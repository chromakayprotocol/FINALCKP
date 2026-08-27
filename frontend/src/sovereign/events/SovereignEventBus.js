/**
 * Sovereign Event Bus (Phase 6 of the Sovereign OS migration).
 *
 * Every meaningful Sovereign Runtime state mutation becomes an event here.
 * Consumers (persistence, analytics, progress, synthesis, visualizer, VMA)
 * subscribe instead of each feature hand-rolling its own side effect —
 * this is the structural fix for duplication finding #13 in
 * docs/SOVEREIGN_STATE_MAP.md ("two disconnected analytics systems,
 * neither covering the whole app").
 *
 * Framework-free and independently testable; SovereignProvider wires it to
 * every dispatched action via mapActionToEvents.js.
 */

import { createSovereignEvent } from './SovereignEvent';

function logListenerError(eventType, error) {
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error(`[SovereignEventBus] listener threw for event "${eventType}"`, error);
  }
}

export function createSovereignEventBus({ historyLimit = 100 } = {}) {
  const listeners = new Map(); // type -> Set<handler>
  const wildcardListeners = new Set();
  let history = [];

  function notify(handler, event) {
    try {
      handler(event);
    } catch (error) {
      // A consumer throwing (a bad analytics hook, a broken visualizer
      // subscriber, ...) must never break the runtime or block other
      // consumers from receiving the same event.
      logListenerError(event.type, error);
    }
  }

  return {
    /** Subscribe to one event type. Returns an unsubscribe function. */
    subscribe(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
      return () => listeners.get(type)?.delete(handler);
    },

    /** Subscribe to every event, regardless of type. Returns an unsubscribe function. */
    subscribeAll(handler) {
      wildcardListeners.add(handler);
      return () => wildcardListeners.delete(handler);
    },

    /** Emits an event and returns the constructed event object. */
    emit(type, payload) {
      const event = createSovereignEvent(type, payload);
      history.push(event);
      if (history.length > historyLimit) {
        history = history.slice(history.length - historyLimit);
      }
      listeners.get(type)?.forEach((handler) => notify(handler, event));
      wildcardListeners.forEach((handler) => notify(handler, event));
      return event;
    },

    /** Most recent events, oldest first. Pass a limit to get just the tail. */
    getHistory(limit) {
      return limit ? history.slice(-limit) : history.slice();
    },

    clearHistory() {
      history = [];
    },
  };
}
