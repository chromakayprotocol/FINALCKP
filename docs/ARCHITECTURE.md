# FinalCKP → Sovereign OS: Architecture

This is the canonical architecture document for the Chroma Key Protocol app. It
defines two things:

1. **The current architecture** (what is actually running today).
2. **The target architecture** (what the Sovereign OS migration is moving
   toward, per the FINALCKP → SOVEREIGN OS Implementation & Migration Guide).

Where the two differ, this doc says so explicitly. Do not assume the target
state is already implemented — check `SOVEREIGN_STATE_MAP.md` (Phase 2) and
the migration status notes below before relying on any target-architecture
component described here.

## Migration status

This repo has completed **Phase 1 (Repository Sanitization)**, **Phase 2
(State Inventory)**, and a first pass of **Phase 3 (Sovereign Runtime)** of
the Sovereign OS migration. The **current architecture** section above still
reflects the real, active system that ships to users — the runtime below is
new, standalone scaffolding that nothing in the app reads or writes yet.

Phase 2 produced `docs/SOVEREIGN_STATE_MAP.md`, a full inventory of every
existing state store (module progress, journal, declarations, audio state,
auth, curriculum registry, etc.) and its owner/persistence/consumers. It
found significant duplication — most notably **seven independent,
incompatible Reclamation-University progress-tracking systems** and **two
independently-writable stores for a user's `current_act`/`completed_acts`**
(Supabase Auth metadata vs. backend Postgres `users`), where the live UI
only writes one of them.

Phase 3 added `frontend/src/sovereign/runtime/` — a React Context +
`useReducer` runtime (`SovereignProvider`, `sovereignReducer`,
`sovereignActions`, `sovereignSelectors`, and the `useSovereign()` hook) with
the state shape and action set the migration guide specifies: `identity`,
`curriculum` (a registry of per-module `SovereignModuleState`), `module`
(the active module, exposed with bound `advanceStep`/`completeStep`),
`media`, `reflection`, `concepts`, `synthesis`, `artifact`, and `session`.
State only ever changes through the explicit actions in
`sovereignActions.js` (`startModule`, `advanceStep`, `completeStep`,
`recordReflection`, `selectConcept`, `connectConcepts`, `executeProtocol`,
`generateArtifact`, `sealArtifact`) — components never get a raw `dispatch`.
`sovereignReducer.test.js` covers the reducer's invariants (dedup on
repeated completions/concept selection, non-clobbering identity merges,
`sealArtifact` refusing to fire before a draft exists, etc.).

This runtime is intentionally **not wired into the app yet** — no existing
component imports it, and it does not yet replace any of the 13 duplication
findings in `SOVEREIGN_STATE_MAP.md`.

