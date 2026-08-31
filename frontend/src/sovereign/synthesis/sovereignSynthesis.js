/**
 * The Synthesis Engine (Phase 13 of the Sovereign OS migration).
 *
 * "Only once reflections + concepts + decisions exist should synthesis
 * begin" — Phases 10-12 built exactly that (the Concept Graph, the Domain
 * Matrix, and the structured reflection pipeline), so this phase adds no
 * new mutable state of its own. SynthesisState and the Synthesis Graph
 * are pure derivations over what the runtime already stores — the same
 * pattern buildDomainMatrix() (Phase 11) and evaluateModuleSteps()
 * (Phase 4) already established: real, minimal state plus pure functions
 * that build richer views on demand.
 *
 * Two guide-listed inputs aren't collected here: "user declarations" (no
 * runtime state models a declaration yet — that still lives entirely in
 * ReclamationModuleEngine.jsx's own local state, deliberately left alone
 * in Phase 8 since it already works) and "media references" (the media
 * domain, Phase 9, only tracks what's *currently* playing, not a history
 * of what was played during a journey). Collecting them here would mean
 * inventing state that doesn't exist, which is exactly what the guide's
 * sequencing rule warns against — building a downstream layer on a faked
 * upstream one. Both are real gaps, left for whichever future phase
 * actually builds that state.
 */

import {
  SOVEREIGN_STEPS,
  SOVEREIGN_STEP_IDS,
  SOVEREIGN_STEP_STATUSES,
  evaluateModuleSteps,
} from '../runtime/sovereignSteps';

function selectCompletedModules(state) {
  return Object.values(state.curriculum.modules).filter((module) => module.status === 'completed');
}

function selectReflectionEntries(state) {
  return Object.values(state.reflection.entries);
}

/**
 * How much of a module's synthesizable data actually exists yet — the
 * fraction of its curriculum this module has genuinely completed, via
 * evaluateModuleSteps()'s real criteria (Phase 4) — not the
 * completeStep()-tracked module.completedSteps array, which is a separate,
 * lower-level primitive evaluateModuleSteps doesn't itself read (nothing
 * in the real step-completion flow calls completeStep() today). Derived
 * at read time rather than written back into
 * SovereignModuleState.synthesisReadiness (a field that has existed,
 * unused, since Phase 3) to avoid coupling the reducer to the
 * step-evaluation layer for a value nothing currently reads — that stored
 * field remains a documented gap, not silently repurposed.
 *
 * Defaults to Hermetic Hall's 11-step lifecycle, same as
 * evaluateModuleSteps() itself — pass `stepList`/`reflectionPromptId` for
 * a module on a different track (e.g. a Reflection Chamber pillar) so the
 * fraction is computed against *that* track's own step shape instead.
 */
export function moduleSynthesisReadiness(
  state,
  moduleId,
  stepList = SOVEREIGN_STEPS,
  reflectionPromptId = SOVEREIGN_STEP_IDS.REFLECTION,
) {
  if (!state.curriculum.modules[moduleId]) return 0;
  const evaluatedSteps = evaluateModuleSteps(state, moduleId, stepList, reflectionPromptId);
  const completeCount = evaluatedSteps.filter((step) => step.status === SOVEREIGN_STEP_STATUSES.COMPLETE).length;
  return completeCount / stepList.length;
}

/**
 * The aggregation the guide calls SynthesisState: everything Synthesis
 * draws from, collected — not yet related to each other (see
 * buildSynthesisGraph for that).
 */
export function buildSynthesisState(state) {
  return {
    completedModules: selectCompletedModules(state),
    reflections: selectReflectionEntries(state),
    selectedConcepts: state.concepts.selected,
    connections: state.concepts.connections,
    protocolDecisions: state.synthesis.protocolExecutions,
    domainMappings: state.concepts.domainMappings,
  };
}

/**
 * The Synthesis Graph: SynthesisState's pieces related to each other as
 * nodes and edges, rather than five separate flat lists. A reflection's
 * edges to concepts distinguish RECLAIMED (retained) from REJECTED
 * (a candidate that never made it into the real Concept Graph via *any*
 * path) — the graph, not just the raw lists, is what lets a future
 * consumer (the Artifact Compiler, Phase 14) walk "this reflection led to
 * this concept led to this connection" as one structure instead of
 * cross-referencing flat arrays by hand.
 */
