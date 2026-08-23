import { describe, it, expect, vi } from 'vitest';
import { verifySupabaseAccessToken, fetchAppUser, fetchTrack } from './supabaseClient.js';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
};

function fakeFetch(responsesByUrl) {
  return vi.fn(async (url, init) => {
    for (const [matcher, respond] of responsesByUrl) {
      if (typeof matcher === 'string' ? url.includes(matcher) : matcher.test(url)) {
        return respond(url, init);
      }
    }
    throw new Error(`Unhandled fake fetch: ${url}`);
  });
}

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('verifySupabaseAccessToken', () => {
  it('returns the Supabase user on a 200 from /auth/v1/user, with the right headers', async () => {
    const fetchImpl = fakeFetch([
      ['/auth/v1/user', (url, init) => {
        expect(init.headers.apikey).toBe('service-role-key');
        expect(init.headers.Authorization).toBe('Bearer real-token');
        return jsonResponse(200, { id: 'sb-1', email: 'seeker@example.com' });
      }],
    ]);

    const result = await verifySupabaseAccessToken('real-token', env, fetchImpl);
    expect(result).toEqual({ id: 'sb-1', email: 'seeker@example.com' });
  });

  it('returns null for a non-200 response (expired/invalid token)', async () => {
    const fetchImpl = fakeFetch([['/auth/v1/user', () => jsonResponse(401, {})]]);
    expect(await verifySupabaseAccessToken('bad-token', env, fetchImpl)).toBeNull();
  });

  it('returns null when the Supabase response is missing id or email', async () => {
    const fetchImpl = fakeFetch([['/auth/v1/user', () => jsonResponse(200, { id: 'sb-1' })]]);
    expect(await verifySupabaseAccessToken('token', env, fetchImpl)).toBeNull();
  });

  it('returns null without a token, without throwing', async () => {
    expect(await verifySupabaseAccessToken(null, env, vi.fn())).toBeNull();
  });

  it('returns null when env is missing SUPABASE_SERVICE_ROLE_KEY', async () => {
    expect(await verifySupabaseAccessToken('token', { SUPABASE_URL: env.SUPABASE_URL }, vi.fn())).toBeNull();
  });

  it('returns null (not throws) on a network failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    expect(await verifySupabaseAccessToken('token', env, fetchImpl)).toBeNull();
  });
});

describe('fetchAppUser', () => {
  it('returns the first row from a users REST query scoped to the given id', async () => {
    const fetchImpl = fakeFetch([
      [/\/rest\/v1\/users\?user_id=eq\.sb-1/, () => jsonResponse(200, [{ user_id: 'sb-1', tier: 'full' }])],
    ]);
    expect(await fetchAppUser('sb-1', env, fetchImpl)).toEqual({ user_id: 'sb-1', tier: 'full' });
  });

  it('returns null when no row matches (not-yet-provisioned user)', async () => {
    const fetchImpl = fakeFetch([[/\/rest\/v1\/users/, () => jsonResponse(200, [])]]);
    expect(await fetchAppUser('sb-1', env, fetchImpl)).toBeNull();
  });

  it('returns null on a REST error', async () => {
    const fetchImpl = fakeFetch([[/\/rest\/v1\/users/, () => jsonResponse(500, {})]]);
    expect(await fetchAppUser('sb-1', env, fetchImpl)).toBeNull();
  });
});

describe('fetchTrack', () => {
  it('returns the first row from a tracks REST query scoped to the given id', async () => {
    const fetchImpl = fakeFetch([
      [/\/rest\/v1\/tracks\?track_id=eq\.track-1/, () => jsonResponse(200, [{ track_id: 'track-1', act: 3 }])],
    ]);
    expect(await fetchTrack('track-1', env, fetchImpl)).toEqual({ track_id: 'track-1', act: 3 });
  });

  it('returns null when the track does not exist', async () => {
    const fetchImpl = fakeFetch([[/\/rest\/v1\/tracks/, () => jsonResponse(200, [])]]);
    expect(await fetchTrack('missing', env, fetchImpl)).toBeNull();
  });
});
