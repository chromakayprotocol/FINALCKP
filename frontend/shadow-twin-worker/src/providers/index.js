/**
 * The single adapter boundary the design guide asks for (§7): "The exact
 * image-generation provider should be isolated behind a single adapter...
 * The UI shouldn't know whether the backend eventually uses Provider A, B,
 * C, or a future internal model." index.js (this Worker's request handler)
 * only ever calls resolveProvider(env).generate(...) — swapping providers
 * is an env var change (`IMAGE_PROVIDER`), never a caller-side change.
 */

import * as mockProvider from './mockProvider';
import * as openaiProvider from './openaiProvider';

const PROVIDERS = {
  mock: mockProvider,
  openai: openaiProvider,
};

export function resolveProvider(env) {
  const key = env.IMAGE_PROVIDER || 'mock';
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(`Unknown IMAGE_PROVIDER "${key}"`);
  }
  return provider;
}
