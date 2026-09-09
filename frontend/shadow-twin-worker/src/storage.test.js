import { describe, it, expect, vi } from 'vitest';
import { downloadSourceImage, uploadCanonicalImage } from './storage.js';

const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key' };

describe('downloadSourceImage', () => {
  it('GETs the object with the caller\'s own token, not a service-role key', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toBe('https://example.supabase.co/storage/v1/object/shadow-twins/u1/source/a.jpg');
      expect(init.headers.apikey).toBe('anon-key');
      expect(init.headers.Authorization).toBe('Bearer user-token');
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => bytes.buffer,
      };
    });

    const result = await downloadSourceImage('u1/source/a.jpg', 'user-token', env, fetchImpl);
    expect(result.contentType).toBe('image/jpeg');
    expect(Array.from(result.bytes)).toEqual([1, 2, 3]);
  });

  it('throws (never leaks provider internals) on a non-ok response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }));
    await expect(downloadSourceImage('u1/source/missing.jpg', 'token', env, fetchImpl)).rejects.toThrow(/404/);
  });
});

describe('uploadCanonicalImage', () => {
  it('POSTs under {userId}/canonical/ with the caller\'s own token', async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toMatch(/^https:\/\/example\.supabase\.co\/storage\/v1\/object\/shadow-twins\/u1\/canonical\/.+\.png$/);
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe('Bearer user-token');
      expect(init.headers['content-type']).toBe('image/png');
      return { ok: true };
    });

    const path = await uploadCanonicalImage('u1', new Uint8Array([9]), 'image/png', 'user-token', env, fetchImpl);
    expect(path).toMatch(/^u1\/canonical\/.+\.png$/);
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'boom' }));
    await expect(uploadCanonicalImage('u1', new Uint8Array(), 'image/png', 'token', env, fetchImpl)).rejects.toThrow(/500/);
  });
});
