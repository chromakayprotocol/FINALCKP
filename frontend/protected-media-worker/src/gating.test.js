import { describe, it, expect } from 'vitest';
import { canStream, canDownload } from './gating.js';

describe('canStream', () => {
  it('allows any resolved user', () => {
    expect(canStream({ user_id: 'u1' })).toBe(true);
  });

  it('denies a missing user', () => {
    expect(canStream(null)).toBe(false);
    expect(canStream(undefined)).toBe(false);
  });
});

describe('canDownload — mirrors backend/server.py download_audio exactly', () => {
  it('denies a missing user', () => {
    expect(canDownload(null, { act: 3 })).toBe(false);
  });

  it('allows admins regardless of tier', () => {
    expect(canDownload({ is_admin: true, tier: 'free' }, { act: 1 })).toBe(true);
  });

  it('allows full tier', () => {
    expect(canDownload({ tier: 'full' }, { act: 1 })).toBe(true);
  });

  it('allows owns_all_albums regardless of tier', () => {
    expect(canDownload({ tier: 'free', owns_all_albums: true }, { act: 2 })).toBe(true);
  });

  it('allows license tier only for an Act III track', () => {
    expect(canDownload({ tier: 'license' }, { act: 3 })).toBe(true);
    expect(canDownload({ tier: 'license' }, { act: 1 })).toBe(false);
    expect(canDownload({ tier: 'license' }, { act: 2 })).toBe(false);
  });

  it('denies free tier with none of the above', () => {
    expect(canDownload({ tier: 'free' }, { act: 3 })).toBe(false);
  });
});
