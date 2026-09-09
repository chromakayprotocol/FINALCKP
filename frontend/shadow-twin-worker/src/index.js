import { verifySupabaseAccessToken } from './supabaseAuth.js';
import { downloadSourceImage, uploadCanonicalImage } from './storage.js';
import { resolveProvider } from './providers/index.js';
import { shadowTwinPromptForVersion, CURRENT_SHADOW_TWIN_PROMPT_VERSION } from './data/shadowTwinPrompt.js';

/**
 * Act II Reflection Chamber — Shadow Twin generation. The one adapter
 * boundary the design guide asks for (§7-8): the frontend never talks to
 * an image-generation provider directly, never sends a prompt, and never
 * sees a generation credential — it POSTs { sourceImagePath, promptVersion }
 * here and gets back { canonicalImagePath, visualIdentitySeed }.
 *
 * Auth follows frontend/vma-worker's exact pattern: verify the caller's
 * Supabase access token, then use that SAME token (not a service-role key)
 * for every Storage read/write, since the shadow-twins bucket's RLS
 * policies already scope an authenticated user to their own
 * `{user_id}/...` prefix — see storage.js's header.
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
 * Handles one generation request. `deps` is injectable, same DI convention
 * as vma-worker's handleRequest(), so the full pipeline is testable without
 * a network call.
 */
export async function handleRequest(request, env, deps = {}) {
  const {
    verifyToken = verifySupabaseAccessToken,
    downloadSource = downloadSourceImage,
    uploadCanonical = uploadCanonicalImage,
    getProvider = resolveProvider,
  } = deps;

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
  if (url.pathname !== '/generate') return jsonResponse(404, { error: 'Not found' });

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

  const { sourceImagePath, promptVersion } = payload || {};
  if (!sourceImagePath || typeof sourceImagePath !== 'string') {
    return jsonResponse(400, { error: 'Request body must include `sourceImagePath`' });
  }
  // A caller-supplied source path outside this user's own prefix would
  // still be rejected by Storage RLS on download below (the token is
  // theirs, not the target user's), but reject it here too so a bad
  // request never reaches the provider at all.
  if (!sourceImagePath.startsWith(`${supabaseUser.id}/source/`)) {
    return jsonResponse(403, { error: 'Not authorized for that source image' });
  }

  const prompt = shadowTwinPromptForVersion(promptVersion) ?? shadowTwinPromptForVersion(CURRENT_SHADOW_TWIN_PROMPT_VERSION);

  try {
    const { bytes: sourceImageBytes, contentType: sourceContentType } = await downloadSource(
      sourceImagePath,
      token,
      env,
    );

    const provider = getProvider(env);
    const { imageBytes, contentType } = await provider.generate(
      {
        sourceImageBytes,
        sourceContentType,
        prompt: prompt.text,
        aspectRatio: prompt.aspectRatio,
      },
      env,
    );

    const canonicalImagePath = await uploadCanonical(supabaseUser.id, imageBytes, contentType, token, env);

    return jsonResponse(200, {
      canonicalImagePath,
      // A stable per-generation seed, derived rather than provider-specific,
      // so downstream visual treatments can stay consistent for one Twin
      // without depending on any one provider exposing a real seed value.
      visualIdentitySeed: canonicalImagePath,
      promptVersion: prompt.version,
    });
  } catch (err) {
    // Never surface the raw provider/storage error to the client (design
    // guide §41) — log it server-side, return a safe generic message.
    console.error('Shadow Twin generation failed', err);
    return jsonResponse(502, { error: 'The Chamber could not complete the initialization.' });
  }
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
