/**
 * Active Imagination's script — deliberately generic and shared across
 * every pillar built on the track/synthesis engine (originally authored
 * for Pillar Two, §10 of its scope-control directive: "the same four
 * prompts for every track, not custom content per encounter. The system
 * doesn't generate, analyze, or classify the figure; the Seeker supplies
 * the experience, the Chamber provides the container."). Extracted out of
 * forgedWitnessConfig.js once Pillars Three through Five started reusing
 * it too, so there is exactly one copy of this script, not four.
 */
export const ACTIVE_IMAGINATION_PROMPTS = [
  { key: 'figure', label: 'Who or what appears?' },
  { key: 'understand', label: 'What does this part of you want you to understand?' },
  { key: 'protecting', label: 'What was it protecting?' },
  { key: 'sayBack', label: 'What do you want to say back?' },
];
