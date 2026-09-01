import { useContext, useMemo } from 'react';
import { SovereignContext } from './SovereignProvider';
import {
  selectSession,
  selectIdentity,
  selectCurriculum,
  selectActiveModule,
  selectMedia,
  selectReflection,
  selectConcepts,
  selectSynthesis,
  selectArtifact,
} from './sovereignSelectors';
import { evaluateModuleSteps } from './sovereignSteps';
import { buildDomainMatrix } from './sovereignDomains';
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
} from '../synthesis/sovereignSynthesis';
import { compileArtifactDocument } from '../artifact/artifactSchema';
import { exportArtifactToMarkdown } from '../artifact/artifactExport';
import { buildVMAContext } from '../vma/buildVMAContext';

/**
 * The one way app code reads or mutates Sovereign state. Each domain bundles
 * its own slice of state alongside the actions that mutate it — e.g.
 * `concepts.selectConcept(id)`, `artifact.sealArtifact()` — so components
 * never touch a raw dispatch.
 */
export function useSovereign() {
  const ctx = useContext(SovereignContext);
  if (!ctx) {
    throw new Error('useSovereign must be used within a SovereignProvider');
  }
  const { state, actions, eventBus } = ctx;

  return useMemo(() => {
    const activeModule = selectActiveModule(state);

    return {
      // Raw state escape hatch: most reads should go through the domain
      // slices below, but a page hosting several modules of one track (e.g.
      // the Reflection Chamber checking whether a pillar other than the
      // currently-active one is complete) needs the full tree to pass into
      // track-specific pure derivations like evaluateModuleSteps()/
      // isModuleComplete() or reflectionChamber/mirrorClarity.js, which take
      // state directly rather than a per-module slice.
      state,
      identity: { ...selectIdentity(state), setIdentity: actions.setIdentity },
      curriculum: { ...selectCurriculum(state), startModule: actions.startModule },
      module: activeModule && {
        ...activeModule,
        steps: evaluateModuleSteps(state, activeModule.moduleId),
        synthesisReadiness: moduleSynthesisReadiness(state, activeModule.moduleId),
        advanceStep: (stepId) => actions.advanceStep(activeModule.moduleId, stepId),
        completeStep: (stepId, criteria) =>
          actions.completeStep(activeModule.moduleId, stepId, criteria),
      },
      media: {
        ...selectMedia(state),
        loadTrack: actions.loadTrack,
        play: actions.play,
        pause: actions.pause,
        seek: actions.seek,
        advancePosition: actions.advancePosition,
        setDuration: actions.setDuration,
        setVolume: actions.setVolume,
        selectAnchor: actions.selectAnchor,
        selectMediaConcept: actions.selectMediaConcept,
      },
      reflection: {
        ...selectReflection(state),
        recordReflection: actions.recordReflection,
        // Structured pipeline (Phase 12) — all four default moduleId to
        // the active module, same fallback pattern as concepts.selectConcept
        // and synthesis.executeProtocol, with an optional override last.
        startReflection: (promptId, moduleId) =>
          actions.startReflection(moduleId ?? activeModule?.moduleId, promptId),
        updateReflection: (promptId, response, moduleId) =>
          actions.updateReflection(moduleId ?? activeModule?.moduleId, promptId, response),
        extractConcepts: (promptId, conceptIds, moduleId) =>
          actions.extractConcepts(moduleId ?? activeModule?.moduleId, promptId, conceptIds),
        commitReflection: (promptId, response, retainedConcepts, moduleId) =>
          actions.commitReflection(
            moduleId ?? activeModule?.moduleId,
            promptId,
            response,
            retainedConcepts,
          ),
      },
      concepts: {
        ...selectConcepts(state),
        // Defaults to the active module, same fallback pattern as
        // synthesis.executeProtocol below — a caller can still pass an
        // explicit moduleId (or null, for an unscoped selection) to
        // override it.
        selectConcept: (conceptId, moduleId) =>
          actions.selectConcept(conceptId, moduleId ?? activeModule?.moduleId ?? null),
        connectConcepts: actions.connectConcepts,
        mapConceptToDomain: actions.mapConceptToDomain,
        domainMatrix: buildDomainMatrix(selectConcepts(state)),
      },
      synthesis: {
        ...selectSynthesis(state),
        executeProtocol: (protocolId, payload, moduleId) =>
          actions.executeProtocol(protocolId, payload, moduleId ?? activeModule?.moduleId),
        // The Synthesis Engine (Phase 13) — pure derivations over state
        // that already exists, recomputed whenever state changes. See
        // sovereign/synthesis/sovereignSynthesis.js for what each of these
        // actually reads and why "patterns" and "relationships" are kept
        // genuinely distinct rather than both aliasing concepts.connections.
        synthesisState: buildSynthesisState(state),
        synthesisGraph: buildSynthesisGraph(buildSynthesisState(state)),
        whatDidIIdentify: whatDidIIdentify(state),
        whatPatternsDidIFind: whatPatternsDidIFind(state),
        whatDidIReject: whatDidIReject(state),
        whatDidIReclaim: whatDidIReclaim(state),
        whatRelationshipsDidIEstablish: whatRelationshipsDidIEstablish(state),
        whatProtocolDidIChoose: whatProtocolDidIChoose(state),
      },
      artifact: {
        ...selectArtifact(state),
        generateArtifact: actions.generateArtifact,
        sealArtifact: actions.sealArtifact,
        // The Artifact Compiler (Phase 14): compiles a fresh
        // ArtifactDocument from the current Synthesis State and dispatches
        // it as a (re)draft in one call — generateArtifact() already
        // tracks the revision history (see GENERATE_ARTIFACT in
        // sovereignReducer.js), so calling this again mid-journey is how
        // "User Revision" via re-compiling looks in practice.
        compileFromSynthesis: () => actions.generateArtifact(compileArtifactDocument(buildSynthesisState(state))),
        exportMarkdown: () => exportArtifactToMarkdown(selectArtifact(state).draft),
      },
      session: {
        ...selectSession(state),
        subscribe: eventBus.subscribe,
        subscribeAll: eventBus.subscribeAll,
        recentEvents: eventBus.getHistory(20),
      },
      // Phase 18 (AI/VMA): the compact, cost-conscious projection of state
      // frontend/vma-worker's /chat endpoint expects as `context` — see
      // sovereign/vma/buildVMAContext.js for exactly what's included (and
      // deliberately excluded, like raw reflection text).
      vma: {
        context: buildVMAContext(state),
      },
    };
  }, [state, actions, eventBus]);
}
