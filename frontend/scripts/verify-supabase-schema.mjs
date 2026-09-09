/**
 * Deployed Supabase schema verification (credential-free).
 *
 * A migration file existing in `supabase/migrations/` is not evidence that
 * the deployed project has the table. PostgREST answers PGRST205 —
 * "Could not find the table 'public.<name>' in the schema cache" — for both
 * "never migrated" and "migrated but the schema cache is stale", and the
 * only way to tell the app's real production state is to ask the deployed
 * endpoint.
 *
 * This check uses ONLY the publishable/anon key that already ships in the
 * browser bundle. It never uses (and must never be given) a service-role
 * key: it asserts that each required table is *exposed by PostgREST*, not
 * that it can read anyone's rows. Row-level security is expected to be on;
 * a PostgREST 401/403 for a table means RLS is doing its job and counts as
 * a pass. PGRST205, a 404, an unreachable endpoint, or a response that
 * isn't PostgREST's at all are failures.
 *
 * Env (either spelling):
 *   SUPABASE_URL              / VITE_SUPABASE_URL
 *   SUPABASE_PUBLISHABLE_KEY  / VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * Run: `npm run verify:supabase --prefix frontend`
 *
 * Importing this module runs nothing — `classifyResponse` is unit-tested in
 * verifySupabaseSchema.test.js.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const REQUIRED_TABLES = [
  'rec_uni_faculties',
  'rec_uni_modules',
  'rec_uni_user_progress',
  'rec_uni_module_responses',
  'rec_uni_journal_entries',
  'rec_uni_events',
  'rec_uni_certificates',
  // The Nexus's Hermetic Hall and Reflection Protocol percentages are
  // derived from this one, so a check that only covers rec_uni_* is not
  // actually checking the Nexus's own data path.
  'sovereign_module_state',
  // Act II's Shadow Twin (supabase/migrations/20260909132000_create_shadow_twin_schema.sql).
  // Added after a real gap: the migration file existed and the frontend
  // code merged and deployed, but the migration itself was never applied
  // to the live project, so the feature was silently non-functional in
  // production with nothing catching it. This is exactly the class of
  // failure this whole script exists to catch.
  'shadow_twins',
  'shadow_twin_fragments',
];

export const SCHEMA_CACHE_MISS = 'PGRST205';

/**
 * Distinguishes a real PostgREST answer from something else that merely
 * returned an HTTP status — a proxy, a captive portal, a WAF, a CDN error
 * page.
 *
 * This function exists because of a live false pass: an egress proxy that
 * answers `403 text/plain` to CONNECT was read as "table exists, RLS denied
 * the read", and the check reported a fully green schema for an endpoint it
 * had never reached. Status codes alone cannot be trusted here.
 *
 * PostgREST always answers JSON: an array on a successful select, an object
 * carrying `message`/`code`/`hint`/`details` on an error.
 *
 * @returns {{kind: 'rows', payload: Array}
 *          |{kind: 'postgrest-error', payload: Object}
 *          |{kind: 'not-postgrest', detail: string}}
 */
export function classifyResponse(response, body) {
  const contentType = response.headers?.get?.('content-type') ?? '';

  if (!contentType.includes('json')) {
    return {
      kind: 'not-postgrest',
      detail: `HTTP ${response.status}, content-type: ${contentType || 'none'}`,
    };
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return {
      kind: 'not-postgrest',
      detail: `HTTP ${response.status}, unparseable JSON body`,
    };
  }

  if (Array.isArray(payload)) return { kind: 'rows', payload };

  if (payload && typeof payload === 'object' && ('message' in payload || 'code' in payload)) {
    return { kind: 'postgrest-error', payload };
  }

  return { kind: 'not-postgrest', detail: `HTTP ${response.status}, unrecognised JSON shape` };
}

