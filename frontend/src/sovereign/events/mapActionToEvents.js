/**
 * Translates a dispatched Sovereign Runtime action into zero or more
 * Sovereign events (Phase 6). This is what makes the event flow from the
 * migration guide real:
 *
 *   User Interaction -> Action -> State Mutation -> Event -> Consumers
 *
 * Events are derived from the action + the reducer's before/after state,
 * not emitted by hand at each UI call site — so a consumer never has to
 * trust that every feature remembered to fire its own event.
 *
 * STEP_COMPLETED is the one event that isn't a 1:1 mapping from a single
 * action type: because step completion criteria (sovereignSteps.js) can
 * depend on state written by several different actions (a reflection, a
 * protocol execution, a sealed artifact, ...), this diffs
 * evaluateModuleSteps() before/after *every* action and emits
 * STEP_COMPLETED for whichever steps just crossed into 'complete'. That is
 * the direct payoff of building Phase 4's real completion criteria before
 * this phase's event bus, per the migration guide's sequencing rule.
 */

import { SOVEREIGN_ACTION_TYPES } from '../runtime/sovereignActions';
import { evaluateModuleSteps, SOVEREIGN_STEP_STATUSES } from '../runtime/sovereignSteps';
import { SOVEREIGN_EVENT_TYPES } from './eventTypes';

function resolveModuleId(action, nextState) {
  return action.payload?.moduleId ?? nextState.curriculum.activeModuleId ?? null;
}

function diffCompletedSteps(prevState, nextState, moduleId) {
  if (!moduleId || !nextState.curriculum.modules[moduleId]) return [];

  const prevStatusById = new Map(
    evaluateModuleSteps(prevState, moduleId).map((step) => [step.id, step.status]),
  );

  return evaluateModuleSteps(nextState, moduleId)
    .filter(
      (step) =>
        step.status === SOVEREIGN_STEP_STATUSES.COMPLETE &&
        prevStatusById.get(step.id) !== SOVEREIGN_STEP_STATUSES.COMPLETE,
    )
    .map((step) => ({ moduleId, stepId: step.id }));
}

export function mapActionToEvents(action, { prevState, nextState }) {
  const events = [];
  const push = (type, payload) => events.push({ type, payload });

  switch (action.type) {
    case SOVEREIGN_ACTION_TYPES.START_MODULE: {
      push(SOVEREIGN_EVENT_TYPES.MODULE_ENTERED, { moduleId: action.payload.moduleId });
      break;
    }

    case SOVEREIGN_ACTION_TYPES.ADVANCE_STEP: {
      push(SOVEREIGN_EVENT_TYPES.STEP_STARTED, {
        moduleId: action.payload.moduleId,
        stepId: action.payload.stepId,
      });
      break;
    }

    case SOVEREIGN_ACTION_TYPES.SELECT_CONCEPT: {
      push(SOVEREIGN_EVENT_TYPES.CONCEPT_SELECTED, {
        conceptId: action.payload.conceptId,
        moduleId: action.payload.moduleId ?? null,
      });
      break;
    }

    case SOVEREIGN_ACTION_TYPES.CONNECT_CONCEPTS: {
      push(SOVEREIGN_EVENT_TYPES.CONCEPT_CONNECTED, {
        fromConceptId: action.payload.fromConceptId,
        toConceptId: action.payload.toConceptId,
        relationship: action.payload.relationship,
      });
      break;
    }

    case SOVEREIGN_ACTION_TYPES.MAP_CONCEPT_TO_DOMAIN: {
      // mapConceptToDomain() no-ops in the reducer for an invalid
      // domain/role or a repeat of an existing mapping — only emit when a
      // new mapping actually landed.
      if (nextState.concepts.domainMappings.length > prevState.concepts.domainMappings.length) {
        push(SOVEREIGN_EVENT_TYPES.CONCEPT_DOMAIN_MAPPED, {
          conceptId: action.payload.conceptId,
          domain: action.payload.domain,
          role: action.payload.role,
        });
      }
      break;
    }

    case SOVEREIGN_ACTION_TYPES.RECORD_REFLECTION: {
      push(SOVEREIGN_EVENT_TYPES.REFLECTION_COMMITTED, {
        moduleId: action.payload.moduleId,
        promptId: action.payload.promptId,
      });
      break;
    }

    case SOVEREIGN_ACTION_TYPES.EXECUTE_PROTOCOL: {
      push(SOVEREIGN_EVENT_TYPES.PROTOCOL_COMPLETED, {
        protocolId: action.payload.protocolId,
        moduleId: action.payload.moduleId ?? null,
      });
      break;
    }

    case SOVEREIGN_ACTION_TYPES.GENERATE_ARTIFACT: {
      const type =
        prevState.artifact.status === 'empty'
          ? SOVEREIGN_EVENT_TYPES.ARTIFACT_STARTED
          : SOVEREIGN_EVENT_TYPES.ARTIFACT_EDITED;
      push(type, {});
      break;
    }

    case SOVEREIGN_ACTION_TYPES.SEAL_ARTIFACT: {
      // sealArtifact() is a no-op in the reducer without a draft — only
      // emit when the state actually transitioned.
      if (nextState.artifact.status === 'sealed' && prevState.artifact.status !== 'sealed') {
        push(SOVEREIGN_EVENT_TYPES.ARTIFACT_SEALED, {});
      }
      break;
    }

    case SOVEREIGN_ACTION_TYPES.PLAY: {
      // play() is a no-op in the reducer without a loaded track, and a
      // repeat play() while already playing shouldn't re-announce — only
      // emit on a real not-playing -> playing transition.
      if (nextState.media.isPlaying && !prevState.media.isPlaying) {
        push(SOVEREIGN_EVENT_TYPES.MEDIA_STARTED, {
          trackId: nextState.media.currentTrackId,
        });
      }
      break;
    }

    case SOVEREIGN_ACTION_TYPES.PAUSE: {
      if (!nextState.media.isPlaying && prevState.media.isPlaying) {
        push(SOVEREIGN_EVENT_TYPES.MEDIA_PAUSED, {
          trackId: nextState.media.currentTrackId,
        });
      }
      break;
    }

    case SOVEREIGN_ACTION_TYPES.SEEK: {
      push(SOVEREIGN_EVENT_TYPES.MEDIA_SEEKED, {
        trackId: nextState.media.currentTrackId,
        position: action.payload.position,
      });
      break;
    }

    case SOVEREIGN_ACTION_TYPES.SELECT_ANCHOR: {
      push(SOVEREIGN_EVENT_TYPES.LYRIC_ANCHOR_SELECTED, {
        trackId: nextState.media.currentTrackId,
        anchorKey: action.payload.anchorKey,
      });
      break;
    }

    default:
      break;
  }

  const moduleId = resolveModuleId(action, nextState);
  diffCompletedSteps(prevState, nextState, moduleId).forEach(({ stepId }) => {
    push(SOVEREIGN_EVENT_TYPES.STEP_COMPLETED, { moduleId, stepId });
  });

  return events;
}
