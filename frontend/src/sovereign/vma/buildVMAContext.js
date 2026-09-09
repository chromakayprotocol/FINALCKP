import {
  whatDidIIdentify,
  whatPatternsDidIFind,
  whatDidIReclaim,
  whatProtocolDidIChoose,
} from '../synthesis/sovereignSynthesis';
import { mirrorClarity } from '../reflectionChamber/mirrorClarity';
import { deriveShadowTwinVisualState } from '../reflectionChamber/shadowTwin';

/**
 * Phase 18 (AI/VMA) of the Sovereign OS migration. The target
 * architecture's own rule for this phase: "VMA / AI services operate as
 * consumers of Sovereign State... not as an independent chatbot bolted
 * onto the app." This is that consumption, built for real — not a new
 * derivation layer, but a compact projection of Phase 13's *existing*
 * synthesis questions (whatDidIIdentify, whatPatternsDidIFind, ...) into
 * the shape a model prompt actually needs.
 *
 * Deliberately compact rather than a full state dump: module ids,
 * concept ids, and protocol ids are the cheap summary a companion
 * conversation actually needs — real cost matters here (see
 * frontend/vma-worker), not just design purity. Full reflection
 * response text is left out on purpose — it's the most token-expensive
 * part of state and the part least needed for VMA to reference "what
 * you've been working through" rather than quote it back verbatim; a
 * caller that wants a specific reflection's text can still read it from
 * Sovereign State directly and include it in the user message.
 */
export function buildVMAContext(state) {
  const completedModuleIds = Object.values(state.curriculum.modules)
    .filter((module) => module.status === 'completed')
    .map((module) => module.moduleId);
  const inProgressModuleIds = Object.values(state.curriculum.modules)
    .filter((module) => module.status !== 'completed')
    .map((module) => module.moduleId);

  // Act II (Reflection Chamber) — design guide §35: "Add Shadow Twin state
  // to [VMA] context... The VMA can now understand: 'The user is currently
  // encountering a partially materialized Shadow Twin.'" Compact for the
  // same cost reason as the rest of this file: `recoveredFragmentCount`
  // rather than the fragments themselves (their sourceRegion/portalId
  // metadata is render detail VMA never needs to reference in a reply).
  const clarity = mirrorClarity(state);
  const visualState = deriveShadowTwinVisualState(state.shadowTwin, clarity);

  return {
    activeModuleId: state.curriculum.activeModuleId,
    completedModuleIds,
    inProgressModuleIds,
    retainedConcepts: whatDidIIdentify(state),
    reclaimedConcepts: whatDidIReclaim(state),
    recurringPatterns: whatPatternsDidIFind(state).map((pattern) => pattern.conceptId),
    protocolsChosen: whatProtocolDidIChoose(state).map((execution) => execution.protocolId),
    artifactStatus: state.artifact.status,
    shadowTwin: {
      exists: visualState.exists,
      materializationState: visualState.liveMaterializationState,
      mirrorClarityScore: Math.round(clarity.score * 100) / 100,
      recoveredFragmentCount: state.shadowTwin.recoveredFragments.length,
      integrationState: state.shadowTwin.integrationState,
    },
  };
}
