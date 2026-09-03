# Diagnostics archive

**Historical diagnostic artifacts. Not evidence of current source behavior.**

Everything in this directory is a captured runtime log from a past debugging
session. These files are retained so a finding can be traced back to the
observation that produced it — nothing more. Before treating anything here
as a live bug, verify it against the current source.

## Contents

### `2026-vite-runtime-errors.log`

Vite dev-server stderr captured while the Reclamation University module
experiences were being exercised against a Supabase project whose
Reclamation University schema had not been applied. Previously lived at
`frontend/.codex-vite-err.log`, where its proximity to the source tree
invited it to be read as current runtime output.

It records three distinct classes of failure:

| Symptom in the log | Status today |
|---|---|
| `PGRST205 — Could not find the table 'public.rec_uni_user_progress' in the schema cache` | **Environment, not code.** The migration exists at `supabase/migrations/20260718050923_create_reclamation_university_runtime_schema.sql`; this is what the deployed project answers when that migration has not been applied (or PostgREST's schema cache is stale). See `docs/reclamation-university-data-integrity.md` for the verification procedure and `frontend/scripts/verify-supabase-schema.mjs` for the automated check. |
| `TypeError: supabase.from(...).insert(...).catch is not a function` in `emitAnalyticsEvent` | **Stale.** The current implementation awaits the builder and destructures `{ error }`; a repository-wide search for `.catch(` on a Supabase builder finds no remaining instance. Pinned by `frontend/src/lib/supabase/reclamationUniversityAnalytics.test.js`, which fails if that pattern ever returns. |
| `Cannot read properties of undefined (reading 'title')` in `reclamationUniversityCurriculum.js` | **Stale.** Not reproducible from the current curriculum registry; `frontend/src/data/reclamationUniversityCurriculum.test.js` covers the registry's shape. |
| Vite `esbuild` / `optimizeDeps.esbuildOptions` deprecation warnings | **Current, benign.** Vite 8 (Rolldown) deprecation notices from `vite.config.js`. Warnings only — they do not affect the build. |

Do not "fix" anything on the strength of a line in this file alone. Confirm
it in the current source first.
