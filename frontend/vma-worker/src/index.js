import Anthropic from '@anthropic-ai/sdk';
import { verifySupabaseAccessToken } from './supabaseAuth.js';
import { buildSystemBlocks } from './vmaContext.js';

/**
 * Phase 18 (AI/VMA) of the Sovereign OS migration. The target
 * architecture's rule for this phase: VMA reads Sovereign State (the
 * caller sends buildVMAContext(state)'s compact output — see
 * frontend/src/sovereign/vma/buildVMAContext.js) rather than being a
 * stateless chatbot bolted onto the app.
 *
 * Cost was the explicit, named constraint for this phase, so every
 * choice here is the cheap one, not just the correct one:
 *  - claude-haiku-4-5 — the cheapest current model ($1/$5 per MTok,
 *    roughly a third of Sonnet 5's rate and a fifth of Opus 5's).
 *  - No `thinking` config at all — Haiku 4.5 runs without thinking by
 *    default, which is also its cheapest mode; there's no reason to pay
 *    for reasoning tokens on a short companion reply.
 *  - `max_tokens: 1024` — bounds worst-case spend per turn. A VMA reply
 *    is a few sentences, not a report.
 *  - Prompt caching on the stable persona instructions (see
 *    vmaContext.js) — the per-user journey context and the
 *    conversation itself vary every request, but the persona block
 *    doesn't, so it's marked as the cache breakpoint.
 *  - A single Messages API call, not an agent/tool-use loop — per this
 *    session's own Claude API guidance, "Q&A" is exactly the tier a
 *    single LLM call fits; anything heavier would be paying for
 *    capability this feature doesn't use.
 */

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'Authorization, Content-Type',
    },
  });
}

function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
}

/**
 * Handles one chat turn. `deps` is injectable (verifyToken, createChatCompletion)
 * so this can be tested without a network call, same DI convention as
 * frontend/protected-media-worker.
 */
export async function handleRequest(request, env, deps = {}) {
  const { verifyToken = verifySupabaseAccessToken, createChatCompletion = defaultCreateChatCompletion } = deps;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'Authorization, Content-Type',
      },
    });
  }
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  const url = new URL(request.url);
  if (url.pathname !== '/chat') return jsonResponse(404, { error: 'Not found' });

  const token = bearerToken(request);
  if (!token) return jsonResponse(401, { error: 'Not authenticated' });
  const supabaseUser = await verifyToken(token, env);
  if (!supabaseUser) return jsonResponse(401, { error: 'Not authenticated' });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const { context, message, history } = payload || {};
  if (!context || typeof message !== 'string' || !message.trim()) {
    return jsonResponse(400, { error: 'Request body must include `context` and a non-empty `message`' });
  }
  if (history !== undefined && !Array.isArray(history)) {
    return jsonResponse(400, { error: '`history` must be an array when provided' });
  }

  let reply;
  try {
    reply = await createChatCompletion({ context, message, history: history || [] }, env);
  } catch (err) {
    return jsonResponse(502, { error: `VMA model call failed: ${err.message}` });
  }

  return jsonResponse(200, { reply });
}

async function defaultCreateChatCompletion({ context, message, history }, env) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: buildSystemBlocks(context),
    messages: [...history, { role: 'user', content: message }],
  });
  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock?.text ?? '';
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
