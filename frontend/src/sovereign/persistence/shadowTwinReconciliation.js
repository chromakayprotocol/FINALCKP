/**
 * Reconciles local Shadow Twin state (restored from localStorage by
 * sovereignLocalPersistence.js, since `shadowTwin` is part of the unified
 * Sovereign state tree — see sovereignState.js) with whatever Supabase
 * actually has (shadowTwinSupabaseSync.js's fetchRemoteShadowTwin()).
 *
 * Same reason this exists as sovereignReconciliation.js: local can be a
 * stale replica (an old tab, a different device, a session that closed
 * mid-generation) — Supabase is the cross-device source of truth for the
 * Twin's own record, but a local record that's genuinely further along
 * (e.g. this tab just finished generating and the debounced push hasn't
 * landed yet) must never be regressed by an in-flight fetch that started
 * before it. Progress is ranked by MATERIALIZATION_ORDER; recovered
 * fragments are always a union (additive-only, same as concepts/
 * connections in sovereignReconciliation.js) since a fragment recovered on
 * one device is real regardless of which device's record "wins."
 */

import { MATERIALIZATION_ORDER } from '../runtime/sovereignState';

function materializationRank(materializationState) {
  if (!materializationState) return -1;
  const index = MATERIALIZATION_ORDER.indexOf(materializationState);
  return index;
}

function unionFragments(localFragments, remoteFragments) {
  const seen = new Map();
  for (const fragment of [...localFragments, ...remoteFragments]) {
    if (!seen.has(fragment.id)) seen.set(fragment.id, fragment);
  }
  return Array.from(seen.values());
}

/**
 * @param {import('../runtime/sovereignState').ShadowTwinState} localShadowTwin
 * @param {import('../runtime/sovereignState').ShadowTwinState|null} remoteShadowTwin
 */
export function reconcileShadowTwinState(localShadowTwin, remoteShadowTwin) {
  if (!remoteShadowTwin) return localShadowTwin;

  const localRank = materializationRank(localShadowTwin.materializationState);
  const remoteRank = materializationRank(remoteShadowTwin.materializationState);
  const winner = remoteRank > localRank ? remoteShadowTwin : localShadowTwin;

  return {
    ...winner,
    recoveredFragments: unionFragments(
      localShadowTwin.recoveredFragments,
      remoteShadowTwin.recoveredFragments,
    ),
  };
}
