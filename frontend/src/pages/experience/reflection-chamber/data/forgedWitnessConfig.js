/**
 * Portal Two / "The Forged Witness" — the pillar-specific config plugged
 * into the shared PillarExperience engine.
 *
 * Deliberately small, per the scope-control directive this replaces the
 * earlier ten-beat/six-subsystem draft with: a pillar is mostly data. Six
 * tracks, four moments each (song, recognition, recode, application — see
 * TrackScreen.jsx), run through the same shared prompt component. Nothing
 * here declares anything about the Seeker — every prompt asks what they
 * learned, noticed, or chose; the Chamber records, it does not diagnose.
 */

export const TRACKS = [
  {
    id: 'version-of-me',
    order: 1,
    title: 'Version of Me',
    territory: 'ARMOR',
    shadowCode: 'What protected you can imprison you.',
    lightCode: 'Keep the strength. Return the debt.',
    encounterQuestion: 'What part of your armor is still standing guard over a war that ended?',
    prompts: [
      { key: 'learned', label: 'What did you learn to do?' },
      { key: 'protecting', label: 'What was it protecting?' },
      { key: 'strengthKept', label: 'What strength do you keep?' },
      { key: 'debtReturned', label: 'What debt do you return?' },
      { key: 'application', label: 'What would you do differently now?' },
    ],
  },
  {
    id: 'five-minutes-from-the-edge',
    order: 2,
    title: '5 Minutes From The Edge',
    territory: 'SACRIFICE',
    shadowCode: 'Loving someone means dying for them repeatedly to keep them sane.',
    lightCode: 'I can walk away to survive without punishing your shame.',
    encounterQuestion: 'Where did love become indistinguishable from self-destruction?',
    prompts: [
      { key: 'learned', label: 'What did you learn to do?' },
      { key: 'protecting', label: 'What was it protecting?' },
      { key: 'stillCarrying', label: 'What are you still carrying?' },
      { key: 'application', label: 'What can you walk away from without retaliation?' },
    ],
  },
  {
    id: 'ashes-and-iron',
    order: 3,
    title: 'Ashes and Iron',
    territory: 'RAGE',
    shadowCode: 'My rage is an armor that will heal my broken pride.',
    lightCode: 'Only releasing the crusade will grant mercy unrehearsed.',
    encounterQuestion: 'What does your anger promise to repair that it cannot actually restore?',
    prompts: [
      { key: 'protected', label: 'What did your rage protect?' },
      { key: 'cost', label: 'What has it cost you?' },
      { key: 'strengthKept', label: 'What power remains useful?' },
      { key: 'application', label: 'What are you willing to stop fighting?' },
    ],
  },
  {
    id: 'felt-that-drift',
    order: 4,
    title: 'Felt That Drift',
    territory: 'CONTROL',
    shadowCode: "Fear builds cages to maintain Earth's control.",
    lightCode: 'Mastery moves within; the body knows before the mind can look.',
    encounterQuestion: 'What happens when you stop forcing certainty?',
    prompts: [
      { key: 'controlling', label: 'What are you trying to control?' },
      { key: 'bodyKnows', label: 'What does your body already know?' },
      { key: 'releaseOneDegree', label: 'What happens if you release one degree of control?' },
      { key: 'application', label: 'What do you notice?' },
    ],
  },
  {
    id: 'if-he-could-only-see',
    order: 5,
    title: 'If He Could Only See',
    territory: 'SILENCE',
    shadowCode: 'Safety means remaining silent and chasing external approval.',
    lightCode: 'The truth is louder than the lies they told; real love rises above the fear.',
    encounterQuestion: "What truth have you been keeping quiet because somebody else's approval felt safer?",
    prompts: [
      { key: 'afraidToSay', label: 'What are you afraid to say?' },
      { key: 'chasingApproval', label: 'Whose approval are you still chasing?' },
      { key: 'trueRegardless', label: 'What is true regardless of their response?' },
      { key: 'application', label: 'Say one true thing.' },
    ],
  },
  {
    id: 'if-you-really-listened',
    order: 6,
    title: 'If You Really Listened',
    territory: 'NUMBNESS',
    shadowCode: 'Moving on quietly means I am untouched by the fall.',
    lightCode: 'I am not numb; I alchemized a void into my survival.',
    encounterQuestion: 'What have you called "moving on" that may actually be emotional distance?',
    prompts: [
      { key: 'stoppedFeeling', label: 'What did you stop feeling?' },
      { key: 'numbnessProtected', label: 'What did that numbness protect?' },
      { key: 'survivedAnyway', label: 'What survived anyway?' },
      { key: 'application', label: 'What are you ready to let yourself feel?' },
    ],
  },
];

/**
 * Active Imagination's script (§10 of the scope-control directive):
 * deliberately generic and shared — the same four prompts for every
 * track, not custom content per encounter. The system doesn't generate,
 * analyze, or classify the figure; the Seeker supplies the experience,
 * the Chamber provides the container.
 */
export const ACTIVE_IMAGINATION_PROMPTS = [
  { key: 'figure', label: 'Who or what appears?' },
  { key: 'understand', label: 'What does this part of you want you to understand?' },
  { key: 'protecting', label: 'What was it protecting?' },
  { key: 'sayBack', label: 'What do you want to say back?' },
];

/** The closing synthesis, after all six tracks (§18). */
export const SYNTHESIS_PROMPTS = [
  { key: 'commonRule', label: 'What did all six survival patterns have in common?' },
  { key: 'strengthKept', label: 'What strength are you keeping?' },
  { key: 'noLongerCarrying', label: 'What are you no longer carrying?' },
  { key: 'newRule', label: 'What is the new rule?' },
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

export const FORGED_WITNESS_CONFIG = {
  pillarId: 'forged-witness',
  themeClass: 'forged-witness-pillar',

  intro: {
    eyebrow: 'Portal Two',
    word: 'Identity',
    title: 'The Forged Witness',
    subtitle: 'The Version That Survived',
    tagline: 'You are not here to destroy the survivor. You are here to meet them.',
  },

  screens: SCREENS,
  buildRecord,

  seal: {
    eyebrow: 'Pillar Two Complete',
    word: 'The Version That Survived',
    lines: [
      'I know what I became.',
      'I know why I became it.',
      'I decide what remains.',
      'Keep the strength. Return the debt.',
    ],
  },
};

export default FORGED_WITNESS_CONFIG;
