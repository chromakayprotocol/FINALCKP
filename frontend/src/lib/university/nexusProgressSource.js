/**
 * The one Supabase read behind the Nexus dashboard.
 *
 * Loads exactly the rows deriveNexusState() needs, from exactly the two
 * tables that actually persist Reclamation University learner state (see
 * nexusState.js's header for the audit of which engine writes where), and
 * reports what happened in a shape that keeps these three cases distinct:
 *
 *   - no authenticated seeker          -> { isAuthenticated: false }
 *   - authenticated, rows loaded       -> { isAuthenticated: true, rows }
 *   - authenticated, read failed       -> { isAuthenticated: true, error }
 *
 * The third case must never be collapsed into the first two. A schema that
 * has not been applied to the deployed project answers PGRST205 here, and
 * the Nexus is required to say so rather than render a plausible-looking
 * number.
 */

import { getSupabaseClient } from '../../services/supabase/client';
import { nexusTrackedModuleIds } from './nexusState';

const REC_UNI_TABLE = 'rec_uni_user_progress';
const SOVEREIGN_TABLE = 'sovereign_module_state';

/** Normalizes a Supabase/PostgREST error into something loggable and testable. */
export function toStructuredError(error, { table, stage }) {
  if (!error) return null;
  return {
    code: error.code ?? null,
    message: error.message ?? String(error),
    hint: error.hint ?? null,
    details: error.details ?? null,
    table: table ?? null,
    stage,
  };
}

/**
 * @param {Object} [options]
 * @param {Object} [options.client] injectable Supabase client (tests)
 * @returns {Promise<{
 *   isAuthenticated: boolean,
 *   progressRows: Array,
 *   sovereignRows: Array,
 *   error: Object|null,
 * }>}
 */
export async function loadNexusProgress({ client } = {}) {
  const supabase = client ?? getSupabaseClient();

  const empty = { isAuthenticated: false, progressRows: [], sovereignRows: [], error: null };

  if (!supabase) {
    return {
      ...empty,
      error: toStructuredError(
        new Error('Supabase client is not configured.'),
        { stage: 'client' }
      ),
    };
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) {
    // An expired/absent session surfaces here as an error too. Treat it as
    // signed-out rather than as a database failure: there is no seeker to
    // show state for, but nothing is broken.
    return empty;
  }

  const userId = userResult?.user?.id;
  if (!userId) return empty;

  const { recUni, sovereign } = nexusTrackedModuleIds();

  const [progressResult, sovereignResult] = await Promise.all([
    supabase.from(REC_UNI_TABLE).select('*').eq('user_id', userId).in('module_id', recUni),
    supabase.from(SOVEREIGN_TABLE).select('*').eq('user_id', userId).in('module_id', sovereign),
  ]);

  const error =
    toStructuredError(progressResult?.error, { table: REC_UNI_TABLE, stage: 'query' }) ??
    toStructuredError(sovereignResult?.error, { table: SOVEREIGN_TABLE, stage: 'query' });

  if (error) {
    return { isAuthenticated: true, progressRows: [], sovereignRows: [], error };
  }

  return {
    isAuthenticated: true,
    progressRows: progressResult?.data ?? [],
    sovereignRows: sovereignResult?.data ?? [],
    error: null,
  };
}
