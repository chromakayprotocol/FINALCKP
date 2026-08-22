import { SOVEREIGN_ACTION_TYPES } from './sovereignActions';
import { createModuleState } from './sovereignState';

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
      const { conceptId } = action.payload;
      const selected = state.concepts.selected.includes(conceptId)
        ? state.concepts.selected
        : [...state.concepts.selected, conceptId];
      return { ...state, concepts: { ...state.concepts, selected } };
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
          isPlaying: false,
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

    default:
      return state;
  }
}
