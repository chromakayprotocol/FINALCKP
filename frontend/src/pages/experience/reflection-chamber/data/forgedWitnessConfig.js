import { PILLARS } from '../../../../data/reflectionChamberModuleData';

/**
 * Portal Two / "The Forged Witness" — the pillar-specific config plugged
 * into the shared PillarExperience engine.
 *
 * Two layers, kept distinct on purpose:
 *   • reflectionChamberModuleData.js stays the authoritative *curriculum*
 *     layer (the pillar's question, teaching, mantra, seal). This file
 *     references it rather than restating it.
 *   • This file is the authoritative *experience* layer: the six musical
 *     encounters and the screen order that runs them.
 *
 * The six tracks are Pillar Two's canonical set. Each song is a complete
 * encounter, not a lesson illustrated by a song, so the content is
 * track-centric: every track carries its own territory, Shadow Code,
 * Light Code, and the prompts for each beat of the encounter.
 *
 * Nothing here declares anything about the Seeker. Every prompt asks what
 * they learned, noticed, or chose — the Chamber records, it does not
 * diagnose.
 */

const PILLAR = PILLARS.find((p) => p.id === 'forged-witness');

/** Every track runs the same beats; only the content differs. */
export const TRACK_STEPS = Object.freeze({
  SONG: 'song',
  ENCOUNTER: 'encounter',
  PATTERN: 'pattern',
  SHADOW: 'shadow',
  RECOGNITION: 'recognition',
  IMAGINATION: 'imagination',
  PRACTICE: 'practice',
  LIGHT: 'light',
  APPLICATION: 'application',
  INTEGRATION: 'integration',
});

export const TRACK_STEP_ORDER = [
  TRACK_STEPS.SONG,
  TRACK_STEPS.ENCOUNTER,
  TRACK_STEPS.PATTERN,
  TRACK_STEPS.SHADOW,
  TRACK_STEPS.RECOGNITION,
  TRACK_STEPS.IMAGINATION,
  TRACK_STEPS.PRACTICE,
  TRACK_STEPS.LIGHT,
  TRACK_STEPS.APPLICATION,
  TRACK_STEPS.INTEGRATION,
];

