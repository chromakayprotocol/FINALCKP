/**
 * Shadow Twin — pure visual-state derivation (Act II Reflection Chamber).
 *
 * Per the Shadow Twin specification: "The generated Shadow Twin is an Act II
 * state object, not merely an image" and "Mirror Clarity [is] the primary
 * visual driver" of it. This module is that derivation — the same pattern
 * mirrorClarity.js and sovereign/synthesis/sovereignSynthesis.js already
 * use: a pure function over Sovereign Runtime state, no mutable state of its
 * own, no Supabase table, recomputed on every render. It does not decide how
 * the Twin renders (that is ShadowTwinViewport.jsx's job) — only what
 * numbers that renderer should use.
 *
 * There is deliberately only ONE canonical Twin, generated once
 * (sovereign/runtime/sovereignState.js's `shadowTwin` domain). The five
 * Reflection Chamber portals never regenerate it; they change what this
 * derivation returns for the same asset. "Portal" here is the Shadow Twin's
 * own narrative frame for the same five pillars reflectionChamberModuleData.js
 * already defines (owned-interior..mirror-walker-boundary), index-aligned —
 * see SHADOW_TWIN_PORTALS below — not a second curriculum.
 */

import {
  mirrorClarity,
  reflectionChamberModuleId,
  REFLECTION_CHAMBER_PILLAR_IDS,
} from './mirrorClarity';
import { REFLECTION_CHAMBER_STEPS, REFLECTION_CHAMBER_STEP_IDS } from './reflectionChamberSteps';
import { MATERIALIZATION_ORDER, MATERIALIZATION_STATES } from '../runtime/sovereignState';

export { MATERIALIZATION_STATES, MATERIALIZATION_ORDER };

/**
 * The five portals, in canonical order, each carrying: its own id (the
 * Shadow Twin's narrative frame), the materialization state reaching it
 * establishes, and the Reflection Chamber pillar it is index-aligned to.
 * Order matters — it is both MATERIALIZATION_ORDER's portal rungs and the
 * pillar walk order.
 */
export const SHADOW_TWIN_PORTALS = Object.freeze([
  { portalId: 'recognition', materializationState: MATERIALIZATION_STATES.FRAGMENTED_APPARITION, pillarId: REFLECTION_CHAMBER_PILLAR_IDS[0] },
  { portalId: 'confrontation', materializationState: MATERIALIZATION_STATES.MANIFESTATION, pillarId: REFLECTION_CHAMBER_PILLAR_IDS[1] },
  { portalId: 'dialogue', materializationState: MATERIALIZATION_STATES.PRESENCE, pillarId: REFLECTION_CHAMBER_PILLAR_IDS[2] },
  { portalId: 'integration', materializationState: MATERIALIZATION_STATES.CONVERGENCE, pillarId: REFLECTION_CHAMBER_PILLAR_IDS[3] },
  { portalId: 'transformation', materializationState: MATERIALIZATION_STATES.INTEGRATED, pillarId: REFLECTION_CHAMBER_PILLAR_IDS[4] },
]);

export function portalForPillarId(pillarId) {
  return SHADOW_TWIN_PORTALS.find((portal) => portal.pillarId === pillarId) ?? null;
}

export function pillarIdForPortal(portalId) {
  return SHADOW_TWIN_PORTALS.find((portal) => portal.portalId === portalId)?.pillarId ?? null;
}

/**
 * Buckets an overall mirrorClarity score (0..1, the average of exactly five
 * pillars' synthesisReadiness) into one of the six materialization states.
 * Five equal pillars means the natural bucket edges are exact fifths — this
 * intentionally mirrors clarityStateFor()'s shape in mirrorClarity.js.
 *
 * @param {number} score
 * @param {boolean} hasTwin whether a canonical Twin has been generated yet
 */
