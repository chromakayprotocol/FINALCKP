import { describe, expect, it } from 'vitest';
import { sovereignReducer } from '../runtime/sovereignReducer';
import { createInitialState } from '../runtime/sovereignState';
import {
  startModule,
  advanceStep,
  completeStep,
  selectConcept,
  connectConcepts,
  executeProtocol,
  mapConceptToDomain,
  extractConcepts,
  commitReflection,
} from '../runtime/sovereignActions';
import { SOVEREIGN_STEP_IDS, SOVEREIGN_STEPS } from '../runtime/sovereignSteps';
import {
  moduleSynthesisReadiness,
  buildSynthesisState,
  buildSynthesisGraph,
  whatDidIIdentify,
  whatPatternsDidIFind,
  whatDidIReject,
  whatDidIReclaim,
  whatRelationshipsDidIEstablish,
  whatProtocolDidIChoose,
} from './sovereignSynthesis';

const STEPS_BEFORE_REFLECTION = [
  SOVEREIGN_STEP_IDS.INTRO,
  SOVEREIGN_STEP_IDS.PRINCIPLE,
  SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
  SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
  SOVEREIGN_STEP_IDS.DOMAINS,
  SOVEREIGN_STEP_IDS.RECLAMATION,
  SOVEREIGN_STEP_IDS.LENS_2026,
];

function walkToReflectionGate(state, moduleId) {
  let next = sovereignReducer(state, selectConcept('shadow-work', moduleId));
  for (const stepId of STEPS_BEFORE_REFLECTION) {
    next = sovereignReducer(next, advanceStep(moduleId, stepId));
  }
  return next;
}

describe('moduleSynthesisReadiness', () => {
  it('is 0 for a module that has never been started', () => {
    expect(moduleSynthesisReadiness(createInitialState(), 'mentalism')).toBe(0);
  });

  it('is 0 for a started module with no steps genuinely complete yet', () => {
    const state = sovereignReducer(createInitialState(), startModule('mentalism'));
    expect(moduleSynthesisReadiness(state, 'mentalism')).toBe(0);
  });

  it('grows as a proportion of the 11 real steps completed, via the same criteria evaluateModuleSteps uses', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, advanceStep('mentalism', SOVEREIGN_STEP_IDS.INTRO)); // completes (viewed)

    expect(moduleSynthesisReadiness(state, 'mentalism')).toBeCloseTo(1 / SOVEREIGN_STEPS.length);
  });

  it('does not credit module.completedSteps (a separate, lower-level primitive evaluateModuleSteps ignores)', () => {
    const state = sovereignReducer(createInitialState(), completeStep('mentalism', SOVEREIGN_STEP_IDS.INTRO));
    // completeStep() alone never satisfies evaluateModuleSteps' real INTRO
    // criterion (viewed), so readiness must stay at 0.
    expect(moduleSynthesisReadiness(state, 'mentalism')).toBe(0);
  });
});

describe('buildSynthesisState', () => {
  it('collects completed modules, selected concepts, connections, protocol decisions, and domain mappings', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, selectConcept('shadow-work', 'mentalism'));
    state = sovereignReducer(state, connectConcepts('shadow-work', 'projection', 'CAUSES'));
    state = sovereignReducer(state, executeProtocol('vision-quest', { intensity: 3 }, 'mentalism'));
    state = sovereignReducer(state, mapConceptToDomain('shadow-work', 'psychology', 'cause'));

    const synthesisState = buildSynthesisState(state);
    expect(synthesisState.selectedConcepts).toEqual(['shadow-work']);
    expect(synthesisState.connections).toHaveLength(1);
    expect(synthesisState.protocolDecisions).toHaveLength(1);
    expect(synthesisState.domainMappings).toHaveLength(1);
    // Not completed yet (no module status transition to 'completed' has happened).
    expect(synthesisState.completedModules).toEqual([]);
  });

  it('only includes modules whose status is actually completed, not merely started', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = {
      ...state,
      curriculum: {
        ...state.curriculum,
        modules: {
          ...state.curriculum.modules,
          mentalism: { ...state.curriculum.modules.mentalism, status: 'completed' },
        },
      },
    };

    expect(buildSynthesisState(state).completedModules).toHaveLength(1);
    expect(buildSynthesisState(state).completedModules[0].moduleId).toBe('mentalism');
  });
});

