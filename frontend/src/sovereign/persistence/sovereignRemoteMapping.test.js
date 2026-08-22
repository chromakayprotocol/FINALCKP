import { describe, expect, it } from 'vitest';
import {
  moduleStateToRow,
  rowToModuleState,
  modulesToRows,
  rowsToModules,
  reflectionEntryToRow,
  rowToReflectionEntry,
  reflectionEntriesToRows,
  rowsToReflectionEntries,
  conceptSelectionsToRows,
  rowsToConceptSelections,
  connectionToRow,
  rowToConnection,
  domainMappingToRow,
  rowToDomainMapping,
  domainMappingsToRows,
  rowsToDomainMappings,
  artifactToRow,
  rowToArtifact,
  sessionSnapshotToRow,
  rowToSessionSnapshot,
} from './sovereignRemoteMapping';
import { createModuleState, createInitialState } from '../runtime/sovereignState';

describe('sovereignRemoteMapping', () => {
  it('round-trips a module state through row conversion', () => {
    const moduleState = {
      ...createModuleState('mentalism'),
      currentStep: '02-principle',
      viewedSteps: ['01-intro', '02-principle'],
      completedSteps: ['01-intro'],
      startedAt: '2026-01-01T00:00:00.000Z',
      lastActiveAt: '2026-01-02T00:00:00.000Z',
      interactionCount: 3,
    };

    const row = moduleStateToRow('user-1', moduleState);
    expect(row.user_id).toBe('user-1');
    expect(row.module_id).toBe('mentalism');
    expect(row.viewed_steps).toEqual(['01-intro', '02-principle']);

    const restored = rowToModuleState(row);
    expect(restored).toEqual(moduleState);
  });

  it('maps a modules dict to rows and back losslessly', () => {
    const modules = {
      mentalism: { ...createModuleState('mentalism'), interactionCount: 2 },
      correspondence: { ...createModuleState('correspondence'), currentStep: '01-intro' },
    };

    const rows = modulesToRows('user-1', modules);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.user_id === 'user-1')).toBe(true);

    expect(rowsToModules(rows)).toEqual(modules);
  });

  it('round-trips a plain (recordReflection-style) entry with the new columns at their defaults', () => {
    const row = reflectionEntryToRow('user-1', {
      moduleId: 'mentalism',
      promptId: '08-reflection',
      response: 'a real reflection',
    });
    expect(row).toEqual({
      user_id: 'user-1',
      module_id: 'mentalism',
      prompt_id: '08-reflection',
      response: 'a real reflection',
      status: 'draft',
      candidate_concepts: [],
      retained_concepts: [],
      started_at: null,
      committed_at: null,
    });

    const restored = rowToReflectionEntry({ ...row, updated_at: '2026-01-01T00:00:00.000Z' });
    expect(restored).toEqual({
      moduleId: 'mentalism',
      promptId: '08-reflection',
      response: 'a real reflection',
      status: 'draft',
      candidateConcepts: [],
      retainedConcepts: [],
      startedAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
      committedAt: null,
    });
  });

  it('round-trips a structured (Phase 12) committed reflection entry', () => {
    const row = reflectionEntryToRow('user-1', {
      moduleId: 'mentalism',
      promptId: '08-reflection',
      response: 'a real reflection, edited before committing',
      status: 'committed',
      candidateConcepts: ['shadow-work', 'projection'],
      retainedConcepts: ['shadow-work'],
      startedAt: '2026-01-01T00:00:00.000Z',
      committedAt: '2026-01-01T00:05:00.000Z',
    });
    expect(row).toMatchObject({
      status: 'committed',
      candidate_concepts: ['shadow-work', 'projection'],
      retained_concepts: ['shadow-work'],
      started_at: '2026-01-01T00:00:00.000Z',
      committed_at: '2026-01-01T00:05:00.000Z',
    });

    const restored = rowToReflectionEntry({ ...row, updated_at: '2026-01-01T00:05:00.000Z' });
    expect(restored).toEqual({
      moduleId: 'mentalism',
      promptId: '08-reflection',
      response: 'a real reflection, edited before committing',
      status: 'committed',
      candidateConcepts: ['shadow-work', 'projection'],
      retainedConcepts: ['shadow-work'],
      startedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:05:00.000Z',
      committedAt: '2026-01-01T00:05:00.000Z',
    });
  });

  it('keys reconstructed reflection entries the same way the reducer does (moduleId:promptId)', () => {
    const rows = [
      { module_id: 'mentalism', prompt_id: '08-reflection', response: 'a', updated_at: 't1' },
      { module_id: 'correspondence', prompt_id: '08-reflection', response: 'b', updated_at: 't2' },
    ];
    const entries = rowsToReflectionEntries(rows);
    expect(Object.keys(entries).sort()).toEqual(['correspondence:08-reflection', 'mentalism:08-reflection']);
  });

  it('maps concept selections to rows and back as a flat id list', () => {
    const rows = conceptSelectionsToRows('user-1', ['shadow-work', 'projection']);
    expect(rows).toEqual([
      { user_id: 'user-1', concept_id: 'shadow-work' },
      { user_id: 'user-1', concept_id: 'projection' },
    ]);
    expect(rowsToConceptSelections(rows)).toEqual(['shadow-work', 'projection']);
  });

  it('round-trips a concept connection', () => {
    const row = connectionToRow('user-1', {
      fromConceptId: 'a',
      toConceptId: 'b',
      relationship: 'CAUSES',
    });
    const restored = rowToConnection({ ...row, created_at: '2026-01-01T00:00:00.000Z' });
    expect(restored).toEqual({
      fromConceptId: 'a',
      toConceptId: 'b',
      relationship: 'CAUSES',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('round-trips a concept-domain mapping', () => {
    const row = domainMappingToRow('user-1', {
      conceptId: 'shadow-work',
      domain: 'psychology',
      role: 'cause',
    });
    expect(row).toEqual({
      user_id: 'user-1',
      concept_id: 'shadow-work',
      domain: 'psychology',
      role: 'cause',
    });

    const restored = rowToDomainMapping({ ...row, mapped_at: '2026-01-01T00:00:00.000Z' });
    expect(restored).toEqual({
      conceptId: 'shadow-work',
      domain: 'psychology',
      role: 'cause',
      mappedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('maps a domain mappings list to rows and back losslessly', () => {
    const mappings = [
      { conceptId: 'shadow-work', domain: 'psychology', role: 'cause', mappedAt: '2026-01-01T00:00:00.000Z' },
      { conceptId: 'shadow-work', domain: 'culture', role: 'effect', mappedAt: '2026-01-02T00:00:00.000Z' },
    ];

    const rows = domainMappingsToRows('user-1', mappings);
    expect(rows.every((row) => row.user_id === 'user-1')).toBe(true);
    expect(rowsToDomainMappings(rows.map((row, index) => ({ ...row, mapped_at: mappings[index].mappedAt }))))
      .toEqual(mappings);
  });

  it('round-trips the artifact singleton', () => {
    const artifact = { status: 'sealed', draft: { title: 'x' }, sealedAt: '2026-01-01T00:00:00.000Z' };
    const row = artifactToRow('user-1', artifact);
    expect(rowToArtifact(row)).toEqual(artifact);
  });

  it('rowToArtifact returns null for a missing row (no artifact created yet)', () => {
    expect(rowToArtifact(null)).toBeNull();
  });

  it('round-trips the session snapshot (identity/session/media)', () => {
    const state = createInitialState();
    const row = sessionSnapshotToRow('user-1', state);
    expect(rowToSessionSnapshot(row)).toEqual({
      identity: state.identity,
      session: state.session,
      media: state.media,
    });
  });

  it('rowToSessionSnapshot returns null for a missing row (never synced before)', () => {
    expect(rowToSessionSnapshot(null)).toBeNull();
  });
});
