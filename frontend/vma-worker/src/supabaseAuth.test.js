import { describe, it, expect, vi } from 'vitest';
import { verifySupabaseAccessToken } from './supabaseAuth.js';

const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key' };

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('verifySupabaseAccessToken', () => {
  it('returns the Supabase user on success, using the anon key (not a service-role key)', async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toBe('https://example.supabase.co/auth/v1/user');
      expect(init.headers.apikey).toBe('anon-key');
      expect(init.headers.Authorization).toBe('Bearer real-token');
      return jsonResponse(200, { id: 'sb-1', email: 'seeker@example.com' });
    });
    expect(await verifySupabaseAccessToken('real-token', env, fetchImpl)).toEqual({
      id: 'sb-1',
      email: 'seeker@example.com',
    });
  });

  it('returns null for a non-200 response', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(401, {}));
    expect(await verifySupabaseAccessToken('bad', env, fetchImpl)).toBeNull();
  });

  it('returns null without a token', async () => {
    expect(await verifySupabaseAccessToken(null, env, vi.fn())).toBeNull();
  });

  it('returns null (not throws) on a network failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('down');
    });
    expect(await verifySupabaseAccessToken('token', env, fetchImpl)).toBeNull();
  });
});
