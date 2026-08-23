import { describe, it, expect, vi } from 'vitest';
import { handleRequest } from './index.js';

const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key', ANTHROPIC_API_KEY: 'sk-fake' };
const validSupabaseUser = { id: 'sb-1', email: 'seeker@example.com' };
const validContext = { activeModuleId: 'hermetic-hall/mentalism', retainedConcepts: ['shadow-work'] };

function makeRequest(body, { method = 'POST', token = 'good-token', path = '/chat' } = {}) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('authorization', `Bearer ${token}`);
  return new Request(`https://worker.example${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function baseDeps({ user = validSupabaseUser, reply = 'a grounded reply' } = {}) {
  return {
    verifyToken: vi.fn(async () => user),
    createChatCompletion: vi.fn(async () => reply),
  };
}

describe('handleRequest — transport-level behavior', () => {
  it('answers OPTIONS with 204, without touching Supabase or the model', async () => {
    const deps = baseDeps();
    const res = await handleRequest(makeRequest(undefined, { method: 'OPTIONS' }), env, deps);
    expect(res.status).toBe(204);
    expect(deps.verifyToken).not.toHaveBeenCalled();
  });

  it('rejects a non-POST method', async () => {
    const res = await handleRequest(makeRequest(undefined, { method: 'GET' }), env, baseDeps());
    expect(res.status).toBe(405);
  });

  it('404s a path other than /chat', async () => {
    const res = await handleRequest(makeRequest({ context: validContext, message: 'hi' }, { path: '/other' }), env, baseDeps());
    expect(res.status).toBe(404);
  });
});

describe('handleRequest — authentication', () => {
  it('401s with no Authorization header', async () => {
    const deps = baseDeps();
    const res = await handleRequest(makeRequest({ context: validContext, message: 'hi' }, { token: null }), env, deps);
    expect(res.status).toBe(401);
    expect(deps.verifyToken).not.toHaveBeenCalled();
  });

  it('401s when the token fails Supabase verification', async () => {
    const deps = baseDeps({ user: null });
    const res = await handleRequest(makeRequest({ context: validContext, message: 'hi' }), env, deps);
    expect(res.status).toBe(401);
  });
});

describe('handleRequest — request validation', () => {
  it('400s invalid JSON', async () => {
    const res = await handleRequest(makeRequest('not json'), env, baseDeps());
    expect(res.status).toBe(400);
  });

  it('400s a missing context', async () => {
    const res = await handleRequest(makeRequest({ message: 'hi' }), env, baseDeps());
    expect(res.status).toBe(400);
  });

  it('400s an empty message', async () => {
    const res = await handleRequest(makeRequest({ context: validContext, message: '   ' }), env, baseDeps());
    expect(res.status).toBe(400);
  });

  it('400s a non-array history', async () => {
    const res = await handleRequest(makeRequest({ context: validContext, message: 'hi', history: 'nope' }), env, baseDeps());
    expect(res.status).toBe(400);
  });
});

describe('handleRequest — the real turn', () => {
  it('calls createChatCompletion with the context/message/history and returns its reply', async () => {
    const deps = baseDeps({ reply: 'grounded in your journey' });
    const history = [{ role: 'user', content: 'earlier turn' }, { role: 'assistant', content: 'earlier reply' }];
    const res = await handleRequest(
      makeRequest({ context: validContext, message: 'what patterns have I found?', history }),
      env,
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ reply: 'grounded in your journey' });
    expect(deps.createChatCompletion).toHaveBeenCalledWith(
      { context: validContext, message: 'what patterns have I found?', history },
      env,
    );
  });

  it('defaults history to [] when omitted', async () => {
    const deps = baseDeps();
    await handleRequest(makeRequest({ context: validContext, message: 'hi' }), env, deps);
    expect(deps.createChatCompletion).toHaveBeenCalledWith({ context: validContext, message: 'hi', history: [] }, env);
  });

  it('502s when the model call fails, without leaking the raw error to a 500', async () => {
    const deps = {
      verifyToken: vi.fn(async () => validSupabaseUser),
      createChatCompletion: vi.fn(async () => {
        throw new Error('upstream timeout');
      }),
    };
    const res = await handleRequest(makeRequest({ context: validContext, message: 'hi' }), env, deps);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('upstream timeout');
  });
});