Phase 4 added `sovereignSteps.js`: the canonical 11-step curriculum
lifecycle (`01-intro` … `11-summary`) with **real, per-step completion
criteria** instead of navigation standing in for completion — the migration
guide's core rule ("Next" ≠ "complete"). `evaluateModuleSteps(state,
moduleId)` computes each step's status (`locked`/`active`/`complete`)
straight from runtime state: simple steps complete once viewed
(`module.viewedSteps`), `REFLECTION` requires an actual committed reflection
entry for that module, `PROTOCOL` requires a protocol execution tagged with
that `moduleId`, `ARTIFACT` requires the artifact to be sealed (not just
drafted), and `SUMMARY` requires every prior step to genuinely be done.
Steps lock in order — you can be on the first incomplete step, but you
can't skip ahead of it. Two things are explicitly flagged as placeholders in
code comments pending later phases: `KEY_CONCEPTS`'s criterion (any concept
selected anywhere, since concept selection isn't module-scoped until Phase
10's Concept Graph) and `ARTIFACT`'s criterion (the runtime has one global
artifact slot until Phase 14 defines how a per-module artifact review
relates to the single cross-journey Living Artifact). `sovereignSteps.test.js`
(9 tests) exercises this against the real reducer, including the exact
"advancing past a step doesn't complete it" case the guide calls out.

Phase 5 added `sovereignLocalPersistence.js` and wired it into
`SovereignProvider`: pass a `namespace` prop and the runtime restores state
from `localStorage` on mount (via `useReducer`'s lazy initializer, so
there's no restore-flash render) and debounce-saves it back (default 500ms)
on every subsequent change, plus flushes immediately on `beforeunload` and
on unmount so the last debounce window is never silently dropped. Storage is
dependency-injected — it falls back to `globalThis.localStorage`, then an
in-memory stub — so the whole thing is unit-tested (11 tests across
save/load round-tripping, version-mismatch and corrupted-JSON handling,
fail-soft behavior when storage throws, and debounce/flush/cancel timing
with fake timers) without needing a DOM or new test dependencies.
`namespace` is intentionally not defaulted to anything shared — it needs to
be scoped to the signed-in user once identity is wired up (Phase 7), or two
accounts on the same browser would see each other's local state; omitting
it disables local persistence entirely (e.g. for tests).

Phase 6 added `frontend/src/sovereign/events/`: a framework-free event bus
(`SovereignEventBus.js` — subscribe/subscribeAll/emit, bounded history, a
throwing listener can't break the runtime or block other listeners) plus
`mapActionToEvents.js`, which derives events from every dispatched action
rather than requiring each feature to hand-roll its own emission — the
structural fix for duplication finding #13 (two disconnected analytics
systems). `SovereignProvider` now routes every action through this mapper
and emits the resulting events automatically; `useSovereign().session`
exposes `subscribe`, `subscribeAll`, and `recentEvents` for consumers.

`STEP_COMPLETED` is the one event that isn't a simple 1:1 action mapping:
because a step's completion criteria (Phase 4) can depend on state written
by several different action types, `mapActionToEvents` diffs
`evaluateModuleSteps()` before/after *every* action and emits
`STEP_COMPLETED` for whichever steps just crossed into `complete` — direct
payoff of building Phase 4's real completion criteria before this phase's
event bus, per the migration guide's sequencing rule. Several event types
from the guide's taxonomy (`MEDIA_*`, `LYRIC_ANCHOR_SELECTED`,
`CONCEPT_OPENED`, `REFLECTION_STARTED`/`REFLECTION_UPDATED`,
`PROTOCOL_STARTED`) are defined in `eventTypes.js` but not yet emitted,
each commented with which later phase (9, 10, or 12) needs to exist first —
they depend on runtime pieces that don't have real actions yet.

Phase 7 connected Supabase. Two parts:

**Schema** — `supabase/migrations/20260822051703_create_sovereign_runtime_schema.sql`
adds the guide's seven tables (`sovereign_sessions`, `sovereign_module_state`,
`sovereign_reflections`, `sovereign_events`, `sovereign_concepts`,
`sovereign_connections`, `sovereign_artifacts`), mirroring the exact
conventions the existing `rec_uni_*` schema already established (RLS scoped
to `auth.uid() = user_id`, `gen_random_uuid()` PKs, an `updated_at` trigger).
Naming note documented in the migration itself: "sovereign_" here is this
migration's new runtime and is unrelated to the pre-existing "Sovereign
Mode" UI under `frontend/src/modules/sovereign/` and the generic
`getSovereignSupabase()` helper in `frontend/src/lib/supabase/`, which
predate this migration and mean something different. `synthesis.protocolExecutions`
deliberately has no table yet — Phase 6's event only carries
`{protocolId, moduleId}`, not the full protocol payload, so persisting it
properly belongs with Phase 13's Synthesis Engine instead of being done
lossily here now.

**Sync layer** — `frontend/src/sovereign/persistence/`:
- `sovereignRemoteMapping.js`: pure, round-trip-tested field mapping
  between runtime state and DB rows (snake_case <-> camelCase, plus
  reconstructing the `moduleId:promptId` reflection-entry keys and the
  per-module dict shape from flat row lists).
- `sovereignReconciliation.js`: the actual merge policy for local vs.
  remote state — whole-module-record adoption from whichever side was more
  recently active (never a field-by-field blend, which could produce an
  incoherent record), later-`updatedAt`-wins per reflection entry,
  set-union for concepts/connections (additive-only today, so nothing to
  conflict), artifact status-priority so a stale replica can never
  downgrade a sealed artifact, and local-wins-ties for identity/media so a
  stale remote snapshot can't hijack what's actively happening in the
  current session. This is the most rigorously tested module in the whole
  runtime (21 tests) since it's exactly Phase 19's "Test E: persistence
  failure" scenario made real.
- `sovereignSupabaseSync.js`: thin I/O (`fetchRemoteState`,
  `pushRemoteState`, and a debounced `createRemoteAutosave` mirroring Phase
  5's local autosave shape) following this codebase's existing
  `{ data, error }` convention from `lib/supabase/reclamationUniversity.js`,
  with the Supabase client dependency-injected so it's tested against a
  hand-built fake client rather than a live connection.

**Wired into `SovereignProvider`** via an opt-in `userId` prop (should match
whatever `namespace` is set to, so local and remote agree on whose data this
is): on mount, fetches remote state, reconciles it with local, and
dispatches the result through `hydrate()`; debounce-pushes state back on
every subsequent change (2s default). `session.syncStatus` tracks
`local -> syncing -> synced`, or `error` on a failed fetch — Supabase stays
additive persistence, never a hard dependency; local state keeps working
either way. 95/95 tests pass across Phases 3-7.

## Phase 8 (in progress): migrating Reclamation University onto the runtime

Phase 8 is the first phase that touches existing, live components rather
than adding standalone files, and a full field-by-field migration of all
seven Hermetic Hall module engines (`SOVEREIGN_STATE_MAP.md` §1) in one pass
isn't a safe or realistic scope — each has its own bespoke interaction
model built around ~1,000+ lines of content/animation code. Phase 8 is
being done incrementally, one module at a time, starting with the
persistence layer only (not a structural rewrite of each module's
internals) — matching the guide's own framing: *"the Sovereign Runtime
becomes the operating layer... existing modules don't need to be rewritten
immediately."*

**Done:** `VibrationModuleExperience.jsx` (Hermetic Hall Module III) — this
was `SOVEREIGN_STATE_MAP.md`'s duplication finding #2, a real data-loss bug:
its `saveUserProgress()` call passed `{ progress, state, completed }`, but
that function's actual signature doesn't destructure those keys, so every
save silently wiped remote progress back to empty defaults. The component
is now split into a thin outer wrapper (`SovereignProvider` scoped to
`namespace={userId || 'anonymous'}` and `userId`) around the existing inner
implementation, which is otherwise untouched — only its two persistence
effects changed, from a raw `localStorage` read/write plus the broken
`saveUserProgress()` call, to `useSovereign().reflection.recordReflection()`
storing this module's whole local record as one reflection entry keyed
`hermetic-hall/vibration:record`. This is a persistence-layer swap, not a
structural migration onto the runtime's typed `module`/`concepts`/
`artifact` domains — the component's own `reflect`/`plate`/`steps`/`audits`
state still lives in plain `useState`; mapping those onto the runtime's
structured domains properly is future work for whichever phase decides how
Phase 4's step machine should generalize past the "Shadow/Light Code"
pedagogy (see the Phase 4 section above).

Verification: `npx esbuild` bundle-checked the edited file's imports/syntax;
started the Vite dev server and loaded both `/` and the (auth-gated) route
in headless Chromium — no console/page errors attributable to the change
(the only errors present, blocked font/analytics/video CDN requests, are
pre-existing sandbox network restrictions present on the untouched homepage
too), and the protected route correctly redirected to `/login` rather than
crashing. **Not verified**: the actual signed-in Module III experience —
that needs real Supabase credentials this environment doesn't have, and
creating a test account against what's configured as the real production
Supabase project wasn't judged appropriate just to check this. The existing
test suite (131 tests across `src/sovereign/`, `matrx-alchemizr/`, and
`reclamation-university/`) passes except 5 pre-existing failures in
`hermeticJourneyTabs.test.js`/`hermeticLearningExperience.test.js`,
confirmed present on the base commit before this change (unrelated files,
not touched here).

**Done:** `HermeticSuppliedModuleExperience.jsx` (Hermetic Hall Modules I—II,
Mentalism and Correspondence) — this was `SOVEREIGN_STATE_MAP.md`'s
duplication finding #3: the component had *no* persistence at all. Its
active tab and reflection textarea were plain `useState`, wiped on every
unmount or reload. Same wrapper shape as Vibration — a thin outer
`SovereignProvider` (`namespace={userId || 'anonymous'}`, `userId`) around
an otherwise-untouched inner component — but since this one component
serves two module slugs (`mentalism`/`correspondence` via a `moduleSlug`
prop), the reflection key is computed per-instance as
`` `hermetic-hall/${moduleSlug}:record` `` so the two modules' progress
doesn't collide. Same hydrate-once-per-`syncStatus` guard and 800ms
debounced save as Vibration.

Verification: same method as Vibration — `npx esbuild` bundle-check,
existing `HermeticSuppliedModuleExperience.test.js` (copy-parsing tests,
unaffected) still passes, Vite dev server + headless Chromium load of the
`/experiencemode/sovereign/reclamation-university/hermetic-hall/mentalism`
route correctly redirected to `/login` with no errors attributable to the
change. Not verified: the signed-in experience (same Supabase-credentials
gap as Vibration). Full suite: 103/108 tests pass, same 5 pre-existing
unrelated failures as before.

**Done:** `PolarityModuleExperience.jsx` (Hermetic Hall Module IV) — this
was localStorage-only (key `ckp-hermetic-hall-module-4`): progress reached
the browser's storage but never the server, so it never synced across
devices and was lost with cleared site data. The hydrate/save payload
shape (`activeIndex`, `maxIndex`, `completedIds`, `reflection`,
`reflectionSavedAt`, `protocolResponses`, `protocolDone`,
`protocolStepIndex`, `artifactGenerated`, `artifact`, `artifactSituation`,
`patternStatement`, `artifactCreatedAt`, `artifactUpdatedAt`,
`moduleCompleted`) is unchanged from the localStorage version — only the
underlying store changed, from `window.localStorage` to
`useSovereign().reflection.recordReflection()` under key
`hermetic-hall/polarity:record`. Same wrapper/hydrate-guard/800ms-debounce
pattern as Vibration and Mentalism/Correspondence. One naming wrinkle
worth flagging for the remaining modules: this component already had its
own local `reflection` state (the reflection-textarea string), which
collides with the runtime's `useSovereign().reflection` domain — resolved
by destructuring it as `sovereignReflection`.

Verification: same method as the prior two — `npx esbuild` bundle-check
(no naming-collision or syntax errors), Vite dev server + headless
Chromium load of the `/experiencemode/sovereign/reclamation-university/
hermetic-hall/polarity` route correctly redirected to `/login` with no
errors attributable to the change. Not verified: the signed-in experience
(same Supabase-credentials gap as the prior two modules). Full suite:
129/134 tests pass, same 5 pre-existing unrelated failures as before (no
dedicated test file exists for this component).

**Done:** `RhythmModuleExperience.jsx` (Hermetic Hall Module V) — same
localStorage-only pattern as Polarity (`STORE_KEY`
`ckp-hermetic-hall-module-5`), same fix: hydrate/save payload unchanged
(`activeIndex`, `maxIndex`, `completedIds`, `reflection`,
`reflectionSavedAt`, `protocolResponses`, `protocolDone`,
`protocolStepIndex`, `responseKind`, `interventionPoint`,
`artifactGenerated`, `artifact`, `patternStatement`, `artifactCreatedAt`,
`artifactUpdatedAt`, `sevenDayPracticeStarted`, `sevenDayPracticeEntries`,
`moduleCompleted`, plus the static `moduleId`/`principleId` tags already
in the payload), just the store swapped to
`useSovereign().reflection.recordReflection()` under key
`hermetic-hall/rhythm:record`. Same local-`reflection`-state naming
collision as Polarity, same fix (`sovereignReflection`).

Verification: same method as Polarity — `npx esbuild` bundle-check, Vite
dev server + headless Chromium load of the
`/experiencemode/sovereign/reclamation-university/hermetic-hall/rhythm`
route correctly redirected to `/login` with no errors attributable to the
change. Not verified: the signed-in experience (same Supabase-credentials
gap as the prior modules). Full suite: 129/134 tests pass, same 5
pre-existing unrelated failures as before (no dedicated test file exists
for this component).

**Done:** `CauseEffectModuleExperience.jsx` (Hermetic Hall Module VI) — same
localStorage-only pattern as Polarity/Rhythm (`STORE_KEY`
`ckp-hermetic-hall-module-6`), same fix: hydrate/save payload unchanged
(`activeIndex`, `visited`, `engaged`, `reflection`, `reflectionSavedAt`,
`protocolResponses`, `protocolDone`, `protocolStepIndex`,
`artifactGenerated`, `artifact`, `draftPattern`, `draftAccepted`,
`artifactCreatedAt`, `artifactUpdatedAt`, `dashboardSavedAt`,
`moduleCompleted`, plus the static `moduleId`/`principleId` tags), just the
store swapped to `useSovereign().reflection.recordReflection()` under key
`hermetic-hall/cause-and-effect:record`. Same local-`reflection`-state
naming collision, same fix (`sovereignReflection`).

Verification: same method as Polarity/Rhythm — `npx esbuild` bundle-check,
Vite dev server + headless Chromium load of the
`/experiencemode/sovereign/reclamation-university/hermetic-hall/cause-and-effect`
route correctly redirected to `/login` with no errors attributable to the
change. Not verified: the signed-in experience (same Supabase-credentials
gap as the prior modules). Full suite: 129/134 tests pass, same 5
pre-existing unrelated failures as before (no dedicated test file exists
for this component).

**Done:** `GenderModuleExperience.jsx` (Hermetic Hall Module VII, the final
principle) — same localStorage-only pattern as Polarity/Rhythm/Cause &
Effect (`STORE_KEY` `ckp-hermetic-hall-module-7`), same fix: hydrate/save
payload unchanged (`activeIndex`, `visited`, `engaged`, `reflection`,
`reflectionSavedAt`, `protocolResponses`, `protocolDone`,
`protocolStepIndex`, `artifactGenerated`, `artifact`, `artifactCreatedAt`,
`artifactUpdatedAt`, `dashboardSavedAt`, `moduleCompleted`, plus the static
`moduleId`/`principleId` tags), just the store swapped to
`useSovereign().reflection.recordReflection()` under key
`hermetic-hall/gender:record`. Same local-`reflection`-state naming
collision, same fix (`sovereignReflection`).

Verification: same method as the prior three — `npx esbuild` bundle-check,
Vite dev server + headless Chromium load of the
`/experiencemode/sovereign/reclamation-university/hermetic-hall/gender`
route correctly redirected to `/login` with no errors attributable to the
change. Not verified: the signed-in experience (same Supabase-credentials
gap as the prior modules). Full suite: 129/134 tests pass, same 5
pre-existing unrelated failures as before (no dedicated test file exists
for this component).

This completes all seven Hermetic Hall module engines (Mentalism through
Gender) — every one now persists through the Sovereign Runtime's
local+remote sync instead of localStorage-only or no persistence at all.

**Deliberately skipped for this pass:** `HermeticCurriculumModule.jsx`.
Unlike the seven modules above, this one is not broken: it already
persists to Supabase per-module (`useReclamationModuleProgress` →
`saveUserProgress`/`loadUserProgress`, keyed by `module.id`) with a
`localStorage` mirror as an offline fallback, plus a separate
`saveCompletion` write (response-table row + journal entry) and analytics
events on load/save/complete. What `SOVEREIGN_STATE_MAP.md` §1 flags for
it is schema hygiene, not data loss: it reuses `rec_uni_user_progress`
columns (`active_scene`, `listened_track_ids`, `declaration_json`) that
`ReclamationModuleEngine.jsx` uses for different meanings elsewhere
(curriculum-section-index vs. 5-scene-index, lesson ids vs. track ids) —
confusing for anything reading across modules generically, but each
module gets its own row, so it isn't actively corrupting data today.
Asked the user how to handle it given the added risk of rewriting a
working save/completion/analytics flow for consistency rather than fixing
a bug; the answer was to leave it as-is and treat any future migration as
a deliberate, planned structural pass (e.g. once a later phase actually
needs the runtime's typed domains here) rather than a drive-by fix
alongside the other five.

**Also deliberately skipped:** `ReclamationModuleEngine.jsx` — the shared
persistence engine for every non-Hermetic-Hall faculty (broader blast
radius than `HermeticCurriculumModule.jsx`, since it's the one component
behind all of them). Reviewed and found the same category as
`HermeticCurriculumModule.jsx`, not a new one: `saveProgress`/
`saveCompletion` (via `useReclamationModuleProgress`) are already called
on every meaningful interaction — track listened, Shadow Code toggled,
Light Code retrieved, scene advance, declaration seal, completion — with
legacy-ID normalization for backward compatibility and a working
unlock-gate/Integration-Key/journal-save flow. Not broken, not missing
persistence. Applying the same call the user already made for
`HermeticCurriculumModule.jsx` rather than re-litigating it: left as-is,
future migration deferred to a deliberate structural pass rather than a
drive-by fix.

**Phase 8 status**: complete for this pass. All seven Hermetic Hall
principles (Mentalism, Correspondence, Vibration, Polarity, Rhythm,
Cause & Effect, Gender — six components, since Mentalism and
Correspondence share `HermeticSuppliedModuleExperience.jsx`) had actually
broken or missing persistence and now route through the Sovereign
Runtime's local+remote sync. The two remaining Reclamation University
components (`HermeticCurriculumModule.jsx`, `ReclamationModuleEngine.jsx`)
already have working Supabase persistence and were deliberately left
alone rather than rewritten for architectural consistency alone — that's
future work, not a Phase 8 bug fix.

## Phase 9 (in progress): Media Runtime

Per `SOVEREIGN_STATE_MAP.md` §8, audio playback today is two fully
independent, non-communicating stacks: `context/audioprovider.jsx`
(`AudioProvider`/`useAudio`, one consumer — `ReclamationCodex.jsx`) and
`modules/sovereign/AudioVisualizerCore.jsx` (its own separate `<audio>`
element, `useState`, and the only place `lib/audio/useAudioAnalyzer.js`'s
`AnalyserNode` gets instantiated). Neither persists across reload, and
nothing stops both from playing concurrently if both are mounted.

This pass built out the runtime's `media` domain — state shape for it
already existed in `sovereignState.js` since Phase 3, but had zero actions
or reducer cases, so it was pure dead scaffolding until now — following
the same "build the layer standalone, verify with tests, wire into live
code as a separate later pass" sequencing used for Phases 3-7 before
Phase 8 touched live components:

- **Actions** (`sovereignActions.js`): `loadTrack(trackId)` (swaps the
  active track, resetting `position`/`duration`, mirroring what a new
  `<audio src>` does — does not auto-play), `play()`/`pause()` (no-op
  without a loaded track, same invariant as `sealArtifact()` without a
  draft), `seek(position)` (a discrete user jump), `advancePosition(position)`
  (the continuous per-frame tick a playing track emits — kept distinct
  from `seek` because only a discrete jump is event-worthy),
  `setDuration(duration)`, `setVolume(volume)` (clamped 0-1),
  `selectAnchor(anchorKey)`/`selectMediaConcept(conceptId)` (which lyric
  anchor/concept is "live" for whatever's playing — for the Concept Graph,
  Phase 10, to consume later).
- **Reducer** (`sovereignReducer.js`): one case per action above, all pure
  state transitions against `state.media`.
- **Events** (Phase 6's event bus): `MEDIA_STARTED`/`MEDIA_PAUSED` now
  wired to `play()`/`pause()`, firing only on a real playing-state
  transition (not on redundant repeat calls); `MEDIA_SEEKED` wired to
  `seek()`; `LYRIC_ANCHOR_SELECTED` wired to `selectAnchor()`. These four
  event types existed in `eventTypes.js` since Phase 6, marked "pending
  Phase 9" — now marked wired. `advancePosition`/`setDuration`/`setVolume`/
  `selectMediaConcept` intentionally emit nothing (continuous or
  not-yet-reserved an event type), consistent with the rest of the event
  taxonomy only covering meaningful transitions.
- **`useSovereign()`**: the `media` domain now bundles the state slice
  with all nine bound actions, same pattern as every other domain.

Verification: 13 new tests (8 reducer, 5 event-mapping) covering the
no-op-without-a-track guards, the playing-state-transition-only event
firing, volume clamping, and that `activeConcept`/`activeAnchor` are
independent of the Concept Graph's own `concepts.selected` array. Full
suite: 187/193 tests pass — same 6 pre-existing failures as before
(confirmed via `git stash`/`git stash pop` against the base commit),
0 introduced. `npx esbuild` bundle-checked all three `sovereign/*/index.js`
barrels.

### Phase 9, second increment: wiring `AudioProvider`

Attempting the actual live-wiring surfaced a real design gap: `loadTrack`
as first built always reset `isPlaying` to `false`, matching Reclamation
University's "load a step, wait for explicit play" pattern — but that
would have broken `AudioProvider`'s continuous queue playback (skip /
auto-advance-on-end both just change the current track and expect
playback to keep going, the way every real media player behaves). Since
nothing live depended on the old reset-to-false behavior yet, fixed
`loadTrack` to leave `isPlaying` untouched — a caller that wants a freshly
loaded track to start paused now has to call `pause()` itself. Updated
its test coverage: one test for "load while paused stays paused", a new
one for "load while playing keeps playing."

With that fixed, `context/audioprovider.jsx` (`AudioProvider`/`useAudio`)
now dispatches its playback primitives — `isPlaying`, `currentTime`
(-> `position`), `duration`, `volume` — through the Sovereign Runtime's
reducer via a bare `useReducer(sovereignReducer, createInitialState())`,
instead of five parallel `useState` calls. Deliberately **not** mounted
through `<SovereignProvider>`: that component's automatic local+remote
persistence is designed for per-module curriculum state, and `AudioProvider`
is mounted once at the true app root (`index.jsx`, wrapping all of `<App/>`)
— routing it through the full provider would start syncing this always-
mounted component's other, empty domains (identity/curriculum/reflection/
concepts/artifact) to Supabase on every signed-in page load, for a concern
that has nothing to do with any of them. Using the reducer directly gets
the shared, tested state-transition logic and invariants without that
unwanted dependency. The `queue`/`currentTrackIndex` playlist concept
stays local `useState`, unchanged — the runtime's `media` domain only
models "what's currently playing," not a playlist, so there's no matching
concept to migrate it to. `useAudio()`'s public return shape is byte-for-
byte unchanged, so its one live consumer (`ReclamationCodex.jsx`) needed
no changes at all. Also fixed one latent mismatch caught while doing this:
the mount effect hard-sets `audio.volume = 0.78` but nothing previously
told the exposed `volume` value to match — added the matching
`setVolume(0.78)` dispatch so the displayed volume can't drift from the
actual playing volume.

Verification: `npx esbuild` bundle-checked `audioprovider.jsx`; full test
suite 188/194 (same 6 pre-existing failures, 0 introduced); headless
Chromium load of `/` (the true app root — if `AudioProvider` crashed,
nothing in the app would render) and of `/protocol/3`
(`ReclamationCodex`'s route), both loading cleanly with only the same
pre-existing sandbox network noise seen on every other route checked this
session, and `/protocol/3` correctly redirecting to `/login` for an
unauthenticated visitor. **Not verified**: actual audio playback — no
speakers or real user interaction available in this sandboxed environment,
and this is exactly the kind of thing that can't be confirmed by absence
of console errors alone (e.g., whether the queue truly keeps playing
uninterrupted across a track boundary). Flagging this explicitly rather
than overclaiming: the fix above was found and reasoned through via static
analysis of the diff, not confirmed by hearing it work.

**Deliberately not attempted in this pass**: `AudioVisualizerCore.jsx`.
Reviewed it in detail and found it's a substantially bigger lift than
`AudioProvider`: `isPlaying` and the selected track are controlled by its
*parent* (`VisualizerCorePage.jsx`) via props/callbacks rather than owned
internally; its local state includes several fields with no equivalent in
the runtime's media schema at all (`isMuted`, `isShuffle`, `playbackRate`,
`showSettings`, `trackPage`, fullscreen state); and its DOM `<audio>`
event handlers (`onLoadedData`/`onPlaying`/`onTimeUpdate`/`onEnded`) are
tightly interleaved with the `useAudioAnalyzer` start/stop calls in ways
that would need careful re-sequencing to route through dispatch safely.
Migrating it — and deciding what happens to its fully independent
`<audio>` element relative to `AudioProvider`'s (`SOVEREIGN_STATE_MAP.md`
§8's "two non-communicating stacks" finding is only half-resolved until
this happens) — is real scope for a dedicated future pass, not a
same-session follow-on to the `AudioProvider` wiring.

## Phase 10 (first increment): scoping concept selection per module

`SOVEREIGN_STATE_MAP.md` doesn't cover a "Concept Graph" state category at
all — Phase 2's inventory predates it, and the live app's closest analog
(`modules/sovereign/matrx-alchemizr/`, Act III's lyric-tagging tool, with
its own five `TAG_CATEGORIES` and its own `alchemizrReducer.js`) is a
different, self-contained feature, not a source this phase draws from.
What *is* concretely evidenced is a placeholder the Phase 4 step machine
had been carrying since it was built: `KEY_CONCEPTS`'s completion
criterion checked `concepts.selected.length > 0` — *any* concept selected
*anywhere* in the whole session — with a code comment explicitly flagging
it as a stand-in "until Phase 10 (Concept Graph) scopes concept selection
per module." That's what this increment closes.

Fixed by tracking, on each module's own state (`SovereignModuleState`,
alongside `viewedSteps`/`completedSteps`), which concepts were selected
while *that* module was active (`selectedConcepts: []`) — rather than
reshaping the top-level `concepts.selected` list itself into something
module-keyed. That choice follows a constraint already latent in the
Phase 7 SQL schema: `sovereign_concepts` has `unique(user_id, concept_id)`
— a concept, once selected, is one global fact about the user, matching
`concepts.selected`'s existing global-dedup behavior. Module-scoping which
*step* gets credit for a selection is a different, additive concern, so it
lives on the module record instead. `selectConcept(conceptId, moduleId)`
now takes an optional second argument (defaulting to `null`, an unscoped
selection); the reducer updates the global list as before *and*, when a
moduleId is given, credits it to that module. `useSovereign()`'s
`concepts.selectConcept` defaults the moduleId to the currently active
module (same fallback pattern `synthesis.executeProtocol` already used),
so a caller mid-module doesn't have to pass it explicitly.
`sovereignSteps.js`'s `KEY_CONCEPTS` criterion now reads
`module.selectedConcepts.length > 0`. `CONCEPT_SELECTED`'s event payload
gained the same `moduleId` field concept-adjacent events already had.

Extended, not narrowed: the still-unapplied Phase 7 migration SQL gained a
`selected_concepts text[]` column on `sovereign_module_state` (safe to
edit — nothing has been applied to a live database yet), and
`sovereignRemoteMapping.js`'s `moduleStateToRow`/`rowToModuleState` carry
it. `sovereignReconciliation.js` needed no changes: `reconcileModules`
already merges whole module records by recency, so the new field rides
along automatically.

One correctness bug surfaced and fixed while wiring this in for real:
three existing tests (`walkToReflectionGate` in
`mapActionToEvents.test.js`, and one test each in `sovereignSteps.test.js`
and `sovereignRemoteMapping.test.js`) called `selectConcept('shadow-work')`
with no moduleId, which the *old*, global-only criterion happened to
satisfy for every module at once — exactly the bug this phase exists to
close. Updated them to pass the module they're actually walking through,
and added a dedicated regression test (`sovereignSteps.test.js`) asserting
a concept selected for one module does *not* satisfy a different module's
KEY_CONCEPTS step, which would have caught the old behavior directly.

Verification: 5 new tests (3 reducer, 1 steps regression, 1 event-mapping)
plus 3 existing tests fixed for the new module-scoping. Full suite:
193/199 — same 6 pre-existing unrelated failures, 0 introduced. `npx
esbuild` bundle-checked all `sovereign/*/index.js` barrels plus
`audioprovider.jsx`. Nothing here touches live UI — same "standalone
scaffolding first" posture as Phases 3-7 before Phase 8's live wiring.

**Not attempted in this pass**: the rest of what "Concept Graph" likely
means per the migration guide — an actual authored graph of concepts
(nodes with real identities/metadata, not just opaque ids a caller
invents), a browsing UI, and `CONCEPT_OPENED` (still pending — no "viewed
without selecting" action exists). This increment only closes the one
concretely-evidenced gap the codebase itself had already flagged.

## Phase 11: the Domain Matrix

The user supplied this phase's actual text mid-session (Phases 1-10 up to
this point had been executed from a paraphrased/summarized memory of the
original guide after context compaction — Phase 10 in particular had to
be scoped from codebase evidence alone because the real spec wasn't
available). Built to the literal spec: eight domains (Psychology,
Technology, Economics, Culture, Power, Language, Systems, Identity) ×
four roles (Condition, Cause, Effect, Feedback), where "each domain
references concepts rather than owning duplicate definitions" and "the
same concept can exist across multiple domains."

New: `sovereignDomains.js` — the static domain/role catalog
(`SOVEREIGN_DOMAINS`, `SOVEREIGN_DOMAIN_ROLES`), `isValidDomain`/
`isValidDomainRole`, and two pure derivations: `buildDomainMatrix(concepts)`
(the literal grid the guide draws — one row per domain, one column per
role, every cell present even when empty, so a future renderer never has
to special-case a gap) and `domainsForConcept(concepts, conceptId)` (the
inverse view: every domain/role a given concept has been mapped into).
`concepts.domainMappings: []` was added to `sovereignState.js` alongside
the existing `selected`/`connections` arrays — a mapping is a
`{conceptId, domain, role, mappedAt}` triple, deliberately *not* a new
place a concept gets defined (the concept itself still only exists as an
id in `concepts.selected`, Phase 10). `mapConceptToDomain(conceptId,
domain, role)` is the new action; the reducer no-ops on an unknown
domain/role (validated against the catalog) or an exact repeat of an
existing triple, and otherwise appends — the same "concept can carry
multiple roles across multiple domains" flexibility the guide's matrix
diagram implies is preserved (no artificial one-role-per-domain
constraint). `CONCEPT_DOMAIN_MAPPED` is a new event type — Phase 6's
taxonomy predates the Domain Matrix, so there was no placeholder slot to
fill, unlike Phase 9's four pre-reserved media events — wired to fire
only when a mapping genuinely lands (not on a no-op).

Extended the persistence layer the same way Phase 7 built it for
`concepts.connections`: a new `sovereign_domain_mappings` table (still
unapplied to any live database, so free to edit) with
`unique(user_id, concept_id, domain, role)`, RLS policies, and grants
matching `sovereign_connections`' shape exactly; `sovereignRemoteMapping.js`
gained `domainMappingToRow`/`rowToDomainMapping`/`domainMappingsToRows`/
`rowsToDomainMappings`; `sovereignSupabaseSync.js` fetches/pushes the new
table (upsert with `ignoreDuplicates: true`, same as connections);
`sovereignReconciliation.js` gained `reconcileDomainMappings`, a
set-union by `(conceptId, domain, role)` fingerprint — additive-only data,
same policy class as connections. Also cleaned up one now-resolved loose
end from Phase 7: `sovereign_concepts.module_id` was a column added in
anticipation of module-scoped concept selection that Phase 10 ended up
solving a different way (via `sovereign_module_state.selected_concepts`
instead), leaving it permanently unused — removed it rather than leave a
column nothing ever wrote to.

`useSovereign()`'s `concepts` bundle gained `mapConceptToDomain` and a
computed `domainMatrix` (the live grid, recalculated whenever concepts
change) — a component can render the matrix directly without calling
`buildDomainMatrix` itself.

Verification: 15 new tests (7 in a new `sovereignDomains.test.js` for the
catalog and both pure derivations, 4 reducer, 2 event-mapping, 2 remote
mapping round-trip) plus 3 existing persistence tests fixed for the new
`domainMappings` field (same "hand-built fixture predates the new field"
issue Phase 10 hit). Full suite: 210/216 — same 6 pre-existing unrelated
failures, 0 introduced. `npx esbuild` bundle-checked all
`sovereign/*/index.js` barrels. No live UI touched — domain mapping has
no live consumers yet, same posture as every phase since Phase 3 up
until Phase 8's live wiring began.

**Not attempted in this pass**: any UI for actually assigning a concept
to a domain/role (that's Phase 16, Visual Interaction Layer, per the
guide's own sequencing) and any seeded/authored initial matrix content —
this phase is the data model and persistence, not populated data.

## Phase 12: reflection as structured state

Built to the guide's spec: "instead of question/textarea/save, use Prompt
-> Reflection -> Concept extraction/selection -> User editing -> Decision
-> State," with "the user must explicitly choose what is retained" and
"USER = authority, AI = instrument."

The existing `recordReflection(moduleId, promptId, response)` — one
atomic write — could not simply be redefined into this pipeline: all
seven live Phase 8 Reclamation University components use it to persist
their *entire* local module state as a single JSON blob under a reserved
`"record"` promptId, not an actual reflection. Redefining what that
action does, or what `entries[key].response` means, would have broken
shipped, working code for no reason. So Phase 12 is purely additive:
`recordReflection` is untouched, byte-for-byte, and still satisfies the
REFLECTION step exactly as before; four new actions
(`startReflection`/`updateReflection`/`extractConcepts`/
`commitReflection`) implement the real staged pipeline as a second,
richer way to write the same `reflection.entries` dict, for any caller
that wants it. A reflection entry now optionally carries `status`
(`'draft'` | `'committed'`), `candidateConcepts`, `retainedConcepts`,
`startedAt`, and `committedAt` alongside the original `response`/
`updatedAt` — entries written by the old atomic path simply never
populate those fields, which every consumer already treats as optional.

The four stages, concretely: `startReflection(moduleId, promptId)` marks
a prompt begun (idempotent — re-opening an in-progress draft doesn't
reset `startedAt` or wipe what's written); `updateReflection(...,
response)` records each edit; `extractConcepts(..., conceptIds)` records
which concepts are *candidates* — the action doesn't care whether a human
typed them or a future AI suggested them, since nothing about "surfacing
candidates" is itself a decision; `commitReflection(..., response,
retainedConcepts)` is the actual Decision — the one place a human chooses
the subset of candidates that's actually kept. Critically, `commitReflection`
doesn't just record `retainedConcepts` as a note on the entry: each
retained concept is credited into the real Concept Graph exactly as
`selectConcept()` would (both `concepts.selected` and the module's
`selectedConcepts`), via a `creditConceptSelection()` helper now shared
by both action's reducer cases — a rejected candidate never reaches the
Concept Graph at all. This is what makes the pipeline real rather than
decorative: "Decision -> State" in the guide's diagram means the decision
actually mutates the state other systems (Phase 4's KEY_CONCEPTS
criterion, Phase 10/11's Concept Graph and Domain Matrix) already read.

Events: `REFLECTION_STARTED`/`REFLECTION_UPDATED` — placeholders in
`eventTypes.js` since Phase 6, marked "pending Phase 12" — are now wired.
`REFLECTION_CONCEPTS_EXTRACTED` is a new event type (no Phase 6 slot
existed for it, same as `CONCEPT_DOMAIN_MAPPED` in Phase 11), firing only
when the candidate list actually changes. `commitReflection` fires the
existing `REFLECTION_COMMITTED` (shared with `recordReflection`, since
it's the same semantic event from a richer input path) plus one
`CONCEPT_SELECTED` per retained concept, so anything subscribed to
concept-selection events sees the same thing regardless of which path
added it.

Persistence extended the same way as every prior phase: `sovereign_reflections`
(still unapplied to any live database) gained `status`/`candidate_concepts`/
`retained_concepts`/`started_at`/`committed_at` columns, with sensible
defaults so a row written by the old atomic path still round-trips
cleanly; `reflectionEntryToRow`/`rowToReflectionEntry` carry the new
fields (defaulting missing values the same way the SQL columns do, so
Phase-8-written rows and Phase-12-written rows round-trip through the
identical code path); `sovereignReconciliation.js` needed no changes —
`reconcileReflectionEntries`'s existing whole-entry-by-`updatedAt` policy
already carries new fields along for free, same as Phase 10's
`selectedConcepts` addition to modules did.

Verification: 12 new tests (7 reducer — including one explicitly proving
`recordReflection`'s Phase 8 usage is unaffected — 4 event-mapping, 1 new
+ 1 rewritten remote-mapping round-trip) plus one existing persistence
test fixed for the new columns. Full suite: 222/228 — same 6 pre-existing
unrelated failures, 0 introduced. `npx esbuild` bundle-checked all
`sovereign/*/index.js` barrels; since this phase touched `useSovereign.js`/
`SovereignProvider.jsx` (shared by every live Reclamation University
component from Phase 8), also re-bundle-checked
`VibrationModuleExperience.jsx` directly and did a headless-browser load
of both the app root and one live Hermetic Hall route — clean, only the
same pre-existing sandbox network noise, both correctly redirecting an
unauthenticated visitor to `/login`.

**Not attempted in this pass**: any UI for an actual reflection prompt
screen (nothing live calls these new actions yet — same "runtime first,
wire into components later" posture used since Phase 3), and any AI
integration for `extractConcepts` (Phase 18, deliberately last per the
guide — "AI can assist with X" describes a future caller populating
`conceptIds`, not anything built here). The REFLECTION step's completion
criterion also deliberately still accepts *any* entry (`reflectionEntry
!== null`), not specifically a `status: 'committed'` one — tightening
that to require a genuine commit would be truer to "the user must
explicitly choose what is retained," but would also change what already-
passing tests and the existing REFLECTION_COMMITTED-via-`recordReflection`
path mean, which is exactly the kind of breaking change this pass
deliberately avoided.

## Phase 13: the Synthesis Engine

Per the guide: "only once reflections + concepts + decisions exist should
synthesis begin" — Phases 10-12 built exactly those, so this phase adds
**no new mutable state**. `frontend/src/sovereign/synthesis/` (a new
top-level directory alongside `runtime/`, `events/`, `persistence/`,
matching the guide's own naming for this as a distinct engine) is pure
derivation over state that already exists — the same pattern
`buildDomainMatrix()` (Phase 11) and `evaluateModuleSteps()` (Phase 4)
already established.

`buildSynthesisState(state)` collects what the guide lists — completed
modules, reflections, selected concepts, concept relationships, protocol
decisions, domain mappings. Two guide-listed inputs are deliberately
**not** collected: "user declarations" (no runtime state models a
declaration at all — that still lives entirely in
`ReclamationModuleEngine.jsx`'s own local state, left alone in Phase 8
since it already works) and "media references" (the media domain, Phase
9, tracks only what's *currently* playing, not a history of a journey's
media). Inventing that data here to check a box would be exactly the
"downstream layer on a faked upstream one" the guide's sequencing rule
warns against — both are real, named gaps for whichever future phase
actually builds that state.

`buildSynthesisGraph(synthesisState)` relates those pieces as nodes and
edges rather than leaving them as five flat lists — module/concept/
protocol/reflection nodes; `REFLECTED_IN`, `RECLAIMED`, `REJECTED`,
`CHOSE_PROTOCOL`, the connection's own relationship type, and
`DOMAIN_<ROLE>` edges. The `REJECTED` edge only fires for a candidate
concept that never entered the Concept Graph via *any* path (checked
against `concepts.selected`, not just that one reflection) — a concept
rejected in one reflection but reclaimed via another must never show as
rejected.

The six questions from the guide are individually testable functions,
not a generic query API:
- `whatDidIIdentify` — every selected concept.
- `whatPatternsDidIFind` — a concept recurring across more than one
  Domain Matrix (domain, role) pairing. Deliberately *not* the same data
  as relationships below (both could otherwise read `concepts.connections`
  and give redundant answers to two different guide questions) — a
  pattern is "the same idea keeps showing up across contexts," which the
  Domain Matrix, not the connection graph, actually encodes.
- `whatDidIReject` — every reflection candidate that never made it into
  `concepts.selected` by any path.
- `whatDidIReclaim` — concepts retained specifically through a
  reflection's Decision stage (`commitReflection`'s `retainedConcepts`),
  distinct from concept selection in general.
- `whatRelationshipsDidIEstablish` — the literal `concepts.connections`
  graph edges.
- `whatProtocolDidIChoose` — every recorded protocol execution.

Also gave real meaning to `SovereignModuleState.synthesisReadiness`, a
field that has been declared, persisted, and round-tripped since Phase 3
without anything ever computing or reading it. `moduleSynthesisReadiness(state,
moduleId)` is the fraction of the 11 real steps `evaluateModuleSteps()`
reports complete — writing this while implementing it surfaced a real
distinction worth documenting: `module.completedSteps` (set only by the
separate, lower-level `completeStep()` action) is **not** what
`evaluateModuleSteps()` actually reads to determine real completion — the
criteria-based system built in Phase 4 evaluates each step's own
condition (viewed, a committed reflection, a protocol execution, a sealed
artifact) directly from state, never consulting `completedSteps` at all.
`completeStep()`/`module.completedSteps` is effectively a vestigial,
disconnected primitive nothing in the real step-completion flow calls —
readiness is deliberately computed from the real criteria, not that
array, and is exposed live (`useSovereign().module.synthesisReadiness`)
rather than written back into the stored, still-unused field.

`useSovereign()`'s `synthesis` bundle now exposes `synthesisState`,
`synthesisGraph`, and all six question functions as live computed values
alongside the existing `executeProtocol`.

Verification: 16 new tests in a new `sovereignSynthesis.test.js` covering
readiness (including the `completedSteps`-is-ignored distinction above),
`buildSynthesisState`'s collection (and that a merely-started module
isn't miscounted as completed), graph edge construction (including the
cross-reflection REJECTED/RECLAIMED non-collision case), and all six
questions independently. Full suite: 238/244 — same 6 pre-existing
unrelated failures, 0 introduced. `npx esbuild` bundle-checked all four
`sovereign/*/index.js` barrels; since this phase touched `useSovereign.js`
again, re-bundle-checked `VibrationModuleExperience.jsx` directly and did
a headless-browser load of the app root and one live Hermetic Hall route
— clean, same pre-existing sandbox network noise only, correctly
redirecting to `/login`.

**Not attempted in this pass**: nothing live calls any of this yet — same
posture as every phase since Phase 3. Phase 14 (the Artifact Compiler)
is the guide's stated next consumer of `SynthesisState`/the graph.

## Phase 14: the Artifact Compiler

The guide's pipeline: Sovereign State -> Artifact Schema -> Renderer ->
Editable Canvas -> User Revision -> Seal -> Export. Two of those stages
are UI (Renderer, Editable Canvas — Phase 16, Visual Interaction Layer)
and out of scope here; Seal already existed (`sealArtifact()`, Phase 3).
This phase builds the rest: the Schema, the Compiler that produces it
from Synthesis State, User Revision, and Export.

New `frontend/src/sovereign/artifact/` (a fourth top-level directory,
alongside `runtime/`, `events/`, `persistence/`, `synthesis/`).
`artifactSchema.js` defines the four schema pieces the guide names —
`createArtifactDocument`/`Section`/`Block`/`Decision` — plus a fifth,
`createArtifactRevision`, tracked separately from the document itself
(see below) rather than as a field inside it. `compileArtifactDocument(synthesisState)`
is the literal Compiler: Sovereign State -> Artifact Schema, a pure
function producing a fresh `ArtifactDocument` from a Phase 13
`SynthesisState`, with every block and decision carrying a `sourceRef`
back to where it came from (a concept id, or a `moduleId:promptId`
reflection key). It compiles two sections today ("What I Identified" from
`selectedConcepts`, "Reflections" from committed reflection responses)
and two kinds of decisions (`concept-retained`, from each committed
reflection's `retainedConcepts` — a rejected candidate never appears, the
same distinction Phase 13's `whatDidIReject`/`whatDidIReclaim` draw;
`protocol-chosen`, from `protocolDecisions`). Calling it twice with the
same input produces an equal document — pure, like every derivation since
Phase 11's `buildDomainMatrix`.

**User Revision** deliberately isn't a new action. `generateArtifact()`
already existed (Phase 3) and Phase 6 already distinguished a first draft
(`ARTIFACT_STARTED`) from a redraft (`ARTIFACT_EDITED`) by whether a prior
draft existed — that distinction *is* "is this a revision," so
`GENERATE_ARTIFACT`'s reducer case now also snapshots the prior draft into
`artifact.revisions` (a new field, sibling to `draft`/`status`/`sealedAt`)
whenever a redraft actually replaces one, via `createArtifactRevision`.
Calling `generateArtifact()` again with an edited copy — whether typed by
hand or produced by re-running the compiler — is what "editing before
sealing" looks like at the state layer; a canvas UI (Phase 16) would just
be a nicer way to produce that edited copy.

**Export**: `artifactExport.js`'s `exportArtifactToMarkdown(document)` —
pure, format-only, doesn't care whether the document is sealed or still a
draft. Renders each non-empty section as a heading with its blocks as a
list, and decisions under their own heading with a human-readable label
per kind. Other formats (PDF, a Cloudflare-hosted page) are Phase 17's
concern once there's somewhere real to serve them from; Markdown alone is
enough to prove Export is real.

Persistence: `sovereign_artifacts` (still unapplied to any live database)
gained a `revisions_json jsonb` column, matching `draft_json`'s reasoning
(the schema is still expected to grow, and a document is always read/
written whole) rather than normalized columns; `artifactToRow`/
`rowToArtifact` carry it, defaulting missing values the same way
Phase 10/12's additions did. `sovereignReconciliation.js` needed no
changes — `reconcileArtifact` already picks a whole artifact object by
status-priority, so `revisions` rides along with whichever side wins.

`useSovereign()`'s `artifact` bundle gained `compileFromSynthesis()`
(compiles from the current Synthesis State and dispatches it as a
(re)draft in one call) and `exportMarkdown()` (exports the current draft),
so a future caller doesn't need to import from `sovereign/synthesis` or
`sovereign/artifact` directly.

Verification: 18 new tests (7 schema/compiler, 5 export, 3 reducer
revision-tracking, 2 remote-mapping/sync fixed for the new column, 1
default-for-a-pre-Phase-14-row case). Full suite: 252/258 — same 6
pre-existing unrelated failures, 0 introduced. `npx esbuild`
bundle-checked all five `sovereign/*/index.js` barrels; since this phase
touched `sovereignReducer.js`/`useSovereign.js` again, re-bundle-checked
`VibrationModuleExperience.jsx` directly and did a headless-browser load
of the app root and one live Hermetic Hall route — clean, same
pre-existing sandbox network noise only.

**Not attempted in this pass**: no Renderer or Editable Canvas (Phase 16);
no PDF/hosted export (Phase 17); nothing live calls any of this yet, same
posture as every phase since Phase 3.

## Phase 15: the Sovereign OS Shell

The first UI phase since Phase 8, and a different kind of change from
everything built between them — Phases 9-14 were all standalone
runtime/persistence layers with zero live consumers; this is a real,
rendered interface. Built to the guide's structure:

```
SovereignOS
├── Navigation
├── Module Context
├── Main Workspace
├── Concept Context
├── Media Runtime
└── Synthesis Status
```

`frontend/src/components/sovereign-os/SovereignOSShell.jsx` renders all
six regions and reads `useSovereign()` directly, so every region is live
— Navigation lists the seven Hermetic Hall modules and calls
`curriculum.startModule()`; Module Context shows the active module's
status/step-completion/synthesis readiness; Main Workspace is a
`children` slot; Concept Context, Media Runtime, and Synthesis Status
read the `concepts`/`media`/`synthesis`+`artifact` bundles respectively.
`SovereignOS.jsx` is the outer wrapper — mounts a `SovereignProvider`
(namespaced to the signed-in user, same pattern every Phase 8 component
uses) and renders the shell inside it, so "Shell = persistent, Module =
contextual, State = continuous" is literally true for whatever's mounted
as its `children`: switching modules, selecting concepts, or starting
playback anywhere sharing that provider updates every region at once
without the shell re-mounting.

**Deliberately not wired into the live Reclamation University route
tree.** Making the shell genuinely "survive module transitions" for the
seven already-shipped Hermetic Hall components would mean hoisting one
shared `SovereignProvider` above all of them and migrating every one of
those live wrappers away from mounting their own — a cross-cutting
routing/layout change to shipped code, categorically riskier than
anything since Phase 8's individual persistence swaps, and it deserves
its own scoped pass and explicit sign-off rather than folding into an
already-large phase. Instead, verified the shell for real via a new,
non-colliding, unlinked staging route: `/qa/sovereign-os` (added the same
way `/qa/sovereign` already exists in this app — unauthenticated,
reachable directly, not linked from anywhere live), rendering
`SovereignOSDemo.jsx` — a Main Workspace with buttons that dispatch real
actions (`startModule`, `selectConcept`, `loadTrack`+`play`,
`executeProtocol`).

Verification: `npx esbuild` bundle-checked the three new files plus
`App.jsx` itself (with the new route wired in). Full suite: 252/258 —
same 6 pre-existing unrelated failures, 0 introduced (no new unit tests —
this is UI, and this codebase has never had jsdom/testing-library
installed for component rendering, so verification here follows the same
bundle-check + live-browser standard used for every other UI change this
session). The live-browser check was the substantive one: loaded
`/qa/sovereign-os`, confirmed Module Context correctly shows "No module
active" before anything happens, then clicked through all four demo
buttons in sequence and confirmed each one's effect showed up in its
*own* panel — starting Mentalism updated Module Context, selecting a
concept updated Concept Context, loading+playing a track updated Media
Runtime, executing a protocol incremented Synthesis Status's protocol
count from 0 to 1 — proving the shared context genuinely propagates
across sibling components, not just that the page renders once. Only the
same pre-existing sandbox network noise appeared.

**Not attempted in this pass**: replacing or wrapping any live route with
this shell (the deferred follow-up described above); any visual polish
beyond the existing `SovereignModulePanel`-style dark/red Tailwind
aesthetic (that's Phase 16's job); a real navigation beyond the seven
Hermetic Hall modules (no non-Hall faculties, no cross-Act navigation).

## Phase 16: the Visual Interaction Layer

The guide lists seven elements ("SVG causal-chain animations,
scroll-linked progression, interactive concept nodes, dynamic hover
states, animated state transitions, visual progress, audio-reactive
surfaces") and draws one architectural line through all of them: visuals
must consume real runtime state (`scroll position -> current step ->
runtime -> event -> progress`), not drive `scroll position -> CSS
animation` in isolation. This pass built two real components covering
five of the seven elements, added to the `/qa/sovereign-os` staging page
from Phase 15 — chosen over attempting all seven shallowly, since a
component that doesn't actually read/dispatch real state would just be
the "merely animated" interface the guide is explicitly steering away
from.

**`ConceptGraphView.jsx`** (interactive concept nodes, dynamic hover
states, SVG causal-chain animation): renders one SVG circle per
`concepts.selected` id (no placeholder/sample nodes — an empty selection
renders an empty state, not mock data) and one line per
`concepts.connections` entry. A connection whose `relationship` matches
`/cause/i` gets a red, dashed, animated stroke (a `stroke-dashoffset`
keyframe in the new `sovereignOSVisuals.css`, disabled under
`prefers-reduced-motion`) — a real visual distinction for a real causal
edge, not decoration on state that doesn't exist. Hovering or clicking a
node highlights it and its directly-connected neighbors (dimming the
rest) and opens a detail panel reading that concept's actual Domain
Matrix placements via Phase 11's `domainsForConcept()`.

**`ScrollLinkedProgress.jsx`** (scroll-linked progression, visual
progress, animated state transitions): the guide's diagram implemented
literally. One section per real curriculum step
(`sovereignSteps.js`'s `SOVEREIGN_STEPS`); an `IntersectionObserver`
reports which section is actually in view and dispatches the *real*
`module.advanceStep(stepId)` — the same action any other step UI would
call — not a scroll-percentage kept in local component state. The
progress bar's width (with a CSS `transition` so it animates rather than
jumping) reads `module.steps`' genuine completion status, which matters:
scrolling past a step only marks it *viewed*, so a step whose real
criterion needs more than that (a committed reflection, a protocol
execution, a sealed artifact — Phase 4) does **not** silently complete
just because the user scrolled past its section. Verified live: scrolling
straight to the last section correctly dispatched `advanceStep` for it
(confirmed via the "currently scrolled to" readout changing), while the
completion count stayed exactly where Phase 4's real criteria say it
should — proof the component didn't quietly reintroduce "next is
complete," the exact anti-pattern Phase 4 was built to rule out.

**Not attempted in this pass**: **audio-reactive surfaces** — the
runtime's `media` domain (Phase 9) tracks only `isPlaying`/`position`/
`duration`, not frequency data; that still lives in
`useAudioAnalyzer.js`'s own local hook, deliberately not migrated when
`AudioVisualizerCore.jsx` was left alone in Phase 9. Building a
"real-runtime-state-driven" audio-reactive surface would mean either
inventing frequency state the runtime doesn't have, or building it
against the one local hook that isn't Sovereign state — either way, the
kind of faked-upstream-layer problem the guide's sequencing rule warns
against, so it's left as a named gap rather than faked. **Animated state
transitions** beyond the progress bar (e.g. a value fade when a panel's
text changes) and a force-directed (rather than simple circular) graph
layout are cosmetic refinement, not a new architectural point, and were
left out to keep the phase scoped to what actually demonstrates the
guide's real-state-vs-CSS-only distinction.

Verification: `npx esbuild` bundle-checked the three new/changed files.
Full suite: 252/258 — same 6 pre-existing unrelated failures, 0
introduced (no new unit tests — same UI/no-jsdom rationale as Phase 15).
Live-browser walkthrough on `/qa/sovereign-os`: confirmed the graph's
empty state, then selected two concepts, connected them with a `CAUSES`
relationship, and mapped one into a domain — the SVG rendered exactly 2
node circles and 1 edge line carrying the causal animation class, and
hovering the node surfaced its real domain mapping in the detail panel.
Scrolled the progression container to its end and confirmed the in-view
step readout updated to the last section while the completion count
correctly did not advance past what real criteria allow. Only the same
pre-existing sandbox network noise appeared.

## Phase 19: testing the system as an OS

Every earlier phase's tests proved one function or one reducer case in
isolation. This phase's guide text asks a different question — "does the
composed system behave like an OS?" — naming five journeys verbatim
(interruption/resume, cross-module memory, media synchronization, artifact
synthesis, persistence failure). Rather than rendering `SovereignProvider`
itself (there is no jsdom/testing-library anywhere in this codebase, so
component-render tests aren't available), the new
`frontend/src/sovereign/sovereignOSJourneys.test.js` builds each journey
by composing the same real functions every other test file already
trusts — the reducer, the local-persistence pair, the Supabase sync/
reconciliation functions, and the synthesis/artifact derivations — the
same integration-by-composition approach Phase 15's live Playwright pass
and Phase 16's demo page used for the parts that do need a browser.

**Test A — interruption/resume.** Dispatches `startReflection` +
`updateReflection` + `extractConcepts` (deliberately stopping short of
`commitReflection`), round-trips the resulting state through
`savePersistedState`/`loadPersistedState` (Phase 3's local-first
autosave), and asserts the reloaded entry is still `status: 'draft'` with
its `candidateConcepts` intact and `retainedConcepts` still empty — an
interrupted reflection survives as exactly what it was, not silently
promoted to committed. A second case does the same for two modules
started but not finished, proving persistence isn't scoped to only the
most-recently-active module.

**Test B — cross-module memory.** Starts module A, selects a concept
there, switches the active module to B, and asserts the concept is still
present in the global `concepts.selected` and still attributed to module
A via `curriculum.modules['A'].selectedConcepts` (Phase 10's per-module
scoping) — and explicitly absent from `curriculum.modules['B']
.selectedConcepts`, not fabricated onto B just because B is now active. A
second case confirms
`buildSynthesisState`/`whatDidIIdentify` (Phase 13) surface that same
concept regardless of which module is currently active, since synthesis
reads across the whole journey, not the active module.

**Test C — media synchronization.** Loads a track, selects an anchor, and
selects a media concept, then reads `state.media.activeConcept` back and
manually composes it into `extractConcepts`/`commitReflection`. The test
carries an explicit comment that this composition is the caller's job —
the runtime does not automatically fold an active media concept into a
reflection. This is Phase 13's documented gap restated as a test: proving
the real (missing) behavior honestly, rather than asserting an
auto-linkage that was never built.

**Test D — artifact synthesis.** The one true end-to-end run: start a
module, walk it to the reflection gate, advance through REFLECTION,
extract two candidate concepts, commit the reflection retaining only one
of them, advance through PROTOCOL, execute a protocol, advance through
ARTIFACT, compile the artifact document from `buildSynthesisState`,
generate and seal the artifact, advance through SUMMARY. Asserts
`isModuleComplete` is true, `artifact.status === 'sealed'`, and — the
sharper assertion — that `artifact.draft.decisions` contains the
retained concept and the chosen protocol but contains **nothing**
mentioning the rejected candidate concept. Proves the compiler (Phase 14)
actually respects the reflect → retain/reject distinction end to end,
not just that it produces *some* decisions.

**Test E — persistence failure.** Reproduces `SovereignProvider.jsx`'s
real `runInitialSync()` failure branch exactly (`hydrate({session:
{...state.session, syncStatus: 'error'}})` on a Supabase error, no
reconciliation attempted) using the same `createFakeSupabase` fake used
by `sovereignSupabaseSync.test.js`, then asserts local dispatch
(`selectConcept`) still works after that — sync failing never blocks the
app. A second case simulates offline local work plus a differing remote
snapshot and runs it through the real `reconcileSovereignState` (Phase 7),
asserting both sides' concepts survive the merge and
`session.syncStatus` ends `'synced'`.

**Also fixed in this pass**: the ARTIFACT step's comment in
`sovereignSteps.js`, discovered stale while re-reading step criteria for
Test D. It still said "Placeholder until Phase 14... defines the
relationship between a per-module artifact review and the single
cross-journey Living Artifact" — Phase 14 has since landed and
deliberately left that relationship unchanged (one global artifact slot,
not per-module), so the comment was rewritten to state that as settled
fact rather than an open question.

Verification: `npx vitest run src/sovereign/sovereignOSJourneys.test.js`
— 8/8 passing on first run. Full suite: 260/266 — the same 6 pre-existing
unrelated failures as every prior phase, 0 introduced. `npx esbuild
--bundle` on the new test file's full dependency chain (runtime, synthesis,
artifact, persistence, reconciliation) — clean, only the same benign
`import.meta`/iife warnings from `services/supabase/client.js` seen on
every previous bundle-check.

## Current architecture (active today)

```
Frontend                        Backend                         Data / Infra
─────────                       ───────                         ────────────
React + Vite                    FastAPI (backend/server.py,      Supabase
React Router v7                 the single canonical API —        - Postgres (primary datastore)
Tailwind + shadcn tokens        backend/app/main.py is a          - Auth (frontend authenticates
Tone.js / Web Audio             one-line shim re-exporting it,      directly against Supabase,
                                 backend/app/routes|services are     not via the backend)
                                 legacy/dead code, not mounted)
                                                                  Cloudflare
                                 Responsibilities:                 - Pages (hosts the built frontend)
                                 - Supabase access-token             - R2 (audio/media storage, via
                                   verification                        boto3 S3-compatible client)
                                 - Cloudflare R2 object storage     - R2 Worker (frontend/r2-worker,
                                   (audio streaming/downloads)        proxies/serves R2 media)
                                 - Stripe-style checkout /
                                   license-key flows
                                 - Redis-backed rate limiting /
                                   session state
                                 - Protocol acts/journal/
                                   reflections/spins endpoints
