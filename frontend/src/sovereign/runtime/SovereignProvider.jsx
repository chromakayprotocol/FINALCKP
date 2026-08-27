import React, { createContext, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { createInitialState } from './sovereignState';
import { sovereignReducer } from './sovereignReducer';
import * as actions from './sovereignActions';
import { loadPersistedState, createAutosave } from './sovereignLocalPersistence';
import { createSovereignEventBus } from '../events/SovereignEventBus';
import { mapActionToEvents } from '../events/mapActionToEvents';
import { fetchRemoteState, createRemoteAutosave } from '../persistence/sovereignSupabaseSync';
import { reconcileSovereignState } from '../persistence/sovereignReconciliation';

export const SovereignContext = createContext(null);

function initSovereignState({ initialState, namespace, storage }) {
  const base = initialState ?? createInitialState();
  if (!namespace) {
    return { ...base, session: { ...base.session, status: 'ready' } };
  }

  const persisted = loadPersistedState(namespace, storage);
  if (!persisted) {
    return { ...base, session: { ...base.session, status: 'ready' } };
  }

  return {
    ...base,
    ...persisted,
    session: {
      ...base.session,
      ...persisted.session,
      status: 'ready',
      hydratedAt: new Date().toISOString(),
    },
  };
}

/**
 * Owns the Sovereign Runtime's state tree. Components never get a raw
 * `dispatch` — only the bound action functions below, so state can only
 * change through the explicit actions defined in sovereignActions.js.
 *
 * Local-first autosave (Phase 5): if `namespace` is set, state is restored
 * from localStorage on mount and debounce-saved back on every change, so a
 * refresh or closed tab never loses a reflection or declaration in
 * progress. `namespace` should be scoped to the signed-in user once
 * identity is wired up (Phase 7) — an unscoped namespace would let two
 * accounts on the same shared browser see each other's local state.
 * Autosave is opt-in per instance (omit `namespace` to run with no local
 * persistence, e.g. in tests).
 *
 * Event bus (Phase 6): every dispatched action is translated into zero or
 * more Sovereign events (mapActionToEvents.js) and emitted on the runtime's
 * event bus, exposed to consumers via useSovereign().session.subscribe /
 * .subscribeAll / .recentEvents. Pass a custom `eventBus` (e.g. one built
 * with createSovereignEventBus()) to share a bus across tests or providers;
 * otherwise one is created per SovereignProvider instance.
 *
 * Supabase sync (Phase 7): pass `userId` (the signed-in Supabase Auth user
 * id — this is also what `namespace` should be set to, so local and remote
 * state agree on whose data this is) to enable remote sync. On mount (and
 * whenever `userId` changes), fetches whatever Supabase already has for
 * that user and reconciles it with current state
 * (sovereignReconciliation.js — later-wins per module/reflection, sealed
 * artifacts never downgraded, set-unions for concepts/connections), then
 * debounce-pushes state back to Supabase on every subsequent change
 * (default 2s — slower than local autosave's 500ms since this is a network
 * call, not a local write). `session.syncStatus` reflects this:
 * 'local' -> 'syncing' -> 'synced', or 'error' if the initial fetch fails
 * (state keeps working locally either way — Supabase is additive
 * persistence, never a hard dependency). Omit `userId` to run with no
 * remote sync at all (e.g. a signed-out visitor, or tests).
 */
export function SovereignProvider({
  children,
  initialState,
  namespace,
  autosaveDelayMs = 500,
  storage,
  eventBus,
  userId,
  remoteClient,
  remoteSyncDelayMs = 2000,
}) {
  const [state, dispatch] = useReducer(
    sovereignReducer,
    { initialState, namespace, storage },
    initSovereignState,
  );

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const eventBusRef = useRef(null);
  if (!eventBusRef.current) {
    eventBusRef.current = eventBus ?? createSovereignEventBus();
  }

  const autosaveRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!namespace) return undefined;
    autosaveRef.current = createAutosave(namespace, { delayMs: autosaveDelayMs, storage });
    return () => {
      // Flush on unmount so the last debounce window isn't silently dropped.
      autosaveRef.current?.flush(stateRef.current);
      autosaveRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, autosaveDelayMs, storage]);

  useEffect(() => {
    if (isFirstRender.current) {
      // Don't immediately re-save exactly what was just restored (or the
      // freshly-created initial state) on the mount render.
      isFirstRender.current = false;
      return;
    }
    autosaveRef.current?.schedule(state);
  }, [state]);

  useEffect(() => {
    if (!namespace || typeof window === 'undefined') return undefined;
    const handleBeforeUnload = () => autosaveRef.current?.flush(stateRef.current);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [namespace]);

  // Routes every action through the event bus: compute the next state
  // ourselves (the reducer is pure, so this matches what React will
  // commit), update stateRef synchronously so back-to-back dispatches in
  // the same tick see a correct prevState, then dispatch for the real
  // re-render and emit whatever events this action produced. Stable via
  // useCallback so the remote-sync effect below can also use it to dispatch
  // hydrate() without needing to be recreated on every render.
  const dispatchAction = useCallback(
    (action) => {
      const prevState = stateRef.current;
      const nextState = sovereignReducer(prevState, action);
      stateRef.current = nextState;
      dispatch(action);
      mapActionToEvents(action, { prevState, nextState }).forEach((event) => {
        eventBusRef.current.emit(event.type, event.payload);
      });
    },
    [dispatch],
  );

  const remoteAutosaveRef = useRef(null);
  const remoteReadyRef = useRef(false);

  useEffect(() => {
    if (!userId) return undefined;
    remoteReadyRef.current = false;
    let cancelled = false;

    async function runInitialSync() {
      dispatchAction(actions.hydrate({ session: { ...stateRef.current.session, syncStatus: 'syncing' } }));
      const { data, error } = await fetchRemoteState(userId, remoteClient);
      if (cancelled) return;
      if (error) {
        dispatchAction(actions.hydrate({ session: { ...stateRef.current.session, syncStatus: 'error' } }));
        return;
      }
      dispatchAction(actions.hydrate(reconcileSovereignState(stateRef.current, data)));
      remoteReadyRef.current = true;
    }

    runInitialSync();
    remoteAutosaveRef.current = createRemoteAutosave(userId, remoteClient, { delayMs: remoteSyncDelayMs });

    return () => {
      cancelled = true;
      // Flush whatever's pending so a fast unmount (e.g. route change right
      // after a reflection) doesn't drop the last debounce window.
      remoteAutosaveRef.current?.flush(stateRef.current);
      remoteAutosaveRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, remoteClient, remoteSyncDelayMs]);

  useEffect(() => {
    if (!userId || !remoteReadyRef.current) return;
    remoteAutosaveRef.current?.schedule(state);
  }, [state, userId]);

  const boundActions = useMemo(() => {
    return {
      hydrate: (nextState) => dispatchAction(actions.hydrate(nextState)),
      setIdentity: (identity) => dispatchAction(actions.setIdentity(identity)),
      startModule: (moduleId) => dispatchAction(actions.startModule(moduleId)),
      advanceStep: (moduleId, stepId) => dispatchAction(actions.advanceStep(moduleId, stepId)),
      completeStep: (moduleId, stepId, criteria) =>
        dispatchAction(actions.completeStep(moduleId, stepId, criteria)),
      recordReflection: (moduleId, promptId, response) =>
        dispatchAction(actions.recordReflection(moduleId, promptId, response)),
      startReflection: (moduleId, promptId) =>
        dispatchAction(actions.startReflection(moduleId, promptId)),
      updateReflection: (moduleId, promptId, response) =>
        dispatchAction(actions.updateReflection(moduleId, promptId, response)),
      extractConcepts: (moduleId, promptId, conceptIds) =>
        dispatchAction(actions.extractConcepts(moduleId, promptId, conceptIds)),
      commitReflection: (moduleId, promptId, response, retainedConcepts) =>
        dispatchAction(actions.commitReflection(moduleId, promptId, response, retainedConcepts)),
      selectConcept: (conceptId, moduleId) =>
        dispatchAction(actions.selectConcept(conceptId, moduleId)),
      connectConcepts: (fromConceptId, toConceptId, relationship) =>
        dispatchAction(actions.connectConcepts(fromConceptId, toConceptId, relationship)),
      mapConceptToDomain: (conceptId, domain, role) =>
        dispatchAction(actions.mapConceptToDomain(conceptId, domain, role)),
      executeProtocol: (protocolId, payload, moduleId) =>
        dispatchAction(actions.executeProtocol(protocolId, payload, moduleId)),
      generateArtifact: (draft) => dispatchAction(actions.generateArtifact(draft)),
      sealArtifact: () => dispatchAction(actions.sealArtifact()),
      loadTrack: (trackId) => dispatchAction(actions.loadTrack(trackId)),
      play: () => dispatchAction(actions.play()),
      pause: () => dispatchAction(actions.pause()),
      seek: (position) => dispatchAction(actions.seek(position)),
      advancePosition: (position) => dispatchAction(actions.advancePosition(position)),
      setDuration: (duration) => dispatchAction(actions.setDuration(duration)),
      setVolume: (volume) => dispatchAction(actions.setVolume(volume)),
      selectAnchor: (anchorKey) => dispatchAction(actions.selectAnchor(anchorKey)),
      selectMediaConcept: (conceptId) => dispatchAction(actions.selectMediaConcept(conceptId)),
    };
  }, [dispatchAction]);

  const value = useMemo(
    () => ({ state, actions: boundActions, eventBus: eventBusRef.current }),
    [state, boundActions],
  );

  return <SovereignContext.Provider value={value}>{children}</SovereignContext.Provider>;
}
