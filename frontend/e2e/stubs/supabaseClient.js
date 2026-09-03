/**
 * Harness stub for the Supabase singleton.
 *
 * Returns a fixed, fully-populated learner state so the viewport tests
 * exercise the widest possible rendering (three-digit percentages, the
 * longest dock readouts) rather than a sparse one. `?state=` on the harness
 * URL selects a scenario: `ready` (default), `signed-out`, or `error`.
 */

const params = new URLSearchParams(globalThis.location?.search ?? '');
const scenario = params.get('state') ?? 'ready';

const HERMETIC_SLUGS = [
  'mentalism',
  'correspondence',
  'vibration',
  'polarity',
  'rhythm',
  'cause-and-effect',
  'gender',
];

const ROWS = {
  rec_uni_user_progress: [{ module_id: 'module-fractured-veil', status: 'completed' }],
  sovereign_module_state: [
    ...HERMETIC_SLUGS.map((slug) => ({ module_id: `hermetic-hall/${slug}`, status: 'completed' })),
    { module_id: 'reflection-chamber/owned-interior', status: 'completed' },
  ],
};

const SCHEMA_ERROR = {
  code: 'PGRST205',
  message: "Could not find the table 'public.rec_uni_user_progress' in the schema cache",
};

export function getSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({
        data: { user: scenario === 'signed-out' ? null : { id: 'harness-seeker' } },
        error: null,
      }),
    },
    from: (table) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () =>
          Promise.resolve(
            scenario === 'error'
              ? { data: null, error: SCHEMA_ERROR }
              : { data: ROWS[table] ?? [], error: null }
          ),
      };
      return builder;
    },
  };
}

export function validateSupabaseConfiguration() {
  return { isValid: true, issues: [], usesBundledFallback: false };
}
