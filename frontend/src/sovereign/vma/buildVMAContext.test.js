import { describe, it, expect } from 'vitest';
import { sovereignReducer } from '../runtime/sovereignReducer';
import { createInitialState } from '../runtime/sovereignState';
import {
  startModule,
  advanceStep,
  selectConcept,
  extractConcepts,
  commitReflection,
  executeProtocol,
  completeShadowTwinGeneration,
  unlockShadowTwinFragment,
} from '../runtime/sovereignActions';
import { SOVEREIGN_STEP_IDS } from '../runtime/sovereignSteps';
import { buildVMAContext } from './buildVMAContext';

const STEPS_BEFORE_REFLECTION = [
  SOVEREIGN_STEP_IDS.INTRO,
  SOVEREIGN_STEP_IDS.PRINCIPLE,
  SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
  SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
  SOVEREIGN_STEP_IDS.DOMAINS,
  SOVEREIGN_STEP_IDS.RECLAMATION,
  SOVEREIGN_STEP_IDS.LENS_2026,
];

function walkToReflectionGate(state, moduleId, conceptId = 'shadow-work') {
  let next = sovereignReducer(state, selectConcept(conceptId, moduleId));
  for (const stepId of STEPS_BEFORE_REFLECTION) {
    next = sovereignReducer(next, advanceStep(moduleId, stepId));
  }
  return next;
}

describe('buildVMAContext', () => {
  it('reports an empty, honest context for a brand-new session', () => {
    const context = buildVMAContext(createInitialState());
    expect(context).toEqual({
      activeModuleId: null,
      completedModuleIds: [],
      inProgressModuleIds: [],
      retainedConcepts: [],
      reclaimedConcepts: [],
      recurringPatterns: [],
      protocolsChosen: [],
      artifactStatus: 'empty',
      shadowTwin: {
        exists: false,
        materializationState: null,
        mirrorClarityScore: 0,
        recoveredFragmentCount: 0,
        integrationState: 'unresolved',
      },
    });
  });

  it('projects real Shadow Twin progress compactly — no fragment detail, just a count', () => {
    let state = sovereignReducer(
      createInitialState(),
      completeShadowTwinGeneration({ canonicalImagePath: 'p', promptVersion: 'shadow-twin-v1' }),
    );
    state = sovereignReducer(
      state,
      unlockShadowTwinFragment({ id: 'f1', type: 'facial', sourceRegion: {}, portalId: 'recognition', visualWeight: 0.5 }),
    );

    const context = buildVMAContext(state);
    expect(context.shadowTwin.exists).toBe(true);
    expect(context.shadowTwin.materializationState).toBe('INITIALIZED');
    expect(context.shadowTwin.recoveredFragmentCount).toBe(1);
    expect(JSON.stringify(context)).not.toContain('sourceRegion');
  });

  it('reflects real journey progress — not a full state dump', () => {
    const moduleId = 'hermetic-hall/mentalism';
    let state = sovereignReducer(createInitialState(), startModule(moduleId));
    state = walkToReflectionGate(state, moduleId, 'shadow-work');
    state = sovereignReducer(state, advanceStep(moduleId, SOVEREIGN_STEP_IDS.REFLECTION));
    state = sovereignReducer(
      state,
      extractConcepts(moduleId, SOVEREIGN_STEP_IDS.REFLECTION, ['shadow-work', 'projection']),
    );
    state = sovereignReducer(
      state,
      commitReflection(moduleId, SOVEREIGN_STEP_IDS.REFLECTION, 'a real reflection with real detail', [
        'shadow-work',
      ]),
    );
    state = sovereignReducer(state, executeProtocol('vision-quest', {}, moduleId));

    const context = buildVMAContext(state);
    expect(context.activeModuleId).toBe(moduleId);
    expect(context.inProgressModuleIds).toEqual([moduleId]);
    expect(context.completedModuleIds).toEqual([]);
    expect(context.retainedConcepts).toEqual(['shadow-work']);
    expect(context.reclaimedConcepts).toEqual(['shadow-work']);
    expect(context.protocolsChosen).toEqual(['vision-quest']);
    // The rejected candidate never appears — this is a summary of what
    // actually happened, not everything that was ever considered.
    expect(context.retainedConcepts).not.toContain('projection');
    // No raw reflection text anywhere in the context — the point of
    // keeping this compact.
    expect(JSON.stringify(context)).not.toContain('real detail');
  });
});
