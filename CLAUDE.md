# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Chroma Key Protocol** — a narrative, role-based web app with a React/Vite frontend and a FastAPI backend, backed by Supabase (auth + Postgres) and Cloudflare (R2 for media storage, Pages for hosting, a small R2 Worker). The product is structured as "Acts" (I–IV) the user progresses through — journaling, guided audio listening, a "Protocol" chat, a visualizer, and a "Reclamation University" curriculum module ("Sovereign Mode").

> **Migration note**: a "Sovereign OS" migration is in progress (Phase 1 of the guide as of this writing) whose target architecture removes the FastAPI backend entirely in favor of a frontend-owned Sovereign Runtime + Supabase + Cloudflare Workers. See `docs/ARCHITECTURE.md` for both the current and target architectures. Until that migration actually lands, everything below in this file describes the real, active system — treat it as accurate.

## Commands

### Frontend (`frontend/`)
```bash
npm install --prefix frontend   # or: cd frontend && npm install
npm run dev --prefix frontend   # Vite dev server on :3000 (runs restore-env first)
npm run build --prefix frontend # production build -> frontend/build
npm test --prefix frontend      # runs vitest against ONE fixed file: src/context/authUserNormalizer.test.js
```
To run a different/single test file directly, use vitest from inside `frontend/`:
```bash
cd frontend && npx vitest run src/path/to/file.test.js
```
Root `package.json` exposes the same frontend scripts as `npm run bootstrap|start|build|test` (they just shell out to `--prefix frontend`).

There is no lint script wired up (`eslint` is a devDependency but no `eslint.config.*` exists yet and no `npm run lint` is defined).

### Backend (`backend/`)
```bash
cd backend
pip install -r requirements.txt
python run.py                   # uvicorn server:app on 127.0.0.1:$PORT (default 5000), reload=True
```
Tests use `pytest` + `fastapi.testclient.TestClient` (pytest itself is not pinned in `requirements.txt` — install it separately if missing):
```bash
cd backend && pytest tests/                      # all backend tests
cd backend && pytest tests/test_chroma_key.py -v  # single file
```

### Lyrics alignment pipeline (`scripts/`)
A separate, standalone Python 3.11 pipeline (WhisperX-based) for aligning album lyrics to audio — unrelated to the main app's runtime dependencies. See `scripts/lyrics-alignment/README.md`. Needs its own venv since WhisperX/PyTorch don't support the workspace's default Python:
```powershell
py -3.11 -m venv .venv-lyrics
.\.venv-lyrics\Scripts\python.exe -m pip install -r scripts\lyrics-alignment\requirements.txt
python scripts\align_album_lyrics.py manifest|transcribe|align|sql
```
It only ever produces reviewed SQL output under `outputs/lyrics-alignment/`; it never writes to Supabase directly.

### Deploy
`.github/workflows/deploy.yml` builds `frontend/` and pushes `frontend/build` to Cloudflare Pages (project `chromakeyprotocol`) on push to `main`. There is no CI test/lint gate — only build + deploy.

## Architecture

### Backend: one canonical FastAPI app
`backend/server.py` is the **single source of truth** for the API — a large (~1300 line) monolithic file containing all models, auth, and routes, mounted under `api_router = APIRouter(prefix="/api")`. `backend/app/main.py` is **not** a separate backend; it's a one-line shim (`from server import app`) kept only so `uvicorn app.main:app` still works. `backend/app/routes/`, `backend/app/services/` etc. are legacy/dead code from an earlier prototype split-brain (documented as a known past issue in `APP_FLOW_INFRA_ANALYSIS.md`) — do not add new routes there.

Backend responsibilities in `server.py`: JWT/cookie session handling for its own bearer-token protected endpoints, Supabase access-token verification (`verify_supabase_access_token`), Cloudflare R2 object storage (via boto3 S3-compatible client) for audio streaming/downloads, Stripe-style checkout/license-key flows, Redis-backed rate limiting/session state, and the "Protocol" acts/journal/reflections/spins data endpoints. See `API_CONTRACT.md` for the authoritative `/api/auth/*` request/response contracts.

`backend/db_client.py` provides a lazily-initialized async Supabase client (`init_db`/`get_db`) shared across the app.

