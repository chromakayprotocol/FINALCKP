import { SOVEREIGN_ACTION_TYPES } from './sovereignActions';
import { createModuleState } from './sovereignState';
import { isValidDomain, isValidDomainRole } from './sovereignDomains';

function getOrCreateModule(modules, moduleId) {
  return modules[moduleId] ?? createModuleState(moduleId);
}

function updateModule(state, moduleId, updater) {
  const existing = getOrCreateModule(state.curriculum.modules, moduleId);
  const nextModule = updater(existing);
  return {
    ...state,
    curriculum: {
      ...state.curriculum,
      modules: { ...state.curriculum.modules, [moduleId]: nextModule },
    },
  };
}

/* Shared by SELECT_CONCEPT and COMMIT_REFLECTION (Phase 12) — committing a
   reflection's retained concepts must have the exact same effect on the
   Concept Graph as calling selectConcept() directly for each one, so
   there's only one real implementation of "what does selecting a concept
   do" for both paths to share. */
function creditConceptSelection(state, conceptId, moduleId) {
  const selected = state.concepts.selected.includes(conceptId)
    ? state.concepts.selected
    : [...state.concepts.selected, conceptId];
  const withSelection = { ...state, concepts: { ...state.concepts, selected } };
  if (!moduleId) return withSelection;
  return updateModule(withSelection, moduleId, (existing) => ({
    ...existing,
    selectedConcepts: existing.selectedConcepts.includes(conceptId)
      ? existing.selectedConcepts
      : [...existing.selectedConcepts, conceptId],
  }));
}

function getOrCreateReflectionEntry(entries, moduleId, promptId) {
  const entryId = `${moduleId}:${promptId}`;
  return (
    entries[entryId] ?? {
      moduleId,
      promptId,
      response: null,
      status: 'draft',
      candidateConcepts: [],
      retainedConcepts: [],
      startedAt: null,
      updatedAt: null,
      committedAt: null,
    }
  );
}

function updateReflectionEntry(state, moduleId, promptId, updater) {
  const entryId = `${moduleId}:${promptId}`;
  const existing = getOrCreateReflectionEntry(state.reflection.entries, moduleId, promptId);
  const entry = updater(existing);
  return {
    ...state,
    reflection: {
      ...state.reflection,
      entries: { ...state.reflection.entries, [entryId]: entry },
    },
  };
}

