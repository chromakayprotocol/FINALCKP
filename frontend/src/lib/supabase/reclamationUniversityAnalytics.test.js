/**
 * Regression coverage for emitAnalyticsEvent().
 *
 * A historical Vite runtime log (now archived under diagnostics/archive/)
 * recorded `supabase.from(...).insert(...).catch is not a function` from
 * this function. The current source does not use that pattern — it awaits
 * the builder and destructures `{ error }` — and a repository-wide search
 * for `.catch(` on a Supabase builder finds no remaining instance, so that
 * failure is classified as stale rather than re-fixed.
 *
 * These tests pin the behaviour that makes it stale, in both directions:
 * a successful insert must not throw, and a Supabase error must take the
 * structured warning path and leave the caller usable.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

const getSupabaseClient = vi.fn();
vi.mock('../../services/supabase/client', () => ({
  getSupabaseClient: () => getSupabaseClient(),
}));

const { emitAnalyticsEvent } = await import('./reclamationUniversity');

/**
 * A Supabase double whose insert() resolves to `{ error }` — a plain
 * promise with NO `.catch`-chaining contract beyond a thenable, exactly
 * like the real PostgREST builder.
 */
function fakeClient({ insertResult = { error: null }, userId = 'seeker-1' } = {}) {
  const insert = vi.fn(async () => insertResult);
  return {
    insert,
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })) },
    from: vi.fn(() => ({ insert })),
  };
}

let warn;
let error;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  error = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  error.mockRestore();
  getSupabaseClient.mockReset();
});

describe('emitAnalyticsEvent', () => {
  test('a successful insert resolves without throwing', async () => {
    const client = fakeClient();
    getSupabaseClient.mockReturnValue(client);

    await expect(
      emitAnalyticsEvent({
        facultySlug: 'hermetic-hall',
        moduleSlug: 'vibration',
        eventName: 'module_started',
        eventPayload: { scene: 0 },
      })
    ).resolves.toBeUndefined();

    expect(client.from).toHaveBeenCalledWith('rec_uni_events');
    expect(client.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'seeker-1',
        faculty_slug: 'hermetic-hall',
        module_slug: 'vibration',
        event_name: 'module_started',
        event_payload: { scene: 0 },
      })
    );
    expect(warn).not.toHaveBeenCalled();
  });

  test('never calls .catch() on the Supabase builder', async () => {
    // The builder double deliberately has no `.catch`. If the source ever
    // regresses to `.insert(...).catch(...)`, this rejects with the exact
    // TypeError from the archived log instead of passing.
    const insertResult = { error: null };
    const builder = {
      insert: vi.fn(() => {
        const promise = Promise.resolve(insertResult);
        return {
          then: promise.then.bind(promise),
          // no catch, no finally — a strict thenable
        };
      }),
    };
    getSupabaseClient.mockReturnValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u' } }, error: null })) },
      from: vi.fn(() => builder),
    });

    await expect(emitAnalyticsEvent({ eventName: 'module_completed' })).resolves.toBeUndefined();
  });

  test('a Supabase error warns with structure and stays non-fatal', async () => {
    const supabaseError = {
      code: 'PGRST205',
      message: "Could not find the table 'public.rec_uni_events' in the schema cache",
    };
    getSupabaseClient.mockReturnValue(fakeClient({ insertResult: { error: supabaseError } }));

    await expect(emitAnalyticsEvent({ eventName: 'module_completed' })).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith('Failed to record analytics event:', supabaseError);
  });

  test('an unconfigured Supabase client warns instead of throwing', async () => {
    getSupabaseClient.mockReturnValue(null);

    await expect(emitAnalyticsEvent({ eventName: 'module_started' })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'Supabase client is not configured. Analytics event not recorded.'
    );
  });
});