```

Auth is Supabase-first: `frontend/src/context/AuthContext.jsx` authenticates
directly against Supabase Auth in the browser and gates routes on that state.
The FastAPI backend validates the Supabase access token passed from the
frontend for its own owned resources — it does not issue a competing
session. See `API_CONTRACT.md` for the backend's own bearer-token endpoint
contracts, and `CLAUDE.md` for the full architecture writeup this summarizes.

Existing state (module/scene progress, journal, declarations, listened
tracks, audio state, curriculum registry, etc.) is currently owned
independently by several different components/hooks — there is no single
runtime that owns state today. Phase 2 (`SOVEREIGN_STATE_MAP.md`) inventories
this in detail; that inventory, not this doc, is the source of truth for
"who owns what" until the Sovereign Runtime (Phase 3) exists.

## Target architecture (Sovereign OS — not yet built)

```
FinalCKP
│
├── Experience Layer
│   ├── Sovereign OS
│   ├── Reclamation University
│   └── Experience Mode
│
├── Runtime Layer
│   ├── SovereignRuntime
│   ├── Event Bus
│   ├── Media Runtime
│   └── Synthesis Runtime
│
├── State Layer
│   ├── Local State
│   ├── Supabase
│   └── Realtime
│
├── Infrastructure
│   ├── Cloudflare Pages
│   ├── Cloudflare Workers
│   └── Cloudflare R2
│
└── External Integrations
    ├── Spotify
    └── AI/VMA
