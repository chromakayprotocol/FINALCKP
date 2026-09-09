/**
 * The canonical Shadow Twin generation prompt, versioned (design guide §8:
 * "Never place the canonical generation prompt in a component... Persist:
 * generationPromptVersion"). A user's canonical Twin stays associated with
 * whichever version generated it (see sovereign/runtime/sovereignActions.js's
 * completeShadowTwinGeneration()) — later prompt versions never retroactively
 * change an existing Twin.
 *
 * The frontend only ever sends `promptVersion` on a generation request
 * (see lib/supabase/shadowTwin.js's generateShadowTwin()) — it never sends
 * prompt text. frontend/shadow-twin-worker/src/data/shadowTwinPrompt.js
 * carries its own copy of this exact content: Cloudflare Workers bundle
 * only their own package, the same reason frontend/vma-worker duplicates
 * its persona text (src/vmaContext.js) rather than importing frontend/src.
 * The two files must be kept in sync by hand; each one says so.
 */

export const SHADOW_TWIN_PROMPT_V1 = Object.freeze({
  version: 'shadow-twin-v1',
  aspectRatio: '9:16',
  background: 'solid-white',
  // The model is deliberately given interpretive freedom (design guide §47:
  // "Don't automatically determine... This is their trauma" — the system
  // stores a visual artifact, not a psychological diagnosis). This prompt
  // asks for a *counterpart*, not a villain, and never asks the model to
  // infer or depict anything about the uploaded person's psychology,
  // history, or identity beyond their visual likeness.
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