export function buildSynthesisGraph(synthesisState) {
  const nodes = [];
  const edges = [];
  const selected = new Set(synthesisState.selectedConcepts);

  for (const module of synthesisState.completedModules) {
    nodes.push({ type: 'module', id: module.moduleId });
  }
  for (const conceptId of synthesisState.selectedConcepts) {
    nodes.push({ type: 'concept', id: conceptId });
  }
  for (const execution of synthesisState.protocolDecisions) {
    const protocolNodeId = `${execution.protocolId}@${execution.executedAt}`;
    nodes.push({ type: 'protocol', id: protocolNodeId, protocolId: execution.protocolId });
    if (execution.moduleId) {
      edges.push({ type: 'CHOSE_PROTOCOL', from: execution.moduleId, to: protocolNodeId });
    }
  }
  for (const entry of synthesisState.reflections) {
    const reflectionId = `${entry.moduleId}:${entry.promptId}`;
    nodes.push({ type: 'reflection', id: reflectionId });
    edges.push({ type: 'REFLECTED_IN', from: entry.moduleId, to: reflectionId });
    for (const conceptId of entry.retainedConcepts ?? []) {
      edges.push({ type: 'RECLAIMED', from: reflectionId, to: conceptId });
    }
    for (const conceptId of entry.candidateConcepts ?? []) {
      if (!selected.has(conceptId)) {
        edges.push({ type: 'REJECTED', from: reflectionId, to: conceptId });
      }
    }
  }
  for (const connection of synthesisState.connections) {
    edges.push({ type: connection.relationship, from: connection.fromConceptId, to: connection.toConceptId });
  }
  for (const mapping of synthesisState.domainMappings) {
    edges.push({ type: `DOMAIN_${mapping.role.toUpperCase()}`, from: mapping.conceptId, to: mapping.domain });
  }

  return { nodes, edges };
}

/* The six questions the guide says the system should be able to answer.
   Each is a thin, named, independently-testable read over state/the
   graph — the value here is giving these specific questions first-class
   answers, not a generic query API a caller has to reconstruct by hand. */

/** What did I identify? — every concept that's part of the real Concept Graph. */
export function whatDidIIdentify(state) {
  return state.concepts.selected;
}

/**
 * What patterns did I find? — a concept recurring across more than one
 * domain/role in the Domain Matrix (Phase 11). The same idea showing up
 * through more than one lens is what makes it a pattern rather than a
 * single observation, and keeps this genuinely distinct from
 * whatRelationshipsDidIEstablish below (both could otherwise read the
 * same connections list).
 */
export function whatPatternsDidIFind(state) {
  const occurrencesByConceptId = new Map();
  for (const mapping of state.concepts.domainMappings) {
    occurrencesByConceptId.set(mapping.conceptId, (occurrencesByConceptId.get(mapping.conceptId) ?? 0) + 1);
  }
  return [...occurrencesByConceptId.entries()]
    .filter(([, occurrences]) => occurrences > 1)
    .map(([conceptId, occurrences]) => ({ conceptId, occurrences }));
}

/**
 * What did I reject? — every concept that was a reflection candidate at
 * some point but never actually entered the Concept Graph via any path
 * (a reflection commit elsewhere, or a direct selectConcept() call). A
 * concept rejected in one reflection but reclaimed via another isn't
 * "rejected" overall — this only reports concepts that never made it in.
 */
export function whatDidIReject(state) {
  const everyCandidate = new Set();
  for (const entry of Object.values(state.reflection.entries)) {
    for (const conceptId of entry.candidateConcepts ?? []) everyCandidate.add(conceptId);
  }
  const selected = new Set(state.concepts.selected);
  return [...everyCandidate].filter((conceptId) => !selected.has(conceptId));
}

/**
 * What did I reclaim? — concepts that made it into the Concept Graph
 * specifically through a reflection's Decision stage (commitReflection's
 * retainedConcepts), as opposed to concept selection in general (that's
 * whatDidIIdentify, which also includes concepts selected outside any
 * reflection).
 */
export function whatDidIReclaim(state) {
  const reclaimed = new Set();
  for (const entry of Object.values(state.reflection.entries)) {
    for (const conceptId of entry.retainedConcepts ?? []) reclaimed.add(conceptId);
  }
  return [...reclaimed];
}

/** What relationships did I establish? — the literal concept-to-concept graph edges. */
export function whatRelationshipsDidIEstablish(state) {
  return state.concepts.connections;
}

/** What protocol did I choose? — every protocol execution recorded so far. */
export function whatProtocolDidIChoose(state) {
  return state.synthesis.protocolExecutions;
}
