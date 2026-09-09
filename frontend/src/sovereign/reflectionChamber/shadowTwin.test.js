import { describe, expect, it } from 'vitest';
import { sovereignReducer } from '../runtime/sovereignReducer';
import { createInitialState } from '../runtime/sovereignState';
import {
  completeShadowTwinGeneration,
  integrateShadowTwin,
  startModule,
  advanceStep,
  selectConcept,
} from '../runtime/sovereignActions';
import { REFLECTION_CHAMBER_STEP_IDS } from './reflectionChamberSteps';
import { mirrorClarity, reflectionChamberModuleId, REFLECTION_CHAMBER_PILLAR_IDS } from './mirrorClarity';
import {
  deriveShadowTwinVisualState,
  materializationStateForClarity,
  MATERIALIZATION_STATES,
  SHADOW_TWIN_PORTALS,
  portalForPillarId,
  pillarIdForPortal,
  fragmentForStepCompletion,
} from './shadowTwin';

function withGeneratedTwin(state) {
  return sovereignReducer(
    state,
    completeShadowTwinGeneration({
      canonicalImagePath: 'shadow-twins/u1/canonical/twin.png',
      promptVersion: 'shadow-twin-v1',
      visualIdentitySeed: 'seed-1',
    }),
  );
}

describe('SHADOW_TWIN_PORTALS', () => {
  it('index-aligns one portal per Reflection Chamber pillar, in order', () => {
    expect(SHADOW_TWIN_PORTALS.map((p) => p.pillarId)).toEqual(REFLECTION_CHAMBER_PILLAR_IDS);
  });

  it('resolves portal <-> pillar both directions', () => {
    expect(portalForPillarId('owned-interior').portalId).toBe('recognition');
    expect(pillarIdForPortal('transformation')).toBe('mirror-walker-boundary');
  });
});

describe('materializationStateForClarity', () => {
  it('is null with no Twin regardless of score', () => {
    expect(materializationStateForClarity(1, false)).toBeNull();
  });

  it('buckets the five-pillar-average score across all six states', () => {
    expect(materializationStateForClarity(0, true)).toBe(MATERIALIZATION_STATES.INITIALIZED);
    expect(materializationStateForClarity(0.2, true)).toBe(MATERIALIZATION_STATES.FRAGMENTED_APPARITION);
    expect(materializationStateForClarity(0.4, true)).toBe(MATERIALIZATION_STATES.MANIFESTATION);
    expect(materializationStateForClarity(0.6, true)).toBe(MATERIALIZATION_STATES.PRESENCE);
    expect(materializationStateForClarity(0.8, true)).toBe(MATERIALIZATION_STATES.CONVERGENCE);
    expect(materializationStateForClarity(1, true)).toBe(MATERIALIZATION_STATES.INTEGRATED);
  });
});

describe('deriveShadowTwinVisualState', () => {
  it('is fully absent before a Twin has been generated', () => {
    const state = createInitialState();
    const result = deriveShadowTwinVisualState(state.shadowTwin, mirrorClarity(state));
    expect(result.exists).toBe(false);
    expect(result.visibility).toBe(0);
    expect(result.activePortalId).toBeNull();
  });

  it('never fades to full invisibility once generated, even at zero clarity', () => {
    const state = withGeneratedTwin(createInitialState());
    const result = deriveShadowTwinVisualState(state.shadowTwin, mirrorClarity(state));
    expect(result.exists).toBe(true);
    expect(result.visibility).toBeGreaterThan(0);
    expect(result.fragmentation).toBeCloseTo(1);
    expect(result.liveMaterializationState).toBe(MATERIALIZATION_STATES.INITIALIZED);
  });

  it('increases coherence and decreases fragmentation as pillars progress', () => {
    let state = withGeneratedTwin(createInitialState());
    const moduleId = reflectionChamberModuleId('owned-interior');
    state = sovereignReducer(state, startModule(moduleId));
    state = sovereignReducer(state, advanceStep(moduleId, REFLECTION_CHAMBER_STEP_IDS.ENTER));
    state = sovereignReducer(state, selectConcept('shadow-code', moduleId));

    const result = deriveShadowTwinVisualState(state.shadowTwin, mirrorClarity(state));
    expect(result.coherence).toBeGreaterThan(0);
    expect(result.fragmentation).toBeLessThan(1);
    // Not yet enough of one pillar (let alone a fifth of the whole Chamber)
    // to cross the 0.2 threshold into the first portal.
    expect(result.activePortalId).toBeNull();
  });

  it('resolves the active portal once the score crosses that portal\'s threshold', () => {
    const state = withGeneratedTwin(createInitialState());
    const fakeClarity = { score: 0.45, perPillar: [] };
    const result = deriveShadowTwinVisualState(state.shadowTwin, fakeClarity);
    expect(result.liveMaterializationState).toBe(MATERIALIZATION_STATES.MANIFESTATION);
    expect(result.activePortalId).toBe('confrontation');
  });

  it('reports full integration once integrateShadowTwin() lands', () => {
    let state = withGeneratedTwin(createInitialState());
    state = sovereignReducer(state, integrateShadowTwin());
    const result = deriveShadowTwinVisualState(state.shadowTwin, mirrorClarity(state));
    expect(result.integration).toBe(1);
  });
});

describe('fragmentForStepCompletion', () => {
  it('builds a fragment tied to the completing pillar\'s portal', () => {
    const fragment = fragmentForStepCompletion('forged-witness', REFLECTION_CHAMBER_STEP_IDS.DIAGNOSE);
    expect(fragment.portalId).toBe('confrontation');
    expect(fragment.id).toBe('forged-witness:02-diagnose');
    expect(fragment.sourceRegion).toBeDefined();
  });

  it('returns null for an unknown pillar', () => {
    expect(fragmentForStepCompletion('not-a-pillar', REFLECTION_CHAMBER_STEP_IDS.ENTER)).toBeNull();
  });
});
