# CLAUDE.md

Guidance for Claude Code in this repo.

## What this is
Chroma Key Protocol — React/Vite frontend + FastAPI backend, Supabase (auth+Postgres), Cloudflare (R2 storage, Pages hosting, R2 Worker). App is structured as Acts I–IV: journaling, guided audio, "Protocol" chat, visualizer, "Reclamation University" ("Sovereign Mode").

> **Migration note**: a "Sovereign OS" migration is in progress (Phase 1 of the guide as of this writing) whose target architecture removes the FastAPI backend entirely in favor of a frontend-owned Sovereign Runtime + Supabase + Cloudflare Workers. See `docs/ARCHITECTURE.md` for both the current and target architectures. Until that migration actually lands, everything below in this file describes the real, active system — treat it as accurate.

## Commands

**Frontend** (`frontend/`):
- `npm install --prefix frontend`
- `npm run dev --prefix frontend` — Vite on :3000, runs restore-env first
- `npm run build --prefix frontend` → `frontend/build`
- `npm test --prefix frontend` — runs vitest on ONE fixed file only (`authUserNormalizer.test.js`); for others: `cd frontend && npx vitest run src/path/to/file.test.js`
- Root `package.json` mirrors these as `npm run bootstrap|start|build|test`
- No lint script wired up (eslint installed but unconfigured)

**Backend** (`backend/`):
- `pip install -r requirements.txt` then `python run.py` (uvicorn server:app, :5000 default, reload=True)
- `pytest tests/` (pytest not pinned in requirements.txt — install separately if missing)

**Lyrics alignment** (`scripts/`): standalone Python 3.11/WhisperX pipeline, own venv (`py -3.11 -m venv .venv-lyrics`), see `scripts/lyrics-alignment/README.md`. Writes only reviewed SQL to `outputs/lyrics-alignment/`, never touches Supabase directly.

**Deploy**: `.github/workflows/deploy.yml` builds frontend → Cloudflare Pages (`chromakeyprotocol`) on push to `main`. No CI test/lint gate.

## Architecture gotchas

- **Backend = `backend/server.py` only.** Single ~1300-line file: all models/auth/routes under `api_router` (prefix `/api`). `backend/app/main.py` is just `from server import app`. `backend/app/routes/`, `backend/app/services/` are dead prototype code — **never add routes there**. `backend/db_client.py` gives the shared async Supabase client (`init_db`/`get_db`).
- **Frontend auth is Supabase-first, not backend-issued** (despite `API_CONTRACT.md` describing backend sessions). `AuthContext.jsx` talks to Supabase Auth directly, `ProtectedRoute` gates on that state. Backend auth endpoints validate the Supabase access token instead of issuing their own session.
- **Two migration systems** — check which owns a table before adding one: `supabase/migrations/` (current) vs `backend/migrations/` (backend-applied SQL, separate mechanism). `supabase/migrations_legacy_finalckp/` is archived, don't extend.
- Routing (`App.jsx`) is one big lazy-loaded react-router-dom v7 table; many paths are `<Navigate>` redirects from old names — check before assuming a path is live.
- Design system is dual-layer: shadcn HSL vars (`bg-primary`, ...) in `src/index.css` + brand tokens (`bg-brand-*`) in `tailwind.config.js`. Don't mix legacy `chroma-*` classes with `brand-*`. Tailwind config edits need a dev server restart.

## Key dirs (frontend)
- `src/acts/` — per-act code; `src/modules/sovereign/`, `src/modules/ImmersiveProtocol/` — Sovereign Mode
- `src/lib/supabase/` — one file per Supabase domain (tracks, journal, archetypes, elemental codex, matrxAlchemizr, sonic artifacts, Reclamation University)
- `src/services/supabase/client.js` (Supabase singleton) vs `src/services/apiClient.js` (axios → FastAPI)
- `src/context/audioprovider.jsx`, `src/lib/audio/useAudioAnalyzer.js` — audio state feeding visualizer
- `frontend/r2-worker/` — separate Cloudflare Worker, own node_modules

## Env vars
- Backend `.env`: `SUPABASE_URL`, `SUPABASE_KEY` (service role), `SUPABASE_ANON_KEY`, `JWT_SECRET`, `ADMIN_BOOTSTRAP_SECRET`, `R2_*` (server-only)
- Frontend `.env`: `VITE_APP_SUPABASE_URL`/`VITE_SUPABASE_URL`, `VITE_APP_SUPABASE_ANON_KEY`/`VITE_SUPABASE_PUBLISHABLE_KEY` (both accepted), `VITE_APP_BACKEND_URL`, `VITE_APP_GOOGLE_CLIENT_ID`, `VITE_APP_R2_PUBLIC_BASE_URL`
- `frontend/scripts/restore-env.mjs` runs before dev/start — can rewrite `.env`

Details/contracts beyond this: `API_CONTRACT.md` (auth API), `auth_testing.md` (manual auth playbook) — read only when working on those areas.
