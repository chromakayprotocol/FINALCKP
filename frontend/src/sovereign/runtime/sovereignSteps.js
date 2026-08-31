/**
 * The 11-step Hermetic Hall curriculum lifecycle (Phase 4 of the Sovereign
 * OS migration).
 *
 * Every Hermetic Hall module (the seven Hermetic principles) walks the same
 * 11 steps below. This is that track's own step *shape* — "teach a
 * principle": intro -> principle -> key concepts -> why it matters ->
 * domains -> reclamation -> 2026 lens -> reflection -> protocol -> artifact
 * -> summary. It is not a generic, app-wide lifecycle: the four-Act pathway
 * (Fractured Veil, Reflection Chamber, Reclamation, Crucible Code) is a
 * structurally separate track that was never migrated onto this shape and
 * should not be forced onto it — see
 * `sovereign/reflectionChamber/reflectionChamberSteps.js` for that track's
 * own, differently-shaped step list.
 *
 * `evaluateModuleSteps`/`isStepComplete`/`isModuleComplete` below take the
 * step list (and the promptId that step list uses for its one
 * reflection-gate step) as parameters, defaulting to this Hermetic Hall
 * shape so none of the six existing Hermetic Hall call sites need to
 * change — but any other track can pass its own step list through the same
 * evaluator rather than duplicating the walk-and-lock logic.
 *
 * The critical rule from the migration guide, true for any step list this
 * evaluator runs: **"Next" is not "complete."** Each step defines its own
 * completion criteria, evaluated against real runtime state (module state,
 * reflections, concepts, synthesis, artifact) — not just whether the user
 * navigated past it. Progression this way represents engagement rather
 * than navigation.
 */

import {
  selectReflectionEntry,
  selectConcepts,
  selectSynthesis,
  selectArtifact,
} from './sovereignSelectors';

export const SOVEREIGN_STEP_IDS = Object.freeze({
  INTRO: '01-intro',
  PRINCIPLE: '02-principle',
  KEY_CONCEPTS: '03-key-concepts',
  WHY_IT_MATTERS: '04-why-it-matters',
  DOMAINS: '05-domains',
  RECLAMATION: '06-reclamation',
  LENS_2026: '07-2026-lens',
  REFLECTION: '08-reflection',
  PROTOCOL: '09-protocol',
  ARTIFACT: '10-artifact',
  SUMMARY: '11-summary',
});

export const SOVEREIGN_STEP_STATUSES = Object.freeze({
  LOCKED: 'locked',
  ACTIVE: 'active',
  COMPLETE: 'complete',
});

/**
 * @typedef {Object} StepCompletionContext
 * @property {import('./sovereignState').SovereignModuleState} module
 * @property {Object|null} reflectionEntry - this module's REFLECTION-step entry
 * @property {{selected: string[], connections: Array}} concepts
 * @property {{protocolExecutions: Array}} synthesis
 * @property {{status: string, draft: Object|null, sealedAt: string|null}} artifact
 */

const viewed = (stepId) => (ctx) => ctx.module.viewedSteps.includes(stepId);

/**
 * Ordered step definitions. `isComplete` is the single source of truth for
 * whether a step counts as done — nothing else (not currentStep, not
 * navigation) determines this.
 */
