/**
 * Regression coverage for the deployed-schema verifier's classifier.
 *
 * This exists because of a live false pass: an egress proxy answering
 * `403 text/plain` to CONNECT was read as "table exists, RLS denied the
 * read", and the check reported a fully green schema for a Supabase project
 * it had never reached. A verification gate that passes when it did not
 * verify anything is worse than no gate, so the classification is pinned
 * here rather than left to the script's own runtime.
 */

import { describe, test, expect } from 'vitest';
import {
  REQUIRED_TABLES,
  SCHEMA_CACHE_MISS,
  classifyResponse,
  evaluateTable,
  validateReflectionChamberRows,
  validateReflectionStages,
} from '../../../scripts/verify-supabase-schema.mjs';

const response = (status, contentType) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: { get: (name) => (name === 'content-type' ? contentType : null) },
});

describe('classifyResponse', () => {
  test('a JSON array is a successful PostgREST read', () => {
    expect(classifyResponse(response(200, 'application/json'), '[]')).toEqual({
      kind: 'rows',
      payload: [],
    });
  });

  test('a JSON error object is a PostgREST error', () => {
    const body = JSON.stringify({ code: 'PGRST205', message: 'nope' });
    expect(classifyResponse(response(404, 'application/json'), body).kind).toBe('postgrest-error');
  });

  test('a text/plain 403 from a proxy is NOT a PostgREST response', () => {
    const classified = classifyResponse(response(403, 'text/plain; charset=utf-8'), 'Forbidden');
    expect(classified.kind).toBe('not-postgrest');
    expect(classified.detail).toContain('text/plain');
  });

  test('an HTML error page is NOT a PostgREST response', () => {
    const classified = classifyResponse(response(502, 'text/html'), '<html>Bad Gateway</html>');
    expect(classified.kind).toBe('not-postgrest');
  });

  test('a response with no content-type is NOT a PostgREST response', () => {
    expect(classifyResponse(response(403, null), '').kind).toBe('not-postgrest');
  });

  test('JSON of an unrecognised shape is NOT treated as a PostgREST answer', () => {
    const classified = classifyResponse(response(200, 'application/json'), '{"anything":1}');
    expect(classified.kind).toBe('not-postgrest');
  });
});

describe('evaluateTable', () => {
  test('rows returned → pass', () => {
    const result = evaluateTable('rec_uni_user_progress', response(200, 'application/json'), '[]');
    expect(result.ok).toBe(true);
  });

  test('a PostgREST 401/403 → pass, because RLS denying an anon read proves the table exists', () => {
    const body = JSON.stringify({ message: 'permission denied for table rec_uni_user_progress' });
    for (const status of [401, 403]) {
      const result = evaluateTable(
        'rec_uni_user_progress',
        response(status, 'application/json'),
        body
      );
      expect(result.ok).toBe(true);
      expect(result.label).toContain('RLS denied');
    }
  });

  test('PGRST205 → fail, naming both possible causes', () => {
    const body = JSON.stringify({
      code: SCHEMA_CACHE_MISS,
      message: "Could not find the table 'public.rec_uni_user_progress' in the schema cache",
    });
    const result = evaluateTable('rec_uni_user_progress', response(404, 'application/json'), body);
    expect(result.ok).toBe(false);
    expect(result.problem).toContain('migration has not been applied');
    expect(result.problem).toContain('schema reload');
  });

  test('a proxy 403 → FAIL, never a pass', () => {
    const result = evaluateTable(
      'rec_uni_user_progress',
      response(403, 'text/plain'),
      'Forbidden'
    );
    expect(result.ok).toBe(false);
    expect(result.problem).toContain('NOT evidence the table exists');
  });
});

describe('required table list', () => {
  test('covers the Reclamation University runtime schema', () => {
    for (const table of [
      'rec_uni_faculties',
      'rec_uni_modules',
      'rec_uni_user_progress',
      'rec_uni_module_responses',
      'rec_uni_journal_entries',
      'rec_uni_events',
      'rec_uni_certificates',
    ]) {
      expect(REQUIRED_TABLES).toContain(table);
    }
  });

  test('also covers sovereign_module_state, which backs two of the four Nexus tracks', () => {
    expect(REQUIRED_TABLES).toContain('sovereign_module_state');
  });

  test('covers the two authoritative Reflection Chamber production tables', () => {
    expect(REQUIRED_TABLES).toContain('act_two_sonic_artifacts');
    expect(REQUIRED_TABLES).toContain('act_two_stages');
  });
});

describe('Reflection Chamber production-master validation', () => {
  test('accepts exactly 20 populated artifacts ordered 1..20', () => {
    const rows = Array.from({ length: 20 }, (_, index) => ({
      chamber_order: index + 1,
      stage_number: Math.min(5, Math.floor(index / 4) + 1),
      what_you_bring: 'present',
      shadow_code_quote: 'present',
      light_code_quote: 'present',
      make_the_turn: 'present',
      life_domains: ['Relationships'],
      where_this_shows_up: 'present',
      jungian_lens: 'present',
      reflection_title: 'present',
      reflection_prompt: 'present',
      movement_criteria: 'present',
      handoff: 'present',
      source_edition: '2026',
    }));

    expect(validateReflectionChamberRows(rows)).toEqual({ ok: true });
    expect(validateReflectionChamberRows(rows.slice(0, 19)).ok).toBe(false);
    expect(validateReflectionChamberRows(rows.map((row, index) => (
      index === 0 ? { ...row, reflection_prompt: null } : row
    ))).ok).toBe(false);
  });

  test('accepts exactly five complete stage definitions', () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({
      stage_number: index + 1,
      stage_name: 'Stage',
      core_question: 'Question',
      stage_intent: 'Intent',
      gate_question: 'Gate',
    }));

    expect(validateReflectionStages(rows)).toEqual({ ok: true });
    expect(validateReflectionStages(rows.slice(0, 4)).ok).toBe(false);
  });
});
