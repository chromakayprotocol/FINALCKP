import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  storageKeyFor,
  savePersistedState,
  loadPersistedState,
  clearPersistedState,
  createAutosave,
} from './sovereignLocalPersistence';

function createFakeStorage() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    _store: store,
  };
}

describe('sovereignLocalPersistence', () => {
  it('round-trips state through save and load', () => {
    const storage = createFakeStorage();
    const state = { identity: { userId: 'u1' } };

    savePersistedState('u1', state, storage);
    const loaded = loadPersistedState('u1', storage);

    expect(loaded).toEqual(state);
  });

  it('namespaces the storage key per caller, not globally', () => {
    const storage = createFakeStorage();
    savePersistedState('u1', { identity: { userId: 'u1' } }, storage);
    savePersistedState('u2', { identity: { userId: 'u2' } }, storage);

    expect(loadPersistedState('u1', storage)).toEqual({ identity: { userId: 'u1' } });
    expect(loadPersistedState('u2', storage)).toEqual({ identity: { userId: 'u2' } });
    expect(storageKeyFor('u1')).not.toBe(storageKeyFor('u2'));
  });

  it('returns null when nothing has been saved yet', () => {
    const storage = createFakeStorage();
    expect(loadPersistedState('never-saved', storage)).toBeNull();
  });

  it('returns null and does not throw on corrupted JSON under our key', () => {
    const storage = createFakeStorage();
    storage.setItem(storageKeyFor('broken'), 'not valid json{{{');

    expect(loadPersistedState('broken', storage)).toBeNull();
  });

  it('discards a persisted envelope from a different storage version', () => {
    const storage = createFakeStorage();
    storage.setItem(
      storageKeyFor('old'),
      JSON.stringify({ version: 999, savedAt: 'x', state: { identity: {} } }),
    );

    expect(loadPersistedState('old', storage)).toBeNull();
  });

  it('fails soft (returns false, does not throw) when storage.setItem throws', () => {
    const storage = createFakeStorage();
    storage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => savePersistedState('full', { identity: {} }, storage)).not.toThrow();
    expect(savePersistedState('full', { identity: {} }, storage)).toBe(false);
  });

  it('clears a previously saved state', () => {
    const storage = createFakeStorage();
    savePersistedState('u1', { identity: {} }, storage);
    clearPersistedState('u1', storage);

    expect(loadPersistedState('u1', storage)).toBeNull();
  });

  it('falls back to an in-memory store when no storage is available or injected', () => {
    // No storage argument, and this test environment has no localStorage —
    // save/load should still work via the built-in memory fallback rather
    // than throwing.
    expect(() => savePersistedState('no-storage-ns', { identity: {} })).not.toThrow();
  });
});

describe('createAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces schedule() calls into a single save after the delay', () => {
    const storage = createFakeStorage();
    const autosave = createAutosave('u1', { delayMs: 500, storage });

    autosave.schedule({ identity: { level: 1 } });
    vi.advanceTimersByTime(100);
    autosave.schedule({ identity: { level: 2 } });
    vi.advanceTimersByTime(100);
    autosave.schedule({ identity: { level: 3 } });

    expect(storage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(loadPersistedState('u1', storage)).toEqual({ identity: { level: 3 } });
  });

  it('flush() saves immediately and cancels any pending debounce', () => {
    const storage = createFakeStorage();
    const autosave = createAutosave('u1', { delayMs: 500, storage });

    autosave.schedule({ identity: { level: 1 } });
    autosave.flush({ identity: { level: 2 } });

    expect(storage.setItem).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    // The cancelled schedule() must not fire a second, stale save.
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(loadPersistedState('u1', storage)).toEqual({ identity: { level: 2 } });
  });

  it('cancel() drops a pending save without writing anything', () => {
    const storage = createFakeStorage();
    const autosave = createAutosave('u1', { delayMs: 500, storage });

    autosave.schedule({ identity: { level: 1 } });
    autosave.cancel();
    vi.advanceTimersByTime(1000);

    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