export const TRACKS = [
  {
    id: 'version-of-me',
    order: 1,
    title: 'Version of Me',
    territory: 'ARMOR',
    shadowCode: 'What protected you can imprison you.',
    lightCode: 'Keep the strength. Return the debt.',

    encounter: {
      lead: 'Listen first. Let the song finish before you answer anything.',
      question: 'What in this felt like a description of you rather than a story about someone else?',
    },

    pattern: {
      condition: 'The ground kept moving.',
      question: 'What did you learn to do?',
      responses: [
        'Read every room before I entered it',
        'Never need anything out loud',
        'Stay useful so I could not be discarded',
        'Stay three steps ahead of everyone',
      ],
      adaptationQuestion: 'And what does that look like now, on an ordinary day?',
    },

    recognition: {
      protectionQuestion: 'What did that keep safe?',
      costQuestion: 'What has it cost since?',
    },

    imagination: {
      instruction: 'Let the version of you that learned this appear. Do not direct them. Watch.',
      prompts: [
        'What do you notice?',
        'What does this part want?',
        'What was it protecting?',
        'What does it need now?',
      ],
    },

    practice: {
      instruction:
        'One rehearsal, out loud or on the page: "I am the version of me that this forced into existence."',
      question: 'What happened in the body when you said it?',
    },

    application: {
      scenario: 'Someone offers you help you actually need this week.',
      question: 'What would the Forged Witness do that the armor would not?',
    },

    integration: {
      keepQuestion: 'What is the strength here — the part you keep?',
      returnQuestion: 'What is the debt here — the part you return?',
    },
  },

  {
    id: 'five-minutes-from-the-edge',
    order: 2,
    title: '5 Minutes From The Edge',
    territory: 'SACRIFICE',
    shadowCode: 'Loving someone means dying for them repeatedly to keep them sane.',
    lightCode: 'I can walk away to survive without punishing your shame.',

    encounter: {
      lead: 'Listen first. Notice who you thought of before the second verse.',
      question: 'Whose survival did you make your responsibility?',
    },

    pattern: {
      condition: "Someone else's collapse became your job to prevent.",
      question: 'What did you learn to do?',
      responses: [
        'Absorb the crisis before it landed',
        'Be the calm one, always',
        'Postpone my own collapse indefinitely',
        'Treat my limit as negotiable',
      ],
      adaptationQuestion: 'Where does that still run — with whom, and how often?',
    },

    recognition: {
      protectionQuestion: 'What did that keep safe — for them, and for you?',
      costQuestion: 'What did it take from you to keep providing it?',
    },

    imagination: {
      instruction: 'Let the one who kept saving them appear. Sit with them.',
      prompts: [
        'What do you notice about how they hold themselves?',
        'What are they afraid happens if they stop?',
        'What were they protecting?',
        'What would let them rest?',
      ],
    },

    practice: {
      instruction:
        'Rehearse the sentence that leaves without indicting: "I am going, and it is not a verdict on you."',
      question: 'What did you want to add to it — and what happens if you do not?',
    },

    application: {
      scenario: 'The next time their crisis arrives and you are already empty.',
      question: 'What is the response that survives you and does not punish them?',
    },

    integration: {
      keepQuestion: 'What is the strength here — the part you keep?',
      returnQuestion: 'What is the debt here — the part you return?',
    },
  },

  {
    id: 'ashes-and-iron',
    order: 3,
    title: 'Ashes and Iron',
    subtitle: 'Bloodline and Flame',
    territory: 'RAGE',
    shadowCode: 'My rage is an armor that will heal my broken pride.',
    lightCode: 'Only releasing the crusade will grant mercy unrehearsed.',

    encounter: {
      lead: 'Listen first. Let the heat come up without managing it.',
      question: 'What case is still open in you?',
    },

    pattern: {
      condition: 'What was owed to you was never paid.',
      question: 'What did you learn to do?',
      responses: [
        'Keep the case open',
        'Strike first and explain later',
        'Turn every hurt into heat',
        'Carry the verdict for the whole bloodline',
      ],
      adaptationQuestion: 'Who receives that heat now who never earned it?',
    },

    recognition: {
      protectionQuestion: 'What did the rage protect when it first arrived?',
      costQuestion: 'What does keeping the crusade cost you now?',
    },

    imagination: {
      instruction: 'Let the one carrying the flame appear. Do not disarm them. Ask.',
      prompts: [
        'What do you notice about what they are guarding?',
        'What verdict are they still waiting for?',
        'What were they protecting?',
        'What would let them set it down?',
      ],
    },

    practice: {
      instruction:
        'Name one thing you have been prosecuting. Write the sentence that closes the case without conceding the truth of it.',
      question: 'What is left when the crusade is not doing the talking?',
    },

    application: {
      scenario: 'The next time the old heat rises and the person in front of you is not the one who caused it.',
      question: 'What does mercy unrehearsed actually sound like there?',
    },

    integration: {
      keepQuestion: 'What is the strength here — the part you keep?',
      returnQuestion: 'What is the debt here — the part you return?',
    },
  },

  {
    id: 'felt-that-drift',
    order: 4,
    title: 'Felt That Drift',
    territory: 'CONTROL',
    shadowCode: "Fear builds cages to maintain Earth's control.",
    lightCode: 'Mastery moves within; the body knows before the mind can look.',

    encounter: {
      lead: 'Listen first. Notice where in your body you registered the drift.',
      question: 'What did you know was ending before anyone said so?',
    },

    pattern: {
      condition: 'You were punished for what you could not predict.',
      question: 'What did you learn to do?',
      responses: [
        'Plan the exit before I arrived',
        'Hold everything at one remove',
        "Manage the outcome for everyone in the room",
        'Call the drift before it could be confirmed',
      ],
      adaptationQuestion: 'What does that control look like on a good day now?',
    },

    recognition: {
      protectionQuestion: 'What did the cage keep out?',
      costQuestion: 'What has it also kept out that you wanted in?',
    },

    imagination: {
      instruction: 'Let the one who builds the cages appear. Watch them work.',
      prompts: [
        'What do you notice about what they are bracing for?',
        'What are they certain is coming?',
        'What were they protecting?',
        'What would let them loosen one bar?',
      ],
    },

    practice: {
      instruction:
        'One question, asked of the body before the mind: where did you feel that, and what did it already know?',
      question: 'What did the body report that the plan had not accounted for?',
    },

    application: {
      scenario: 'The next time you sense a drift and want to manage it preemptively.',
      question: 'What would it mean to let the body report first and act second?',
    },

    integration: {
      keepQuestion: 'What is the strength here — the part you keep?',
      returnQuestion: 'What is the debt here — the part you return?',
    },
  },

  {
    id: 'if-he-could-only-see',
    order: 5,
    title: 'If He Could Only See',
    territory: 'SILENCE',
    shadowCode: 'Safety means remaining silent and chasing external approval.',
    lightCode: 'The truth is louder than the lies they told; real love rises above the fear.',

    encounter: {
      lead: 'Listen first. Let the unsaid thing come up on its own.',
      question: 'What have you never said, to whom?',
    },

    pattern: {
      condition: 'Telling the truth cost more than carrying it.',
      question: 'What did you learn to do?',
      responses: [
        'Say the version they could accept',
        'Earn the right to speak first',
        'Keep the record inside',
        'Perform fine',
      ],
      adaptationQuestion: 'Where does the edited version still get spoken instead of the real one?',
    },

    recognition: {
      protectionQuestion: 'What did the silence keep safe?',
      costQuestion: 'What has it kept unspoken that is still yours to say?',
    },

    imagination: {
      instruction: 'Let the one who learned to stay quiet appear. Let them take their time.',
      prompts: [
        'What do you notice about how they wait?',
        'What are they still holding?',
        'What were they protecting?',
        'What would they need in order to speak?',
      ],
    },

    practice: {
      instruction:
        'Write the unedited sentence — the one with no softener in front of it. It does not have to be sent.',
      question: 'What changed in you once it existed in writing?',
    },

    application: {
      scenario: 'The next room where the edited version is easier.',
      question: 'What is the one true sentence you will not trade for approval?',
    },

    integration: {
      keepQuestion: 'What is the strength here — the part you keep?',
      returnQuestion: 'What is the debt here — the part you return?',
    },
  },

  {
    id: 'if-you-really-listened',
    order: 6,
    title: 'If You Really Listened',
    territory: 'NUMBNESS',
    shadowCode: 'Moving on quietly means I am untouched by the fall.',
    lightCode: 'I am not numb; I alchemized a void into my survival.',

    encounter: {
      lead: 'Listen first. Notice what you moved past without stopping.',
      question: 'What did you never actually grieve?',
    },

    pattern: {
      condition: 'Feeling it fully would have stopped you, and you could not stop.',
      question: 'What did you learn to do?',
      responses: [
        'Feel it later',
        'Move on before the grief landed',
        'Keep the voice level',
        'Convert the ache into output',
      ],
      adaptationQuestion: 'What still gets converted instead of felt?',
    },

    recognition: {
      protectionQuestion: 'What did moving on quietly make possible?',
      costQuestion: 'What has gone unfelt in order to keep it possible?',
    },

    imagination: {
      instruction: 'Let the one who kept moving appear. Let them stop.',
      prompts: [
        'What do you notice when they are finally still?',
        'What have they been carrying without naming?',
        'What were they protecting?',
        'What would let them feel it now?',
      ],
    },

    practice: {
      instruction: 'Name one thing you moved past. Say what it actually cost, in plain words.',
      question: 'What arrived in the body when it was named rather than converted?',
    },

    application: {
      scenario: 'The next loss, large or small, that you would normally absorb and continue through.',
      question: 'What would it look like to let it register before you move?',
    },

    integration: {
      keepQuestion: 'What is the strength here — the part you keep?',
      returnQuestion: 'What is the debt here — the part you return?',
    },
  },
];

