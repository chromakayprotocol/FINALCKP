import { describe, expect, it } from 'vitest';
import { sovereignReducer } from './sovereignReducer';
import { createInitialState } from './sovereignState';
import {
  startModule,
  advanceStep,
  recordReflection,
  selectConcept,
  executeProtocol,
  generateArtifact,
  sealArtifact,
} from './sovereignActions';
import {
  SOVEREIGN_STEP_IDS,
  SOVEREIGN_STEP_STATUSES,
  evaluateModuleSteps,
  isStepComplete,
  isModuleComplete,
} from './sovereignSteps';

function statusOf(steps, stepId) {
  return steps.find((step) => step.id === stepId).status;
}

describe('sovereignSteps', () => {
  it('locks every step for a module that has not started', () => {
    const steps = evaluateModuleSteps(createInitialState(), 'mentalism');

    expect(steps).toHaveLength(11);
    expect(steps.every((step) => step.status === SOVEREIGN_STEP_STATUSES.LOCKED)).toBe(true);
  });

  it('does not treat "Next" as "complete" — advancing past intro does not complete it', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    // Navigate straight to principle without the intro step itself being
    // marked viewed (e.g. INTRO was never the currentStep the user landed on).
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.PRINCIPLE));

    const steps = evaluateModuleSteps(state, 'mentalism');
    // INTRO is still incomplete (never itself viewed), so it stays the
    // reachable/active step — everything after it, including PRINCIPLE, is
    // locked despite having been navigated to.
    expect(statusOf(steps, SOVEREIGN_STEP_IDS.INTRO)).toBe(SOVEREIGN_STEP_STATUSES.ACTIVE);
    expect(statusOf(steps, SOVEREIGN_STEP_IDS.PRINCIPLE)).toBe(SOVEREIGN_STEP_STATUSES.LOCKED);
  });

  it('completes a simple "viewed" step once navigated to, and unlocks the next one', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.INTRO));

    const steps = evaluateModuleSteps(state, 'mentalism');
    expect(statusOf(steps, SOVEREIGN_STEP_IDS.INTRO)).toBe(SOVEREIGN_STEP_STATUSES.COMPLETE);
    expect(statusOf(steps, SOVEREIGN_STEP_IDS.PRINCIPLE)).toBe(SOVEREIGN_STEP_STATUSES.ACTIVE);
    expect(statusOf(steps, SOVEREIGN_STEP_IDS.KEY_CONCEPTS)).toBe(SOVEREIGN_STEP_STATUSES.LOCKED);
  });

  it('requires a concept selected for THIS module, not just anywhere in the session, to complete KEY_CONCEPTS (Phase 10)', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, startModule('correspondence'));
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.INTRO));
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.PRINCIPLE));
    state = sovereignReducer(state, advanceStep('correspondence', SOVEREIGN_STEP_IDS.INTRO));
    state = sovereignReducer(state, advanceStep('correspondence', SOVEREIGN_STEP_IDS.PRINCIPLE));

    // Selecting a concept while working through correspondence must not
    // silently satisfy mentalism's KEY_CONCEPTS step too.
    state = sovereignReducer(state, selectConcept('as-within-so-without', 'correspondence'));

    expect(isStepComplete(state, 'correspondence', SOVEREIGN_STEP_IDS.KEY_CONCEPTS)).toBe(true);
    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.KEY_CONCEPTS)).toBe(false);

    state = sovereignReducer(state, selectConcept('shadow-work', 'mentalism'));
    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.KEY_CONCEPTS)).toBe(true);
  });

  it('requires a committed reflection, not just navigation, to complete the REFLECTION step', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.REFLECTION));

    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.REFLECTION)).toBe(false);

    state = sovereignReducer(
      state,
      recordReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'I noticed a pattern.'),
    );

    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.REFLECTION)).toBe(true);
  });

  it("a reflection recorded for a different module doesn't complete this module's REFLECTION step", () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(
      state,
      recordReflection('correspondence', SOVEREIGN_STEP_IDS.REFLECTION, 'wrong module'),
    );

    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.REFLECTION)).toBe(false);
  });

  it('requires a protocol execution scoped to this module to complete the PROTOCOL step', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, executeProtocol('vision-quest', {}, 'correspondence'));
    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.PROTOCOL)).toBe(false);

    state = sovereignReducer(state, executeProtocol('vision-quest', {}, 'mentalism'));
    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.PROTOCOL)).toBe(true);
  });

  it('requires a sealed artifact, not just a draft, to complete the ARTIFACT step', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, generateArtifact({ title: 'draft' }));
    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.ARTIFACT)).toBe(false);

    state = sovereignReducer(state, sealArtifact());
    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.ARTIFACT)).toBe(true);
  });

  it('does not complete SUMMARY on its own, even once viewed, until every prior step is complete', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.SUMMARY));

    expect(isStepComplete(state, 'mentalism', SOVEREIGN_STEP_IDS.SUMMARY)).toBe(false);
    expect(isModuleComplete(state, 'mentalism')).toBe(false);
  });

  it('completes the whole module once every step is genuinely satisfied', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));

    for (const stepId of [
      SOVEREIGN_STEP_IDS.INTRO,
      SOVEREIGN_STEP_IDS.PRINCIPLE,
      SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
      SOVEREIGN_STEP_IDS.DOMAINS,
      SOVEREIGN_STEP_IDS.RECLAMATION,
      SOVEREIGN_STEP_IDS.LENS_2026,
    ]) {
      state = sovereignReducer(state, advanceStep('mentalism', stepId));
    }
    state = sovereignReducer(state, selectConcept('shadow-work', 'mentalism'));
    state = sovereignReducer(
      state,
      recordReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'a real reflection'),
    );
    state = sovereignReducer(state, executeProtocol('vision-quest', {}, 'mentalism'));
    state = sovereignReducer(state, generateArtifact({ title: 'final' }));
    state = sovereignReducer(state, sealArtifact());
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.SUMMARY));

    expect(isModuleComplete(state, 'mentalism')).toBe(true);
    expect(
      evaluateModuleSteps(state, 'mentalism').every(
        (step) => step.status === SOVEREIGN_STEP_STATUSES.COMPLETE,
      ),
    ).toBe(true);
  });
});
