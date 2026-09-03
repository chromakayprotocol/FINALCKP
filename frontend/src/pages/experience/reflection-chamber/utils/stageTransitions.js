/**
 * Portal One / "The Owned Interior" — ordered stage sequence.
 *
 * The pillar runs in two movements. The first is recognition: EVENT, RESPONSE,
 * INTERPRETATION, STORY, pulled apart until the Seeker can see the seams. The
 * second is the code work the pillar exists for — the rule underneath the
 * story, the encounter with the part of the Seeker that learned it, and the
 * Light Code carried back out of the Chamber. The order matters: the Light Code
 * is a replacement earned after the Shadow encounter, never a lesson delivered
 * before it, so nothing may reveal it ahead of STAGES.LIGHT_CODE.
 *
 * Local UI concern only: this is the screen-by-screen sequence inside the
 * Portal One experience. It has nothing to do with any app-wide runtime —
 * Reflection Chamber persists its own experience state (see
 * state/usePillarExperience.js), not a shared curriculum engine.
 */

export const STAGES = Object.freeze({
  // Recognition — separating what happened from what the mind built around it.
  INTRO: 'intro',
  SITUATION: 'situation',
  SORT: 'sort',
  CONCEPT: 'concept',
  APPLICATION: 'application',
  REFLECTION: 'reflection',
  INSTRUCT: 'instruct',
  PRACTICE: 'practice',
  COMMITMENT: 'commitment',
  // The Shadow Code arc — the rule underneath the story, the part of the
  // Seeker that learned it, and the governed replacement carried back out.
  CODE_DISCOVERY: 'code-discovery',
  SHADOW_CODE: 'shadow-code',
  SHADOW_ENCOUNTER: 'shadow-encounter',
  ACTIVE_IMAGINATION: 'active-imagination',
  DIALOGUE: 'dialogue',
  SHADOW_ENERGY: 'shadow-energy',
  LIGHT_CODE: 'light-code',
  LIGHT_PRACTICE: 'light-practice',
  TRANSFER: 'transfer',
  // Mastery — a situation the Seeker has not been walked through.
  MASTERY: 'mastery',
  SEAL: 'seal',
});

export const STAGE_ORDER = [
  STAGES.INTRO,
  STAGES.SITUATION,
  STAGES.SORT,
  STAGES.CONCEPT,
  STAGES.APPLICATION,
  STAGES.REFLECTION,
  STAGES.INSTRUCT,
  STAGES.PRACTICE,
  STAGES.COMMITMENT,
  STAGES.CODE_DISCOVERY,
  STAGES.SHADOW_CODE,
  STAGES.SHADOW_ENCOUNTER,
  STAGES.ACTIVE_IMAGINATION,
  STAGES.DIALOGUE,
  STAGES.SHADOW_ENERGY,
  STAGES.LIGHT_CODE,
  STAGES.LIGHT_PRACTICE,
  STAGES.TRANSFER,
  STAGES.MASTERY,
  STAGES.SEAL,
];

export function stageIndex(stage) {
  return STAGE_ORDER.indexOf(stage);
}

export function nextStage(stage) {
  const i = stageIndex(stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : stage;
}

export function previousStage(stage) {
  const i = stageIndex(stage);
  return i > 0 ? STAGE_ORDER[i - 1] : stage;
}

export const PRACTICE_PHASES = Object.freeze({
  OBSERVE: 'observe',
  LOG: 'log',
  DOOR: 'door',
});

export const PRACTICE_PHASE_ORDER = [
  PRACTICE_PHASES.OBSERVE,
  PRACTICE_PHASES.LOG,
  PRACTICE_PHASES.DOOR,
];
