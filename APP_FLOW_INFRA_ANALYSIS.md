# App User Flow & Infrastructure Analysis

> **Status: historical.** The backend "split-brain" this document describes (`backend/server.py` vs. `backend/app/main.py` + `backend/app/routes/*`) has since been resolved: `backend/app/main.py` is now a one-line shim re-exporting `backend/server.py`'s app, and `backend/app/routes/`, `backend/app/services/` are legacy/dead code that is no longer mounted. `backend/server.py` is the single canonical API. This doc is kept for historical context; see `docs/ARCHITECTURE.md` for the current and target (Sovereign OS) architecture.

## Executive Summary

Your app has strong ambition and a lot of surface area, but right now it is split across **two partially overlapping backend architectures** and a frontend that assumes one auth contract while parts of the backend expose a different one. The result is brittle login/session behavior, inconsistent routing behavior, and high maintenance overhead.

Top issues:

1. **Backend split-brain**: `backend/server.py` contains a large API surface, while `backend/app/main.py` + `backend/app/routes/*` defines a second mini API with placeholder auth.
2. **Auth contract mismatch**: Frontend `AuthContext` expects specific `/auth/*` responses that are not guaranteed across both backends.
3. **Inconsistent route mounting/prefixing**: Some code assumes `/api/*`, other parts mount auth at `/auth/*` directly.
4. **Environment/config drift**: Multiple startup paths and env assumptions make local/dev/prod parity fragile.

---

## 1) Current User Flow (as implemented)

## Frontend route and auth flow

Primary flow in `frontend/src/App.jsx`:

- App bootstraps routes under `BrowserRouter`.
- Most routes are wrapped in `ProtectedRoute`.
- `ProtectedRoute` waits for `loading` from `AuthContext`, then:
  - redirects to `/login` when `user` is null,
  - otherwise renders child route (with optional `AppShell`).

Auth lifecycle in `frontend/src/context/AuthContext.jsx`:

- On mount, `checkAuth()` calls `GET /auth/me`.
- If success: sets user + starts refresh timer.
- Login calls `POST /auth/login` and assumes `response.data` is directly the user payload.
- Register calls `POST /auth/register` and also assumes `response.data` is user payload.
- Logout calls `POST /auth/logout`.

### Observed risk in flow

`AuthContext.login` expects user-like JSON directly, but one backend route (`backend/app/routes/auth.py`) returns `{ token, user }`, not direct user. This can break downstream usage unless normalized.

---

## 2) Infrastructure / Backend Architecture Reality

You currently have **two FastAPI patterns**:

## A) Monolithic API in `backend/server.py`

- Defines `app = FastAPI()` + `api_router = APIRouter(prefix="/api")`.
- Contains substantial production-like concerns:
  - JWT auth
  - cookie handling
  - DB access
  - storage client (Cloudflare R2 via S3 API)
  - many data models
- Looks like the “real” backend backbone.

## B) Secondary API in `backend/app/main.py` + `backend/app/routes/*`

- Defines another `app = FastAPI()`.
- Adds permissive CORS (`allow_origins=["*"]` plus credentials).
- Includes simplistic routes:
  - `/auth/login` with fake token
  - `/user/me` with hardcoded user
- `authenticate_user` is placeholder hardcoded in `backend/app/services/auth_service.py`.

### Why this is painful

Depending on which entry point you run (`backend/server.py`, `backend/run.py`, or `backend/app/main.py`), the frontend talks to materially different auth behavior.

---

## 3) Main Sources of “Mess” (Root Causes)

1. **Parallel backend implementations**
   - Prototype auth/service layer and fuller auth layer coexist.
   - No clear ownership of “source of truth” API.

2. **Contract drift between frontend and backend**
   - Frontend expects user payload directly from auth calls.
   - One backend returns nested token+user structure.

3. **Path/prefix fragmentation**
   - Frontend axios uses base URL `${API_URL}/api`.
   - Alternate backend app routes are mounted without `/api` prefix in `backend/app/main.py`.

4. **Security posture inconsistency**
   - CORS wildcard + credentials is usually invalid/insecure in browsers.
   - Cookie security behavior differs by environment assumptions.

5. **Documentation drift**
   - Root `README.md` describes a “Flask-style API” while code is FastAPI-centric.
   - Increases onboarding and debugging time.

---

## 4) Recommended Target Architecture

Pick one backend path and remove the other from runtime use.

## Recommended decision

- Keep `backend/server.py` stack as the canonical API (it already has auth/JWT/cookie/storage/database wiring).
- Treat `backend/app/main.py` stack as deprecated prototype and remove or archive.

## Target request flow

1. Frontend boot -> `GET /api/auth/me`
2. If 200 -> user session active -> protected routes render
3. If 401 -> redirect to `/login`
4. Login -> `POST /api/auth/login` returns normalized user/session response
5. Logout -> `POST /api/auth/logout` clears cookie/session

## Contract hardening

Define and document a single response shape for:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Then adapt frontend `AuthContext` strictly to that schema.

---

## 5) Cleanup Plan (Practical)

## Phase 1 — Stabilize (1-2 days)

- Decide canonical backend entrypoint.
- Add a short `API_CONTRACT.md` with real payload examples.
- Make `AuthContext` parse explicit response fields (avoid implicit `response.data` assumptions).
- Ensure all frontend auth requests resolve to `/api/auth/*` consistently.

## Phase 2 — Remove ambiguity (1-2 days)

- Remove or quarantine `backend/app/main.py` prototype stack.
- Update README startup instructions to one backend path.
- Add smoke tests for:
  - login success/failure
  - `/auth/me` session detection
  - logout invalidation

## Phase 3 — Infra hygiene (ongoing)

- Standardize env vars (`.env.example` authoritative).
- Tighten CORS by explicit origins only.
- Add health check and structured logging for auth failures.

---

## 6) What To Fix First (highest ROI)

1. **Unify auth API contract + route prefixing** (`/api/auth/*`).
2. **Kill duplicate backend runtime path**.
3. **Update frontend auth state expectations** to explicit schema.

Doing those 3 will remove most “mystery failures” and give you a stable platform for feature work.

---

## 7) Optional Fast Wins

- Add a route map doc generated from FastAPI openapi (single backend only).
- Add a startup banner logging active env + base URL + mounted routes.
- Add one integration test that emulates browser auth cookie flow end-to-end.

