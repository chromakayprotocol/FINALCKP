# Sovereign State Map (Phase 2)

This is the Phase 2 deliverable of the Sovereign OS migration (see
`docs/ARCHITECTURE.md` for the overall plan). Its job is **not** to fix
anything — it's to inventory every place in the codebase that currently
owns state, so that Phase 3 (the Sovereign Runtime) can be designed against
reality instead of assumption. Every finding below comes from reading the
actual source, not from guessing at intent.

**Headline finding:** there is no single authoritative progress/state
system today. The same concepts (`currentScene`, `progress`, `isComplete`,
`currentTrack`, `declaration`, `current_act`) are independently owned by
multiple components, several of which disagree with each other or write to
shared database columns with incompatible shapes. Two of these are outright
bugs (a broken Supabase write, and a UI control that silently does nothing).
This is the duplication Phase 3+ needs to collapse into one runtime.

For each category: **Current owner**, **Persistence location**, **Read
APIs**, **Write APIs**, **Consumers**, **Migration status** (what Phase 3+
needs to reconcile).

---

## 1. Module progress (Reclamation University)

The single largest duplication zone in the app. **Seven independent,
non-interoperable progress-tracking systems**, routed by module slug in
`frontend/src/pages/ReclamationModulePage.jsx`:

| Module slug(s) | Component | Persistence |
|---|---|---|
| non-Hermetic-Hall faculties | `ReclamationModuleEngine.jsx` | Supabase `rec_uni_user_progress` (+ legacy `rec_uni_module_responses`) |
| Hermetic Hall (default) | `HermeticCurriculumModule.jsx` | Supabase `rec_uni_user_progress.declaration_json.curriculum` **+** `localStorage` mirror (`ru_hermetic_curriculum_${moduleId}`) — own record shape, distinct from `ReclamationModuleEngine`'s |
| `mentalism`, `correspondence` | `HermeticSuppliedModuleExperience.jsx` | **None.** `progress` is a hardcoded prop; always resets on reload |
| `vibration` | `VibrationModuleExperience.jsx` | `localStorage` (`ckp-hermetic-hall-module-3`) + Supabase `rec_uni_user_progress` — **write is broken** (see below) |
| `polarity` | `PolarityModuleExperience.jsx` | `localStorage` only (`ckp-hermetic-hall-module-4`) |
| `rhythm` | `RhythmModuleExperience.jsx` | `localStorage` only (`ckp-hermetic-hall-module-5`) |
| `cause-and-effect` | `CauseEffectModuleExperience.jsx` | `localStorage` only (`ckp-hermetic-hall-module-6`) |
| `gender` | `GenderModuleExperience.jsx` | `localStorage` only (`ckp-hermetic-hall-module-7`) |

- **Current owner**: split across the 7 components above; `ReclamationModulePage.jsx` routes by slug.
- **Persistence location**: Supabase `rec_uni_user_progress` (2 of 7), `localStorage` (5 of 7), or nothing (1 of 7).
- **Read APIs**: `lib/supabase/reclamationUniversity.js` (`loadUserProgress`, `loadUserFacultyProgress`) via `hooks/useReclamationModuleProgress.js`; raw `localStorage.getItem`.
- **Write APIs**: `saveUserProgress`, `saveReclamationUniversityResponse`; raw `localStorage.setItem`.
- **Consumers**: `ReclamationModulePage.jsx`; `HermeticHallViewport.jsx` (reads none of this — see §2).
- **Bug found**: `VibrationModuleExperience.jsx` calls `saveUserProgress({ moduleId, progress: work.pct, state: payload, completed: complete })`, but the real function signature only destructures `{ moduleId, status, activeScene, listenedTrackIds, selectedShadowCodes, retrievedLightCodes, declarationJson, integrationKey, completedAt }`. `progress`/`state`/`completed` are silently dropped — every save upserts empty defaults. Cross-device sync for Module III is non-functional; only `localStorage` actually holds state.
- **Migration status**: 5 of 7 Hermetic Hall modules never reach the server at all — progress is unrecoverable across devices/browsers. This is the top candidate for Phase 3's `SovereignModuleState` to unify, and the Module III bug should probably be fixed as part of that unification rather than patched standalone (patching the old shape just adds an 8th format).

---

## 2. Scene progress (within a module)

No shared concept — fragmented per engine:

- `ReclamationModuleEngine.jsx`: `activeSceneIndex` (0–4) → saved as `active_scene`.
- `HermeticCurriculumModule.jsx`: `activeSectionIndex`/`activeItemIndex` → also saved as `active_scene` (**same column, different meaning** — a curriculum-section index, not a 5-scene index).
- `CauseEffectModuleExperience.jsx` (and Gender/Polarity/Rhythm): `activeIndex` against the shared `CURRICULUM_SECTIONS` constant (`curriculumSections.js`), via `CurriculumSpine.jsx`, `localStorage` only.
- `VibrationModuleExperience.jsx`: its own `tab`/`maxTab` (11-tab index), not using `CurriculumSpine.jsx` at all.
- `HermeticHallViewport.jsx`: `selected` principle (`useState(principles[0])`) — pure UI selection, unrelated to any of the above.

- **Persistence location**: `active_scene` column in Supabase (2 of 7 module types, colliding meanings); `localStorage` (rest); pure React state (`HermeticHallViewport`).
- **Read/Write APIs**: same paths as §1, per module type.
- **Consumers**: `ReclamationModuleEngine.jsx` → `SceneShell`; `HermeticCurriculumModule.jsx` → `LessonJourneyMap`; the four Hall engines → `CurriculumSpine.jsx`.
- **Duplication**: `curriculumSections.js`'s canonical 11-section list carries an explicit code comment saying it *"replaces both the earlier seven-section structure and the five-stage ReclamationModuleEngine flow. Neither should be reintroduced for a Hall module"* — yet `ReclamationModuleEngine.jsx`'s 5-scene model and `HermeticCurriculumModule.jsx`'s separate `JOURNEY_TAB_LABELS` scheme are both still live. Three incompatible "what section am I on" models coexist.
- **Also found**: `HermeticHallViewport.jsx` hardcodes `progress: 18` for Mentalism and `progress: 0` for the other six principles directly in the component file — it does not query any real progress store. The Hall's "% Complete" display is disconnected from actual learner progress.
- **Migration status**: Phase 4's 11-step state machine should become the *one* section/scene model; the 5-scene and journey-tab models need an explicit migration (data + code), not just a new system bolted alongside.

---

## 3. Journal

Four independent journal-like stores, two of them write-only dead ends:

- **`rec_uni_journal_entries`** (Supabase) — write via `saveJournalEntry()` (`lib/supabase/reclamationUniversity.js`), called from `ReclamationModuleEngine.jsx`'s "Seal Private Record" flow. **No read function exists anywhere in the frontend** — insert-only, nothing displays past entries.
- **`rec_uni_events`** (Supabase) — analytics-flavored event log (see §7), also insert-only, no reader.
- **`user_scribe_entries`** (Supabase) — `saveUserScribeEntry()` (`lib/supabase/userScribeEntries.js`) is **never called from anywhere in the app**. `VibesAndScribes.jsx` has a local textarea (`useState('')`) that looks like it should call this on save — it doesn't. Anything a user types there is discarded on unmount.
- **`vibes_and_scribes`** (Supabase) — actually **curated content**, not user journal data: `getVibesAndScribesByTrack()` reads per-track prompts, read-only reference data.
- **Backend `reflections` table** (Postgres via FastAPI) — a fifth, unrelated "journal": per-Act checkbox items (`{item_id: bool}`), via `GET/PUT /api/reflections/{act}`, called directly from `ActPage.jsx`.

- **Migration status**: "journal" currently means five different things in five different places. Phase 12 (structured reflection) needs one canonical reflection/journal model; the dead writers (`user_scribe_entries`, `rec_uni_journal_entries`, `rec_uni_events`) should either get real readers or be retired, not carried forward as-is.

---

## 4. Declarations

- **Current owner**: `ReclamationModuleEngine.jsx` — `declaration` (field-keyed object) + `declarationSealed` (bool), local `useState`.
- **Persistence location**: Supabase `rec_uni_user_progress.declaration_json` (incremental via `saveProgress`, finalized via `saveCompletion`/`saveReclamationUniversityResponse`).
- **Read APIs**: `loadUserProgress()` → `progress.declaration_json`.
- **Write APIs**: `updateDeclaration()` → `saveProgress()`; sealing via `DeclarationBuilder.jsx`'s `onComplete` callback.
- **Consumers**: `DeclarationBuilder.jsx` and `IntegrationKeyReveal.jsx` — both purely presentational, own no state.
- **Duplication**: `HermeticCurriculumModule.jsx` writes a *different* shape (`declaration_json.curriculum: {completedLessons, reflections, artifact}`) into the **same column** — a naming collision, not the same concept. A third, entirely separate declaration store also exists on the backend: `protocol_sessions.declaration` (Postgres, `GET /protocol/sessions`), unsynced with either Supabase shape.
- **Migration status**: Phase 4/14 (`ArtifactDecision`, the artifact compiler) needs a single declaration/decision schema — right now there are three incompatible ones sharing overlapping names.

