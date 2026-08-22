/**
 * Pure mapping between the Sovereign Runtime's in-memory state shape
 * (../runtime/sovereignState.js) and the normalized Supabase row shapes
 * defined in
 * supabase/migrations/20260822051703_create_sovereign_runtime_schema.sql.
 *
 * No I/O here — see sovereignSupabaseSync.js for that. Kept separate so the
 * field-mapping logic (the part most likely to silently drift from the
 * schema) is unit-tested without needing a network or a fake client.
 *
 * Note: synthesis.protocolExecutions has no remote table yet — Phase 6's
 * PROTOCOL_COMPLETED event only carries {protocolId, moduleId}, not the
 * full protocol payload, so reconstructing executions from the event log
 * would be lossy. Persisting them properly belongs with Phase 13's
 * Synthesis Engine, which is where "protocol decisions" are meant to live
 * per the migration guide. Until then, protocol executions are local/
 * session-only, same as the media domain is until Phase 9.
 */

export function moduleStateToRow(userId, moduleState) {
  return {
    user_id: userId,
    module_id: moduleState.moduleId,
    status: moduleState.status,
    current_step: moduleState.currentStep,
    viewed_steps: moduleState.viewedSteps,
    completed_steps: moduleState.completedSteps,
    started_at: moduleState.startedAt,
    last_active_at: moduleState.lastActiveAt,
    time_spent: moduleState.timeSpent,
    estimated_remaining: moduleState.estimatedRemaining,
    interaction_count: moduleState.interactionCount,
    synthesis_readiness: moduleState.synthesisReadiness,
    selected_concepts: moduleState.selectedConcepts,
  };
}

export function rowToModuleState(row) {
  return {
    moduleId: row.module_id,
    status: row.status,
    currentStep: row.current_step ?? null,
    viewedSteps: row.viewed_steps ?? [],
    completedSteps: row.completed_steps ?? [],
    startedAt: row.started_at ?? null,
    lastActiveAt: row.last_active_at ?? null,
    timeSpent: row.time_spent ?? 0,
    estimatedRemaining: row.estimated_remaining ?? null,
    interactionCount: row.interaction_count ?? 0,
    synthesisReadiness: row.synthesis_readiness ?? 0,
    selectedConcepts: row.selected_concepts ?? [],
  };
}

export function modulesToRows(userId, modules) {
  return Object.values(modules).map((moduleState) => moduleStateToRow(userId, moduleState));
}

export function rowsToModules(rows) {
  const modules = {};
  for (const row of rows) {
    modules[row.module_id] = rowToModuleState(row);
  }
  return modules;
}

export function reflectionEntryToRow(userId, entry) {
  return {
    user_id: userId,
    module_id: entry.moduleId,
    prompt_id: entry.promptId,
    response: entry.response ?? null,
    // Entries written by the plain recordReflection() (Phase 8's
    // whole-blob use case) never set these — default to the same values
    // the SQL column defaults use, so a round-trip through Supabase can't
    // silently drop them to something else.
    status: entry.status ?? 'draft',
    candidate_concepts: entry.candidateConcepts ?? [],
    retained_concepts: entry.retainedConcepts ?? [],
    started_at: entry.startedAt ?? null,
    committed_at: entry.committedAt ?? null,
  };
}

export function rowToReflectionEntry(row) {
  return {
    moduleId: row.module_id,
    promptId: row.prompt_id,
    response: row.response,
    status: row.status ?? 'draft',
    candidateConcepts: row.candidate_concepts ?? [],
    retainedConcepts: row.retained_concepts ?? [],
    startedAt: row.started_at ?? null,
    updatedAt: row.updated_at,
    committedAt: row.committed_at ?? null,
  };
}

export function reflectionEntriesToRows(userId, entries) {
  return Object.values(entries).map((entry) => reflectionEntryToRow(userId, entry));
}

export function rowsToReflectionEntries(rows) {
  const entries = {};
  for (const row of rows) {
    const entry = rowToReflectionEntry(row);
    entries[`${entry.moduleId}:${entry.promptId}`] = entry;
  }
  return entries;
}

export function conceptSelectionsToRows(userId, selectedConceptIds) {
  return selectedConceptIds.map((conceptId) => ({ user_id: userId, concept_id: conceptId }));
}

export function rowsToConceptSelections(rows) {
  return rows.map((row) => row.concept_id);
}

export function connectionToRow(userId, connection) {
  return {
    user_id: userId,
    from_concept_id: connection.fromConceptId,
    to_concept_id: connection.toConceptId,
    relationship: connection.relationship,
  };
}

export function rowToConnection(row) {
  return {
    fromConceptId: row.from_concept_id,
    toConceptId: row.to_concept_id,
    relationship: row.relationship,
    createdAt: row.created_at,
  };
}

export function connectionsToRows(userId, connections) {
  return connections.map((connection) => connectionToRow(userId, connection));
}

export function rowsToConnections(rows) {
  return rows.map(rowToConnection);
}

export function domainMappingToRow(userId, mapping) {
  return {
    user_id: userId,
    concept_id: mapping.conceptId,
    domain: mapping.domain,
    role: mapping.role,
  };
}

export function rowToDomainMapping(row) {
  return {
    conceptId: row.concept_id,
    domain: row.domain,
    role: row.role,
    mappedAt: row.mapped_at,
  };
}

export function domainMappingsToRows(userId, domainMappings) {
  return domainMappings.map((mapping) => domainMappingToRow(userId, mapping));
}

export function rowsToDomainMappings(rows) {
  return rows.map(rowToDomainMapping);
}

export function artifactToRow(userId, artifact) {
  return {
    user_id: userId,
    status: artifact.status,
    draft_json: artifact.draft,
    sealed_at: artifact.sealedAt,
  };
}

export function rowToArtifact(row) {
  if (!row) return null;
  return { status: row.status, draft: row.draft_json ?? null, sealedAt: row.sealed_at ?? null };
}

export function sessionSnapshotToRow(userId, state) {
  return {
    user_id: userId,
    identity_json: state.identity,
    session_json: state.session,
    media_json: state.media,
  };
}

export function rowToSessionSnapshot(row) {
  if (!row) return null;
  return {
    identity: row.identity_json ?? {},
    session: row.session_json ?? {},
    media: row.media_json ?? {},
  };
}