export function materializationStateForClarity(score, hasTwin) {
  if (!hasTwin) return null;
  if (score >= 1) return MATERIALIZATION_STATES.INTEGRATED;
  if (score >= 0.8) return MATERIALIZATION_STATES.CONVERGENCE;
  if (score >= 0.6) return MATERIALIZATION_STATES.PRESENCE;
  if (score >= 0.4) return MATERIALIZATION_STATES.MANIFESTATION;
  if (score >= 0.2) return MATERIALIZATION_STATES.FRAGMENTED_APPARITION;
  return MATERIALIZATION_STATES.INITIALIZED;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * The one Shadow Twin derivation everything else should read from. Combines
 * the Twin's own domain state with mirrorClarity (which already walks all
 * five pillars' Sovereign module state) into the render-ready parameters
 * the design guide's §29 asks for. Never mutates `shadowTwinState`.
 *
 * @param {import('../runtime/sovereignState').ShadowTwinState} shadowTwinState
 * @param {ReturnType<typeof mirrorClarity>} clarity
 * @returns {{
 *   exists: boolean,
 *   materializationState: string|null,
 *   liveMaterializationState: string|null,
 *   visibility: number,
 *   coherence: number,
 *   fragmentation: number,
 *   distortion: number,
 *   spatialPresence: number,
 *   convergence: number,
 *   integration: number,
 *   activePortalId: string|null,
 * }}
 */
export function deriveShadowTwinVisualState(shadowTwinState, clarity) {
  const exists = shadowTwinState.status === 'ready' || shadowTwinState.status === 'failed'
    ? Boolean(shadowTwinState.canonicalImage)
    : false;
  const score = clamp01(clarity?.score ?? 0);

  // liveMaterializationState is what the pure derivation says *right now*
  // from current Sovereign state; materializationState is the domain's own
  // cached snapshot (see UPDATE_SHADOW_TWIN_MATERIALIZATION). They agree
  // once a caller has synced them (see useShadowTwinMaterializationSync) —
  // exposing both lets a first paint use the cached value before that
  // sync effect runs, without ever treating the cache as the source of truth.
  const liveMaterializationState = materializationStateForClarity(score, exists);

  if (!exists) {
    return {
      exists: false,
      materializationState: shadowTwinState.materializationState,
      liveMaterializationState,
      visibility: 0,
      coherence: 0,
      fragmentation: 1,
      distortion: 1,
      spatialPresence: 0,
      convergence: 0,
      integration: 0,
      activePortalId: null,
    };
  }

  const isIntegrated = shadowTwinState.integrationState === 'integrated' || score >= 1;

  // Visibility never drops to zero once the Twin has been generated (§10:
  // "not opacity: 20%" but also never fully absent — the point is a
  // reconstruction, not a fade-in from nothing).
  const visibility = clamp01(0.18 + score * 0.82);
  const coherence = score;
  const fragmentation = clamp01(1 - score * 1.1);
  const distortion = clamp01(1 - score * 1.35);
  // Spatial presence (§17, Portal III/Dialogue threshold) only becomes
  // meaningful once the Twin has crossed into PRESENCE (score >= 0.6).
  const spatialPresence = score >= 0.6 ? clamp01((score - 0.6) / 0.4) : 0;
  // Convergence (§19, Portal IV/Integration) ramps from CONVERGENCE's own
  // threshold (score >= 0.8).
  const convergence = score >= 0.8 ? clamp01((score - 0.8) / 0.2) : 0;
  const integration = isIntegrated ? 1 : 0;

  const activePortal = [...SHADOW_TWIN_PORTALS]
    .reverse()
    .find((portal) => MATERIALIZATION_ORDER.indexOf(portal.materializationState) <= MATERIALIZATION_ORDER.indexOf(liveMaterializationState));

  return {
    exists: true,
    materializationState: shadowTwinState.materializationState,
    liveMaterializationState,
    visibility,
    coherence,
    fragmentation,
    distortion,
    spatialPresence,
    convergence,
    integration,
    activePortalId: activePortal?.portalId ?? null,
  };
}

/**
 * Convenience: the Twin's per-pillar readiness re-expressed by portal id,
 * for a fragment/portal-nav UI that thinks in "recognition/confrontation/…"
 * rather than pillar ids.
 */
export function shadowTwinPortalReadiness(state) {
  const clarity = mirrorClarity(state);
  return SHADOW_TWIN_PORTALS.map((portal) => {
    const pillarEntry = clarity.perPillar.find((entry) => entry.pillarId === portal.pillarId);
    return {
      ...portal,
      readiness: pillarEntry?.readiness ?? 0,
      moduleId: pillarEntry?.moduleId ?? reflectionChamberModuleId(portal.pillarId),
    };
  });
}

/**
 * A small deterministic fragment "slot" table: three recoverable fragments
 * per portal (15 total across the five pillars), each tied to one of that
 * pillar's REFLECTION_CHAMBER_STEPS. Source regions are stable percentages
 * of the canonical 9:16 asset so the same fragment always reveals the same
 * area of a given user's Twin, without hardcoding what that area *means*
 * for every user (§14 — "the appearance comes from the individual's
 * generated Twin," not this table).
 */
const FRAGMENT_SLOT_STEPS = [
  { stepId: REFLECTION_CHAMBER_STEP_IDS.ENTER, type: 'silhouette', region: { x: 10, y: 55, width: 80, height: 40 } },
  { stepId: REFLECTION_CHAMBER_STEP_IDS.DIAGNOSE, type: 'facial', region: { x: 30, y: 5, width: 40, height: 25 } },
  { stepId: REFLECTION_CHAMBER_STEP_IDS.REFLECT, type: 'torso', region: { x: 20, y: 30, width: 60, height: 25 } },
  { stepId: REFLECTION_CHAMBER_STEP_IDS.INSTRUCT, type: 'limb', region: { x: 0, y: 40, width: 25, height: 45 } },
  { stepId: REFLECTION_CHAMBER_STEP_IDS.PRACTICE, type: 'limb', region: { x: 75, y: 40, width: 25, height: 45 } },
  { stepId: REFLECTION_CHAMBER_STEP_IDS.SEAL, type: 'core', region: { x: 35, y: 35, width: 30, height: 20 } },
];

/**
 * Builds the fragment object to unlock when `stepId` completes for
 * `pillarId`'s module. Returns null for a step this table doesn't cover
 * (there is none today — every REFLECTION_CHAMBER_STEP_IDS entry has a
 * slot — but callers should still guard for it as the step lifecycle grows).
 */
export function fragmentForStepCompletion(pillarId, stepId) {
  const portal = portalForPillarId(pillarId);
  const slot = FRAGMENT_SLOT_STEPS.find((entry) => entry.stepId === stepId);
  if (!portal || !slot) return null;
  return {
    id: `${pillarId}:${stepId}`,
    type: slot.type,
    sourceRegion: slot.region,
    portalId: portal.portalId,
    visualWeight: (FRAGMENT_SLOT_STEPS.indexOf(slot) + 1) / FRAGMENT_SLOT_STEPS.length,
  };
}