```

Target stack, once migrated:

- **Frontend**: React + Vite, React Router, Tailwind / existing design
  system, Tone.js / Web Audio.
- **State**: Sovereign Runtime (React context/hooks) with local persistence
  and Supabase persistence.
- **Backend / Infrastructure**: Supabase (identity, database, RLS,
  persistent state, realtime) + Cloudflare (Pages, Workers, R2) for
  delivery, edge execution, and media. **FastAPI is removed completely** in
  the target state — Cloudflare Workers take over any edge/protected-API
  logic the backend currently owns.
- **External Media**: Spotify integration where appropriate.
- **AI**: VMA / AI services operate as consumers of Sovereign State (a
  read-only `SovereignContext`), not as an independent chatbot bolted onto
  the app.

The full phased path from current → target architecture (state inventory,
Sovereign Runtime, 11-step curriculum state machine, local-first autosave,
event bus, Supabase persistence, Reclamation University migration, media
runtime, concept graph, domain matrix, reflection/synthesis/artifact
pipeline, OS shell, visual layer, Cloudflare consolidation, VMA, testing,
and finally deleting the legacy architecture) is tracked phase-by-phase as
migration work proceeds. Each phase should only begin once the phase before
it is real and working — do not build a downstream layer (e.g. the Artifact
UI) on top of an upstream layer that's only faked (e.g. Synthesis State that
doesn't actually exist yet).

## Repository FastAPI/backend reference audit (Phase 1.1)

As of this phase, mentions of FastAPI/the Python backend across the repo
were classified as follows:

| Location | Classification | Action |
|---|---|---|
| `backend/server.py`, `backend/app/main.py`, `backend/run.py`, `backend/requirements.txt`, `backend/tests/*` | Active code | Untouched — still the canonical, running backend |
| `CLAUDE.md`, `README.md`, `API_CONTRACT.md` | Active, accurate documentation of the currently-running system | Kept, annotated with a pointer to this doc as the target architecture |
| `APP_FLOW_INFRA_ANALYSIS.md` | Historical analysis; the specific "two FastAPI patterns" split-brain it describes has already been resolved (`backend/app/main.py` is now a one-line shim) | Kept as history, annotated as resolved/historical |
| `memory/PRD.md` | Historical/original PRD (predates Supabase; still says "MongoDB") | Left as-is — historical record, not live guidance |
| `supabase/config.toml` | Unrelated — Supabase CLI's own auto-generated comment about its API server (PostgREST), not the FastAPI backend | No action |
| `frontend/src/services/certificates/bloomCertificateGenerator.js` | Active code; generic comment ("backend API"), not FastAPI-specific | No action |

Nothing was deleted in this pass. FastAPI removal is Phase 20 of the
migration guide and depends on every phase before it actually replacing its
responsibilities first.
