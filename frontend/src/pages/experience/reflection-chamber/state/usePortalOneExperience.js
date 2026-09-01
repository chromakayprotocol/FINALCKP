import { useCallback, useEffect, useReducer } from 'react';
import { STAGES, PRACTICE_PHASES } from '../utils/stageTransitions';

const STORAGE_PREFIX = 'ckp:reflection-chamber:owned-interior:';

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'anonymous'}`;
}

function emptyState() {
  return {
    currentStage: STAGES.INTRO,
    practicePhase: PRACTICE_PHASES.OBSERVE,
    sorterPlacements: {},
    sorterComplete: false,
    conceptResponse: '',
    modernScenarioId: null,
    digitalSequenceLog: [],
    rehearsedRoomSelection: null,
    rehearsedRoomAdmission: '',
    reflection: { whatHappened: '', whatFelt: [], whatAssumed: '', whatKnow: '' },
    lightCodeResponse: '',
    observation: { noticed: '', changed: null },
    unbentDoorChoice: null,
    avoidedAction: '',
    mastery: { whatKnow: '', whatFeel: '', whatAssuming: '', whatWouldDo: '' },
    completedAt: null,
  };
}

function loadInitialState(userId) {
  const base = emptyState();
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return base;
    return { ...base, ...JSON.parse(raw) };
  } catch {
    return base;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, currentStage: action.stage };
    case 'SET_PRACTICE_PHASE':
      return { ...state, practicePhase: action.phase };
    case 'PATCH':
      return { ...state, ...action.patch };
    case 'RESET':
      return emptyState();
    default:
      return state;
  }
}

/**
 * Owns Portal One's experience state (§23 of the component guide): local to
 * this pillar session, distinct from the static curriculum in
 * reflectionChamberModuleData.js. Persisted to localStorage only — no
 * server round trip, no shared runtime, matching how the rest of the
 * Reflection Chamber works today.
 */
export function usePortalOneExperience(userId) {
  const [state, dispatch] = useReducer(reducer, userId, loadInitialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode / quota) — the session still
      // works in-memory, it just won't survive a reload.
    }
  }, [state, userId]);

  const setStage = useCallback((stage) => dispatch({ type: 'SET_STAGE', stage }), []);
  const setPracticePhase = useCallback((phase) => dispatch({ type: 'SET_PRACTICE_PHASE', phase }), []);
  const patch = useCallback((patchObj) => dispatch({ type: 'PATCH', patch: patchObj }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, setStage, setPracticePhase, patch, reset };
}
