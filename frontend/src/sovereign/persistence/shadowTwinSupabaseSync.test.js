import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchRemoteShadowTwin,
  pushRemoteShadowTwin,
  createShadowTwinRemoteAutosave,
} from './shadowTwinSupabaseSync';
import { createShadowTwinState } from '../runtime/sovereignState';

/**
 * Minimal fake covering exactly the query shapes this sync layer issues:
 * .from(table).select().eq().maybeSingle() / .eq() (awaited directly), and
 * .from(table).upsert(rows, opts).select('id').single() for shadow_twins,
 * .from(table).upsert(rows, opts) for fragments. Same convention as
 * sovereignSupabaseSync.test.js's fake.
 */
function createFakeSupabase(responsesByTable = {}) {
  const calls = [];

  function response(table, op) {
    const entry = responsesByTable[table]?.[op];
    if (entry) return entry;
    return op === 'select' ? { data: [], error: null } : { data: null, error: null };
  }

  function makeSelectQuery(table) {
    const query = {
      eq(column, value) {
        calls.push({ table, op: 'select', column, value });
        return query;
      },
      maybeSingle() {
        return Promise.resolve(response(table, 'selectSingle'));
      },
      then(onFulfilled, onRejected) {
        return Promise.resolve(response(table, 'select')).then(onFulfilled, onRejected);
      },
    };
    return query;
  }

  return {
    calls,
    from(table) {
      return {
        select() {
          return makeSelectQuery(table);
        },
        upsert(payload, opts) {
          calls.push({ table, op: 'upsert', payload, opts });
          return {
            select() {
              return {
                single() {
                  return Promise.resolve(response(table, 'upsertSingle'));
                },
              };
            },
            then(onFulfilled, onRejected) {
              return Promise.resolve(response(table, 'upsert')).then(onFulfilled, onRejected);
            },
          };
        },
      };
    },
  };
}

describe('fetchRemoteShadowTwin', () => {
  it('errors without a user id, before touching the client', async () => {
    const supabase = createFakeSupabase();
    const { data, error } = await fetchRemoteShadowTwin(null, supabase);
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(supabase.calls).toEqual([]);
  });

  it('returns null data (not an error) when the user has no Twin yet', async () => {
    const supabase = createFakeSupabase({ shadow_twins: { selectSingle: { data: null, error: null } } });
    const { data, error } = await fetchRemoteShadowTwin('u1', supabase);
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('assembles the Twin plus its fragments', async () => {
    const supabase = createFakeSupabase({
      shadow_twins: {
        selectSingle: {
          data: {
            id: 'twin-1',
            status: 'ready',
            source_image_path: 'shadow-twins/u1/source/a.png',
            canonical_image_path: 'shadow-twins/u1/canonical/a.png',
            materialization_state: 'PRESENCE',
            visual_coherence: 0.6,
            portal_progression_json: { recognition: true, confrontation: true, dialogue: true, integration: false, transformation: false },
            integration_state: 'unresolved',
          },
          error: null,
        },
      },
      shadow_twin_fragments: {
        select: {
          data: [
            { fragment_key: 'a', portal_id: 'recognition', fragment_type: 'facial', source_region_json: {}, visual_weight: 0.2, unlocked_at: 't1' },
          ],
          error: null,
        },
      },
    });

    const { data, error } = await fetchRemoteShadowTwin('u1', supabase);
    expect(error).toBeNull();
    expect(data.id).toBe('twin-1');
    expect(data.shadowTwin.status).toBe('ready');
    expect(data.shadowTwin.materializationState).toBe('PRESENCE');
    expect(data.shadowTwin.recoveredFragments).toHaveLength(1);
    expect(data.shadowTwin.recoveredFragments[0].id).toBe('a');
  });

  it('propagates a Twin-row fetch error without querying fragments', async () => {
    const supabase = createFakeSupabase({
      shadow_twins: { selectSingle: { data: null, error: new Error('boom') } },
    });
    const { data, error } = await fetchRemoteShadowTwin('u1', supabase);
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(supabase.calls.some((call) => call.table === 'shadow_twin_fragments')).toBe(false);
  });
});

describe('pushRemoteShadowTwin', () => {
  it('is a no-op while the Twin is still empty (no row created before upload starts)', async () => {
    const supabase = createFakeSupabase();
    const { error } = await pushRemoteShadowTwin('u1', createShadowTwinState(), supabase);
    expect(error).toBeNull();
    expect(supabase.calls).toEqual([]);
  });

  it('upserts the Twin row and any recovered fragments', async () => {
    const supabase = createFakeSupabase({
      shadow_twins: { upsertSingle: { data: { id: 'twin-1' }, error: null } },
    });
    const shadowTwin = {
      ...createShadowTwinState(),
      status: 'ready',
      canonicalImage: { path: 'p', generatedAt: 't' },
      recoveredFragments: [
        { id: 'a', type: 'facial', sourceRegion: {}, portalId: 'recognition', visualWeight: 0.2, unlockedAt: 't1' },
      ],
    };

    const { error } = await pushRemoteShadowTwin('u1', shadowTwin, supabase);
    expect(error).toBeNull();

    const twinUpsert = supabase.calls.find((call) => call.table === 'shadow_twins' && call.op === 'upsert');
    expect(twinUpsert.opts).toEqual({ onConflict: 'user_id' });

    const fragmentUpsert = supabase.calls.find((call) => call.table === 'shadow_twin_fragments' && call.op === 'upsert');
    expect(fragmentUpsert.payload).toHaveLength(1);
    expect(fragmentUpsert.payload[0].shadow_twin_id).toBe('twin-1');
    expect(fragmentUpsert.opts).toEqual({ onConflict: 'shadow_twin_id,fragment_key', ignoreDuplicates: true });
  });
});

describe('createShadowTwinRemoteAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces schedule() and pushes once after the delay', async () => {
    const supabase = createFakeSupabase({ shadow_twins: { upsertSingle: { data: { id: 'twin-1' }, error: null } } });
    const autosave = createShadowTwinRemoteAutosave('u1', supabase, { delayMs: 1000 });
    const shadowTwin = { ...createShadowTwinState(), status: 'ready', canonicalImage: { path: 'p' } };

    autosave.schedule(shadowTwin);
    autosave.schedule(shadowTwin);
    expect(supabase.calls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(supabase.calls.filter((call) => call.op === 'upsert')).toHaveLength(1);
  });

  it('flush() pushes immediately and cancels any pending timer', async () => {
    const supabase = createFakeSupabase({ shadow_twins: { upsertSingle: { data: { id: 'twin-1' }, error: null } } });
    const autosave = createShadowTwinRemoteAutosave('u1', supabase, { delayMs: 1000 });
    const shadowTwin = { ...createShadowTwinState(), status: 'ready', canonicalImage: { path: 'p' } };

    autosave.schedule(shadowTwin);
    await autosave.flush(shadowTwin);
    expect(supabase.calls.filter((call) => call.op === 'upsert')).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(supabase.calls.filter((call) => call.op === 'upsert')).toHaveLength(1);
  });
});
