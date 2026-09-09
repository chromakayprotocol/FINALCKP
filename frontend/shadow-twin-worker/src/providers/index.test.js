import { describe, it, expect } from 'vitest';
import { resolveProvider } from './index.js';
import * as mockProvider from './mockProvider.js';
import * as openaiProvider from './openaiProvider.js';

describe('resolveProvider', () => {
  it('defaults to the mock provider when IMAGE_PROVIDER is unset', () => {
    expect(resolveProvider({})).toBe(mockProvider);
  });

  it('resolves "openai" to the OpenAI provider', () => {
    expect(resolveProvider({ IMAGE_PROVIDER: 'openai' })).toBe(openaiProvider);
  });

  it('throws for an unknown provider key', () => {
    expect(() => resolveProvider({ IMAGE_PROVIDER: 'not-a-provider' })).toThrow(/Unknown IMAGE_PROVIDER/);
  });
});

describe('mockProvider.generate', () => {
  it('returns a white PNG without any network call', async () => {
    const { imageBytes, contentType } = await mockProvider.generate();
    expect(contentType).toBe('image/png');
    expect(imageBytes.length).toBeGreaterThan(0);
    // PNG magic bytes
    expect(imageBytes[0]).toBe(0x89);
    expect(imageBytes[1]).toBe(0x50);
  });
});
