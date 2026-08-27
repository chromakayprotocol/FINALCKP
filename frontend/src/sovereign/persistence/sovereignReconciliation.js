/**
 * Reconciles local Sovereign Runtime state with a fetched remote snapshot
 * (Phase 7 of the Sovereign OS migration — "Local Store + Supabase ->
 * Reconciliation" from the migration guide's Phase 7 diagram).
 *
 * Pure and framework-free by design: this is the highest-bug-risk logic in
 * the whole sync layer (concurrent edits across devices, partial remote
 * data, a brand new user with nothing remote yet), so it's kept fully
 * unit-testable without any I/O.
 *
 * Policy, by domain:
 * - curriculum.modules: whole-record adoption from whichever side was more
 *   recently active (lastActiveAt). Module fields are interdependent
 *   (currentStep vs. completedSteps vs. viewedSteps) — merging field by
 *   field could produce an incoherent record, so one side's full state
 *   wins rather than blending them.
 * - reflection.entries: per-entry, later updatedAt wins. Independent
 *   entries (different module/prompt) never conflict.
 * - concepts.selected / concepts.connections / concepts.domainMappings /
 *   synthesis: additive-only in the runtime today (no deselect/disconnect/
 *   unmap actions exist), so these are simple set-unions — there's nothing
 *   to "win," only things to keep.
 * - artifact: status-priority wins (sealed > draft > empty) so a stale
 *   replica can never silently downgrade an artifact that was already
 *   sealed elsewhere; a tie between two sealed artifacts is broken by
 *   later sealedAt; a tie between two unsealed states keeps local, since
 *   local represents this session's most recent work.
 * - identity: local's non-empty fields win — Supabase Auth, not this
 *   cache, remains the actual identity source of truth elsewhere in the
 *   app (see CLAUDE.md's auth section).
 * - media: kept local unless local has never played anything this session
 *   (currentTrackId is null), in which case remote's last-known position
 *   is used as a "resume where you left off" default. Never let a remote
 *   snapshot hijack what's actively playing right now.
 * - session: always stamped synced/lastSyncedAt now — that's the point of
 *   having just reconciled.
 */

function isEmptyValue(value) {
  return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
}

function laterOrEqualTimestampWins(candidateTimestamp, otherTimestamp) {
  if (!candidateTimestamp) return false;
  if (!otherTimestamp) return true;
  return new Date(candidateTimestamp).getTime() >= new Date(otherTimestamp).getTime();
}

function reconcileModules(localModules, remoteModules) {
  const moduleIds = new Set([...Object.keys(localModules), ...Object.keys(remoteModules)]);
  const merged = {};
  for (const moduleId of moduleIds) {
    const local = localModules[moduleId];
    const remote = remoteModules[moduleId];
    if (local && !remote) {
      merged[moduleId] = local;
    } else if (remote && !local) {
      merged[moduleId] = remote;
    } else {
      merged[moduleId] = laterOrEqualTimestampWins(local.lastActiveAt, remote.lastActiveAt) ? local : remote;
    }
  }
  return merged;
}

function reconcileReflectionEntries(localEntries, remoteEntries) {
  const keys = new Set([...Object.keys(localEntries), ...Object.keys(remoteEntries)]);
  const merged = {};
  for (const key of keys) {
    const local = localEntries[key];
    const remote = remoteEntries[key];
    if (local && !remote) {
      merged[key] = local;
    } else if (remote && !local) {
      merged[key] = remote;
    } else {
      merged[key] = laterOrEqualTimestampWins(local.updatedAt, remote.updatedAt) ? local : remote;
    }
  }
  return merged;
}

function reconcileConceptSelections(localSelected, remoteSelected) {
  const merged = [...localSelected];
  for (const conceptId of remoteSelected) {
    if (!merged.includes(conceptId)) merged.push(conceptId);
  }
  return merged;
}

