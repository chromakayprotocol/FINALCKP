import { describe, expect, it } from 'vitest';
import { sovereignReducer } from '../../../sovereign/runtime/sovereignReducer';
import { createInitialState } from '../../../sovereign/runtime/sovereignState';
import {
  startModule,
  advanceStep,
  selectConcept,
  startReflection,
  updateReflection,
  commitReflection,
  executeProtocol,
} from '../../../sovereign/runtime/sovereignActions';
import { isModuleComplete, evaluateModuleSteps, SOVEREIGN_STEP_STATUSES } from '../../../sovereign/runtime/sovereignSteps';
import { REFLECTION_CHAMBER_STEP_IDS, REFLECTION_CHAMBER_STEPS } from '../../../sovereign/reflectionChamber/reflectionChamberSteps';
import { mirrorClarity, reflectionChamberModuleId } from '../../../sovereign/reflectionChamber/mirrorClarity';

/**
 * PillarExperience.jsx doesn't dispatch raw actions or invent its own step
 * shape — it drives the real Sovereign Runtime through reflectionChamberSteps'
 * six-step lifecycle exactly as docs/act-ii-reflection-chamber-architecture.md
 * §7's vertical slice describes. This walks the reducer through the exact
 * dispatch sequence PillarExperience now fires at each stage transition (see
 * that file's stage `switch`), without mounting React, and checks the same
 * things a real Seeker's session should produce: partial credit mid-walk,
 * completion only once every step is genuinely done, and mirrorClarity
 * moving the Chamber environment from FRACTURED to CLEAR for this pillar.
 */