/** Classifies one table's response into a pass or a described failure. */
export function evaluateTable(table, response, body) {
  const classified = classifyResponse(response, body);

  if (classified.kind === 'not-postgrest') {
    return {
      ok: false,
      label: `not a PostgREST response: ${classified.detail}`,
      problem:
        `${table}: not a PostgREST response (${classified.detail}). The request did ` +
        'not reach Supabase; this is NOT evidence the table exists.',
    };
  }

  if (classified.kind === 'rows') {
    return {
      ok: true,
      label: `HTTP ${response.status} — exposed, ${classified.payload.length} row(s) readable`,
    };
  }

  const payload = classified.payload;

  if (payload.code === SCHEMA_CACHE_MISS) {
    return {
      ok: false,
      label: SCHEMA_CACHE_MISS,
      problem:
        `${table}: ${SCHEMA_CACHE_MISS} — not in the schema cache. Either the ` +
        'migration has not been applied to this project, or PostgREST needs a ' +
        "schema reload (NOTIFY pgrst, 'reload schema').",
    };
  }

  if (response.status === 404) {
    return {
      ok: false,
      label: 'HTTP 404',
      problem: `${table}: HTTP 404 — table is not exposed by PostgREST.`,
    };
  }

  if (response.status === 401 || response.status === 403) {
    // PostgREST refused the read but recognised the relation: the table
    // exists and RLS is doing its job, which is what this gate asserts.
    return { ok: true, label: `HTTP ${response.status} — exposed, RLS denied the read` };
  }

  return {
    ok: false,
    label: `HTTP ${response.status}`,
    problem: `${table}: HTTP ${response.status} — ${payload.message ?? 'unexpected error'}`,
  };
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error(
      'Supabase verification FAILED: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY ' +
        '(or their VITE_ equivalents) must be set. Do not hardcode them — provide ' +
        'them from CI secrets.'
    );
    process.exitCode = 1;
    return;
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'Refusing to run: SUPABASE_SERVICE_ROLE_KEY is present in this environment. ' +
        'This check is intentionally anon-key-only and must never run with ' +
        'service-role credentials.'
    );
    process.exitCode = 1;
    return;
  }

  const base = url.replace(/\/$/, '');
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  // Fail fast and loudly if the endpoint itself is not reachable, rather
  // than misreporting every table individually.
  try {
    const probe = await fetch(`${base}/rest/v1/`, { headers });
    const probeType = probe.headers.get('content-type') ?? '';
    if (!probe.ok && !probeType.includes('json')) {
      console.error(
        `Supabase endpoint not reachable: ${base}/rest/v1/ answered HTTP ` +
          `${probe.status} with content-type "${probeType || 'none'}", which is not a ` +
          'PostgREST response. Something between this runner and Supabase (proxy, ' +
          'firewall, egress policy) is intercepting the request — the schema was ' +
          'NOT verified.'
      );
      process.exitCode = 1;
      return;
    }
  } catch (error) {
    console.error(
      `Supabase endpoint not reachable: ${error.message}. The schema was NOT verified.`
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Verifying PostgREST schema exposure at ${new URL(url).origin}\n`);

  const problems = [];

  for (const table of REQUIRED_TABLES) {
    let response;
    let body = '';
    try {
      response = await fetch(`${base}/rest/v1/${table}?select=*&limit=1`, { headers });
      body = await response.text();
    } catch (error) {
      problems.push(`${table}: transport failure — ${error.message}`);
      console.log(`  FAIL   ${table} (unreachable: ${error.message})`);
      continue;
    }

    const result = evaluateTable(table, response, body);
    console.log(`  ${result.ok ? 'ok    ' : 'FAIL  '} ${table} (${result.label})`);
    if (!result.ok) problems.push(result.problem);
  }

  if (problems.length) {
    console.error(`\nSupabase schema verification FAILED (${problems.length}):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      "\nApply the canonical migration through the project's normal Supabase " +
        'deployment process (supabase db push). Do NOT author a duplicate ' +
        'migration for a table that is merely missing remotely.'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`\nSupabase schema verification OK — ${REQUIRED_TABLES.length} tables exposed.`);
}

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) await main();