### Frontend: Supabase-first auth, backend for app-specific data
Despite `API_CONTRACT.md` describing backend-issued sessions, the live `AuthContext` (`frontend/src/context/AuthContext.jsx`) authenticates directly against Supabase Auth in the browser (`services/supabase/client.js`), listens to `onAuthStateChange`, and normalizes the Supabase user into an app user shape via `authUserNormalizer.js`. Protected routes (`App.jsx`'s `ProtectedRoute`) gate on this Supabase-derived `user`/`loading` state, not on a backend `/auth/me` call. The FastAPI backend's own bearer-token auth endpoints exist for backend-owned resources (progress, journal, checkout, protocol chat, audio streaming) and validate the Supabase access token passed from the frontend rather than issuing a competing session. See `auth_testing.md` for the manual verification playbook.

Routing (`frontend/src/App.jsx`) is one large `react-router-dom` v7 route table with almost every route lazy-loaded and most wrapped in `ProtectedRoute`. Route naming reflects several renaming passes — `/experiencemode/sovereign/...`, `/self-directed-sovereign-mode`, `/sovereign`, `/seeker` etc. are largely redirects to current canonical paths; check for a `<Navigate>` before assuming a path is live. `AppWithBackground` derives a "classical element" theme (`earth`/`water`/`fire`/`air`) from the current path to drive `ElementalBackground` — Act III / Reclamation University / Sovereign Mode / Visualizer routes render as `fire`.

Key frontend directories:
- `src/acts/` — per-act experience code (Act II, III, IV, `Reclamation`)
- `src/modules/sovereign/`, `src/modules/ImmersiveProtocol/` — Sovereign Mode / immersive protocol logic
- `src/lib/supabase/` — one file per Supabase-backed domain (tracks, journal/"vibesAndScribes", archetypes, elemental codex, "matrxAlchemizr" lyric tagging, sonic artifacts, Reclamation University)
- `src/services/supabase/client.js` — the Supabase client singleton; `src/services/apiClient.js` — axios client for the FastAPI backend
- `src/context/audioprovider.jsx`, `src/lib/audio/useAudioAnalyzer.js` — shared audio playback/analysis state (Tone.js / Web Audio) feeding the visualizer
- `frontend/r2-worker/` — a separate Cloudflare Worker (own `wrangler`/node_modules) proxying/serving R2-hosted media

### Data layer
Supabase Postgres is the primary datastore. `supabase/migrations/` holds the current migration history (most recent: Act III "matrx alchemizr" lyric-tagging schema and seed). `supabase/migrations_legacy_finalckp/` is superseded/archived and shouldn't be extended. `backend/migrations/` holds a separate, backend-applied SQL migration (immersive protocol tracks) — note there are two migration directories with different apply mechanisms; check which system a given table belongs to before adding a migration.

### Env vars
- Backend (`backend/.env`, see `backend/.env.example`): `SUPABASE_URL`, `SUPABASE_KEY` (service role), `SUPABASE_ANON_KEY`, `JWT_SECRET`, `ADMIN_BOOTSTRAP_SECRET`, `R2_*` (Cloudflare R2 credentials — server-side only, never exposed to the frontend).
- Frontend (`frontend/.env`, see `frontend/.env.example`): `VITE_APP_SUPABASE_URL`/`VITE_SUPABASE_URL`, `VITE_APP_SUPABASE_ANON_KEY`/`VITE_SUPABASE_PUBLISHABLE_KEY` (both naming variants are accepted, see `auth_testing.md`), `VITE_APP_BACKEND_URL`, `VITE_APP_GOOGLE_CLIENT_ID`, `VITE_APP_R2_PUBLIC_BASE_URL`.
- `frontend/scripts/restore-env.mjs` runs automatically before `dev`/`start` — check it before assuming `.env` is untouched between runs.

### Design system
Dual-layer: shadcn-style HSL CSS variables (`bg-primary`, `bg-background`, ...) defined in `src/index.css`, plus a custom brand token layer (`bg-brand-*`, `text-brand-*`) defined in `frontend/tailwind.config.js` under `extend.colors.brand`. Do not mix legacy `chroma-*` classes with the current `brand-*` system. Tailwind config changes require a dev server restart to take effect.
