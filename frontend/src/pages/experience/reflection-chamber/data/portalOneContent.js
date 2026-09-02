/**
 * Portal One / "The Owned Interior" — interactive-exercise content that
 * isn't part of the authored curriculum in reflectionChamberModuleData.js
 * (the modern scenarios, the sorter statements, the mastery transfer case).
 * The real shadow/light codes, practices, mantra and seal for this pillar
 * stay in reflectionChamberModuleData.js — this file only holds the UI
 * exercise scaffolding built around them.
 */

export const OPENING_SITUATION = {
  app: 'MESSAGES',
  from: 'YOU',
  message: 'Hey, are we still good for tomorrow?',
  status: 'SEEN · 10:48 PM',
  followUp: 'NO RESPONSE',
};

export const SORT_CATEGORIES = [
  { id: 'fact', label: 'The Fact' },
  { id: 'feeling', label: 'The Feeling' },
  { id: 'assumption', label: 'The Assumption' },
  { id: 'story', label: 'The Story' },
];

export const SORT_STATEMENTS = [
  { id: 'seen', text: 'They saw the message.', category: 'fact' },
  { id: 'rejected', text: 'I feel rejected.', category: 'feeling' },
  { id: 'ignoring', text: "They're ignoring me.", category: 'assumption' },
  { id: 'dont-matter', text: "I don't matter to them.", category: 'story' },
];

export const MODERN_SCENARIOS = [
  { id: 'relationships', domain: 'RELATIONSHIPS', line: '"They haven’t answered."' },
  { id: 'work', domain: 'WORK', line: '"We need to talk."' },
  { id: 'social', domain: 'SOCIAL MEDIA', line: '"Some people eventually show you who they really are."' },
  { id: 'messaging', domain: 'MESSAGING', line: '"Read 2 hours ago."' },
];

export const DIGITAL_SEQUENCE_STEPS = ['SEEN', 'TYPING…', 'NO RESPONSE', 'ACTIVE 5 MIN AGO', 'LIKED A POST'];

export const PERSONAL_REFLECTION_EMOTIONS = [
  'Rejected',
  'Anxious',
  'Angry',
  'Numb',
  'Sad',
  'Relieved',
  'Confused',
  'Ashamed',
];

export const REHEARSED_LINES = [
  "I'm over it.",
  "I don't care.",
  "That's just how I am.",
  "I already know why.",
  "I'm fine.",
];

export const UNBENT_DOOR_CHOICES = [
  'HAVE THE CONVERSATION',
  'SET THE BOUNDARY',
  'ASK THE QUESTION',
  'WAIT',
  'MAKE THE DECISION',
  'LET IT GO',
];

export const MASTERY_SCENARIO = {
  setup: 'A friend cancels plans twice. You notice they’re still making plans with other people.',
};

/**
 * Screen 35 — what the Seeker demonstrably did, not a score. The list runs the
 * full arc: recognition first, then the code work the pillar exists for.
 */
export const PILLAR_RECORD_ITEMS = [
  'DISTINGUISHED FACT FROM INTERPRETATION',
  'IDENTIFIED AN INTERNAL RESPONSE',
  'EXAMINED AN ASSUMPTION',
  'IDENTIFIED A STORY',
  'IDENTIFIED AN OPERATING CODE',
  'ENCOUNTERED SHADOW MATERIAL',
  'ENGAGED IN REFLECTIVE DIALOGUE',
  'NAMED THE LEGITIMATE ENERGY BENEATH THE PATTERN',
  'PRACTICED THE LIGHT CODE',
  'APPLIED THE DISTINCTION TO A NEW SITUATION',
];

/* ---------------------------------------------------------------------------
 * The Shadow Code arc.
 *
 * Everything above this line runs the recognition half of the pillar: the
 * Seeker learns to separate EVENT from RESPONSE from INTERPRETATION from
 * STORY. Everything below runs the half the pillar actually exists for —
 * finding the operating CODE underneath the story, meeting the part of the
 * Seeker that learned it, and carrying a governed replacement back out.
 * ------------------------------------------------------------------------- */

/** Screen 22 — what the Seeker checks first when the old story returns. */
export const COMMITMENT_ANCHORS = ['The fact', 'The feeling', 'The assumption', 'The story', 'My response'];

/** Screen 23 — the four layers the Seeker has already separated, plus the fifth. */
export const CODE_LAYERS = ['Event', 'Response', 'Interpretation', 'Story'];

export const CODE_DISCOVERY_LEAD = 'For this story to be true, I must believe that…';

/**
 * Screen 26 — the Shadow may take any form. These are offered as language for
 * what the Seeker noticed, never as a prescription: the pillar must not tell
 * anyone that their shadow is "a dark version of themselves."
 */
export const SHADOW_FIGURE_FORMS = [
  'A silhouette',
  'A fragmented reflection',
  'A distorted double',
  'A masked face',
  'Another version of me',
  'A fractured mirror',
  'A shadow on water',
  'A voice, with no figure',
  'A memory',
  'A sensation, nothing visual',
];

/** Screen 27 — Active Imagination. Received, not prescribed. */
export const ACTIVE_IMAGINATION_PROMPTS = [
  { id: 'notice', question: 'What do you notice first?' },
  { id: 'wants', question: 'What does it seem to want?' },
  { id: 'protecting', question: 'What is it protecting?' },
  { id: 'if-stopped', question: 'What does it believe would happen if it stopped?' },
];

/** Screen 28 — openings for the exchange. The Seeker writes both sides. */
export const DIALOGUE_PROMPTS = [
  'What are you trying to protect me from?',
  'When did you learn this?',
  'What do you need me to understand?',
  'What have you cost me?',
  'What strength are you holding that I have rejected?',
  'What would you become if you no longer had to protect me this way?',
];

/** Screen 29 — the legitimate need trapped inside the old behavior. */
export const PROTECTED_NEEDS = [
  'Safety',
  'Control',
  'Dignity',
  'Love',
  'Autonomy',
  'Power',
  'Belonging',
  'Truth',
  'Survival',
  'Self-respect',
];

/** Screen 33 — transfer. A rehearsal of the same event under the new code. */
export const TRANSFER_SCENARIO = {
  setup: 'The same event happens again. The message is seen. No reply comes.',
  oldCodePrompt: 'What would the old code do?',
  lightCodePrompt: 'What would the Light Code do?',
};
