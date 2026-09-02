import { useCallback, useEffect, useReducer } from 'react';
import { STAGES, PRACTICE_PHASES } from '../utils/stageTransitions';

const STORAGE_PREFIX = 'ckp:reflection-chamber:';

function storageKey(pillarId, userId) {
  return `${STORAGE_PREFIX}${pillarId}:${userId || 'anonymous'}`;
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
    observation: { noticed: '', changed: null },
    unbentDoorChoice: null,
    avoidedAction: '',
    commitment: { response: '', anchor: null },
    shadow: {
      // The rule the Seeker found underneath their own story, in their own
      // words — never rewritten into generic psychological terminology.
      discoveredCode: '',
      isRule: null,
      figure: '',
      notice: '',
      wants: '',
      protecting: '',
      ifItStopped: '',
      dialogue: [],
      protectedNeed: null,
      customNeed: '',
    },
    light: {
      reclaimed: '',
      practiceEvent: '',
      practiceResponse: '',
      oldCodeWould: '',
      lightCodeWould: '',
    },
    mastery: { whatKnow: '', whatFeel: '', whatAssuming: '', whatWouldDo: '' },
    completedAt: null,
  };
}

function loadInitialState([pillarId, userId]) {
  const base = emptyState();
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(storageKey(pillarId, userId));
    if (!raw) return base;
    const saved = JSON.parse(raw);
    // Merge one level into the nested groups too. A saved session from before a
    // group gained a field would otherwise rehydrate without it, and the inputs
    // bound to it would flip from controlled to uncontrolled mid-experience.
    return {
      ...base,
      ...saved,
      reflection: { ...base.reflection, ...saved.reflection },
      observation: { ...base.observation, ...saved.observation },
      commitment: { ...base.commitment, ...saved.commitment },
      shadow: { ...base.shadow, ...saved.shadow },
      light: { ...base.light, ...saved.light },
      mastery: { ...base.mastery, ...saved.mastery },
    };
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
 * Owns one pillar's experience state (§23 of the component guide): local
 * to that pillar's session, distinct from the static curriculum in
 * reflectionChamberModuleData.js. Persisted to localStorage, keyed by
 * pillar + user, so every pillar in the Reflection Chamber gets its own
 * independent save slot from the same shared hook — no shared runtime.
 */
export function usePillarExperience(pillarId, userId) {
  const [state, dispatch] = useReducer(reducer, [pillarId, userId], loadInitialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey(pillarId, userId), JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode / quota) — the session still
      // works in-memory, it just won't survive a reload.
    }
  }, [state, pillarId, userId]);

  const setStage = useCallback((stage) => dispatch({ type: 'SET_STAGE', stage }), []);
  const setPracticePhase = useCallback((phase) => dispatch({ type: 'SET_PRACTICE_PHASE', phase }), []);
  const patch = useCallback((patchObj) => dispatch({ type: 'PATCH', patch: patchObj }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, setStage, setPracticePhase, patch, reset };
}
