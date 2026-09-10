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
  // Superseded by V2 below — kept only so a Twin already generated under
  // v1 still resolves back to the exact text that generated it.
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

// The canonical prompt as of this writing — supplied verbatim by the
// project owner. Do not edit this text; a future change is a new version.
export const SHADOW_TWIN_PROMPT_V2 = Object.freeze({
  version: 'shadow-twin-v2',
  aspectRatio: '9:16',
  background: 'solid-white',
  text: `Use the uploaded photograph as the primary identity reference.

Create an original and deeply individualized visual interpretation of this person's Jungian Shadow Twin.

The finished image must unmistakably remain the same individual. Preserve strong facial and physical identity while allowing their hidden, disowned, suppressed, unrealized, contradictory, instinctual, powerful, forbidden, or unexplored aspects to emerge through an original visual transformation.

Do not interpret "Shadow" as simply evil, demonic, monstrous, or dark.

Instead, creatively imagine what THIS specific person's hidden counterpart might look like if the unconscious parts of their identity were given physical form.

Study the individual's face, presence, expression, posture, and overall visual energy. Let those qualities inspire the transformation, but do not mechanically reproduce or literalize any predetermined symbolic system. The Shadow Twin should feel psychologically connected to the person while remaining surprising, imaginative, and visually original.

Give the concept substantial creative freedom.

Do not follow a generic formula for darkness, villainy, horror, fantasy, or beauty. Do not rely on cliché symbols unless they emerge naturally from the creative interpretation of this particular individual.

The transformation may express power, rebellion, desire, instinct, grief, freedom, intensity, mystery, confidence, danger, beauty, alienation, liberation, contradiction, or aspects that cannot be easily categorized.

Allow unexpected visual ideas to emerge.

The result should feel like an encounter with a version of the person that has always existed beneath the visible identity but has never previously been seen.

The finished image must be composed in a 9:16 vertical format.

Place the individual against a pure, solid white background.

The white background must remain visually clean and uninterrupted, creating strong contrast and allowing the Shadow Twin itself to become the entire visual event.

Do not create an environmental scene. Do not fill the background with objects, landscapes, architecture, or decorative storytelling.

Within those constraints, retain broad artistic freedom over pose, framing, camera perspective, crop, expression, body language, styling, transformation, silhouette, and visual presentation.

Choose whatever composition makes THIS particular Shadow Twin most visually powerful.

The person may occupy the frame in an unexpected way. They may be close, distant, dominant, partially framed, full body, tightly composed, asymmetrical, confrontational, restrained, physically expressive, elegant, unsettling, beautiful, strange, powerful, or impossible to immediately categorize.

Use the empty white space as part of the composition.

The image should feel intentionally composed but never mechanically predetermined.

Prioritize individuality over convention.

Prioritize creative interpretation over cliché.

Prioritize psychological depth over superficial darkness.

Prioritize visual originality over generic AI aesthetics.

The final image should create the immediate feeling:

"This is unmistakably the same person—but this is a version of them I have never encountered before."

Create a singular, iconic, visually arresting, psychologically charged portrait with strong identity fidelity, exceptional originality, and complete creative freedom within the 9:16 composition and solid white background.`,
});

export const SHADOW_TWIN_PROMPTS = Object.freeze({
  [SHADOW_TWIN_PROMPT_V1.version]: SHADOW_TWIN_PROMPT_V1,
  [SHADOW_TWIN_PROMPT_V2.version]: SHADOW_TWIN_PROMPT_V2,
});

export const CURRENT_SHADOW_TWIN_PROMPT_VERSION = SHADOW_TWIN_PROMPT_V2.version;

export function shadowTwinPromptForVersion(version) {
  return SHADOW_TWIN_PROMPTS[version] ?? null;
}
