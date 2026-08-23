# chroma-key-protected-media

Phase 17 (Cloudflare Consolidation) of the Sovereign OS migration. An
edge Worker that replicates `backend/server.py`'s gated audio endpoints
(`GET /api/audio/{track_id}` and `GET /api/audio/{track_id}/download`)
— same Supabase Auth verification, same tier/license gating rules, same
R2 bucket and object keys — see `src/index.js` and `src/gating.js` for
the exact mapping, and `docs/ARCHITECTURE.md`'s Phase 17 section for the
full writeup.

This is **not** wired into the live frontend or any live route. It
exists to prove a Worker can own this responsibility for real, not to
replace the backend endpoint yet — that cutover is a separate decision.

## Local checks

```bash
npm install
npm test              # vitest — pure logic + fake-fetch/fake-R2 integration tests
npx wrangler deploy --dry-run   # validates bindings/config without deploying
```

## Deploying for real

Deployment is manual only, via the `Deploy Protected Media Worker
(manual)` GitHub Actions workflow (`workflow_dispatch` — never fires on
push). Before running it, the repo needs one additional secret beyond
the `CLOUDFARE_API_TOKEN`/`CLOUDFARE_ACCOUNT_ID` already used by the
Pages deploy workflow:

- `SUPABASE_SERVICE_ROLE_KEY` — the same value as `backend/.env`'s
  `SUPABASE_KEY`. This Worker needs it because `users`/`tracks` have no
  RLS policies (service-role-only access, matching how the backend
  itself reads them) — there's no anon/user-JWT-scoped alternative.

Without that secret the workflow fails loudly and on purpose at the
"Require SUPABASE_SERVICE_ROLE_KEY secret" step, rather than deploying a
Worker whose every gating check would silently fail against Supabase.

To deploy manually instead: `cd frontend/protected-media-worker && npx
wrangler login && npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY &&
npx wrangler deploy`.
