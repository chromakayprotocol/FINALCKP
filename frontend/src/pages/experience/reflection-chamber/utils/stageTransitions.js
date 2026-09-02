/**
 * Reflection Chamber — sequence helpers.
 *
 * Two layers live here, deliberately separated:
 *
 *   1. Generic sequence math (indexInSequence / nextInSequence /
 *      previousInSequence). It knows nothing about any pillar — it walks
 *      whatever ordered list of ids it is handed, so a pillar's screen
 *      order can come from that pillar's own config.
 *   2. Portal One's fixed stage sequence (STAGES / STAGE_ORDER and the
 *      stageIndex/nextStage/previousStage wrappers). This is Portal One's
 *      screen-by-screen order and nothing else's; it is kept intact so
 *      Portal One's saved sessions and behaviour are unchanged.
 *
 * Local UI concern only — the Reflection Chamber persists its own
 * experience state (state/usePillarExperience.js), not a shared app-wide
 * curriculum engine.
 */

/* ── Generic sequence math ─────────────────────────────────────────── */

export function indexInSequence(sequence, id) {
  return sequence.indexOf(id);
}

export function nextInSequence(sequence, id) {
  const i = sequence.indexOf(id);
  return i >= 0 && i < sequence.length - 1 ? sequence[i + 1] : id;
}

export function previousInSequence(sequence, id) {
  const i = sequence.indexOf(id);
  return i > 0 ? sequence[i - 1] : id;
}

/** Ordered ids of a config-supplied screen list (see data/forgedWitnessConfig.js). */
export function screenIds(screens = []) {
  return screens.map((screen) => screen.id);
}

/* ── Portal One / "The Owned Interior" ─────────────────────────────── */

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
  return indexInSequence(STAGE_ORDER, stage);
}

export function nextStage(stage) {
  return nextInSequence(STAGE_ORDER, stage);
}

export function previousStage(stage) {
  return previousInSequence(STAGE_ORDER, stage);
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
