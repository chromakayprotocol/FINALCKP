# CLAUDE.md

Guidance for Claude Code in this repo.

## What this is
Chroma Key Protocol — React/Vite frontend, Supabase (auth+Postgres), Cloudflare (R2 storage, Pages hosting, R2 Worker, `vma-worker`, `shadow-twin-worker`). App is structured as Acts I–IV: journaling, guided audio, visualizer, "Reclamation University" ("Sovereign Mode").

> **Migration note**: the FastAPI backend (`backend/`) has been removed entirely — the project is now frontend-owned (Sovereign Runtime) + Supabase + Cloudflare Workers, ahead of where the "Sovereign OS" migration guide's own phased sequencing (`docs/ARCHITECTURE.md`) had scheduled that removal. Several features that used to call the backend directly (checkout/license paywall, the `/protocol` AI chat page, the spin-wheel rewards page, onboarding's server-side progress write) were deleted or stripped down along with it and currently have no replacement — see `docs/ARCHITECTURE.md`'s Phase 20 entry for exactly what broke. Everything below describes the real, active system post-removal.

## Commands

**Frontend** (`frontend/`):
- `npm install --prefix frontend`
- `npm run dev --prefix frontend` — Vite on :3000, runs restore-env first
- `npm run build --prefix frontend` → `frontend/build`
- `npm test --prefix frontend` — runs vitest on ONE fixed file only (`authUserNormalizer.test.js`); for others: `cd frontend && npx vitest run src/path/to/file.test.js`
- `npm run test:unit --prefix frontend` — the whole `src/` suite, unfiltered (3 files fail on missing authored lesson content — see below)
- `npm run test:ci --prefix frontend` — what CI gates on: `test:unit` minus a named quarantine list documented in `frontend/vitest.ci.config.js`
- `npm run check:nexus-assets --prefix frontend` — filesystem existence of every Nexus asset the curriculum references
- `npm run smoke:routes --prefix frontend` — post-build SPA route smoke (`-- --base <url>` to smoke a live deployment)
- `npm run verify:supabase --prefix frontend` — anon-key-only check that the deployed project exposes the required tables (needs `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`)
- `npm run test:layout --prefix frontend` — opt-in Playwright suite validating the Nexus's 16:9 composition across 6 viewports + 3 zoom levels, against a credential-free harness (`npm run harness` serves it standalone)
- Root `package.json` mirrors the basics as `npm run bootstrap|start|build|test`
- No lint script wired up (eslint installed but unconfigured)

**Lyrics alignment** (`scripts/`): standalone Python 3.11/WhisperX pipeline, own venv (`py -3.11 -m venv .venv-lyrics`), see `scripts/lyrics-alignment/README.md`. Writes only reviewed SQL to `outputs/lyrics-alignment/`, never touches Supabase directly.

**Deploy**: `.github/workflows/deploy.yml` gates on unit tests → asset integrity → build → route smoke → Supabase schema verification before deploying to Cloudflare Pages (`chromakeyprotocol`) on push to `main`, then re-smokes the live deployment. No lint gate.

## Architecture gotchas

