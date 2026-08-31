/**
 * The Reflection Chamber's own step lifecycle — deliberately NOT Hermetic
 * Hall's 11-step curriculum lifecycle (`sovereign/runtime/sovereignSteps.js`).
 *
 * Correction from an earlier draft of this architecture, which reused
 * SOVEREIGN_STEPS directly for the Reflection Chamber's pillars. That was
 * wrong: the four-Act pathway (Fractured Veil, Reflection Chamber,
 * Reclamation, Crucible Code) is a structurally separate track from
 * Hermetic Hall's seven Hermetic principles — `docs/ARCHITECTURE.md`'s own
 * migration log says so explicitly ("no non-Hall faculties, no cross-Act
 * navigation" was still true as of Phase 15/19). SOVEREIGN_STEPS is
 * Hermetic Hall's own step *shape* for "teach a principle" (intro ->
 * principle -> key concepts -> why it matters -> domains -> reclamation ->
 * 2026 lens -> ...); a Reflection Chamber pillar isn't teaching a
 * principle, it's diagnosing a pattern (shadow codes) and rewriting it
 * (light codes + practice) — see reflectionChamberModuleData.js's actual
 * pillar shape. Forcing pillar content through steps like "02-principle"
 * or "06-reclamation" would mean inventing content that doesn't exist.
 *
 * What genuinely IS shared with Hermetic Hall, on purpose: the Sovereign
 * Runtime primitives this lifecycle is evaluated against —
 * selectConcept(), startReflection()/commitReflection(), executeProtocol(),
 * the event bus, Supabase persistence — and the walk-and-lock evaluator
 * itself (evaluateModuleSteps(), generalized to take any step list for
 * exactly this reason). Only the step *shape* below is pillar-specific.
 */

export const REFLECTION_CHAMBER_STEP_IDS = Object.freeze({
  ENTER: '01-enter',
  DIAGNOSE: '02-diagnose',
  REFLECT: '03-reflect',
  INSTRUCT: '04-instruct',
  PRACTICE: '05-practice',
  SEAL: '06-seal',
});

const viewed = (stepId) => (ctx) => ctx.module.viewedSteps.includes(stepId);

/**
 * Ordered step definitions for one Reflection Chamber pillar module
 * (moduleId `reflection-chamber/<pillar-id>` — see mirrorClarity.js).
 *
 * - ENTER: viewed the pillar's intro (question/layer/summary).
 * - DIAGNOSE: at least one code (shadow or light) claimed via
 *   selectConcept() while this module was active — deliberately not
 *   split into "shadow claimed" vs "light claimed": that distinction
 *   lives in the pillar's *content* (reflectionChamberModuleData.js),
 *   not in generic runtime state, and evaluateModuleSteps()'s context
 *   only has access to the latter.
 * - REFLECT: a diagnostic reflection committed for this pillar's
 *   REFLECT promptId (startReflection -> updateReflection ->
 *   commitReflection).
 * - INSTRUCT: viewed the pillar's light-code instructional content.
 * - PRACTICE: at least one of the pillar's practices executed via
 *   executeProtocol() for this module.
 * - SEAL: viewed the pillar's mantra/seal, with every step before it
 *   genuinely complete.
 */
export const REFLECTION_CHAMBER_STEPS = [
  {
    id: REFLECTION_CHAMBER_STEP_IDS.ENTER,
    order: 1,
    label: 'Enter',
    isComplete: viewed(REFLECTION_CHAMBER_STEP_IDS.ENTER),
  },
  {
    id: REFLECTION_CHAMBER_STEP_IDS.DIAGNOSE,
    order: 2,
    label: 'Diagnose',
    isComplete: (ctx) => ctx.module.selectedConcepts.length > 0,
  },
  {
    id: REFLECTION_CHAMBER_STEP_IDS.REFLECT,
    order: 3,
    label: 'Reflect',
    isComplete: (ctx) => ctx.reflectionEntry !== null,
  },
  {
    id: REFLECTION_CHAMBER_STEP_IDS.INSTRUCT,
    order: 4,
    label: 'Instruct',
    isComplete: viewed(REFLECTION_CHAMBER_STEP_IDS.INSTRUCT),
  },
  {
    id: REFLECTION_CHAMBER_STEP_IDS.PRACTICE,
    order: 5,
    label: 'Practice',
    isComplete: (ctx) =>
      ctx.synthesis.protocolExecutions.some((execution) => execution.moduleId === ctx.module.moduleId),
  },
  {
    id: REFLECTION_CHAMBER_STEP_IDS.SEAL,
    order: 6,
    label: 'Seal',
    isComplete: (ctx) =>
      ctx.module.viewedSteps.includes(REFLECTION_CHAMBER_STEP_IDS.SEAL) &&
      REFLECTION_CHAMBER_STEPS.slice(0, 5).every((step) => step.isComplete(ctx)),
  },
];