export function sovereignReducer(state, action) {
  switch (action.type) {
    case SOVEREIGN_ACTION_TYPES.HYDRATE: {
      return { ...state, ...action.payload.state };
    }

    case SOVEREIGN_ACTION_TYPES.SET_IDENTITY: {
      return { ...state, identity: { ...state.identity, ...action.payload.identity } };
    }

    case SOVEREIGN_ACTION_TYPES.START_MODULE: {
      const { moduleId } = action.payload;
      const withModule = updateModule(state, moduleId, (existing) => ({
        ...existing,
        status: existing.status === 'completed' ? existing.status : 'in_progress',
        startedAt: existing.startedAt ?? action.meta.timestamp,
        lastActiveAt: action.meta.timestamp,
      }));
      return {
        ...withModule,
        curriculum: { ...withModule.curriculum, activeModuleId: moduleId },
      };
    }

    case SOVEREIGN_ACTION_TYPES.ADVANCE_STEP: {
      const { moduleId, stepId } = action.payload;
      return updateModule(state, moduleId, (existing) => ({
        ...existing,
        currentStep: stepId,
        viewedSteps: existing.viewedSteps.includes(stepId)
          ? existing.viewedSteps
          : [...existing.viewedSteps, stepId],
        interactionCount: existing.interactionCount + 1,
        lastActiveAt: action.meta.timestamp,
      }));
    }

    case SOVEREIGN_ACTION_TYPES.COMPLETE_STEP: {
      const { moduleId, stepId } = action.payload;
      return updateModule(state, moduleId, (existing) => ({
        ...existing,
        completedSteps: existing.completedSteps.includes(stepId)
          ? existing.completedSteps
          : [...existing.completedSteps, stepId],
        lastActiveAt: action.meta.timestamp,
      }));
    }

    case SOVEREIGN_ACTION_TYPES.RECORD_REFLECTION: {
      const { moduleId, promptId, response } = action.payload;
      const entryId = `${moduleId}:${promptId}`;
      return {
        ...state,
        reflection: {
          ...state.reflection,
          entries: {
            ...state.reflection.entries,
            [entryId]: { moduleId, promptId, response, updatedAt: action.meta.timestamp },
          },
        },
      };
    }

    case SOVEREIGN_ACTION_TYPES.SELECT_CONCEPT: {
      const { conceptId, moduleId } = action.payload;
      return creditConceptSelection(state, conceptId, moduleId);
    }

    case SOVEREIGN_ACTION_TYPES.CONNECT_CONCEPTS: {
      const { fromConceptId, toConceptId, relationship } = action.payload;
      const connection = {
        fromConceptId,
        toConceptId,
        relationship,
        createdAt: action.meta.timestamp,
      };
      return {
        ...state,
        concepts: {
          ...state.concepts,
          connections: [...state.concepts.connections, connection],
        },
      };
    }

    case SOVEREIGN_ACTION_TYPES.EXECUTE_PROTOCOL: {
      const { protocolId, payload, moduleId } = action.payload;
      const execution = { protocolId, payload, moduleId: moduleId ?? null, executedAt: action.meta.timestamp };
      return {
        ...state,
        synthesis: {
          ...state.synthesis,
          protocolExecutions: [...state.synthesis.protocolExecutions, execution],
        },
      };
    }

    case SOVEREIGN_ACTION_TYPES.GENERATE_ARTIFACT: {
      return {
        ...state,
        artifact: { ...state.artifact, status: 'draft', draft: action.payload.draft },
      };
    }

    case SOVEREIGN_ACTION_TYPES.SEAL_ARTIFACT: {
      if (!state.artifact.draft) return state;
      return {
        ...state,
        artifact: { ...state.artifact, status: 'sealed', sealedAt: action.meta.timestamp },
      };
    }

    case SOVEREIGN_ACTION_TYPES.LOAD_TRACK: {
      const { trackId } = action.payload;
      return {
        ...state,
        media: {
          ...state.media,
          currentTrackId: trackId,
          position: 0,
          duration: 0,
        },
      };
    }

    case SOVEREIGN_ACTION_TYPES.PLAY: {
      // Nothing to play without a loaded track — same invariant as
      // sealArtifact() no-oping without a draft.
      if (!state.media.currentTrackId) return state;
      return { ...state, media: { ...state.media, isPlaying: true } };
    }

    case SOVEREIGN_ACTION_TYPES.PAUSE: {
      return { ...state, media: { ...state.media, isPlaying: false } };
    }

    case SOVEREIGN_ACTION_TYPES.SEEK: {
      return { ...state, media: { ...state.media, position: action.payload.position } };
    }

    case SOVEREIGN_ACTION_TYPES.ADVANCE_POSITION: {
      return { ...state, media: { ...state.media, position: action.payload.position } };
    }

    case SOVEREIGN_ACTION_TYPES.SET_DURATION: {
      return { ...state, media: { ...state.media, duration: action.payload.duration } };
    }

    case SOVEREIGN_ACTION_TYPES.SET_VOLUME: {
      const volume = Math.max(0, Math.min(1, Number(action.payload.volume) || 0));
      return { ...state, media: { ...state.media, volume } };
    }

    case SOVEREIGN_ACTION_TYPES.SELECT_ANCHOR: {
      return { ...state, media: { ...state.media, activeAnchor: action.payload.anchorKey } };
    }

    case SOVEREIGN_ACTION_TYPES.SELECT_MEDIA_CONCEPT: {
      return { ...state, media: { ...state.media, activeConcept: action.payload.conceptId } };
    }

    case SOVEREIGN_ACTION_TYPES.MAP_CONCEPT_TO_DOMAIN: {
      const { conceptId, domain, role } = action.payload;
      if (!conceptId || !isValidDomain(domain) || !isValidDomainRole(role)) return state;

      const exists = state.concepts.domainMappings.some(
        (mapping) => mapping.conceptId === conceptId && mapping.domain === domain && mapping.role === role,
      );
      if (exists) return state;

      const mapping = { conceptId, domain, role, mappedAt: action.meta.timestamp };
      return {
        ...state,
        concepts: {
          ...state.concepts,
          domainMappings: [...state.concepts.domainMappings, mapping],
        },
      };
    }

    case SOVEREIGN_ACTION_TYPES.START_REFLECTION: {
      const { moduleId, promptId } = action.payload;
      return updateReflectionEntry(state, moduleId, promptId, (existing) => ({
        ...existing,
        // Idempotent — re-opening an in-progress draft doesn't reset its
        // start time or wipe what's already been written.
        startedAt: existing.startedAt ?? action.meta.timestamp,
      }));
    }

    case SOVEREIGN_ACTION_TYPES.UPDATE_REFLECTION: {
      const { moduleId, promptId, response } = action.payload;
      return updateReflectionEntry(state, moduleId, promptId, (existing) => ({
        ...existing,
        response,
        updatedAt: action.meta.timestamp,
      }));
    }

    case SOVEREIGN_ACTION_TYPES.EXTRACT_CONCEPTS: {
      const { moduleId, promptId, conceptIds } = action.payload;
      return updateReflectionEntry(state, moduleId, promptId, (existing) => ({
        ...existing,
        candidateConcepts: conceptIds,
        updatedAt: action.meta.timestamp,
      }));
    }

    case SOVEREIGN_ACTION_TYPES.COMMIT_REFLECTION: {
      const { moduleId, promptId, response, retainedConcepts } = action.payload;
      const withEntry = updateReflectionEntry(state, moduleId, promptId, (existing) => ({
        ...existing,
        response: response ?? existing.response,
        retainedConcepts,
        status: 'committed',
        updatedAt: action.meta.timestamp,
        committedAt: action.meta.timestamp,
      }));
      // The Decision stage isn't just a note on the reflection — retained
      // concepts become real Concept Graph facts, exactly as if the user
      // had called selectConcept() for each one.
      return retainedConcepts.reduce(
        (nextState, conceptId) => creditConceptSelection(nextState, conceptId, moduleId),
        withEntry,
      );
    }

    default:
      return state;
  }
}
