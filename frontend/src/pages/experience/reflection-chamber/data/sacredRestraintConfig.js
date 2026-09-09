/**
 * Portal Three / "Sacred Restraint & Reflection" — the pillar-specific
 * config plugged into the shared PillarExperience + ScreenSequence engine
 * (see components/track-synthesis/ for why the engine itself needed no
 * changes — only this file and its renderer table are new). Every
 * shadowCode/lightCode pair below is this pillar's own already-authored
 * canon (reflectionChamberModuleData.js's PILLARS[2].shadow/.light) — the
 * per-track encounterQuestion/prompts are new UI content built directly
 * from that pillar's own diagnostic/instructional lines, the same
 * authorial voice, never inventing a new claim about the Seeker.
 */

import { ACTIVE_IMAGINATION_PROMPTS } from './activeImaginationPrompts';

export const TRACKS = [
  {
    id: 'unsent-messages-season',
    order: 1,
    title: 'Unsent Messages Season',
    territory: 'CONCEALMENT',
    shadowCode: 'Silence can become avoidance wearing the mask of wisdom.',
    lightCode: 'My silence is chosen, not inherited.',
    encounterQuestion: 'Open the drafts of your life. If you sent this from full safety, would the content change?',
    prompts: [
      { key: 'maskOfWisdom', label: 'What are you calling "restraint" that might actually be fear in a calmer coat?' },
      { key: 'protecting', label: 'What is the silence protecting you from feeling or facing?' },
      { key: 'unfinished', label: 'What has stayed unfinished because it was never sent?' },
      { key: 'application', label: 'Write the version of this truth that only frees your field — not the one that still seeks to change the other.' },
    ],
  },
  {
    id: 'before-the-verdict-and-the-door',
    order: 2,
    title: 'Before The Verdict and the Door',
    territory: 'JUDGMENT',
    shadowCode: 'Waiting for judgment absolves me of responsibility.',
    lightCode: 'Redemption asks for truth, not another hedge; step through the door.',
    encounterQuestion: 'What truth sits heavy like a bruise under your skin and still has no spoken record?',
    prompts: [
      { key: 'composure', label: 'Where have you mistaken composure for maturity?' },
      { key: 'waiting', label: 'What are you still waiting to be punished or forgiven for?' },
      { key: 'cost', label: 'What has the waiting itself cost you?' },
      { key: 'application', label: 'Name the door you are waiting to be let through. Walk through it without waiting for permission.' },
    ],
  },
  {
    id: 'the-ones-we-still-carry',
    order: 3,
    title: 'The Ones We Still Carry',
    territory: 'THE ALTAR',
    shadowCode: 'I must beg a silence to shift into sound to heal.',
    lightCode: 'I can walk forward, and let your reflection walk with me.',
    encounterQuestion: 'Whose name still occupies more real estate than their presence warrants?',
    prompts: [
      { key: 'shrine', label: 'What shrine have you built from a moment memory already broke?' },
      { key: 'weight', label: 'What does carrying this like a scar on the pen still cost you?' },
      { key: 'companion', label: 'What would it feel like for this memory to walk beside you instead of ahead of you?' },
      { key: 'application', label: 'Speak the name once with no story. Relocate it — a box, a jar, water — as a ritual of placement, not deletion.' },
    ],
  },
  {
    id: 'the-seeker-and-the-silent',
    order: 4,
    title: 'The Seeker and the Silent',
    territory: 'DEPARTURE',
    shadowCode: 'My departure makes me the villain in the absence of an explanation.',
    lightCode: 'Not all silence is absence; leaving is sometimes necessary to survive.',
    encounterQuestion: 'Where do you still owe an explanation for leaving somewhere that required one to stay?',
    prompts: [
      { key: 'cage', label: 'What made the room a haunted cage rather than a home?' },
      { key: 'villain', label: 'Whose verdict are you still bracing for?' },
      { key: 'necessary', label: 'What did leaving actually protect?' },
      { key: 'application', label: 'Write the explanation you never gave — not to send, but to release yourself from needing to.' },
    ],
  },
  {
    id: 'h2o',
    order: 5,
    title: 'H2O',
    territory: 'THE FLOOD',
    shadowCode: 'I must hold onto false projections to survive the flood.',
    lightCode: 'Break me down to elemental essence; water heals and reveals truth.',
    encounterQuestion: 'What are you still holding your breath against, afraid that letting go would mean drowning?',
    prompts: [
      { key: 'projection', label: 'What false projection are you still gripping to stay afloat?' },
      { key: 'fear', label: 'What do you believe would happen if you let it go?' },
      { key: 'essence', label: 'What remains of you underneath the projection?' },
      { key: 'application', label: 'Let one false projection break down completely this week. Write only what remains after — not what you tried to save.' },
    ],
  },
];

export const SYNTHESIS_PROMPTS = [
  { key: 'commonPattern', label: 'What did all five patterns of silence have in common?' },
  { key: 'chosen', label: 'Where is your silence now a choice rather than a hiding place?' },
  { key: 'lightened', label: 'What are you no longer carrying that was never yours?' },
  { key: 'newRule', label: 'What is your new rule for when to speak and when to hold?' },
];

const SCREENS = [
  { id: 'intro', type: 'intro' },
  ...TRACKS.map((track) => ({ id: track.id, type: 'track', trackId: track.id })),
  { id: 'synthesis', type: 'synthesis' },
  { id: 'record', type: 'record' },
  { id: 'seal', type: 'seal' },
];

function buildRecord({ pillar, state }) {
  const tracksState = state.experience?.tracks || {};
  const integration = state.experience?.integration || {};

  const sections = TRACKS.map((track) => {
    const trackState = tracksState[track.id] || {};
    const values = track.prompts.map((p) => trackState[p.key]).filter((v) => v && v.trim());
    return { label: track.title, values };
  }).filter((section) => section.values.length > 0);

  if (integration.carryCode) {
    sections.push({ label: 'Carry Code', value: integration.carryCode });
  }

  return {
    sections,
    summary: pillar?.seal,
  };
}

export const SACRED_RESTRAINT_CONFIG = {
  pillarId: 'sacred-restraint',
  themeClass: 'sacred-restraint-pillar',

  intro: {
    eyebrow: 'Portal Three',
    word: 'Perception',
    title: 'Sacred Restraint & Reflection',
    subtitle: 'The Surface of the Water',
    tagline: 'Not every unsent message is wisdom. Some are fear in a calmer coat.',
  },

  screens: SCREENS,
  buildRecord,

  tracks: TRACKS,
  activeImaginationPrompts: ACTIVE_IMAGINATION_PROMPTS,
  synthesisPrompts: SYNTHESIS_PROMPTS,

  seal: {
    eyebrow: 'Pillar Three Complete',
    word: 'Sacred Restraint',
    lines: [
      'I do not mistake restraint for absence.',
      'I keep my words where they can bless me.',
      'My silence is chosen.',
      'My carry is lightened by design.',
    ],
  },
};

export default SACRED_RESTRAINT_CONFIG;
