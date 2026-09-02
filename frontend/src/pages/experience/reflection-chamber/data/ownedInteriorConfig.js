import {
  OPENING_SITUATION,
  SORT_CATEGORIES,
  SORT_STATEMENTS,
  MODERN_SCENARIOS,
  DIGITAL_SEQUENCE_STEPS,
  PERSONAL_REFLECTION_EMOTIONS,
  REHEARSED_LINES,
  UNBENT_DOOR_CHOICES,
  COMMITMENT_ANCHORS,
  CODE_LAYERS,
  CODE_DISCOVERY_LEAD,
  SHADOW_FIGURE_FORMS,
  ACTIVE_IMAGINATION_PROMPTS,
  DIALOGUE_PROMPTS,
  PROTECTED_NEEDS,
  TRANSFER_SCENARIO,
  MASTERY_SCENARIO,
  PILLAR_RECORD_ITEMS,
} from './portalOneContent';

/**
 * Portal One / "The Owned Interior" — the pillar-specific config plugged
 * into the shared PillarExperience engine. Every field here is either
 * exercise content (this file / portalOneContent.js) or an index into the
 * pillar's own real curriculum arrays (reflectionChamberModuleData.js) —
 * nothing about the engine itself lives here.
 */
export const OWNED_INTERIOR_CONFIG = {
  pillarId: 'owned-interior',

  intro: {
    eyebrow: 'Portal One',
    word: 'Recognition',
    tagline: 'Before you decide what something means, learn to see what is actually there.',
  },

  situation: OPENING_SITUATION,

  sorter: {
    statements: SORT_STATEMENTS,
    categories: SORT_CATEGORIES,
  },

  conceptReveal: {
    eyebrow: 'The Displaced War',
    lines: [
      'Something happened.',
      'You felt something.',
      'Your mind interpreted what happened.',
      'Those things can be connected without being identical.',
    ],
    closingLine: 'The first practice of the Owned Interior is learning to recognize the difference.',
  },
  // Index into pillar.shadow[] revealed right after the concept reveal.
  shadowCodeIndex: 0,
  // Index into pillar.teaching[] shown as "What's happening" in that panel.
  shadowTeachingIndex: 1,

  application: {
    scenarios: MODERN_SCENARIOS,
    digitalSequenceSteps: DIGITAL_SEQUENCE_STEPS,
    // Index into pillar.shadow[] used by the Rehearsed Room screen.
    rehearsedShadowCodeIndex: 1,
    rehearsedLines: REHEARSED_LINES,
    rehearsedLead: 'If I stopped explaining this situation, I might have to admit…',
  },

  reflectionEmotions: PERSONAL_REFLECTION_EMOTIONS,

  /* Screen 15 — the pillar's conceptual definition. This stage used to reveal
     the Light Code, which put the replacement principle in the Seeker's hands
     before they had met the Shadow it replaces. The Light Code now lives in
     its own stage, after the encounter (see `lightCode` below). */
  ownedInterior: {
    title: 'The Owned Interior is not a place where nothing affects you.',
    definition:
      'It is the place where you can recognize what is happening inside you without automatically assigning all of it to the world outside you.',
    layers: CODE_LAYERS,
  },

  practice: {
    timerSeconds: 60,
  },

  unbentDoor: {
    // Index into pillar.light[] used by the Unbent Door screen.
    lightCodeIndex: 1,
    choices: UNBENT_DOOR_CHOICES,
    promptQuestion:
      'What would you do differently if you were responding to what you actually know instead of what you assume?',
    avoidedActionQuestion: 'What is one action you know you have been avoiding?',
  },

  /* The Shadow Code arc. Screens 22–33: the rule underneath the story, the
     encounter with the part of the Seeker that learned it, and the governed
     replacement carried back out of the Chamber. */
  commitment: {
    anchors: COMMITMENT_ANCHORS,
  },

  codeDiscovery: {
    layers: CODE_LAYERS,
    leadText: CODE_DISCOVERY_LEAD,
  },

  activeImagination: {
    forms: SHADOW_FIGURE_FORMS,
    prompts: ACTIVE_IMAGINATION_PROMPTS,
  },

  dialogue: {
    prompts: DIALOGUE_PROMPTS,
  },

  shadowEnergy: {
    needs: PROTECTED_NEEDS,
  },

  transfer: TRANSFER_SCENARIO,

  mastery: MASTERY_SCENARIO,

  recordItems: PILLAR_RECORD_ITEMS,

  seal: {
    eyebrow: 'Pillar One Complete',
    word: 'Recognition',
    lines: ['See what is there.', 'Name what is yours.', 'Choose what happens next.'],
  },
};
