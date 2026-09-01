/**
 * Portal One / "The Owned Interior" — ordered stage sequence.
 *
 * Local UI concern only: this is the screen-by-screen sequence inside the
 * Portal One experience. It has nothing to do with any app-wide runtime —
 * Reflection Chamber persists its own experience state (see
 * state/usePortalOneExperience.js), not a shared curriculum engine.
 */

export const STAGES = Object.freeze({
  INTRO: 'intro',
  SITUATION: 'situation',
  SORT: 'sort',
  CONCEPT: 'concept',
  APPLICATION: 'application',
  REFLECTION: 'reflection',
  INSTRUCT: 'instruct',
  PRACTICE: 'practice',
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
