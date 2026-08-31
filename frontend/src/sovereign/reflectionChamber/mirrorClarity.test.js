import { describe, expect, it } from 'vitest';
import { sovereignReducer } from '../runtime/sovereignReducer';
import { createInitialState } from '../runtime/sovereignState';
import { startModule, advanceStep, selectConcept } from '../runtime/sovereignActions';
import { REFLECTION_CHAMBER_STEP_IDS, REFLECTION_CHAMBER_STEPS } from './reflectionChamberSteps';
import {
  mirrorClarity,
  clarityStateFor,
  reflectionChamberModuleId,
  REFLECTION_CHAMBER_PILLAR_IDS,
  MIRROR_CLARITY_STATES,
} from './mirrorClarity';

describe('reflectionChamberModuleId', () => {
  it('namespaces a pillar id the same way Hermetic Hall namespaces principles', () => {
    expect(reflectionChamberModuleId('owned-interior')).toBe('reflection-chamber/owned-interior');
  });
});

describe('clarityStateFor', () => {
  it('buckets scores across the five environmental states', () => {
    expect(clarityStateFor(0)).toBe(MIRROR_CLARITY_STATES.FRACTURED);
    expect(clarityStateFor(0.1)).toBe(MIRROR_CLARITY_STATES.DISTORTED);
    expect(clarityStateFor(0.5)).toBe(MIRROR_CLARITY_STATES.ALIGNED);
    expect(clarityStateFor(0.9)).toBe(MIRROR_CLARITY_STATES.INTEGRATED);
    expect(clarityStateFor(1)).toBe(MIRROR_CLARITY_STATES.CLEAR);
  });
});

describe('mirrorClarity', () => {
  it('is fully fractured when no pillar module has been started', () => {
    const result = mirrorClarity(createInitialState());
    expect(result.score).toBe(0);
    expect(result.state).toBe(MIRROR_CLARITY_STATES.FRACTURED);
    expect(result.perPillar).toHaveLength(REFLECTION_CHAMBER_PILLAR_IDS.length);
  });

  it('rises as pillar modules make real progress, and reports each pillar', () => {
    const moduleId = reflectionChamberModuleId('owned-interior');
    let state = sovereignReducer(createInitialState(), startModule(moduleId));
    state = sovereignReducer(state, advanceStep(moduleId, REFLECTION_CHAMBER_STEP_IDS.ENTER));
    state = sovereignReducer(state, selectConcept('the-displaced-war', moduleId));

    const result = mirrorClarity(state);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
    expect(result.state).toBe(MIRROR_CLARITY_STATES.DISTORTED);

    const ownedInterior = result.perPillar.find((p) => p.pillarId === 'owned-interior');
    expect(ownedInterior.readiness).toBeGreaterThan(0);

    const untouched = result.perPillar.find((p) => p.pillarId === 'forged-witness');
    expect(untouched.readiness).toBe(0);
  });

  it('accepts a narrower pillar subset for scoped views', () => {
    const moduleId = reflectionChamberModuleId('owned-interior');
    let state = sovereignReducer(createInitialState(), startModule(moduleId));
    state = sovereignReducer(state, advanceStep(moduleId, REFLECTION_CHAMBER_STEP_IDS.ENTER));

    const result = mirrorClarity(state, ['owned-interior']);
    expect(result.perPillar).toHaveLength(1);
    expect(result.score).toBe(result.perPillar[0].readiness);
  });

  it('scores against the Reflection Chamber step count, not Hermetic Hall\'s', () => {
    const moduleId = reflectionChamberModuleId('owned-interior');
    let state = sovereignReducer(createInitialState(), startModule(moduleId));
    state = sovereignReducer(state, advanceStep(moduleId, REFLECTION_CHAMBER_STEP_IDS.ENTER));

    const result = mirrorClarity(state, ['owned-interior']);
    expect(result.perPillar[0].readiness).toBeCloseTo(1 / REFLECTION_CHAMBER_STEPS.length);
  });
});