/**
 * The screen order. The engine walks this list; each `track` screen runs
 * that track's full internal encounter (song → … → integration), so the
 * pacing of a single encounter can change without touching the engine.
 */
const SCREENS = [
  { id: 'bridge', type: 'bridge', hideNav: true,
    eyebrow: 'Pillar One → Pillar Two',
    lines: [
      'Pillar One taught you to separate the event from the story.',
      'Pillar Two asks what surviving the event taught you to become.',
    ],
    closingLine:
      'Because an adaptation can become an identity if nobody ever questions the code underneath it.',
    ctaLabel: 'Enter the Forged Witness',
  },

  { id: 'activation', type: 'intro', hideNav: true },

  ...TRACKS.map((track) => ({ id: track.id, type: 'track', trackId: track.id, ownsNav: true })),

  { id: 'armor-inventory', type: 'armor-inventory' },
  { id: 'strength-debt', type: 'strength-debt' },
  { id: 'survival-code', type: 'survival-code' },
  { id: 'transfer', type: 'transfer' },
  { id: 'integration', type: 'integration' },
  { id: 'record', type: 'record' },
  { id: 'seal', type: 'seal', hideNav: true },
];

/** Trim and drop empties, so the record never prints a blank line. */
function filled(values) {
  return values.map((v) => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);
}

