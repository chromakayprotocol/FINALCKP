/**
 * Server-side copy of
 * frontend/src/pages/experience/reflection-chamber/data/shadowTwinPrompt.js.
 * Cloudflare Workers bundle only their own package (see
 * frontend/vma-worker/src/vmaContext.js for the same precedent with its
 * persona text), so this file carries the actual prompt text the frontend
 * copy documents but never sends over the wire — the frontend only sends
 * `promptVersion`; this Worker resolves it back to real prompt text. Keep
 * both copies in sync by hand.
 */

export const SHADOW_TWIN_PROMPT_V1 = Object.freeze({
  version: 'shadow-twin-v1',
  aspectRatio: '9:16',
  background: 'solid-white',
  text: `Generate a single full-body character portrait of a shadow counterpart /
reflection-figure of the person in the reference photo, on a pure, solid
white background, isolated with no environment, no props, no other people.

The figure should:
- Preserve the reference photo's general body proportions, pose energy, and
  visible identity (approximate hair, build, and clothing silhouette) so the
  result reads as "a counterpart of this person," not a stranger.
- Read as a reflective / mirrored counterpart rather than a literal duplicate
  photograph — subtly stylized, slightly more graphic/illustrative than a
  photo, with a cool, mirror-like sheen or translucency somewhere in the
  figure (skin, clothing, or an aura) so it is legible as "a reflection,"
  not a second photograph of the same person.
- Avoid literal horror, gore, weapons, or villain iconography. This is a
  counterpart to be integrated, not an enemy to be defeated.
- Be lit evenly and shot straight-on, full body, centered in frame, in a
  9:16 portrait aspect ratio, on the pure white background — the same
  framing every time, so later compositing (masking, fragmentation,
  convergence effects) can rely on a consistent silhouette position.

Do not add any text, watermark, logo, frame, or border to the image.`,
});

export const SHADOW_TWIN_PROMPTS = Object.freeze({
  [SHADOW_TWIN_PROMPT_V1.version]: SHADOW_TWIN_PROMPT_V1,
});

export const CURRENT_SHADOW_TWIN_PROMPT_VERSION = SHADOW_TWIN_PROMPT_V1.version;

export function shadowTwinPromptForVersion(version) {
  return SHADOW_TWIN_PROMPTS[version] ?? null;
}