---

## 5. Shadow/light codes

- **Current owner**: `ReclamationModuleEngine.jsx` — `selectedShadowCodes` / `retrievedLightCodes` (arrays of ids), local `useState`.
- **Persistence location**: Supabase `rec_uni_user_progress.selected_shadow_codes` / `.retrieved_light_codes` (+ legacy `rec_uni_module_responses`).
- **Read APIs**: `loadUserProgress()`, with legacy-id normalization against `module.shadowCodes`.
- **Write APIs**: `toggleShadowCode()` / `toggleLightCode()`, each calling `saveProgress()` on every toggle.
- **Consumers**: `ShadowCodeSelector.jsx` (only owns a local, unpersisted "personal/collective" view toggle), `LightCodeMapper.jsx` (fully presentational).
- **Migration status / scope note**: this mechanic exists **only** in `ReclamationModuleEngine.jsx`'s flow. None of the six Hermetic Hall module engines use Shadow/Light Codes — each has replaced it with its own "protocol steps"/"artifact" pattern. Not duplication so much as divergence: "Shadow Code → Light Code" is not actually the shared pedagogy model across all modules that the naming implies. Worth deciding explicitly whether Phase 4's state machine keeps this as one path among several, or generalizes it.

---

## 6. Listened tracks / audio consumption tracking

- **Current owner**: `ReclamationModuleEngine.jsx` only — `listenedTracks` (array of ids), local `useState`.
- **Persistence location**: Supabase `rec_uni_user_progress.listened_track_ids`.
- **Read/Write APIs**: `loadUserProgress()` (with legacy 1-based-index normalization); `markListenedTrack(trackId)` → `saveProgress()` + `trackEvent('track_listened', ...)`.
- **Consumers**: `PairedTrackPortal.jsx` (drives the "Receive Signal" button; owns only local error-state UI).
- **Duplication**: `HermeticCurriculumModule.jsx` reuses the **same** `listened_track_ids` column for a different value — `completedLessons` (lesson ids, not track ids). Same DB column, two incompatible meanings depending on which module type wrote it last.
- **Also found**: three independent "which tracks exist" queries with no shared helper — `lib/supabase/tracks.js` (`getActThreeTracks`/`getTrackById`), `ReclamationLessonMedia.jsx`'s inline `loadReclamationTracks()`, and the backend's separate Postgres `tracks` table (different schema entirely) behind `GET /api/tracks`/`/api/audio/{track_id}`.
- **Migration status**: Phase 9's Media Runtime / `TrackRegistry` should become the single track-reference source; "listened" tracking needs one column with one meaning.

---

## 7. Analytics events

