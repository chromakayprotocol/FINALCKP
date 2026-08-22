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
      identity: { ...selectIdentity(state), setIdentity: actions.setIdentity },
      curriculum: { ...selectCurriculum(state), startModule: actions.startModule },
      module: activeModule && {
        ...activeModule,
        steps: evaluateModuleSteps(state, activeModule.moduleId),
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
      },
      artifact: {
        ...selectArtifact(state),
        generateArtifact: actions.generateArtifact,
        sealArtifact: actions.sealArtifact,
      },
      session: {
        ...selectSession(state),
        subscribe: eventBus.subscribe,
        subscribeAll: eventBus.subscribeAll,
        recentEvents: eventBus.getHistory(20),
      },
    };
  }, [state, actions, eventBus]);
}
