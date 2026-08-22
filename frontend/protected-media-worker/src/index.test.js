import { describe, it, expect, vi } from 'vitest';
import { handleRequest } from './index.js';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
};

/** Minimal fake R2Bucket — just enough of .get()'s real contract to exercise serveObject(). */
function createFakeBucket(objectsByKey) {
  return {
    async get(key, opts) {
      const entry = objectsByKey[key];
      if (!entry) return null;
      const rangeHeader = opts?.range?.get?.('range');
      const isRanged = Boolean(rangeHeader);
      return {
        body: entry.body,
        size: entry.body.length,
        httpEtag: '"fake-etag"',
        range: isRanged ? { offset: 2, length: entry.body.length - 2 } : undefined,
        writeHttpMetadata(headers) {
          headers.set('content-type', entry.contentType || 'application/octet-stream');
        },
      };
    },
  };
}

function makeRequest(path, { method = 'GET', token, range } = {}) {
  const headers = new Headers();
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (range) headers.set('range', range);
  return new Request(`https://worker.example${path}`, { method, headers });
}

const validSupabaseUser = { id: 'sb-1', email: 'seeker@example.com' };
const track = { track_id: 'track-1', audio_storage_path: 'audio/track-1.mp3', audio_filename: 'track-1.mp3', act: 3 };

function baseDeps({ user = validSupabaseUser, appUser = null, foundTrack = track } = {}) {
  return {
    verifyToken: vi.fn(async () => user),
    getAppUser: vi.fn(async () => appUser),
    getTrack: vi.fn(async () => foundTrack),
  };
}

describe('handleRequest — transport-level behavior', () => {
  it('answers OPTIONS with 204 and CORS headers, without touching Supabase', async () => {
    const deps = baseDeps();
    const res = await handleRequest(makeRequest('/audio/track-1', { method: 'OPTIONS' }), env, deps);
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(deps.verifyToken).not.toHaveBeenCalled();
  });

  it('rejects a non-GET/HEAD method', async () => {
    const res = await handleRequest(makeRequest('/audio/track-1', { method: 'POST', token: 't' }), env, baseDeps());
    expect(res.status).toBe(405);
  });

  it('404s a path that is not /audio/:id or /audio/:id/download', async () => {
    const res = await handleRequest(makeRequest('/not-audio', { token: 't' }), env, baseDeps());
    expect(res.status).toBe(404);
  });
});

describe('handleRequest — authentication', () => {
  it('401s with no Authorization header', async () => {
    const deps = baseDeps();
    const res = await handleRequest(makeRequest('/audio/track-1'), env, deps);
    expect(res.status).toBe(401);
    expect(deps.verifyToken).not.toHaveBeenCalled();
  });

  it('401s when the token fails Supabase verification', async () => {
    const deps = baseDeps({ user: null });
    const res = await handleRequest(makeRequest('/audio/track-1', { token: 'bad' }), env, deps);
    expect(res.status).toBe(401);
  });
});

describe('handleRequest — streaming (GET /audio/:trackId)', () => {
  it('streams for any verified user, even one with no local users row yet', async () => {
    const deps = baseDeps({ appUser: null });
    const bucket = createFakeBucket({ 'audio/track-1.mp3': { body: 'abcdef', contentType: 'audio/mpeg' } });
    const res = await handleRequest(makeRequest('/audio/track-1', { token: 'good' }), { ...env, MEDIA: bucket }, deps);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('inline');
    expect(res.headers.get('content-disposition')).toContain('track-1.mp3');
    // Streaming never needs the local users row.
    expect(deps.getAppUser).not.toHaveBeenCalled();
  });

  it('404s when the track has no audio_storage_path', async () => {
    const deps = baseDeps({ foundTrack: { track_id: 'track-1' } });
    const res = await handleRequest(makeRequest('/audio/track-1', { token: 'good' }), { ...env, MEDIA: createFakeBucket({}) }, deps);
    expect(res.status).toBe(404);
  });

  it('404s when the R2 object itself is missing', async () => {
    const deps = baseDeps();
    const res = await handleRequest(makeRequest('/audio/track-1', { token: 'good' }), { ...env, MEDIA: createFakeBucket({}) }, deps);
    expect(res.status).toBe(404);
  });

  it('serves a 206 partial response for a Range request', async () => {
    const deps = baseDeps();
    const bucket = createFakeBucket({ 'audio/track-1.mp3': { body: 'abcdef', contentType: 'audio/mpeg' } });
    const res = await handleRequest(
      makeRequest('/audio/track-1', { token: 'good', range: 'bytes=2-' }),
      { ...env, MEDIA: bucket },
      deps,
    );
    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 2-5/6');
  });
});

describe('handleRequest — downloading (GET /audio/:trackId/download)', () => {
  it('403s a not-yet-provisioned user (no local users row)', async () => {
    const deps = baseDeps({ appUser: null });
    const envWithBucket = { ...env, MEDIA: createFakeBucket({}) };
    const res = await handleRequest(makeRequest('/audio/track-1/download', { token: 'good' }), envWithBucket, deps);
    expect(res.status).toBe(403);
    expect(deps.getAppUser).toHaveBeenCalledWith('sb-1', envWithBucket);
  });

  it('403s a free-tier user', async () => {
    const deps = baseDeps({ appUser: { tier: 'free' } });
    const res = await handleRequest(makeRequest('/audio/track-1/download', { token: 'good' }), { ...env, MEDIA: createFakeBucket({}) }, deps);
    expect(res.status).toBe(403);
  });

  it('allows a full-tier user, with an attachment disposition', async () => {
    const deps = baseDeps({ appUser: { tier: 'full' } });
    const bucket = createFakeBucket({ 'audio/track-1.mp3': { body: 'abcdef', contentType: 'audio/mpeg' } });
    const res = await handleRequest(makeRequest('/audio/track-1/download', { token: 'good' }), { ...env, MEDIA: bucket }, deps);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('attachment');
  });

  it('allows a license-tier user only for the Act III track it gates', async () => {
    const bucket = createFakeBucket({ 'audio/track-1.mp3': { body: 'abcdef', contentType: 'audio/mpeg' } });
    const allowed = await handleRequest(
      makeRequest('/audio/track-1/download', { token: 'good' }),
      { ...env, MEDIA: bucket },
      baseDeps({ appUser: { tier: 'license' }, foundTrack: { ...track, act: 3 } }),
    );
    expect(allowed.status).toBe(200);

    const denied = await handleRequest(
      makeRequest('/audio/track-1/download', { token: 'good' }),
      { ...env, MEDIA: bucket },
      baseDeps({ appUser: { tier: 'license' }, foundTrack: { ...track, act: 1 } }),
    );
    expect(denied.status).toBe(403);
  });
});
