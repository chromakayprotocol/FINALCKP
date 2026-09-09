import { describe, it, expect, vi } from 'vitest';
import { handleRequest } from './index.js';

const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key', IMAGE_PROVIDER: 'mock' };
const validSupabaseUser = { id: 'u1', email: 'seeker@example.com' };

function makeRequest(body, { method = 'POST', token = 'good-token', path = '/generate' } = {}) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('authorization', `Bearer ${token}`);
  return new Request(`https://worker.example${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function baseDeps({ user = validSupabaseUser } = {}) {
  return {
    verifyToken: vi.fn(async () => user),
    downloadSource: vi.fn(async () => ({ bytes: new Uint8Array([1]), contentType: 'image/jpeg' })),
    uploadCanonical: vi.fn(async (userId) => `${userId}/canonical/generated.png`),
    getProvider: vi.fn(() => ({ generate: vi.fn(async () => ({ imageBytes: new Uint8Array([2]), contentType: 'image/png' })) })),
  };
}

describe('handleRequest — transport-level behavior', () => {
  it('answers OPTIONS with 204, without touching Supabase or a provider', async () => {
    const deps = baseDeps();
    const res = await handleRequest(makeRequest(undefined, { method: 'OPTIONS' }), env, deps);
    expect(res.status).toBe(204);
    expect(deps.verifyToken).not.toHaveBeenCalled();
  });

  it('rejects a non-POST method', async () => {
    const res = await handleRequest(makeRequest(undefined, { method: 'GET' }), env, baseDeps());
    expect(res.status).toBe(405);
  });

  it('404s a path other than /generate', async () => {
    const res = await handleRequest(
      makeRequest({ sourceImagePath: 'u1/source/a.jpg' }, { path: '/other' }),
      env,
      baseDeps(),
    );
    expect(res.status).toBe(404);
  });
});

describe('handleRequest — authentication', () => {
  it('401s with no Authorization header', async () => {
    const deps = baseDeps();
    const res = await handleRequest(makeRequest({ sourceImagePath: 'u1/source/a.jpg' }, { token: null }), env, deps);
    expect(res.status).toBe(401);
    expect(deps.verifyToken).not.toHaveBeenCalled();
  });

  it('401s when the token fails Supabase verification', async () => {
    const deps = baseDeps({ user: null });
    const res = await handleRequest(makeRequest({ sourceImagePath: 'u1/source/a.jpg' }), env, deps);
    expect(res.status).toBe(401);
  });
});

describe('handleRequest — request validation', () => {
  it('400s invalid JSON', async () => {
    const res = await handleRequest(makeRequest('not json'), env, baseDeps());
    expect(res.status).toBe(400);
  });

  it('400s a missing sourceImagePath', async () => {
    const res = await handleRequest(makeRequest({}), env, baseDeps());
    expect(res.status).toBe(400);
  });

  it('403s a sourceImagePath outside the caller\'s own prefix', async () => {
    const res = await handleRequest(makeRequest({ sourceImagePath: 'someone-else/source/a.jpg' }), env, baseDeps());
    expect(res.status).toBe(403);
  });
});

describe('handleRequest — the real pipeline', () => {
  it('downloads the source, generates, uploads the canonical, and returns its path', async () => {
    const deps = baseDeps();
    const res = await handleRequest(
      makeRequest({ sourceImagePath: 'u1/source/a.jpg', promptVersion: 'shadow-twin-v1' }),
      env,
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.canonicalImagePath).toBe('u1/canonical/generated.png');
    expect(body.promptVersion).toBe('shadow-twin-v1');
    expect(body.visualIdentitySeed).toBe('u1/canonical/generated.png');

    expect(deps.downloadSource).toHaveBeenCalledWith('u1/source/a.jpg', 'good-token', env);
    expect(deps.uploadCanonical).toHaveBeenCalledWith('u1', expect.any(Uint8Array), 'image/png', 'good-token', env);
  });

  it('falls back to the current prompt version for an unknown promptVersion', async () => {
    const deps = baseDeps();
    const res = await handleRequest(
      makeRequest({ sourceImagePath: 'u1/source/a.jpg', promptVersion: 'not-a-real-version' }),
      env,
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.promptVersion).toBe('shadow-twin-v1');
  });

  it('502s when the provider fails, without leaking the raw error', async () => {
    const deps = baseDeps();
    deps.getProvider = vi.fn(() => ({
      generate: vi.fn(async () => {
        throw new Error('upstream provider outage details');
      }),
    }));
    const res = await handleRequest(makeRequest({ sourceImagePath: 'u1/source/a.jpg' }), env, deps);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).not.toContain('upstream provider outage details');
    expect(body.error).toBe('The Chamber could not complete the initialization.');
  });

  it('502s when the source download fails', async () => {
    const deps = baseDeps();
    deps.downloadSource = vi.fn(async () => {
      throw new Error('404 not found');
    });
    const res = await handleRequest(makeRequest({ sourceImagePath: 'u1/source/a.jpg' }), env, deps);
    expect(res.status).toBe(502);
  });
});