- **There is no backend.** `backend/` (FastAPI/Python) was deleted. All server-side logic is either Supabase (Postgres + RLS + Auth) directly from the frontend, or a Cloudflare Worker (`frontend/vma-worker`, `frontend/r2-worker`, `frontend/shadow-twin-worker`). Do not add a new backend service without discussing it first — the whole point of the removal was to stop maintaining one.
- **Frontend auth is Supabase-only.** `AuthContext.jsx` talks to Supabase Auth directly (sign in/up/OAuth/session, plus `user_metadata` for `current_act`/`completed_acts`/`level`); `ProtectedRoute` gates on that state. `API_CONTRACT.md` describes the old backend-session contract — it's obsolete, kept only as history.
- **Nexus state is derived, never placeheld.** Everything the Reclamation University Nexus shows as personalized seeker state comes from `src/lib/university/nexusState.js`, which reads `rec_uni_user_progress` (Fracture Protocol) *and* `sovereign_module_state` (Hermetic Hall + Reflection Protocol — that's where those two actually persist). `curriculum.js` owns static metadata only. A value that can't be derived renders as an explicit non-value; there is no fallback to a display default. See `docs/reclamation-university-data-integrity.md`.
- **One migration system**: `supabase/migrations/`. `backend/migrations/` no longer exists (it went with `backend/`). `supabase/migrations_legacy_finalckp/` is archived, don't extend.
- **No payments/licensing, AI protocol chat, or spin-wheel today.** `PaywallModal.jsx`, `ProtocolChat.jsx`, and `SpinWheel.jsx` were deleted with the backend they called (`/payments/*`, `/license/*`, `/protocol/chat`, `/spins/*`) and have no replacement yet — see `docs/ARCHITECTURE.md`'s Phase 20 entry before rebuilding any of them, so the replacement lands on Supabase/Workers rather than a new bespoke server.
- **Act entry routing**: the old generic `/act/:actNumber` and `/protocol/:actNumber` routes (backend-driven `ActPage.jsx`/`ActProtocol.jsx`) are gone. Each Act's real entry point is now `actEntryRoute(actNumber)` in `frontend/src/lib/actRoutes.js` — use that helper rather than hardcoding `/act/N` again.
- Routing (`App.jsx`) is one big lazy-loaded react-router-dom v7 table; many paths are `<Navigate>` redirects from old names — check before assuming a path is live.
- **The Chroma Frame is the central architecture.** `src/system/` owns the Protocol's one shared identity: eight channels, six frame layers, six rail slots, three type voices (Cinzel / Spectral / JetBrains Mono — never a fourth), and the readout rule. **`aurum` (gold) is Act IV's alone** — the Crucible Code reserves it, and a test enforces that. `indigo` (Reclamation University, Hermetic Hall) and `violet` (Sonic Surfaces) are deliberately one colour family split by shade, because they are the visual and auditory halves of the same teaching system — do not "fix" their closeness. A screen supplies a *plate* and declares a *channel*; it does not invent chrome. `PROTOCOL_SURFACES` in `chromaChannels.js` is the one file that knows every screen the Protocol has. Living reference at `/system/chroma-frame`; spec in `docs/CENTRAL_ARCHITECTURE.md`. Before adding a header, a bordered card, a progress meter or a colour, check whether the frame already has one — that is the whole point.
- Design system is dual-layer *below* the frame: shadcn HSL vars (`bg-primary`, ...) in `src/index.css` + brand tokens (`bg-brand-*`) in `tailwind.config.js`. Don't mix legacy `chroma-*` classes with `brand-*`. Tailwind config edits need a dev server restart. Note the `brand-*` lime/gold palette in `tailwind.config.js` and `styles/tokens.js` predates the frame and is NOT reconciled with it — the `--ckp-*` layer is canon where the two disagree.
- **The Reflection Chamber (Act II) predates the Chroma Frame and hasn't been migrated onto it.** `PillarExperience.jsx`/`ReflectionProtocolPage.jsx`/`ReflectionChamberEnvironment.jsx` still use their own bespoke `.pooi`/`.rpp`/`.rce` CSS and the `--h20-sky`/`--pooi-accent` blue tokens, not `chromaChannels.js`'s `azure` channel (Act II's registered channel, `PROTOCOL_SURFACES` id `reflection-protocol`) — the two happen to be close in hue, but are two different, unreconciled token sets. New Reflection Chamber work should extend the existing `--pooi-*`/`--h20-*` primitives (per the pattern the Shadow Twin system already follows — `src/pages/experience/reflection-chamber/styles/shadowTwin.css`) rather than either inventing a third palette or unilaterally migrating the whole Chamber onto the Frame outside a dedicated pass.
- **The Shadow Twin (Act II).** A generated, per-user visual counterpart that materializes as the Seeker progresses through the Reflection Chamber's five pillars — the Chamber's "missing visual/state layer," not a second engine. Lives as a `shadowTwin` domain on the Sovereign Runtime itself (`sovereign/runtime/sovereignState.js`), with its own Supabase tables (`shadow_twins`, `shadow_twin_fragments` — a private `shadow-twins` Storage bucket, RLS-scoped per user) since it's persistent media/asset state, not per-module progression. Visual parameters are always a pure derivation from `mirrorClarity` (`sovereign/reflectionChamber/shadowTwin.js`'s `deriveShadowTwinVisualState`), never mutated directly. Generation is isolated behind `frontend/shadow-twin-worker` (provider-swappable via `IMAGE_PROVIDER`, defaults to a credential-free `mock` provider) so the frontend never sees a generation credential or knows which provider ran. `SovereignProvider` is mounted once at `ReflectionProtocolPage.jsx` (not per-portal) so the Twin and Mirror Clarity survive navigating between portals and render at the Chamber hub itself. All five pillars now have an interactive engine and report real progress into the Sovereign Runtime, so the Twin can genuinely reach full integration.
- **Every Reflection Chamber pillar now runs on one of two engines.** Portal One (`owned-interior`) keeps its own fixed stage machine (`stages/PortalOneStages.jsx`). Portals Two through Five (`forged-witness`, `sacred-restraint`, `open-frequency`, `mirror-walker-boundary`) all run on the same config-driven `screens/ScreenSequence.jsx` — a pillar there is a config (`data/*Config.js`: tracks, prompts, intro/seal copy) plus, if it needs its own screen types beyond the shared `intro/track/synthesis/record/seal`, a small renderer table, never a forked engine. `components/track-synthesis/{TrackScreen,SynthesisScreen}.jsx` are the actual shared mechanics (reading `config.tracks`/`config.activeImaginationPrompts`/`config.synthesisPrompts`, not one pillar's hardcoded data) — `styles/trackSynthesis.css` is their shared structural CSS, scoped to `.pooi .fw-*`; each pillar's own `styles/<pillar>.css` only redefines accent tokens (`--track-secondary`/`--track-secondary-deep` plus the shared `--pooi-*`/`--h20-*` set). `screens/screenSequenceReporting.js` is where EVERY ScreenSequence pillar reports into the Sovereign Runtime (ENTER/DIAGNOSE/INSTRUCT/REFLECT/PRACTICE/SEAL) from one place — adding a new pillar's runtime reporting is automatic, not something its wrapper component or config needs to implement.

## Key dirs (frontend)
- `src/system/` — the Chroma Frame (central architecture: channels, chassis, rails, readout rule)
- `src/acts/` — per-act code; `src/modules/sovereign/`, `src/modules/ImmersiveProtocol/` — Sovereign Mode
- `src/sovereign/` — the Sovereign Runtime (reducer/actions/event bus/persistence) that Reclamation University's Hermetic Hall modules already run on
- `src/lib/supabase/` — one file per Supabase domain (tracks, journal, archetypes, elemental codex, matrxAlchemizr, sonic artifacts, Reclamation University)
- `src/services/supabase/client.js` — the Supabase singleton (the only backend client the app has)
- `src/lib/actRoutes.js` — canonical entry route per Act (see above)
- `src/context/audioprovider.jsx`, `src/lib/audio/useAudioAnalyzer.js` — audio state feeding visualizer
- `frontend/r2-worker/`, `frontend/vma-worker/`, `frontend/shadow-twin-worker/` — separate Cloudflare Workers, own node_modules
- `src/pages/experience/reflection-chamber/` — the Reflection Chamber (Act II); `ShadowTwinInitialization.jsx`, `components/ShadowTwin*.jsx`, `shadowTwin/` (sync/archive/audio hooks), `data/shadowTwinPrompt.js`, `styles/shadowTwin*.css` are the Shadow Twin's UI layer, on top of `sovereign/reflectionChamber/shadowTwin.js`'s pure derivation

## Env vars
- Frontend `.env`: `VITE_APP_SUPABASE_URL`/`VITE_SUPABASE_URL`, `VITE_APP_SUPABASE_ANON_KEY`/`VITE_SUPABASE_PUBLISHABLE_KEY` (both accepted), `VITE_APP_GOOGLE_CLIENT_ID`, `VITE_APP_R2_PUBLIC_BASE_URL`, `VITE_APP_VMA_WORKER_URL`, `VITE_APP_SHADOW_TWIN_WORKER_URL`
- `frontend/scripts/restore-env.mjs` runs before dev/start — can rewrite `.env`

`docs/reclamation-university-data-integrity.md` is the reference for Nexus data flow, the Supabase verification procedure, the canonical University route hierarchy, and the accessibility/layout contracts.

Details/contracts beyond this: `auth_testing.md` (manual auth playbook, still accurate — it already covers Supabase-only auth). `API_CONTRACT.md` documents the removed backend's API and is kept only as historical reference, not a live contract.