export const SOVEREIGN_STEPS = [
  {
    id: SOVEREIGN_STEP_IDS.INTRO,
    order: 1,
    label: 'Intro',
    isComplete: viewed(SOVEREIGN_STEP_IDS.INTRO),
  },
  {
    id: SOVEREIGN_STEP_IDS.PRINCIPLE,
    order: 2,
    label: 'Principle',
    isComplete: viewed(SOVEREIGN_STEP_IDS.PRINCIPLE),
  },
  {
    id: SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
    order: 3,
    label: 'Key Concepts',
    // Module-scoped as of Phase 10 (Concept Graph): requires a concept
    // selected while *this* module was active (module.selectedConcepts),
    // not just anywhere in the session — see sovereignState.js's
    // createModuleState() for why that's tracked on the module rather
    // than derived from the global concepts.selected list.
    isComplete: (ctx) => ctx.module.selectedConcepts.length > 0,
  },
  {
    id: SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
    order: 4,
    label: 'Why It Matters',
    isComplete: viewed(SOVEREIGN_STEP_IDS.WHY_IT_MATTERS),
  },
  {
    id: SOVEREIGN_STEP_IDS.DOMAINS,
    order: 5,
    label: 'Domains',
    isComplete: viewed(SOVEREIGN_STEP_IDS.DOMAINS),
  },
  {
    id: SOVEREIGN_STEP_IDS.RECLAMATION,
    order: 6,
    label: 'Reclamation',
    isComplete: viewed(SOVEREIGN_STEP_IDS.RECLAMATION),
  },
  {
    id: SOVEREIGN_STEP_IDS.LENS_2026,
    order: 7,
    label: '2026 Lens',
    isComplete: viewed(SOVEREIGN_STEP_IDS.LENS_2026),
  },
  {
    id: SOVEREIGN_STEP_IDS.REFLECTION,
    order: 8,
    label: 'Reflection',
    isComplete: (ctx) => ctx.reflectionEntry !== null,
  },
  {
    id: SOVEREIGN_STEP_IDS.PROTOCOL,
    order: 9,
    label: 'Protocol',
    isComplete: (ctx) =>
      ctx.synthesis.protocolExecutions.some((execution) => execution.moduleId === ctx.module.moduleId),
  },
  {
    id: SOVEREIGN_STEP_IDS.ARTIFACT,
    order: 10,
    label: 'Artifact',
    // Phase 14 (Artifact Compiler) kept the relationship this step reads
    // unchanged: there is one cross-journey Living Artifact, not a
    // per-module artifact, so this step completes when that single slot
    // has been sealed at all — not scoped to this module.
    isComplete: (ctx) => ctx.artifact.status === 'sealed',
  },
  {
    id: SOVEREIGN_STEP_IDS.SUMMARY,
    order: 11,
    label: 'Summary',
    // A recap can't be "complete" on its own — it requires everything
    // before it to already be done, plus having been viewed itself.
    isComplete: (ctx) =>
      ctx.module.viewedSteps.includes(SOVEREIGN_STEP_IDS.SUMMARY) &&
      SOVEREIGN_STEPS.slice(0, 10).every((step) => step.isComplete(ctx)),
  },
];

/**
 * @param {string} reflectionPromptId which promptId this step list's
 *   reflection-gate step reads — each step list defines its own (Hermetic
 *   Hall's is SOVEREIGN_STEP_IDS.REFLECTION; the Reflection Chamber's is
 *   its own REFLECT step id), since a module can only ever be evaluated
 *   against one step list at a time.
 * @returns {StepCompletionContext}
 */
function buildStepContext(state, module, reflectionPromptId) {
  return {
    module,
    reflectionEntry: selectReflectionEntry(state, module.moduleId, reflectionPromptId),
    concepts: selectConcepts(state),
    synthesis: selectSynthesis(state),
    artifact: selectArtifact(state),
  };
}

/**
 * Evaluates every step's real completion status for a module, and locks
 * anything past the first incomplete step — you can be *on* the first
 * unfinished step, but you can't skip ahead of it.
 *
 * @param {Array} steps defaults to the Hermetic Hall 11-step lifecycle;
 *   pass a track's own step list (e.g. REFLECTION_CHAMBER_STEPS) to
 *   evaluate that track instead.
 * @param {string} reflectionPromptId defaults to Hermetic Hall's REFLECTION
 *   step id; pass the matching id for whatever `steps` list you pass.
 * @returns {Array<{id: string, order: number, label: string, status: string}>}
 */
export function evaluateModuleSteps(
  state,
  moduleId,
  steps = SOVEREIGN_STEPS,
  reflectionPromptId = SOVEREIGN_STEP_IDS.REFLECTION,
) {
  const module = state.curriculum.modules[moduleId];
  if (!module) {
    return steps.map((step) => ({
      id: step.id,
      order: step.order,
      label: step.label,
      status: SOVEREIGN_STEP_STATUSES.LOCKED,
    }));
  }

  const ctx = buildStepContext(state, module, reflectionPromptId);
  let reachable = true;

  return steps.map((step) => {
    if (!reachable) {
      return { id: step.id, order: step.order, label: step.label, status: SOVEREIGN_STEP_STATUSES.LOCKED };
    }
    const complete = step.isComplete(ctx);
    if (!complete) {
      reachable = false;
    }
    return {
      id: step.id,
      order: step.order,
      label: step.label,
      status: complete ? SOVEREIGN_STEP_STATUSES.COMPLETE : SOVEREIGN_STEP_STATUSES.ACTIVE,
    };
  });
}

export function isStepComplete(
  state,
  moduleId,
  stepId,
  steps = SOVEREIGN_STEPS,
  reflectionPromptId = SOVEREIGN_STEP_IDS.REFLECTION,
) {
  const step = steps.find((candidate) => candidate.id === stepId);
  const module = state.curriculum.modules[moduleId];
  if (!step || !module) return false;
  return step.isComplete(buildStepContext(state, module, reflectionPromptId));
}

export function isModuleComplete(
  state,
  moduleId,
  steps = SOVEREIGN_STEPS,
  reflectionPromptId = SOVEREIGN_STEP_IDS.REFLECTION,
) {
  return evaluateModuleSteps(state, moduleId, steps, reflectionPromptId).every(
    (step) => step.status === SOVEREIGN_STEP_STATUSES.COMPLETE,
  );
}
