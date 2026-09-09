/**
 * Pure mapping between the Shadow Twin domain's in-memory shape
 * (../runtime/sovereignState.js's ShadowTwinState) and the normalized
 * Supabase row shapes defined in
 * supabase/migrations/20260909132000_create_shadow_twin_schema.sql.
 *
 * Kept separate from shadowTwinSupabaseSync.js for the same reason
 * sovereignRemoteMapping.js is kept separate from sovereignSupabaseSync.js:
 * no I/O here, so the field-mapping logic is unit-tested without a network
 * or a fake client.
 */

export function shadowTwinToRow(userId, shadowTwin) {
  return {
    user_id: userId,
    status: shadowTwin.status,
    source_image_path: shadowTwin.sourceImage?.path ?? null,
    canonical_image_path: shadowTwin.canonicalImage?.path ?? null,
    generation_prompt_version: shadowTwin.generationPromptVersion,
    generation_status: shadowTwin.status,
    materialization_state: shadowTwin.materializationState,
    visual_coherence: shadowTwin.visualCoherence,
    portal_progression_json: shadowTwin.portalProgression,
    integration_state: shadowTwin.integrationState,
    visual_identity_seed: shadowTwin.visualIdentitySeed,
    error: shadowTwin.error,
    generated_at: shadowTwin.generatedAt,
  };
}

export function rowToShadowTwin(row) {
  if (!row) return null;
  return {
    status: row.status,
    sourceImage: row.source_image_path ? { path: row.source_image_path, uploadedAt: row.created_at } : null,
    canonicalImage: row.canonical_image_path
      ? { path: row.canonical_image_path, generatedAt: row.generated_at }
      : null,
    generationPromptVersion: row.generation_prompt_version ?? null,
    generatedAt: row.generated_at ?? null,
    materializationState: row.materialization_state ?? null,
    visualCoherence: row.visual_coherence ?? 0,
    portalProgression: {
      recognition: false,
      confrontation: false,
      dialogue: false,
      integration: false,
      transformation: false,
      ...(row.portal_progression_json ?? {}),
    },
    integrationState: row.integration_state ?? 'unresolved',
    visualIdentitySeed: row.visual_identity_seed ?? null,
    error: row.error ?? null,
    // recoveredFragments is populated separately from the fragments table
    // (see rowsToFragments below) — a shadow_twins row alone doesn't carry them.
    recoveredFragments: [],
  };
}

export function fragmentToRow(userId, shadowTwinId, fragment) {
  return {
    shadow_twin_id: shadowTwinId,
    user_id: userId,
    fragment_key: fragment.id,
    portal_id: fragment.portalId,
    fragment_type: fragment.type,
    source_region_json: fragment.sourceRegion ?? {},
    visual_weight: fragment.visualWeight ?? 0,
    unlocked_at: fragment.unlockedAt,
  };
}

export function fragmentsToRows(userId, shadowTwinId, fragments) {
  return fragments.map((fragment) => fragmentToRow(userId, shadowTwinId, fragment));
}

export function rowToFragment(row) {
  return {
    id: row.fragment_key,
    portalId: row.portal_id,
    type: row.fragment_type,
    sourceRegion: row.source_region_json ?? {},
    visualWeight: row.visual_weight ?? 0,
    unlockedAt: row.unlocked_at,
  };
}

export function rowsToFragments(rows) {
  return rows.map(rowToFragment);
}
