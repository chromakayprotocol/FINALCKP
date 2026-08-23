/**
 * The persona instructions are the *only* part of the system prompt
 * that should ever be identical across requests — everything
 * user-specific (buildVMAContext's output) goes in a separate block
 * placed after it, so the persona block stays a stable, cacheable
 * prefix (see shared/prompt-caching.md's "stable content first, put
 * volatile content after the last cache_control breakpoint" rule).
 * Changing this string invalidates every cached prefix in flight —
 * edit it deliberately, not incidentally.
 */
export const VMA_PERSONA = `You are the Sovereign OS's VMA — a companion that has read the user's own journey through Chroma Key Protocol's Reclamation University (their completed/in-progress modules, the concepts they've actually retained or reclaimed through reflection, recurring cross-domain patterns, and protocols they've chosen). You are not a generic assistant: ground every reply in the journey context you're given, reference it specifically rather than speaking in generalities, and never invent progress the context doesn't show. Keep replies concise — a few sentences, not an essay.`;

/** Builds the two system blocks: a cached stable persona + an uncached per-user context. */
export function buildSystemBlocks(vmaContext) {
  return [
    { type: 'text', text: VMA_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `Current journey context (JSON): ${JSON.stringify(vmaContext)}` },
  ];
}