function connectionFingerprint(connection) {
  return `${connection.fromConceptId}::${connection.toConceptId}::${connection.relationship}`;
}

function reconcileConnections(localConnections, remoteConnections) {
  const seen = new Map();
  for (const connection of [...localConnections, ...remoteConnections]) {
    const key = connectionFingerprint(connection);
    if (!seen.has(key)) seen.set(key, connection);
  }
  return Array.from(seen.values());
}

function domainMappingFingerprint(mapping) {
  return `${mapping.conceptId}::${mapping.domain}::${mapping.role}`;
}

function reconcileDomainMappings(localMappings, remoteMappings) {
  const seen = new Map();
  for (const mapping of [...localMappings, ...remoteMappings]) {
    const key = domainMappingFingerprint(mapping);
    if (!seen.has(key)) seen.set(key, mapping);
  }
  return Array.from(seen.values());
}

const ARTIFACT_STATUS_PRIORITY = { empty: 0, draft: 1, sealed: 2 };

function reconcileArtifact(localArtifact, remoteArtifact) {
  if (!remoteArtifact) return localArtifact;

  const localPriority = ARTIFACT_STATUS_PRIORITY[localArtifact.status] ?? 0;
  const remotePriority = ARTIFACT_STATUS_PRIORITY[remoteArtifact.status] ?? 0;

  if (remotePriority > localPriority) return remoteArtifact;
  if (localPriority > remotePriority) return localArtifact;
  if (localArtifact.status === 'sealed') {
    return laterOrEqualTimestampWins(localArtifact.sealedAt, remoteArtifact.sealedAt)
      ? localArtifact
      : remoteArtifact;
  }
  return localArtifact;
}

function reconcileIdentity(localIdentity, remoteIdentity) {
  if (!remoteIdentity) return localIdentity;
  const merged = { ...remoteIdentity };
  for (const key of Object.keys(localIdentity)) {
    if (!isEmptyValue(localIdentity[key])) {
      merged[key] = localIdentity[key];
    }
  }
  return merged;
}

function reconcileMedia(localMedia, remoteMedia) {
  if (localMedia.currentTrackId) return localMedia;
  return remoteMedia ?? localMedia;
}

/**
 * @param {import('../runtime/sovereignState').SovereignState} localState
 * @param {Object|null} remoteSnapshot - shape produced by fetchRemoteState() in sovereignSupabaseSync.js
 */
export function reconcileSovereignState(localState, remoteSnapshot) {
  const stampSynced = (session) => ({
    ...session,
    syncStatus: 'synced',
    lastSyncedAt: new Date().toISOString(),
  });

  if (!remoteSnapshot) {
    // Nothing remote yet (brand new user, or the fetch itself found no
    // rows) — local state stands as-is, just marked synced.
    return { ...localState, session: stampSynced(localState.session) };
  }

  return {
    ...localState,
    identity: reconcileIdentity(localState.identity, remoteSnapshot.identity),
    curriculum: {
      ...localState.curriculum,
      modules: reconcileModules(localState.curriculum.modules, remoteSnapshot.modules ?? {}),
    },
    media: reconcileMedia(localState.media, remoteSnapshot.media),
    reflection: {
      entries: reconcileReflectionEntries(localState.reflection.entries, remoteSnapshot.reflections ?? {}),
    },
    concepts: {
      selected: reconcileConceptSelections(localState.concepts.selected, remoteSnapshot.concepts ?? []),
      connections: reconcileConnections(localState.concepts.connections, remoteSnapshot.connections ?? []),
      domainMappings: reconcileDomainMappings(
        localState.concepts.domainMappings,
        remoteSnapshot.domainMappings ?? [],
      ),
    },
    // synthesis.protocolExecutions has no remote table yet — see the note
    // at the top of sovereignRemoteMapping.js.
    synthesis: localState.synthesis,
    artifact: reconcileArtifact(localState.artifact, remoteSnapshot.artifact),
    session: stampSynced(localState.session),
  };
}
