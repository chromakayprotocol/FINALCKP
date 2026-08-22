import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchRemoteState, pushRemoteState, createRemoteAutosave } from './sovereignSupabaseSync';
import { createInitialState, createModuleState } from '../runtime/sovereignState';

/**
 * A minimal stand-in for the subset of the supabase-js query builder this
 * sync layer actually uses: .from(table).select().eq().maybeSingle() (or
 * awaited directly for a list), and .from(table).upsert(rows, opts).
 * Real supabase-js query builders are themselves thenable, which is why
 * this fake needs a `.then()` on the list-query path.
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
          return Promise.resolve(response(table, 'upsert'));
        },
      };
    },
  };
}

describe('fetchRemoteState', () => {
  it('errors without a user id, before touching the client', async () => {
    const supabase = createFakeSupabase();
    const { data, error } = await fetchRemoteState(null, supabase);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(supabase.calls).toEqual([]);
  });

  it('assembles a full snapshot from all seven tables', async () => {
    const supabase = createFakeSupabase({
      sovereign_sessions: {
        selectSingle: {
          data: { identity_json: { userId: 'u1' }, session_json: { syncStatus: 'local' }, media_json: {} },
          error: null,
        },
      },
      sovereign_module_state: {
        select: { data: [{ module_id: 'mentalism', status: 'in_progress', viewed_steps: [], completed_steps: [] }], error: null },
      },
      sovereign_reflections: {
        select: { data: [{ module_id: 'mentalism', prompt_id: '08-reflection', response: 'x', updated_at: 't1' }], error: null },
      },
      sovereign_concepts: { select: { data: [{ concept_id: 'shadow-work' }], error: null } },
      sovereign_connections: {
        select: { data: [{ from_concept_id: 'a', to_concept_id: 'b', relationship: 'CAUSES', created_at: 't1' }], error: null },
      },
      sovereign_domain_mappings: {
        select: { data: [{ concept_id: 'shadow-work', domain: 'psychology', role: 'cause', mapped_at: 't1' }], error: null },
      },
      sovereign_artifacts: {
        selectSingle: {
          data: { status: 'sealed', draft_json: { title: 'x' }, revisions_json: [], sealed_at: 't1' },
          error: null,
        },
      },
    });

    const { data, error } = await fetchRemoteState('u1', supabase);

    expect(error).toBeNull();
    expect(data.identity).toEqual({ userId: 'u1' });
    expect(data.modules.mentalism.status).toBe('in_progress');
    expect(data.reflections['mentalism:08-reflection'].response).toBe('x');
    expect(data.concepts).toEqual(['shadow-work']);
    expect(data.connections).toEqual([{ fromConceptId: 'a', toConceptId: 'b', relationship: 'CAUSES', createdAt: 't1' }]);
    expect(data.domainMappings).toEqual([{ conceptId: 'shadow-work', domain: 'psychology', role: 'cause', mappedAt: 't1' }]);
    expect(data.artifact).toEqual({ status: 'sealed', draft: { title: 'x' }, revisions: [], sealedAt: 't1' });

    // Every query was scoped to this user.
    expect(supabase.calls.every((call) => call.op !== 'select' || call.value === 'u1')).toBe(true);
  });

  it('returns null domains (not a thrown error) for a brand new user with no rows anywhere', async () => {
    const supabase = createFakeSupabase();
    const { data, error } = await fetchRemoteState('new-user', supabase);

    expect(error).toBeNull();
    expect(data.identity).toBeNull();
    expect(data.modules).toEqual({});
    expect(data.reflections).toEqual({});
    expect(data.concepts).toEqual([]);
    expect(data.domainMappings).toEqual([]);
    expect(data.artifact).toBeNull();
  });

  it('surfaces the first error encountered instead of silently dropping partial data', async () => {
    const boom = new Error('network down');
    const supabase = createFakeSupabase({
      sovereign_module_state: { select: { data: null, error: boom } },
    });

    const { data, error } = await fetchRemoteState('u1', supabase);
    expect(data).toBeNull();
    expect(error).toBe(boom);
  });
});

describe('pushRemoteState', () => {
  it('errors without a user id, before touching the client', async () => {
    const supabase = createFakeSupabase();
    const { error } = await pushRemoteState(null, createInitialState(), supabase);

    expect(error).toBeInstanceOf(Error);
    expect(supabase.calls).toEqual([]);
  });

  it('always upserts the session snapshot, even for an otherwise-empty state', async () => {
    const supabase = createFakeSupabase();
    await pushRemoteState('u1', createInitialState(), supabase);

    const sessionCall = supabase.calls.find((call) => call.table === 'sovereign_sessions');
    expect(sessionCall).toBeDefined();
    expect(sessionCall.payload.user_id).toBe('u1');
  });

  it('skips writing modules/reflections/concepts/connections/artifact when there is nothing to write', async () => {
    const supabase = createFakeSupabase();
    await pushRemoteState('u1', createInitialState(), supabase);

    const tablesWritten = supabase.calls.map((call) => call.table);
    expect(tablesWritten).toEqual(['sovereign_sessions']);
  });

  it('upserts module state with the compound conflict target so repeat pushes update in place', async () => {
    const supabase = createFakeSupabase();
    const state = {
      ...createInitialState(),
      curriculum: { activeModuleId: 'mentalism', modules: { mentalism: createModuleState('mentalism') } },
    };

    await pushRemoteState('u1', state, supabase);

    const moduleCall = supabase.calls.find((call) => call.table === 'sovereign_module_state');
    expect(moduleCall.opts).toEqual({ onConflict: 'user_id,module_id' });
    expect(moduleCall.payload).toHaveLength(1);
  });

  it('only writes the artifact row once something has actually been drafted', async () => {
    const supabase = createFakeSupabase();
    await pushRemoteState('u1', { ...createInitialState(), artifact: { status: 'draft', draft: { title: 'x' }, sealedAt: null } }, supabase);

    expect(supabase.calls.some((call) => call.table === 'sovereign_artifacts')).toBe(true);
  });

  it('upserts connections, concepts, and domain mappings with ignoreDuplicates so repeat pushes never accumulate rows', async () => {
    const supabase = createFakeSupabase();
    const state = {
      ...createInitialState(),
      concepts: {
        selected: ['shadow-work'],
        connections: [{ fromConceptId: 'a', toConceptId: 'b', relationship: 'CAUSES', createdAt: 't1' }],
        domainMappings: [{ conceptId: 'shadow-work', domain: 'psychology', role: 'cause', mappedAt: 't1' }],
      },
    };

    await pushRemoteState('u1', state, supabase);

    const conceptCall = supabase.calls.find((call) => call.table === 'sovereign_concepts');
    const connectionCall = supabase.calls.find((call) => call.table === 'sovereign_connections');
    const domainMappingCall = supabase.calls.find((call) => call.table === 'sovereign_domain_mappings');
    expect(conceptCall.opts).toMatchObject({ ignoreDuplicates: true });
    expect(connectionCall.opts).toMatchObject({
      ignoreDuplicates: true,
      onConflict: 'user_id,from_concept_id,to_concept_id,relationship',
    });
    expect(domainMappingCall.opts).toMatchObject({
      ignoreDuplicates: true,
      onConflict: 'user_id,concept_id,domain,role',
    });
  });

  it('surfaces an error from any one operation without throwing', async () => {
    const boom = new Error('write failed');
    const supabase = createFakeSupabase({ sovereign_sessions: { upsert: { data: null, error: boom } } });

    const { error } = await pushRemoteState('u1', createInitialState(), supabase);
    expect(error).toBe(boom);
  });
});

describe('createRemoteAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces schedule() calls into a single push after the delay', () => {
    const supabase = createFakeSupabase();
    const autosave = createRemoteAutosave('u1', supabase, { delayMs: 2000 });

    autosave.schedule(createInitialState());
    vi.advanceTimersByTime(500);
    autosave.schedule(createInitialState());
    vi.advanceTimersByTime(500);
    autosave.schedule(createInitialState());

    expect(supabase.calls).toEqual([]);

    vi.advanceTimersByTime(2000);

    const sessionCalls = supabase.calls.filter((call) => call.table === 'sovereign_sessions');
    expect(sessionCalls).toHaveLength(1);
  });

  it('flush() pushes immediately and cancels any pending debounce', async () => {
    const supabase = createFakeSupabase();
    const autosave = createRemoteAutosave('u1', supabase, { delayMs: 2000 });

    autosave.schedule(createInitialState());
    await autosave.flush(createInitialState());

    vi.advanceTimersByTime(5000);

    const sessionCalls = supabase.calls.filter((call) => call.table === 'sovereign_sessions');
    expect(sessionCalls).toHaveLength(1);
  });

  it('cancel() drops a pending push without writing anything', () => {
    const supabase = createFakeSupabase();
    const autosave = createRemoteAutosave('u1', supabase, { delayMs: 2000 });

    autosave.schedule(createInitialState());
    autosave.cancel();
    vi.advanceTimersByTime(5000);

    expect(supabase.calls).toEqual([]);
  });
});