describe('buildSynthesisGraph', () => {
  it('builds REFLECTED_IN, RECLAIMED, and REJECTED edges from a committed reflection', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = walkToReflectionGate(state, 'mentalism');
    state = sovereignReducer(state, extractConcepts('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, ['shadow-work', 'projection']));
    state = sovereignReducer(
      state,
      commitReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'final text', ['shadow-work']),
    );

    const graph = buildSynthesisGraph(buildSynthesisState(state));
    const reflectionId = 'mentalism:08-reflection';

    expect(graph.edges).toContainEqual({ type: 'REFLECTED_IN', from: 'mentalism', to: reflectionId });
    expect(graph.edges).toContainEqual({ type: 'RECLAIMED', from: reflectionId, to: 'shadow-work' });
    expect(graph.edges).toContainEqual({ type: 'REJECTED', from: reflectionId, to: 'projection' });
  });

  it('does not mark a concept REJECTED if it was reclaimed via a different path', () => {
    // shadow-work is a rejected candidate in this reflection...
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = walkToReflectionGate(state, 'mentalism');
    state = sovereignReducer(state, extractConcepts('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, ['shadow-work']));
    state = sovereignReducer(state, commitReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'x', []));
    // ...but it's already selected globally (walkToReflectionGate selects
    // it for KEY_CONCEPTS), so it must never show as rejected.
    const graph = buildSynthesisGraph(buildSynthesisState(state));
    expect(graph.edges).not.toContainEqual(
      expect.objectContaining({ type: 'REJECTED', to: 'shadow-work' }),
    );
  });

  it('builds protocol, connection, and domain-mapping edges', () => {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = sovereignReducer(state, executeProtocol('vision-quest', {}, 'mentalism'));
    state = sovereignReducer(state, connectConcepts('a', 'b', 'CAUSES'));
    state = sovereignReducer(state, mapConceptToDomain('a', 'psychology', 'cause'));

    const graph = buildSynthesisGraph(buildSynthesisState(state));

    expect(graph.edges.some((edge) => edge.type === 'CHOSE_PROTOCOL' && edge.from === 'mentalism')).toBe(true);
    expect(graph.edges).toContainEqual({ type: 'CAUSES', from: 'a', to: 'b' });
    expect(graph.edges).toContainEqual({ type: 'DOMAIN_CAUSE', from: 'a', to: 'psychology' });
  });
});

describe('the six synthesis questions', () => {
  function buildJourney() {
    let state = sovereignReducer(createInitialState(), startModule('mentalism'));
    state = walkToReflectionGate(state, 'mentalism');
    state = sovereignReducer(
      state,
      extractConcepts('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, ['shadow-work', 'projection']),
    );
    state = sovereignReducer(
      state,
      commitReflection('mentalism', SOVEREIGN_STEP_IDS.REFLECTION, 'final text', ['shadow-work']),
    );
    state = sovereignReducer(state, connectConcepts('shadow-work', 'projection', 'CAUSES'));
    state = sovereignReducer(state, mapConceptToDomain('shadow-work', 'psychology', 'cause'));
    state = sovereignReducer(state, mapConceptToDomain('shadow-work', 'culture', 'effect'));
    state = sovereignReducer(state, executeProtocol('vision-quest', {}, 'mentalism'));
    return state;
  }

  it('whatDidIIdentify returns every selected concept', () => {
    expect(whatDidIIdentify(buildJourney())).toEqual(['shadow-work']);
  });

  it('whatPatternsDidIFind returns concepts recurring across more than one domain', () => {
    expect(whatPatternsDidIFind(buildJourney())).toEqual([{ conceptId: 'shadow-work', occurrences: 2 }]);
  });

  it('whatPatternsDidIFind excludes a concept mapped into only one domain', () => {
    let state = sovereignReducer(createInitialState(), mapConceptToDomain('a', 'psychology', 'cause'));
    expect(whatPatternsDidIFind(state)).toEqual([]);
  });

  it('whatDidIReject returns candidates that never entered the Concept Graph by any path', () => {
    expect(whatDidIReject(buildJourney())).toEqual(['projection']);
  });

  it('whatDidIReclaim returns concepts retained specifically through a reflection commit', () => {
    expect(whatDidIReclaim(buildJourney())).toEqual(['shadow-work']);
  });

  it('whatRelationshipsDidIEstablish returns the raw concept connections', () => {
    expect(whatRelationshipsDidIEstablish(buildJourney())).toEqual([
      expect.objectContaining({ fromConceptId: 'shadow-work', toConceptId: 'projection', relationship: 'CAUSES' }),
    ]);
  });

  it('whatProtocolDidIChoose returns every protocol execution', () => {
    const executions = whatProtocolDidIChoose(buildJourney());
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({ protocolId: 'vision-quest', moduleId: 'mentalism' });
  });
});
