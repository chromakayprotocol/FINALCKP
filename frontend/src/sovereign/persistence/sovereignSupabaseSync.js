/**
 * Supabase I/O for the Sovereign Runtime (Phase 7). Thin by design — all
 * the logic worth testing carefully lives in sovereignRemoteMapping.js
 * (field mapping) and sovereignReconciliation.js (merge policy); this file
 * just calls those and shuttles rows to/from the tables in
 * supabase/migrations/20260822051703_create_sovereign_runtime_schema.sql.
 *
 * Follows this codebase's existing convention (see
 * frontend/src/lib/supabase/reclamationUniversity.js): functions return
 * `{ data, error }` / `{ error }` rather than throwing, and the Supabase
 * client is dependency-injected (falls back to the app's shared
 * getSupabaseClient()) so this is unit-testable with a fake client.
 */

import { getSupabaseClient } from '../../services/supabase/client';
import {
  modulesToRows,
  rowsToModules,
  reflectionEntriesToRows,
  rowsToReflectionEntries,
  conceptSelectionsToRows,
  rowsToConceptSelections,
  connectionsToRows,
  rowsToConnections,
  domainMappingsToRows,
  rowsToDomainMappings,
  artifactToRow,
  rowToArtifact,
  sessionSnapshotToRow,
  rowToSessionSnapshot,
} from './sovereignRemoteMapping';

function resolveClient(client) {
  return client ?? getSupabaseClient();
}

function firstError(results) {
  return results.map((result) => result.error).find(Boolean) ?? null;
}

/**
 * Fetches everything Supabase knows about one user's Sovereign state and
 * assembles it into the snapshot shape reconcileSovereignState() expects.
 */
export async function fetchRemoteState(userId, client) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }
  if (!userId) {
    return { data: null, error: new Error('A user id is required to fetch Sovereign state.') };
  }

  const [
    sessionResult,
    moduleResult,
    reflectionResult,
    conceptResult,
    connectionResult,
    domainMappingResult,
    artifactResult,
  ] = await Promise.all([
    supabase.from('sovereign_sessions').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('sovereign_module_state').select('*').eq('user_id', userId),
    supabase.from('sovereign_reflections').select('*').eq('user_id', userId),
    supabase.from('sovereign_concepts').select('*').eq('user_id', userId),
    supabase.from('sovereign_connections').select('*').eq('user_id', userId),
    supabase.from('sovereign_domain_mappings').select('*').eq('user_id', userId),
    supabase.from('sovereign_artifacts').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const error = firstError([
    sessionResult,
    moduleResult,
    reflectionResult,
    conceptResult,
    connectionResult,
    domainMappingResult,
    artifactResult,
  ]);
  if (error) return { data: null, error };

  const sessionSnapshot = rowToSessionSnapshot(sessionResult.data);

  return {
    data: {
      identity: sessionSnapshot?.identity ?? null,
      session: sessionSnapshot?.session ?? null,
      media: sessionSnapshot?.media ?? null,
      modules: rowsToModules(moduleResult.data ?? []),
      reflections: rowsToReflectionEntries(reflectionResult.data ?? []),
      concepts: rowsToConceptSelections(conceptResult.data ?? []),
      connections: rowsToConnections(connectionResult.data ?? []),
      domainMappings: rowsToDomainMappings(domainMappingResult.data ?? []),
      artifact: rowToArtifact(artifactResult.data),
    },
    error: null,
  };
}

/**
 * Pushes the given Sovereign state to Supabase for one user. Modules and
 * reflections are upserted (they have real update semantics); concepts,
 * connections, and domain mappings are additive-only today, so duplicates
 * are ignored rather than updated; the artifact row is only written once
 * something has actually been drafted.
 */
export async function pushRemoteState(userId, state, client) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { error: new Error('Supabase client is not configured.') };
  }
  if (!userId) {
    return { error: new Error('A user id is required to push Sovereign state.') };
  }

  const moduleRows = modulesToRows(userId, state.curriculum.modules);
  const reflectionRows = reflectionEntriesToRows(userId, state.reflection.entries);
  const conceptRows = conceptSelectionsToRows(userId, state.concepts.selected);
  const connectionRows = connectionsToRows(userId, state.concepts.connections);
  const domainMappingRows = domainMappingsToRows(userId, state.concepts.domainMappings);

  const operations = [
    supabase
      .from('sovereign_sessions')
      .upsert(sessionSnapshotToRow(userId, state), { onConflict: 'user_id' }),
  ];

  if (moduleRows.length) {
    operations.push(
      supabase.from('sovereign_module_state').upsert(moduleRows, { onConflict: 'user_id,module_id' }),
    );
  }
  if (reflectionRows.length) {
    operations.push(
      supabase
        .from('sovereign_reflections')
        .upsert(reflectionRows, { onConflict: 'user_id,module_id,prompt_id' }),
    );
  }
  if (state.artifact.status !== 'empty') {
    operations.push(
      supabase
        .from('sovereign_artifacts')
        .upsert(artifactToRow(userId, state.artifact), { onConflict: 'user_id' }),
    );
  }
  if (conceptRows.length) {
    operations.push(
      supabase
        .from('sovereign_concepts')
        .upsert(conceptRows, { onConflict: 'user_id,concept_id', ignoreDuplicates: true }),
    );
  }
  if (connectionRows.length) {
    operations.push(
      supabase.from('sovereign_connections').upsert(connectionRows, {
        onConflict: 'user_id,from_concept_id,to_concept_id,relationship',
        ignoreDuplicates: true,
      }),
    );
  }
  if (domainMappingRows.length) {
    operations.push(
      supabase.from('sovereign_domain_mappings').upsert(domainMappingRows, {
        onConflict: 'user_id,concept_id,domain,role',
        ignoreDuplicates: true,
      }),
    );
  }

  const results = await Promise.all(operations);
  return { error: firstError(results) };
}

/**
 * A debounced remote push bound to one user/client, mirroring
 * createAutosave() in sovereignLocalPersistence.js: `.schedule(state)` on
 * every state change, `.flush(state)` to push immediately and cancel any
 * pending timer, `.cancel()` to drop a pending push without writing.
 * Separate from the local autosave helper since it wraps an async network
 * call with a different return shape rather than synchronous storage I/O.
 */
export function createRemoteAutosave(userId, client, { delayMs = 2000 } = {}) {
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
        pushRemoteState(userId, state, client);
      }, delayMs);
    },
    flush(state) {
      cancel();
      return pushRemoteState(userId, state, client);
    },
    cancel,
  };
}
