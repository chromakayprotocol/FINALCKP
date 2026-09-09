import { describe, expect, it, vi } from 'vitest';
import { validateShadowTwinSourceImage, uploadShadowTwinSourceImage, generateShadowTwin } from './shadowTwin';

function makeFile({ type = 'image/png', size = 1024, name = 'photo.png' } = {}) {
  const file = new File([new Uint8Array(size)], name, { type });
  return file;
}

describe('validateShadowTwinSourceImage', () => {
  it('rejects a missing file', async () => {
    const result = await validateShadowTwinSourceImage(null);
    expect(result.valid).toBe(false);
  });

  it('rejects an unsupported MIME type', async () => {
    const result = await validateShadowTwinSourceImage(makeFile({ type: 'application/pdf' }));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/JPEG, PNG, or WebP/);
  });

  it('rejects a file over the size cap', async () => {
    const result = await validateShadowTwinSourceImage(makeFile({ size: 20 * 1024 * 1024 }));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/too large/);
  });
});

describe('uploadShadowTwinSourceImage', () => {
  it('errors without a user id', async () => {
    const supabase = { storage: { from: vi.fn() } };
    const { path, error } = await uploadShadowTwinSourceImage(null, makeFile(), supabase);
    expect(path).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });

  it('uploads under {userId}/source/ and never overwrites (upsert: false)', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const supabase = { storage: { from: vi.fn(() => ({ upload })) } };

    const { path, error } = await uploadShadowTwinSourceImage('u1', makeFile({ name: 'me.jpg', type: 'image/jpeg' }), supabase);
    expect(error).toBeNull();
    expect(path).toMatch(/^u1\/source\/.+\.jpg$/);
    expect(upload).toHaveBeenCalledWith(path, expect.anything(), { contentType: 'image/jpeg', upsert: false });
  });
});

describe('generateShadowTwin', () => {
  it('errors when the worker URL is not configured', async () => {
    const { canonicalImagePath, error } = await generateShadowTwin({ sourceImagePath: 'p', promptVersion: 'v1' }, {});
    expect(canonicalImagePath).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });
});
