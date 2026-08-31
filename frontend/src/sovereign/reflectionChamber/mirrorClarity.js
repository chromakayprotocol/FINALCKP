/**
 * Mirror Clarity — Act II (Reflection Chamber) environmental progression.
 *
 * The Reflection Chamber architecture guide (docs/ACT_II_REFLECTION_CHAMBER_ARCHITECTURE.md)
 * asks for "Mirror Clarity" as a service that represents restoration of the
 * Chamber, not raw points, and for the Chamber's environment to be driven by
 * real state rather than ad hoc CSS. It is intentionally a pure derivation
 * over the Sovereign Runtime's existing state — same pattern as
 * moduleSynthesisReadiness() and buildDomainMatrix() before it — because the
 * runtime already tracks everything Mirror Clarity needs (per-module step
 * completion via evaluateModuleSteps()); it does not need its own mutable
 * state, reducer cases, or Supabase table.
 *
 * Each of the five pillars authored in reflectionChamberModuleData.js is
 * modeled as its own Sovereign module, namespaced the same way Hermetic Hall
 * namespaces its principles (`hermetic-hall/vibration`, etc.) — see
 * REFLECTION_CHAMBER_PILLAR_IDS below and moduleId(). Mirror Clarity is the
 * average of those five modules' synthesisReadiness, evaluated against the
 * Reflection Chamber's *own* step lifecycle (reflectionChamberSteps.js) —
 * not Hermetic Hall's 11-step one, which is a different track's step shape
 * (see that file's header for why they must stay separate) — bucketed into
 * the five environmental states the guide names (FRACTURED -> CLEAR).
 * Nothing here decides how those states render — that is the Chamber
 * environment component's job.
 */

import { moduleSynthesisReadiness } from '../synthesis/sovereignSynthesis';
import { REFLECTION_CHAMBER_STEPS, REFLECTION_CHAMBER_STEP_IDS } from './reflectionChamberSteps';

export const REFLECTION_CHAMBER_MODULE_PREFIX = 'reflection-chamber/';

/** Pillar ids, in order — must match reflectionChamberModuleData.js's PILLARS[].id. */
export const REFLECTION_CHAMBER_PILLAR_IDS = Object.freeze([
  'owned-interior',
  'forged-witness',
  'sacred-restraint',
  'open-frequency',
  'mirror-walker-boundary',
]);

export const MIRROR_CLARITY_STATES = Object.freeze({
  FRACTURED: 'FRACTURED',
  DISTORTED: 'DISTORTED',
  ALIGNED: 'ALIGNED',
  INTEGRATED: 'INTEGRATED',
  CLEAR: 'CLEAR',
});

/** The Sovereign moduleId for a given Reflection Chamber pillar. */
export function reflectionChamberModuleId(pillarId) {
  return `${REFLECTION_CHAMBER_MODULE_PREFIX}${pillarId}`;
}

/**
 * Maps a 0..1 clarity score to one of the five environmental states the
 * guide describes (fractured geometry through the Reflection Core). Bucket
 * edges are deliberately simple: 0 is untouched, 1 is every pillar fully
 * complete, and the three states between mark real, visible progress
 * thresholds rather than even fifths.
 */
export function clarityStateFor(score) {
  if (score <= 0) return MIRROR_CLARITY_STATES.FRACTURED;
  if (score < 0.4) return MIRROR_CLARITY_STATES.DISTORTED;
  if (score < 0.8) return MIRROR_CLARITY_STATES.ALIGNED;
  if (score < 1) return MIRROR_CLARITY_STATES.INTEGRATED;
  return MIRROR_CLARITY_STATES.CLEAR;
}

/**
 * @param {import('../runtime/sovereignState').SovereignModuleState} state Sovereign Runtime state
 * @param {string[]} [pillarIds] defaults to all five Reflection Chamber pillars
 * @returns {{
 *   score: number,
 *   state: string,
 *   perPillar: Array<{ pillarId: string, moduleId: string, readiness: number }>,
 * }}
 */
export function mirrorClarity(state, pillarIds = REFLECTION_CHAMBER_PILLAR_IDS) {
  const perPillar = pillarIds.map((pillarId) => {
    const moduleId = reflectionChamberModuleId(pillarId);
    const readiness = moduleSynthesisReadiness(
      state,
      moduleId,
      REFLECTION_CHAMBER_STEPS,
      REFLECTION_CHAMBER_STEP_IDS.REFLECT,
    );
    return { pillarId, moduleId, readiness };
  });

  const score = perPillar.length
    ? perPillar.reduce((sum, pillar) => sum + pillar.readiness, 0) / perPillar.length
    : 0;

  return { score, state: clarityStateFor(score), perPillar };
}