describe('Portal One walkthrough against the real Sovereign Runtime', () => {
  const moduleId = reflectionChamberModuleId('owned-interior');
  const REFLECT = REFLECTION_CHAMBER_STEP_IDS.REFLECT;

  function walkToStage(stopAfterStepId) {
    let state = createInitialState();

    // PillarExperience's mount effects: startModule() then advanceStep(ENTER)
    // once the module is confirmed active.
    state = sovereignReducer(state, startModule(moduleId));
    state = sovereignReducer(state, advanceStep(moduleId, REFLECTION_CHAMBER_STEP_IDS.ENTER));
    if (stopAfterStepId === REFLECTION_CHAMBER_STEP_IDS.ENTER) return state;

    // CONCEPT stage's shadow ShadowCodePanel onContinue: claims "The
    // Displaced War" (owned-interior's real shadow[0], per
    // ownedInteriorConfig.js's shadowCodeIndex: 0).
    state = sovereignReducer(state, selectConcept('the-displaced-war', moduleId));
    if (stopAfterStepId === REFLECTION_CHAMBER_STEP_IDS.DIAGNOSE) return state;

    // REFLECTION stage's PersonalReflection: startReflection/updateReflection
    // fire on every field edit, commitReflection on submit.
    state = sovereignReducer(state, startReflection(moduleId, REFLECT));
    state = sovereignReducer(
      state,
      updateReflection(moduleId, REFLECT, 'What happened: they went quiet.\nWhat I felt: rejected'),
    );
    state = sovereignReducer(
      state,
      commitReflection(
        moduleId,
        REFLECT,
        'What happened: they went quiet.\nWhat I felt: rejected\nWhat I assumed: they are ignoring me\nWhat I actually know: they saw the message',
        [],
      ),
    );
    if (stopAfterStepId === REFLECTION_CHAMBER_STEP_IDS.REFLECT) return state;

    // INSTRUCT stage's light ShadowCodePanel onContinue: claims "The Owned
    // Interior" (light[0]) and marks INSTRUCT viewed.
    state = sovereignReducer(state, selectConcept('the-owned-interior', moduleId));
    state = sovereignReducer(state, advanceStep(moduleId, REFLECTION_CHAMBER_STEP_IDS.INSTRUCT));
    if (stopAfterStepId === REFLECTION_CHAMBER_STEP_IDS.INSTRUCT) return state;

    // PRACTICE stage's PracticeExercise onComplete: executes the pillar's
    // real authored practice (practices[0].id === 'witness-feeling').
    state = sovereignReducer(state, executeProtocol('witness-feeling', { title: 'Name the witness of feeling' }, moduleId));
    if (stopAfterStepId === REFLECTION_CHAMBER_STEP_IDS.PRACTICE) return state;

    // handleReturn on the seal screen.
    state = sovereignReducer(state, advanceStep(moduleId, REFLECTION_CHAMBER_STEP_IDS.SEAL));
    return state;
  }

  it('is not complete after only Enter', () => {
    const state = walkToStage(REFLECTION_CHAMBER_STEP_IDS.ENTER);
    expect(isModuleComplete(state, moduleId, REFLECTION_CHAMBER_STEPS, REFLECT)).toBe(false);
    const steps = evaluateModuleSteps(state, moduleId, REFLECTION_CHAMBER_STEPS, REFLECT);
    expect(steps.find((s) => s.id === REFLECTION_CHAMBER_STEP_IDS.ENTER).status).toBe(SOVEREIGN_STEP_STATUSES.COMPLETE);
    expect(steps.find((s) => s.id === REFLECTION_CHAMBER_STEP_IDS.DIAGNOSE).status).toBe(SOVEREIGN_STEP_STATUSES.ACTIVE);
  });

  it('credits Diagnose once the shadow code is claimed, but Reflect stays locked until committed', () => {
    const state = walkToStage(REFLECTION_CHAMBER_STEP_IDS.DIAGNOSE);
    const steps = evaluateModuleSteps(state, moduleId, REFLECTION_CHAMBER_STEPS, REFLECT);
    expect(steps.find((s) => s.id === REFLECTION_CHAMBER_STEP_IDS.DIAGNOSE).status).toBe(SOVEREIGN_STEP_STATUSES.COMPLETE);
    expect(steps.find((s) => s.id === REFLECTION_CHAMBER_STEP_IDS.REFLECT).status).toBe(SOVEREIGN_STEP_STATUSES.ACTIVE);
  });

  it('credits Reflect once the structured reflection is committed', () => {
    const state = walkToStage(REFLECTION_CHAMBER_STEP_IDS.REFLECT);
    expect(isStepDone(state, REFLECTION_CHAMBER_STEP_IDS.REFLECT)).toBe(true);
    expect(isStepDone(state, REFLECTION_CHAMBER_STEP_IDS.INSTRUCT)).toBe(false);
  });

  it('is fully complete only after every step, including Seal, is dispatched', () => {
    const partial = walkToStage(REFLECTION_CHAMBER_STEP_IDS.PRACTICE);
    expect(isModuleComplete(partial, moduleId, REFLECTION_CHAMBER_STEPS, REFLECT)).toBe(false);

    const full = walkToStage(REFLECTION_CHAMBER_STEP_IDS.SEAL);
    expect(isModuleComplete(full, moduleId, REFLECTION_CHAMBER_STEPS, REFLECT)).toBe(true);
  });

  it('moves mirrorClarity from FRACTURED to CLEAR for this pillar across the walkthrough', () => {
    const untouched = mirrorClarity(createInitialState(), ['owned-interior']);
    expect(untouched.score).toBe(0);

    const midway = mirrorClarity(walkToStage(REFLECTION_CHAMBER_STEP_IDS.REFLECT), ['owned-interior']);
    expect(midway.score).toBeGreaterThan(0);
    expect(midway.score).toBeLessThan(1);

    const done = mirrorClarity(walkToStage(REFLECTION_CHAMBER_STEP_IDS.SEAL), ['owned-interior']);
    expect(done.score).toBe(1);
  });

  function isStepDone(state, stepId) {
    return (
      evaluateModuleSteps(state, moduleId, REFLECTION_CHAMBER_STEPS, REFLECT).find((s) => s.id === stepId)?.status ===
      SOVEREIGN_STEP_STATUSES.COMPLETE
    );
  }
});
