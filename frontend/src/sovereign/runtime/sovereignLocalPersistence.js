/**
 * Sovereign Runtime — local-first autosave (Phase 5 of the Sovereign OS
 * migration).
 *
 * Debounced persistence to localStorage so a refresh or closed tab never
 * loses a reflection, a declaration in progress, or any other Sovereign
 * state. This is deliberately local-only — Phase 7 adds Supabase sync and
 * reconciliation on top of this, it does not replace it.
 *
 * Storage is dependency-injected (falls back to `globalThis.localStorage`,
 * then an in-memory stub) so this stays unit-testable without a DOM, and so
 * a browser with storage disabled (private mode, quota exceeded) degrades
 * to "no local persistence" instead of crashing the app.
 */

const STORAGE_VERSION = 1;

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return createMemoryStorage();
}

/**
 * `namespace` should be scoped to the signed-in user once identity is
 * wired up (Phase 7) — a bare namespace like "default" would otherwise let
 * two accounts on the same shared browser see each other's local state.
 */
export function storageKeyFor(namespace) {
  return `sovereign:${namespace}:v${STORAGE_VERSION}`;
}

export function savePersistedState(namespace, state, storage) {
  const target = resolveStorage(storage);
  const envelope = { version: STORAGE_VERSION, savedAt: new Date().toISOString(), state };
  try {
    target.setItem(storageKeyFor(namespace), JSON.stringify(envelope));
    return true;
  } catch {
    // Storage full, disabled (private browsing), or unavailable — local
    // autosave is a resilience layer, not a hard requirement. Fail soft.
    return false;
  }
}

export function loadPersistedState(namespace, storage) {
  const target = resolveStorage(storage);
  try {
    const raw = target.getItem(storageKeyFor(namespace));
    if (!raw) return null;
    const envelope = JSON.parse(raw);
    if (!envelope || envelope.version !== STORAGE_VERSION || !envelope.state) return null;
    return envelope.state;
  } catch {
    // Corrupted/foreign JSON under our key — treat as "nothing to restore"
    // rather than crashing the app on boot.
    return null;
  }
}

export function clearPersistedState(namespace, storage) {
  const target = resolveStorage(storage);
  try {
    target.removeItem(storageKeyFor(namespace));
    return true;
  } catch {
    return false;
  }
}

/**
 * A debounced save bound to one namespace/storage.
 * - `schedule(state)` on every state change — resets the timer.
 * - `flush(state)` saves immediately and cancels any pending timer (use on
 *   beforeunload/unmount so the last few hundred ms of edits aren't lost).
 * - `cancel()` drops any pending save without writing.
 */
export function createAutosave(namespace, { delayMs = 500, storage } = {}) {
  let timer = null;

  function cancel() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    schedule(state) {
      cancel();
      timer = setTimeout(() => {
        timer = null;
        savePersistedState(namespace, state, storage);
      }, delayMs);
    },
    flush(state) {
      cancel();
      savePersistedState(namespace, state, storage);
    },
    cancel,
  };
}