/**
 * Builds Pillar Two's Recognition Record from what the Seeker actually
 * wrote. Supplied to the engine as `buildRecord` so the shared
 * PillarRecord component never learns Pillar Two's vocabulary (§13/§44).
 */
function buildRecord({ state }) {
  const experience = state.experience || {};
  const tracks = experience.tracks || {};
  const completed = TRACKS.filter((t) => state.completedTracks?.includes(t.id));

  const sections = [
    { label: 'My survival code', value: experience.personalSurvivalCode },
    {
      label: 'What protected me',
      values: filled(TRACKS.map((t) => tracks[t.id]?.protection)),
    },
    {
      label: 'What I keep',
      values: filled(TRACKS.map((t) => tracks[t.id]?.keep)),
    },
    {
      label: 'What I return',
      values: filled(TRACKS.map((t) => tracks[t.id]?.debt)),
    },
    {
      label: 'What I will do differently',
      values: filled([
        ...TRACKS.map((t) => tracks[t.id]?.application),
        experience.transferResponse,
      ]),
    },
    { label: 'Carry code', value: experience.carryCode },
  ];

  const items = completed.map((t) => `${t.territory} · ${t.title}`);

  const summary =
    completed.length === TRACKS.length
      ? 'Six adaptations named, and the rule underneath them written in your own words. The armor remains — it is no longer running the whole system.'
      : `${completed.length} of ${TRACKS.length} encounters recorded. The Chamber holds them until you return.`;

  return { items, sections, summary };
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

  question: 'What did you have to become to survive what happened to you?',
  hinge: 'What did surviving those conditions cause me to become?',

  shadowCode: 'What protected you can imprison you.',
  lightCode: 'Keep the strength. Return the debt.',

  // Referenced, not restated — the curriculum layer owns these.
  mantra: PILLAR?.mantra,
  pillarSeal: PILLAR?.seal,

  tracks: TRACKS,
  screens: SCREENS,
  buildRecord,

  synthesis: {
    survivalCodePrompt: 'What rule did all of these adaptations have in common?',
    transferQuestion: 'What does the Forged Witness do instead?',
    carryCodePrompt: 'Write the one line you carry out of this Chamber.',
  },

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
