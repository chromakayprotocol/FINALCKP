/**
 * Supabase I/O for the Shadow Twin domain. Mirrors
 * sovereignSupabaseSync.js's shape and conventions exactly (DI'd client,
 * `{ data, error }` returns, a debounced autosave factory) but targets the
 * shadow_twins / shadow_twin_fragments tables
 * (supabase/migrations/20260909132000_create_shadow_twin_schema.sql)
 * instead of the Sovereign Runtime's own tables — see that migration's
 * header for why this is a separate persistence path rather than folded
 * into sovereign_module_state.
 */

import { getSupabaseClient } from '../../services/supabase/client';
import { shadowTwinToRow, rowToShadowTwin, fragmentsToRows, rowsToFragments } from './shadowTwinRemoteMapping';

function resolveClient(client) {
  return client ?? getSupabaseClient();
}

/**
 * Fetches the user's Shadow Twin row plus every recovered fragment, merged
 * into one ShadowTwinState-shaped object. Returns `{ data: null, error: null }`
 * (not an error) when the user has no Shadow Twin yet — that's the normal
 * first-visit case, not a failure.
 */
export async function fetchRemoteShadowTwin(userId, client) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }
  if (!userId) {
    return { data: null, error: new Error('A user id is required to fetch the Shadow Twin.') };
  }

  const { data: twinRow, error: twinError } = await supabase
    .from('shadow_twins')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (twinError) return { data: null, error: twinError };
  if (!twinRow) return { data: null, error: null };

  const { data: fragmentRows, error: fragmentError } = await supabase
    .from('shadow_twin_fragments')
    .select('*')
    .eq('shadow_twin_id', twinRow.id);
  if (fragmentError) return { data: null, error: fragmentError };

  const shadowTwin = rowToShadowTwin(twinRow);
  shadowTwin.recoveredFragments = rowsToFragments(fragmentRows ?? []);
  return { data: { shadowTwin, id: twinRow.id }, error: null };
}

/**
 * Upserts the shadow_twins row and any recovered fragments not yet on the
 * server. Fragments are additive-only (unique on shadow_twin_id +
 * fragment_key), so a plain upsert-and-ignore-duplicates is safe to call on
 * every push, same as sovereign_concepts.
 */
export async function pushRemoteShadowTwin(userId, shadowTwin, client) {
  const supabase = resolveClient(client);
  if (!supabase) return { error: new Error('Supabase client is not configured.') };
  if (!userId) return { error: new Error('A user id is required to push the Shadow Twin.') };

  // Nothing to persist yet — don't create a row before the Seeker has
  // actually started initializing a Twin.
  if (shadowTwin.status === 'empty') return { error: null };

  const { data: upserted, error: twinError } = await supabase
    .from('shadow_twins')
    .upsert(shadowTwinToRow(userId, shadowTwin), { onConflict: 'user_id' })
    .select('id')
    .single();
  if (twinError) return { error: twinError };

  if (shadowTwin.recoveredFragments.length) {
    const fragmentRows = fragmentsToRows(userId, upserted.id, shadowTwin.recoveredFragments);
    const { error: fragmentError } = await supabase
      .from('shadow_twin_fragments')
      .upsert(fragmentRows, { onConflict: 'shadow_twin_id,fragment_key', ignoreDuplicates: true });
    if (fragmentError) return { error: fragmentError };
  }

  return { error: null };
}

/**
 * A debounced remote push, identical shape to createRemoteAutosave() in
 * sovereignSupabaseSync.js: `.schedule(shadowTwin)`, `.flush(shadowTwin)`,
 * `.cancel()`.
 */
export function createShadowTwinRemoteAutosave(userId, client, { delayMs = 2000 } = {}) {
  let timer = null;

  function cancel() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    schedule(shadowTwin) {
      cancel();
      timer = setTimeout(() => {
        timer = null;
        pushRemoteShadowTwin(userId, shadowTwin, client);
      }, delayMs);
    },
    flush(shadowTwin) {
      cancel();
      return pushRemoteShadowTwin(userId, shadowTwin, client);
    },
    cancel,
  };
}
