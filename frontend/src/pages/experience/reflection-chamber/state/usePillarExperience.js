import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { STAGES, PRACTICE_PHASES } from '../utils/stageTransitions';

const STORAGE_PREFIX = 'ckp:reflection-chamber:';

function storageKey(pillarId, userId) {
  return `${STORAGE_PREFIX}${pillarId}:${userId || 'anonymous'}`;
}

function emptyState() {
  return {
    /* ── Generic pillar-session state ──────────────────────────────────
     * Every pillar gets these. `experience` is the pillar's own namespace:
     * the hook never learns any pillar's vocabulary, it just carries the
     * object. Pillar Two's six-track state lives under experience.tracks
     * (see data/forgedWitnessConfig.js), Pillar Three's will look like
     * something else entirely, and neither needs a change here. */
    currentScreen: null,
    completedScreens: [],
    currentTrack: null,
    completedTracks: [],
    experience: {},

    /* ── Portal One's legacy fields ────────────────────────────────────
     * Portal One predates the generic namespace above and still reads and
     * writes these directly. They are kept so existing saved sessions
     * load unchanged; retiring them belongs to a separate, controlled
     * migration of Portal One onto `experience`, not to this one. */
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

function loadInitialState([pillarId, userId]) {
  const base = emptyState();
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(storageKey(pillarId, userId));
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      ...base,
      ...saved,
      // Sessions saved before the generic namespace existed have no
      // `experience` key; the spread above would leave it undefined.
      experience: { ...base.experience, ...(saved.experience || {}) },
    };
  } catch {
    return base;
  }
}

function withoutDuplicate(list, id) {
  return list.includes(id) ? list : [...list, id];
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, currentStage: action.stage };
    case 'SET_PRACTICE_PHASE':
      return { ...state, practicePhase: action.phase };
    case 'PATCH':
      return { ...state, ...action.patch };

    case 'SET_SCREEN':
      return { ...state, currentScreen: action.screenId };
    case 'COMPLETE_SCREEN':
      return { ...state, completedScreens: withoutDuplicate(state.completedScreens, action.screenId) };

    case 'SET_TRACK':
      return { ...state, currentTrack: action.trackId };
    case 'COMPLETE_TRACK':
      return { ...state, completedTracks: withoutDuplicate(state.completedTracks, action.trackId) };

    case 'PATCH_EXPERIENCE':
      return { ...state, experience: { ...state.experience, ...action.patch } };

    case 'PATCH_TRACK': {
      const tracks = state.experience.tracks || {};
      return {
        ...state,
        experience: {
          ...state.experience,
          tracks: {
            ...tracks,
            [action.trackId]: { ...(tracks[action.trackId] || {}), ...action.patch },
          },
        },
      };
    }

    case 'RESET':
      return emptyState();
    default:
      return state;
  }
}

/**
 * Owns one pillar's experience state: local to that pillar's session,
 * distinct from the static curriculum in reflectionChamberModuleData.js.
 * Persisted to localStorage keyed by pillar + user, so every pillar in the
 * Reflection Chamber gets its own independent save slot from this one
 * shared hook — no shared runtime, and no second persistence mechanism.
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

  const setScreen = useCallback((screenId) => dispatch({ type: 'SET_SCREEN', screenId }), []);
  const completeScreen = useCallback((screenId) => dispatch({ type: 'COMPLETE_SCREEN', screenId }), []);
  const setTrack = useCallback((trackId) => dispatch({ type: 'SET_TRACK', trackId }), []);
  const completeTrack = useCallback((trackId) => dispatch({ type: 'COMPLETE_TRACK', trackId }), []);
  const patchExperience = useCallback((patchObj) => dispatch({ type: 'PATCH_EXPERIENCE', patch: patchObj }), []);
  const patchTrack = useCallback(
    (trackId, patchObj) => dispatch({ type: 'PATCH_TRACK', trackId, patch: patchObj }),
    []
  );

  const actions = useMemo(
    () => ({
      setStage,
      setPracticePhase,
      patch,
      reset,
      setScreen,
      completeScreen,
      setTrack,
      completeTrack,
      patchExperience,
      patchTrack,
    }),
    [
      setStage,
      setPracticePhase,
      patch,
      reset,
      setScreen,
      completeScreen,
      setTrack,
      completeTrack,
      patchExperience,
      patchTrack,
    ]
  );

  return { state, ...actions, actions };
}
