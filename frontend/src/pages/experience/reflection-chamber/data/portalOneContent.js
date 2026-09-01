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

export const PILLAR_RECORD_ITEMS = [
  'DISTINGUISHED FACT FROM INTERPRETATION',
  'IDENTIFIED AN INTERNAL RESPONSE',
  'EXAMINED AN ASSUMPTION',
  'SELECTED A DELIBERATE RESPONSE',
  'COMPLETED PRACTICE',
];