- **Current owner / dispatchers**: `hooks/useReclamationModuleProgress.js`'s `trackEvent()` (auto-fires `module_viewed`/`scene_progression`/`module_completed`) and several explicit calls in `ReclamationModuleEngine.jsx` (`track_listened`, `shadow_code_selected`, `light_code_retrieved`, `module_brief_completed`, `track_load_failed`) — both write to Supabase `rec_uni_events` via `emitAnalyticsEvent()`.
- **Separately**: `frontend/src/index.jsx` boots Google Tag Manager and PostHog (hardcoded keys) app-wide.
- **Persistence location**: Supabase `rec_uni_events` (Reclamation-University-scoped only) and PostHog/GTM (external, third-party). These do not share events.
- **Read APIs**: none in-app — no dashboard reads `rec_uni_events` back.
- **Consumers**: `ReclamationModuleEngine.jsx`, `HermeticCurriculumModule.jsx` (via `saveProgress`'s embedded call).
- **Duplication**: two disconnected analytics systems, neither covering the Act/Protocol flow or the backend. PostHog is loaded on every page but has no confirmed `capture()` call sites anywhere in the codebase — effectively dead weight as currently wired.
- **Migration status**: Phase 6's Event Bus is the natural replacement for the bespoke `rec_uni_events` table — consumers (persistence, analytics, progress) should subscribe to one event stream instead of each feature hand-rolling its own Supabase insert.

---

## 8. Audio state

Two separate, non-communicating audio stacks:

1. **`context/audioprovider.jsx`** (`AudioProvider`/`useAudio`) — global React Context. Owns `queue`, `currentTrackIndex`, `currentTrack` (derived), `isPlaying`, `currentTime`, `duration`, `volume`, around one persistent `<audio>` element (plus a preload element). Exposes `playTrack`, `togglePlayback`, `seek`, `setVolume`, `nextTrack`, `previousTrack`.
2. **`modules/sovereign/AudioVisualizerCore.jsx`** — a fully self-contained component with its **own** `useState` for `track`, `elapsed`, `duration`, `volume`, `isMuted`, `isShuffle`, `playbackRate`, and its **own separate** `<audio>` DOM element. It never imports `AudioProvider`/`useAudio`.

- **Frequency/analyzer data**: `lib/audio/useAudioAnalyzer.js` owns `frequencyData`/`audioLevel` via a Web Audio `AnalyserNode`, but is only ever instantiated inside `AudioVisualizerCore.jsx` against *that* component's own audio element — never wired to `AudioProvider`'s element, so nothing consuming `AudioProvider` gets analyzer data without re-instantiating the hook itself.
- **Persistence location**: React state only, for both — resets on reload/navigation. No server or local persistence at all.
- **Duplication**: two fully independent "now playing" states, each backed by its own `<audio>` DOM element. If both are mounted simultaneously, nothing stops two audio elements from playing concurrently.
- **Migration status**: Phase 9's Media Runtime should be the single audio owner; both `AudioProvider` and `AudioVisualizerCore.jsx`'s player logic need to become consumers of it rather than parallel implementations, and `useAudioAnalyzer` should attach to the runtime's one shared element.

---

## 9. User authentication

Sharpens what `CLAUDE.md` already documents, with exact specifics:

- **Current owner**: `context/AuthContext.jsx` (`AuthProvider`/`useAuth`) — `user` (normalized) + `loading`, driven by Supabase Auth's `onAuthStateChange` + initial `getSession()`.
- **Persistence location — two independently-writable stores for the same conceptual progress fields**:
  1. **Supabase Auth `user_metadata`** — `current_act`, `completed_acts`, `level`, normalized by `AuthContext.jsx`'s `toAppUser()`. Written via `AuthContext.updateProgress()` → `supabase.auth.updateUser({ data })`.
  2. **Backend Postgres `users` table** — a richer, separate copy: `current_act`, `completed_acts`, `level`, `tier`, `spins_earned`, `spins_used`, `owns_all_albums`, `act3_unlocked`, `is_admin`. Written via `PUT /api/progress` and `POST /api/protocol/complete-act/{act}` (which also awards spins and inserts into `act_completions`).
- **Read APIs**: frontend reads `useAuth().user` (Supabase-derived) in `AppShell.jsx`/`ActPage.jsx`; backend reads its own `users` row via `GET /api/progress`/`GET /api/auth/me`.
- **Bug/gap found**: the live "Complete Act" button (`ActPage.jsx`'s `handleCompleteAct()`) calls `AuthContext.updateProgress()` only — it **never calls** the backend's `/api/progress` or `/api/protocol/complete-act/{act}`. The backend's `act_completions` table, `spins_earned` counter, and protocol-steps completion gate are effectively orphaned from the live UI flow. `useJourneyProgress.js` reads from the Auth-context user shape and appears to be unused elsewhere.
- **Also found**: the backend maintains its **own parallel credential system** — bcrypt password hashes + custom JWT/cookie sessions in the `users` table (`register`/`login`/`social` endpoints) — separate from Supabase Auth entirely. `verify_supabase_access_token()` bridges the two only by lazily creating a `users` row the first time a Supabase-authenticated request hits the backend; nothing keeps the two rows in sync afterward, so they can and will drift.
- **Migration status**: this is the highest-stakes duplication for Phase 7 (Supabase persistence) to resolve — there are currently two sources of truth for "what act is this user on," and the one the backend was built around isn't the one the live UI actually writes to.

---

## 10. Curriculum registry

`curriculumSections.js`, `hermeticLessonContent.js`, `hermeticJourneyTabs.js`, `hermeticMaterialContent.js` are all **pure static-content/derivation modules** — no runtime state of their own. Every stateful concern (active index, completed ids, reflections, artifacts) lives in the consuming component, not in these registries.

- **Migration status**: safe to treat as read-only content in the Sovereign Runtime design (Phase 8: "the curriculum remains content"). The only real issue is that — per §2 — not every module engine reads from the *same* registry, despite `curriculumSections.js`'s own comment saying it should have superseded the older models.

---

## Backend route inventory (`backend/server.py`, `@api_router` routes)

| Route | Table(s) | Frontend category |
|---|---|---|
| `POST /auth/register`, `/login`, `/logout`, `/bootstrap-admin`, `/social` | `users` (bcrypt) | §9 — parallel credential store |
| `GET /auth/me` | `users` | §9 |
| `GET/PUT /progress` | `users` | §9 / §1 (Act-level, not Reclamation-University-level) |
| `GET/PUT /reflections/{act}` | `reflections` | §3 (Act-checklist flavor) |
| `POST /license/validate`, `GET /license/status` | `license_keys`, `users` | entitlement (not one of the 10 categories) |
| `GET /audio/{track_id}`, `/download` | `tracks` | §8 (streaming only, not playback state) |
| `GET /tracks` | `tracks` | reference data feeding §6/§8 |
| `GET /protocol/sessions[/{id}]` | `protocol_sessions` | §4 — third, backend-only declaration store |
| `GET/POST /protocol/steps/{act}/{step}` | `protocol_steps` | §1/§2 — Act-level, unrelated schema to Reclamation University |
| `POST /protocol/complete-act/{act}` | `act_completions`, `users` | §1/§9 — appears unreachable from the live "Complete Act" button |
| `GET /spins`, `POST /spins/use` | `users` | gamification currency (not one of the 10 categories) |
| `GET /settings/public` | — | out of scope |

**By persistence tier:**
- **Backend Postgres (FastAPI)**: Act-level progress/reflections/protocol-steps/spins/audio-streaming/checkout — but the live "Complete Act" UI path bypasses most of it.
- **Supabase-direct (frontend → Supabase, no backend)**: all of Reclamation University (§1–§6), auth session + `current_act`/`completed_acts` metadata via `AuthContext.updateProgress` (§9), curated content (`vibes_and_scribes`, `tracks`).
- **Purely local (React state / `localStorage`, no server sync)**: Hermetic Hall modules III–VII progress (§1), all audio playback position/queue/volume (§8), the scribe-entry textarea (§3), `HermeticHallViewport.jsx`'s hardcoded progress display (§2), the shadow-code diagnostic-frame toggle (§5), `AudioVisualizerCore.jsx`'s entire player state (§8).

---

## Duplication findings (consolidated)

1. **Seven independent module-progress owners** for one concept, with incompatible persistence. §1.
2. **`saveUserProgress()` payload mismatch** in `VibrationModuleExperience.jsx` silently wipes Supabase progress on every save. §1.
3. **Three coexisting "what section am I on" models** despite code comments saying one superseded the others. §2.
4. **`listened_track_ids` column reused for two different meanings** (tracks vs. lessons) depending on module type. §6.
5. **Three independent, non-deduplicated "which tracks exist" queries**, including a completely separate backend `tracks` schema. §6, backend table.
6. **Two fully independent audio playback engines**, each with its own `<audio>` element; nothing stops both playing at once. §8.
7. **Audio analyzer only ever wired to one of the two audio engines.** §8.
8. **Two independently-writable "current_act/completed_acts/level" stores** for the same user (Supabase Auth metadata vs. backend Postgres `users`); the live UI only writes one of them, orphaning backend completion logic. §9.
9. **Two independent authentication/session systems** (Supabase Auth vs. backend bcrypt+JWT), bridged only by a one-time lazy bootstrap with no ongoing sync. §9.
10. **`declaration_json` column reused for two incompatible schemas** depending on which engine wrote it last, plus a third, entirely separate backend declaration store (`protocol_sessions.declaration`). §4.
11. **Four unrelated "journal" stores**, two write-only with no reader anywhere (`rec_uni_journal_entries`, `rec_uni_events`), one with a write function that's never called (`user_scribe_entries`). §3.
12. **`HermeticHallViewport.jsx`'s progress bar is hardcoded**, disconnected from all seven real progress stores in §1. §2.
13. **Two disconnected analytics systems** (bespoke `rec_uni_events` vs. PostHog/GTM), neither covering the Act/Protocol flow. §7.

These are exactly the kind of findings Phase 0 of the migration guide predicted: *"You are likely to find multiple components independently knowing things such as currentScene, currentTrack, progress, isComplete. Those should eventually be derived from one authoritative runtime."* Confirmed, with thirteen concrete instances. None of this was fixed in this pass — Phase 2 is inventory only. Phase 3 (Sovereign Runtime) should be designed with this list open next to it, and item #8/#9 (the two auth/progress stores) is the one worth resolving earliest given it affects every other category downstream.
