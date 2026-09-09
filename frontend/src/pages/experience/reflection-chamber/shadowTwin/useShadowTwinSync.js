import { useEffect } from 'react';
import { useSovereign } from '../../../../sovereign/runtime';
import { SOVEREIGN_EVENT_TYPES } from '../../../../sovereign/events';
import { REFLECTION_CHAMBER_MODULE_PREFIX } from '../../../../sovereign/reflectionChamber/mirrorClarity';
import { fragmentForStepCompletion } from '../../../../sovereign/reflectionChamber/shadowTwin';

/**
 * The glue between the Sovereign Runtime's existing event stream and the
 * Shadow Twin domain — design guide §12/§16: "Reflection interaction ->
 * selectConcept() -> Reflection Engine -> Mirror Clarity update -> Shadow
 * Twin fragment unlock -> visual reconstruction." Mount this once, high in
 * the Reflection Chamber tree (ReflectionProtocolPage — see that file),
 * so it keeps listening across every portal the Seeker visits, not just
 * whichever one happens to be open.
 *
 * Two responsibilities, both pure reactions to events/derived state that
 * already exist — this never becomes a second source of truth:
 *
 * 1. Fragment unlocking: every STEP_COMPLETED for a Reflection Chamber
 *    pillar module unlocks that step's fragment slot (shadowTwin.js's
 *    small deterministic table) — a fragment is real Concept/step
 *    progress made visible, never awarded independently of it.
 * 2. Materialization cache sync: keeps shadowTwin.materializationState
 *    (the persisted Supabase snapshot — design guide §25/§42, loaded on
 *    return visits before mirrorClarity has necessarily recomputed) in
 *    step with the live pure derivation (deriveShadowTwinVisualState's
 *    liveMaterializationState). Rendering always uses the live value;
 *    this only keeps the cached one honest for the archive/return-visit
 *    case, and produces the SHADOW_TWIN_PRESENCE_ESTABLISHED /
 *    _CONVERGENCE_STARTED / _INTEGRATED threshold events for the
 *    Reflection Archive (see useShadowTwinArchive.js).
 */
export function useShadowTwinSync() {
  const sovereign = useSovereign();
  const { shadowTwin } = sovereign;

  useEffect(() => {
    return sovereign.session.subscribe(SOVEREIGN_EVENT_TYPES.STEP_COMPLETED, ({ payload }) => {
      const { moduleId, stepId } = payload;
      if (!moduleId?.startsWith(REFLECTION_CHAMBER_MODULE_PREFIX)) return;
      const pillarId = moduleId.slice(REFLECTION_CHAMBER_MODULE_PREFIX.length);
      const fragment = fragmentForStepCompletion(pillarId, stepId);
      if (fragment) sovereign.shadowTwin.unlockFragment(fragment);
    });
    // sovereign.session identity changes every render (see useSovereign.js) —
    // subscribe once and let the closure read fresh sovereign.shadowTwin via
    // the outer scope's latest render on the next event, same pattern
    // PortalOneStages.jsx uses for its own mount-once effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sovereign.session.subscribe]);

  useEffect(() => {
    if (!shadowTwin.visualState.exists) return;
    const live = shadowTwin.visualState.liveMaterializationState;
    if (live && live !== shadowTwin.materializationState) {
      sovereign.shadowTwin.updateMaterialization(live, shadowTwin.mirrorClarity.score);
    }
  }, [
    shadowTwin.visualState.exists,
    shadowTwin.visualState.liveMaterializationState,
    shadowTwin.materializationState,
    shadowTwin.mirrorClarity.score,
    sovereign.shadowTwin.updateMaterialization,
  ]);
}
