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

## Phase 15 follow-up: hoisting one shared SovereignProvider into live routes

Every phase from 15 through 18 named the same deferred decision: the
Sovereign OS Shell (and the cross-module awareness it depends on) was
never wired into the live Reclamation University routes, because doing
so meant touching all six already-shipped, Sovereign-consuming Hermetic
Hall components (`SOVEREIGN_STATE_MAP.md`'s Phase 8 migrations) at once
— real production-risk surgery, not a new standalone file. Picked up
explicitly rather than deferred again.

**The actual problem, confirmed by reading the code rather than assumed
from memory**: each of the six components (`VibrationModuleExperience`,
`PolarityModuleExperience`, `RhythmModuleExperience`,
`CauseEffectModuleExperience`, `GenderModuleExperience`,
`HermeticSuppliedModuleExperience`) mounted its *own* `SovereignProvider`
at its own top level, scoped to its own component lifetime. Since
`ReclamationModulePage.jsx` (the page these all render under) simply
`return`s a different one of them based on `module.slug`, navigating
Vibration → Polarity via the normal `onComplete` flow unmounted one
provider and mounted a fresh one — any in-memory Sovereign state
(selected concepts, in-progress reflections, the artifact draft) was
gone the instant a user moved to the next module. "Does a concept
selected in module A survive into module B" — the guide's own Phase 19
Test B — was never actually true for real, signed-in users; it only
ever held for the isolated `/qa/sovereign-os` staging page's demo
provider.

**The fix, scoped to a single, well-understood React Router fact**:
`ReclamationModulePage` itself is one `Route`'s `element`
(`/experiencemode/sovereign/reclamation-university/:facultySlug/:moduleSlug`)
— React Router keeps that component instance mounted across
`:moduleSlug`-only navigation (same matched Route, new params), it does
not remount it. So hoisting one `SovereignProvider` inside
`ReclamationModulePage` itself, wrapping whichever of the six
Sovereign-consuming components it currently renders, gives those six
components a provider that survives exactly the navigation that used to
destroy it — without touching the route table in `App.jsx` at all, and
without changing any of the six components' own internals beyond
removing their now-redundant individual `SovereignProvider` wrapper
(each was a ~4-line, mechanically identical block — `const { user } =
useAuth(); const namespace = user?.id || 'anonymous'; return
<SovereignProvider>...<XInner/></SovereignProvider>` — deleted, with the
inner component simply renamed up to the file's default export). No
other line in any of the six files changed. `HermeticCurriculumModule`
and `ReclamationModuleEngine` — the two Reclamation University
components Phase 8 deliberately left alone because they don't use
`useSovereign()` at all — are correctly left outside the hoisted
provider too, so they don't pay for a Supabase sync they'd never read
from.

**What this does not do**: it doesn't render the Sovereign OS Shell
(`SovereignOSShell.jsx`) anywhere in these live routes. Its fixed
three-column grid layout was designed for a standalone page
(`/qa/sovereign-os`), not to coexist with six modules' own full-viewport,
individually-designed interaction models — putting it there for real
would mean redesigning the Shell into something that can wrap arbitrary
content (a collapsible drawer, not a grid that assumes it owns the
page), which is real visual/responsive design work of its own,
explicitly scoped out of this pass. What *is* real now: the state
those Shell panels would read — `concepts.selected`,
`reflection.entries`, `artifact.draft` — genuinely persists across
Hermetic Hall module navigation for the first time, which is the actual
prerequisite Phase 19's Test B and Phase 13's synthesis questions
needed to mean anything for a real user, not just a test fixture.

Verification: full suite 312/318 — same 6 pre-existing unrelated
failures, 0 introduced. `npx esbuild` bundle-checked all seven touched
files individually (clean) and the full `App.jsx` entry point (clean,
only the same benign `import.meta`/iife warnings seen on every prior
bundle-check). Live Vite dev server + headless Chromium loaded all six
Hermetic Hall module routes directly
(`/experiencemode/sovereign/reclamation-university/hermetic-hall/{vibration,polarity,rhythm,cause-and-effect,gender,mentalism}`)
— each correctly redirected to `/login` with zero console/page errors,
confirming the restructured `ReclamationModulePage.jsx` and all six
edited components still import and render without a runtime error.
**Not verified**: the actual signed-in cross-module memory (selecting a
concept in Vibration, navigating to Polarity, confirming it's still
there) — same real gap as every Phase 8 entry above, this environment
has no real Supabase test credentials and creating one against the
live production project wasn't judged appropriate just to check this.
The fix rests on a well-established, doc-verifiable React Router
behavior (a Route's element doesn't remount on a params-only change),
not on an assumption unique to this codebase.

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

## Phase 17: Cloudflare Consolidation

This phase is different from every one before it: it's the first to
touch a real, live Cloudflare account rather than only committing code
to this branch. That changed what "for real" had to mean, and it's
worth recording exactly what was and wasn't possible, rather than
letting either half blur.

**What the live account inventory found.** Reading it directly (via the
Cloudflare MCP tools) rather than assuming from the guide:
- One real R2 bucket, `chromakeyprotocol`.
- One real, working Worker, `chroma-key-media-gateway` — the deployed
  form of `frontend/r2-worker`, byte-for-byte matching what's in this
  repo. It's fully public/unauthenticated, bound to
  `media.chromakeyprotocol.com`, and serves the Act III visualizer
  preview catalog (`frontend/src/lib/supabase/tracks.js`'s
  `r2_audio_key`/`visualizer_schema_baseline` schema) — confirmed via
  `supabase/migrations/20260711180539_visualizer_schema_baseline.sql`
  this is a genuinely separate schema/catalog from the paid Protocol
  audio, not a security gap: the paid catalog
  (`backend/supabase_schema.sql`'s `tracks.audio_storage_path`) is
  gated behind `backend/server.py`'s `stream_audio`/`download_audio`,
  which require an authenticated user and, for downloads, a paid tier.
- Five other Workers in the account (`chromakeyprotocolproduction`,
  `ckpproductionbackend`, `chroma-key-protocol`, `finalckp`,
  `r2-worker`) all still hold the default `wrangler init`/dashboard
  "Hello world" template — dead scaffolding, not live functionality.
  Left alone: this session's Cloudflare access has no Worker-delete
  tool, and deleting infrastructure nobody asked about isn't something
  to do on a guess. Noted here so a human can clean them up.

**What was actually buildable.** The target architecture says Cloudflare
Workers should take over "any edge/protected-API logic the backend
currently owns." Rather than attempt that whole surface at once (auth,
Stripe-style checkout, Redis rate limiting, Protocol journal endpoints —
each its own real design decision), this pass built the one piece that's
both edge-natural and already has a live public counterpart to contrast
against: **authenticated media serving**. `frontend/protected-media-worker/`
is a new Worker that replicates `backend/server.py`'s
`stream_audio`/`download_audio` gating exactly — not a rewrite of the
rules, a port of them:
- **Auth**: the same call the backend's own `verify_supabase_access_token`
  makes — `GET {SUPABASE_URL}/auth/v1/user` with the caller's bearer
  token — not a reimplemented JWT verifier. (`src/supabaseClient.js`)
- **Gating**: `canStream` (any verified user, matching `stream_audio`'s
  "any authenticated user" rule) and `canDownload` (admin, full tier, or
  owns-all-albums, or license tier scoped to Act III — matching
  `download_audio`'s exact precedence). (`src/gating.js`)
- **Storage**: the same R2 bucket, read via `track.audio_storage_path` —
  the exact column the backend reads — with real byte-range support
  (`src/index.js`'s `serveObject`, ported from `chroma-key-media-gateway`'s
  existing Range/ETag handling), which the backend's boto3-buffer-the-
  whole-file approach doesn't have. That's a genuine improvement Workers
  give for free here, not scope creep — it's the same endpoint, just
  edge-native.

One deliberate, documented behavior gap from the backend: this Worker
does not auto-provision a missing `users` row the way
`app_user_from_supabase_user()` does on the backend. A verified-but-
not-yet-locally-provisioned user can still stream (matching the
backend's real rule — streaming only needs *authentication*, not a
local row) but can't download (matching the backend's real *outcome*
for a freshly auto-provisioned free-tier user too, just without
duplicating the insert). By the time someone is requesting gated audio,
the frontend's existing Supabase-first auth flow has already caused
that row to exist in practice, so this is a real, narrow, named
simplification — not a faked upstream layer.

**What could not be done, and why.** The user asked for this to be built
and deployed for real, not designed and left. Actually deploying turned
out to need more than code:
- This session's Cloudflare access (via the Cloudflare Developer
  Platform MCP tools) covers D1, KV, R2, Hyperdrive, and *read-only*
  Worker inspection (list/get/get-code) — there is no tool to create or
  update a Worker's deployed code.
- `wrangler` itself has no stored Cloudflare credentials in this
  container (`wrangler whoami` → not authenticated; no
  `CLOUDFLARE_API_TOKEN` in the environment).
- The repo already has a real, working precedent for this exact
  problem: `.github/workflows/deploy.yml` deploys Cloudflare Pages
  using `secrets.CLOUDFARE_API_TOKEN`/`CLOUDFARE_ACCOUNT_ID` (that
  spelling, matching the secret names already configured in this repo).
  So rather than stopping at "I can't deploy," this phase wired up the
  same real mechanism: a new **manual-only**
  (`workflow_dispatch`, never on push) workflow,
  `.github/workflows/deploy-protected-media-worker.yml`, that installs,
  tests, and deploys `frontend/protected-media-worker` using those same
  credentials.
- That workflow needs one more secret this session has no way to
  obtain or should ever ask for in chat: `SUPABASE_SERVICE_ROLE_KEY`
  (the same value as `backend/.env`'s `SUPABASE_KEY` — required because
  `users`/`tracks` carry no RLS policies, so only the service role can
  read them, same as the backend itself). The workflow fails loudly and
  intentionally at a dedicated check step when that secret is absent,
  rather than deploying a Worker whose every gating check would
  silently 401 against Supabase. See
  `frontend/protected-media-worker/README.md` for exactly what a human
  needs to add before this can go live.

**Explicitly not done, and why it's not this phase's call**: wiring this
Worker in as the frontend's actual audio path (replacing
`backend/server.py`'s endpoints) is a live cutover of a real,
purchase-gated feature — precisely the kind of decision this migration's
own sequencing rule reserves for an explicit go-ahead, not something to
fold into "build the Worker." The Worker is additive: nothing about
`/api/audio/*` or the frontend's calls to it changed.

Verification: `npx vitest run` inside
`frontend/protected-media-worker` — 32/32 passing, covering the gating
rules in isolation, the Supabase REST calls against a fake `fetch` (bad
token, missing fields, network failure, not-yet-provisioned user, REST
errors), and the full request handler against a fake R2 bucket (OPTIONS/
method/path handling, auth failures, streaming vs. download gating for
every tier, Range requests, a 404 for a track with no
`audio_storage_path`). `npx wrangler deploy --dry-run` confirmed the
Worker bundles cleanly and both bindings (`env.MEDIA` → the real
`chromakeyprotocol` R2 bucket, `env.SUPABASE_URL` → the real project
URL, which is public/non-secret — it's the same value already shipped
to the frontend as `VITE_SUPABASE_URL`) resolve against the real
account. The new GitHub Actions workflow's YAML was validated with
`yaml.safe_load`. No live deploy was performed or claimed.

## Phase 18: AI/VMA

The guide places this phase deliberately last among the feature phases,
and its one hard rule is specific: "VMA / AI services operate as
consumers of Sovereign State... not as an independent chatbot bolted
onto the app." Before any code, this needed a real decision nothing in
the repo had made yet — which model, and at what cost — so it was put
to the user directly rather than guessed. The answer was explicit:
optimize for cost above all else.

**The model decision.** Of the current Claude lineup, `claude-haiku-4-5`
is the cheapest by a wide margin — $1/$5 per million input/output
tokens, roughly a third of Sonnet 5's rate and a fifth of Opus 5's, and
it runs without extended thinking by default (its cheapest mode, not a
downgrade chosen for this feature — that's just what "no thinking
config" means for this tier). Every other choice in
`frontend/vma-worker/src/index.js` follows the same constraint:
`max_tokens: 1024` bounds worst-case spend per reply (a companion
reply is a few sentences, not a report), a single Messages API call is
used rather than a tool-use/agent loop (this is a Q&A-shaped feature,
not an open-ended one), and the stable persona instructions are marked
as a prompt-cache breakpoint (`vmaContext.js`'s `buildSystemBlocks`)
so a multi-turn conversation only pays full price for that block once.

**The consumption itself, built for real.**
`frontend/src/sovereign/vma/buildVMAContext.js` is not a new
derivation — it's Phase 13's existing synthesis questions
(`whatDidIIdentify`, `whatPatternsDidIFind`, `whatDidIReclaim`,
`whatProtocolDidIChoose`) projected into the compact shape a prompt
needs: module ids, concept ids, protocol ids, artifact status. Full
reflection response text is deliberately left out — it's the most
token-expensive part of state and the least necessary for a companion
that should reference the journey, not quote it back verbatim. The
Worker's `/chat` endpoint takes that context plus a message (and
optional history), verifies the caller via the same Supabase Auth call
pattern established in Phase 17 — using the anon/publishable key here
rather than a service-role key, since VMA only needs proof of a real
signed-in user, not tier data — and calls Haiku 4.5 with the context
folded into the system prompt.

**What's not done, on purpose.** Like Phase 17's Worker, this one isn't
wired into any live route, UI, or the frontend's actual chat surface —
it proves VMA can consume real Sovereign State and produce a grounded
reply, not that it's live in the product. And like Phase 17, actually
deploying it hit the same wall: no Worker-deploy tool available to this
session, no wrangler credentials in this container. The same real
mechanism from Phase 17 was reused rather than re-invented — a
manual-only (`workflow_dispatch`) GitHub Actions workflow,
`.github/workflows/deploy-vma-worker.yml`, using the same
`CLOUDFARE_API_TOKEN`/`CLOUDFARE_ACCOUNT_ID` secrets, plus one more this
Worker needs and this session has no way to obtain or should ask for in
chat: `ANTHROPIC_API_KEY`. The workflow fails loudly at a dedicated
check step when that secret is absent, same pattern as Phase 17's
`SUPABASE_SERVICE_ROLE_KEY` check.

One real, worth-naming difference from Phase 17's dry-run: Cloudflare's
own bundler flagged that `@anthropic-ai/sdk` statically imports
`node:fs`/`node:path` for credential-chain code this Worker doesn't use
(it passes `apiKey` directly, no OAuth profile/WIF resolution) — but the
import still has to resolve at module load, so `wrangler deploy
--dry-run` warned without `compatibility_flags: ["nodejs_compat"]` set.
Added it; the warning is gone and the bundle is clean. A real,
Cloudflare-flagged compatibility issue, not a hypothetical one.

Verification: `npx vitest run` in both `frontend/src/sovereign/vma`
(2 tests — an empty-session context, and a real multi-step journey
proving the context reflects retained/reclaimed concepts and chosen
protocols while omitting rejected candidates and raw reflection text)
and `frontend/vma-worker` (18 tests — auth against a fake Supabase
response, request validation, prompt-cache block placement, and the
full request handler against an injected fake model call). `npx
wrangler deploy --dry-run` confirmed a clean bundle against the real
account's bindings. No live deploy was performed or claimed, and no
API key was requested in chat.

## Phase 15/18 follow-up: making the Shell and VMA actually visible

Every prior phase touching the Shell or VMA built real, tested code
that stayed reachable only at unauthenticated `/qa/*` staging pages —
deliberately, each time, because wiring either into the live product
was flagged as a separate design/UX decision. Picked up explicitly:
a new, real, authenticated, linked page.

**`SovereignOSLive.jsx`** (route:
`/experiencemode/sovereign/reclamation-university/sovereign-os`,
`ProtectedRoute`-gated): mounts the real `SovereignOS` wrapper (real
`SovereignProvider`, namespaced to the signed-in user — the same
component `SovereignOSDemo.jsx` uses, just under real auth instead of
none) and renders the Concept Graph (Phase 16) plus a new `VMAChat`
component as the Main Workspace. Linked from a real button on
`HermeticHallViewport.jsx` ("Open Sovereign OS") — the first place
either the Shell or VMA has been reachable by clicking through the live
app rather than typing a URL.

**`VMAChat.jsx`**: a real chat UI calling `frontend/vma-worker`'s
`POST /chat`. Two things worth being precise about:
- The context it sends is `useSovereign().vma.context` — a new bundle
  added to `useSovereign.js` that calls `buildVMAContext(state)`
  directly (Phase 18's function, previously only exercised by its own
  tests) rather than reconstructing an equivalent shape by hand in the
  component. `buildVMAContext` needs the raw reducer state
  (`state.curriculum.modules`, `state.artifact.status`, ...), which
  `useSovereign()` never exposed before — adding `vma.context` was the
  one small, additive hook change this needed, not a new derivation.
- Auth mirrors `src/services/apiClient.js`'s exact pattern for the
  FastAPI backend: pull the live Supabase access token per-request via
  `supabase.auth.getSession()`, send it as `Authorization: Bearer`. No
  new session mechanism.
- The Worker's URL is `VITE_APP_VMA_WORKER_URL` (frontend/.env.example),
  left unset by default — if unset, the chat says so explicitly rather
  than silently failing or fabricating a reply.

**A real bug found and fixed getting here**: triggering the two
`workflow_dispatch` deploys (Phase 17/18's Workers) for the first time
against real CI — both failed immediately, before reaching
`wrangler deploy`, with `Cannot find module 'vite'` from
`npx vitest run`. Neither worker package had its own Vitest config, so
Vitest walked up from `frontend/vma-worker/` (or
`frontend/protected-media-worker/`) and found `../vite.config.js` — the
main frontend app's own config, which needs
`frontend/node_modules/vite` to load. That happened to exist in this
session's dev container (the frontend app had already been installed
and tested earlier in the same session) but was never installed in
CI's clean checkout, which only ever ran `npm ci` inside each worker
directory — so both suites passed here and failed for real the moment
they actually ran in CI. Fixed with a minimal `vitest.config.js` in
each worker directory (`test: { root: import.meta.dirname }`), and this
time verified against the actual failure condition, not just "it passed
locally": ran both suites with `frontend/node_modules` temporarily
moved out of the way, confirming 18 and 32 tests still pass with it
genuinely absent. A reminder that "verified locally" in a long session
with an already-populated environment isn't the same claim as "verified
under the conditions CI actually runs under" — worth being honest about
rather than assuming the first green run generalizes.

Also discovered while investigating the Worker deploy runs: this
account has a *separate*, pre-existing Cloudflare Git-integration
auto-build (visible as automated PR comments from
`cloudflare-workers-and-pages[bot]`) wired to at least three Worker/
Pages projects (`r2-worker`, `chromakeyprotocolproduction`,
`chroma-key-protocol`) that rebuilds on every push independent of this
repo's own GitHub Actions workflows. It's failing for at least two of
them. This is unrelated to anything built in this migration and wasn't
investigated further in this pass — noted here as a real, pre-existing
account-configuration item for whoever owns that Git integration to
look at, not something this session broke or is responsible for fixing.

## Post-migration correction: the LMS becoming the OS, for real

Every phase above built real, tested infrastructure — but a direct
inspection of the live route tree (prompted by a correct challenge: "the
screen looks the same, stop theorizing and look") found that
infrastructure had not actually transformed the primary user experience.
Two things, verified by reading the code rather than assumed:

**The real entry point has nothing to do with any of it.** A signed-in
user hitting `/` lands on `/experiencemode/sovereign` →
`SelfDirectedSovereignMode.jsx` — a pre-existing 3D orbital module
carousel (React Three Fiber, a rotating "Promethean Core," HUD panels
fed by hardcoded placeholder data) that predates this migration entirely
and never imports `useSovereign`. It renders `withShell={false}`, so
even the VMA widget added to the app shell doesn't appear there. The
word "sovereign" names two unrelated things in this codebase:
`src/modules/sovereign/` (SonicArtifacts, ElementalCodex, Archaetypes,
LyricalCodex, VibesAndScribes, AudioVisualizerCore — pre-existing,
reached from that carousel, confirmed by reading `SonicArtifacts.jsx`
directly: no `useSovereign`, a plain `eyebrow`/`title`/paragraph/four-
stats panel exactly as described) versus `src/sovereign/runtime` + this
migration's `src/components/sovereign-os/` — the real new architecture,
wired into exactly one place: the six Hermetic Hall components under
Reclamation University, reached only by navigating three steps deep from
the actual front door.

**Scope decision, made explicitly rather than assumed**: fixing this is
scoped to Reclamation University, not a rebuild of
`SelfDirectedSovereignMode` or the six unrelated `sovereign/*` modules.
Those stay out of scope.

**What "wire it in" actually requires, also discovered by reading code
rather than assumed**: the live Hermetic Hall components' 11-step
tab/phase UI (`TABS` in each module file) is its own local `useState`,
never calling `module.advanceStep`/reading `evaluateModuleSteps`. The
Sovereign Runtime's step engine (Phase 4) and the visible tab UI a real
user clicks through are two separate, parallel systems today — "make the
11 steps drive the workspace" isn't a matter of restyling a panel, it
requires that unification, module by module.

**First real slice, built and shipped rather than planned**:
`VibrationModuleExperience.jsx`'s Key Concepts step (`tab === 2`) now
builds a live, interactive Concept Graph instead of reporting a static
"X/4 self-audits run" count. Each of the four real concepts (Movement Is
Often Invisible, Repetition Builds Momentum, ...) gets a real concept id
(`conceptSlug()`, derived from the actual title — not a placeholder),
and an "Add to concept graph" action gated on having actually run that
concept's self-audit (no free completion). Clicking it dispatches the
real `concepts.selectConcept()`, and the same `ConceptGraphView` Phase
16 built (previously only reachable from the disconnected staging pages)
renders live underneath, reading the same state. The component now also
calls `curriculum.startModule(MODULE_ID)` on mount — a real, previously
missing gap: it ran under the hoisted `SovereignProvider` but never told
the runtime it was the active module, so concepts selected here would
have gone in module-unscoped. Existing pedagogical content (the four
concepts' real body text, practice prompts, self-audit) is untouched —
the graph is additive instrumentation on top of real work, not a
replacement of real content with a generic placeholder.

This is one step of one module — the pattern (real content → gated real
action → real runtime dispatch → real shared visual component rendering
live state) is what extends to the other 10 steps and 5 modules, not a
finished transformation. `SovereignOSShell.jsx`'s header comment was
also corrected: it still described the pre-fix "each module mounts its
own provider" problem as current, when the Phase 15 follow-up above had
already resolved it — the shell's real gap is narrower than that comment
said (the shell component itself isn't rendered in live routes; the
provider hoisting it depends on already happened).

Verification: full suite 312/318 (same 6 pre-existing failures, 0
introduced). `VibrationModuleExperience.jsx` bundle-checked clean in
isolation. Live Vite + headless Chromium load of the Vibration route:
correct `/login` redirect, zero console/page errors. Not verified: the
actual signed-in interaction (open a concept, run its audit, click "Add
to concept graph," confirm it appears in the graph) — same real gap as
every prior phase touching these six components, no test Supabase
account in this environment.

**Second slice: the Reflection step (`tab === 7`).** Before this change,
the Reflection tab's textarea only ever wrote into this module's
whole-blob "record" persistence (`reflection.recordReflection(MODULE_ID,
"record", payload)`, the Phase 8 swap) — never into a real per-prompt
entry. That meant the runtime step engine's own REFLECTION criterion
(`sovereignSteps.js`: `ctx.reflectionEntry !== null` at promptId
`08-reflection`) could never become true no matter what a learner wrote
here — one more concrete instance of the parallel-systems problem, not
just the Key Concepts one already fixed. The primary reflection prompt
now dispatches the real structured pipeline (`sovereignActions.js`
Phase 12): a "Commit reflection" button, gated on non-empty text (same
gate pattern as Key Concepts), calls
`reflection.commitReflection(SOVEREIGN_STEP_IDS.REFLECTION, text,
linkedConcepts, MODULE_ID)`. Above it, chips list the concepts already
recognized in this module (`module.selectedConcepts`, populated by the
Key Concepts step) so the learner marks which ones this reflection
actually connects to — real "Decision" stage, not free text: committing
credits those concepts into the Concept Graph exactly as `selectConcept`
would (`creditConceptSelection`, shared by both action paths in the
reducer). This also makes the reflection real input to
`synthesis.synthesisState.reflections` and, from there, the Artifact
Compiler — previously the "record" blob was invisible to both. Local
`reflectionLinkedConcepts` selection is reseeded from the persisted
entry's `retainedConcepts` on mount so a returning learner doesn't lose
their prior linking choice.

What this does *not* yet do: the four "Supporting Prompts" (`s1`-`s4`)
still only save into the same "record" blob, and — the bigger remaining
gap named above — the 11-tab UI itself is still local `useState`, not
driven by `module.advanceStep`/`evaluateModuleSteps`. Reflection's
runtime *completion criterion* is now real; the visible tab strip still
doesn't read it. That unification, and the remaining 9 steps across this
module and the other 5 Hermetic Hall components, remain open.

Verification: `sovereignReducer.test.js` / `sovereignSteps.test.js` /
`sovereignSynthesis.test.js` (62 tests) re-run clean against the
unmodified runtime this relies on. `VibrationModuleExperience.jsx`
bundle-checked clean in isolation (esbuild). Not verified: the actual
signed-in interaction — same standing gap as above, no test Supabase
account in this environment.

**Third slice: the Protocol step (`tab === 8`).** Same bug, one step
later. The Protocol step's own runtime criterion
(`ctx.synthesis.protocolExecutions.some(execution => execution.moduleId
=== ctx.module.moduleId)`) had nothing in this module that ever wrote
one — the five-step field-exercise checklist ("Process — mark each step
as you run it") only ever toggled local `steps` state. A learner could
mark all five and the runtime would still consider Protocol
incomplete forever. A "Log this protocol run" button, gated on all five
steps actually marked (not just the tab opened), now dispatches
`synthesis.executeProtocol('frequency-check', { stepsRun }, MODULE_ID)`
— a real, explicit action rather than an effect firing silently on the
fifth checkbox, matching the gated-button language the Key Concepts and
Reflection slices already established. This is append-only log data
(`protocolExecutions`), same as the runtime's other synthesis records;
re-logging after unmarking and remarking adds a new entry rather than
mutating one, which is what the reducer already does for every other
caller of `executeProtocol`, not something introduced here.

Verification: same 62-test reducer/steps/synthesis suite re-run clean,
same esbuild bundle-check, same full-suite 312/318 with the same 6
pre-existing failures. Not verified: the live interaction, same standing
gap.

Three of eleven steps in one of six modules now have runtime-real
completion criteria (Key Concepts, Reflection, Protocol). The remaining
eight steps in this module, and all eleven in the other five Hermetic
Hall components, are unchanged.

**Fourth slice: closing the tab/step-engine gap directly, not just per-step.**
`TABS` (the local tab array driving Vibration's visible UI) and
`SOVEREIGN_STEPS` (the runtime's step engine) turned out to describe the
exact same eleven-step arc, in the exact same order, under different
id strings — but nothing ever connected them: visiting a tab only ever
called `setTab`, never `module.advanceStep`. That meant every "viewed"
criterion (Intro, Principle, Why It Matters, Domains, Reclamation,
2026 Lens, Summary — seven of the eleven steps) could never become true
no matter how much of the module a learner actually read, the same class
of bug fixed individually for Key Concepts/Reflection/Protocol above,
but structural this time rather than per-step. A `TAB_STEP_IDS` mapping
(built once, next to `TABS`, so the two arrays can't silently drift
apart) now drives a call to `module.advanceStep(TAB_STEP_IDS[n])` from
both the initial mount (once the runtime confirms this module is
active) and every call to `go()`, which every tab button and the
"Continue" footer action already route through. This is the single
change this migration has been missing since Phase 4: the runtime step
engine and the visible tab UI are now reading and writing the same
state for this module, not two parallel systems.

All eleven of Vibration's steps now have runtime-real completion
criteria. The other five Hermetic Hall modules are unchanged — and,
per direct inspection, further behind than Vibration was before this
work started: none of them call `curriculum.startModule` at all, so
they don't even register as the active module today.

Verification: full suite 312/318, same 6 pre-existing failures, 0
introduced. Bundle-checked clean in isolation. No new automated test
directly exercises `TAB_STEP_IDS`/`advanceStep` wiring — this
component has no existing render-test harness (no
`@testing-library/react` + `SovereignProvider` fixture for it), and
building one is out of scope for this pass; verified by reading the
dispatch path end to end instead. Not verified: the live interaction,
same standing gap as every slice above.

**Fifth slice: Polarity, the first of the five modules that had none of
this at all.** Direct inspection (noted above) found the other five
Hermetic Hall modules further behind than Vibration was before this
work started — none called `curriculum.startModule`, so none registered
as the active module, let alone advanced any step or dispatched any
concept/reflection/protocol action. Polarity is the first fixed.

Four modules (Polarity, Rhythm, Cause & Effect, Gender) share one file,
`curriculumSections.js`, for their eleven-section arc — its `CURRICULUM_SECTIONS`
ids turned out to already match `SOVEREIGN_STEP_IDS` one-to-one, just
under different strings (`'key-concepts'` vs `'03-key-concepts'`, etc).
Rather than repeat Vibration's per-file `TAB_STEP_IDS` table four times
and risk the four copies drifting apart, that mapping now lives once in
`curriculumSections.js` itself as `sovereignStepIdForSection()` — the
single source of truth all four modules import.

Applied to Polarity: `curriculum.startModule(MODULE_ID)` on mount;
`goToIndex()` (the one choke point this module's navigation already
runs through — spine clicks and the footer's primary action both call
it) now also calls `module.advanceStep(sovereignStepIdForSection(...))`,
closing all seven "viewed" criteria the same way Vibration's `go()` did.
Key Concepts: this module has no per-concept self-audit like Vibration's,
so the real-work gate here is structural rather than a separate flag —
the "Add to concept graph" button only exists inside a concept's
expanded accordion body, so clicking it is only possible after actually
opening that concept. Reflection: a "Commit reflection" button, gated on
non-empty text, with concept-linking chips drawn from
`module.selectedConcepts` — same pipeline as Vibration. Protocol: rather
than add a fifth button, the log piggybacks on `generateArtifact()`,
which already only runs once `handlePrimaryAction` has confirmed
`protocolComplete` (all five Spectrum Shift steps actually run) — an
already-gated, already-explicit action, so `synthesis.executeProtocol`
now fires from inside it instead of duplicating that gate with new UI.

Not touched, same as Vibration: the Artifact step's `sealArtifact()` —
that's a single cross-journey artifact, not one per module, and remains
open work across every module including Vibration.

Verification: full suite 312/318, same 6 pre-existing failures, 0
introduced. Both touched files bundle-checked clean in isolation. Same
standing gap as every slice above: no live signed-in verification (no
test Supabase account in this environment).

**Sixth slice: Rhythm, same pattern, second of the four shared-file
modules.** Identical treatment to Polarity, applied to
`RhythmModuleExperience.jsx`: `curriculum.startModule` on mount,
`goToIndex()` now calls `module.advanceStep(sovereignStepIdForSection(...))`,
Key Concepts gets a real "Add to concept graph" action gated on having
opened that concept's accordion, Reflection gets the commit + concept-
linking pipeline, and Protocol's log (`executeProtocol('rhythm-audit', ...)`)
piggybacks on `generateArtifact()`, which already only runs once all
Rhythm Audit steps are done. Same not-touched note as every slice
above: `sealArtifact()` remains cross-journey, untouched work.

Verification: full suite 312/318, same 6 pre-existing failures, 0
introduced. Bundle-checked clean in isolation. Same standing gap: no
live signed-in verification.

**Seventh slice: Cause & Effect, third of the four shared-file modules,
with a structural wrinkle.** Same pattern as Polarity/Rhythm, with two
adaptations this module's own architecture required: its navigation
choke point is `advance()` calling `setActiveIndex` directly rather than
routing through `goToIndex()` (fixed by making `advance()` call
`goToIndex()`, so both the spine and the footer action now go through
one instrumented function); and its Protocol→Artifact gate is
`canGenerateArtifact` (every `ARTIFACT_REQUIREMENTS` field actually
filled) rather than a plain `protocolComplete` flag, so the
`executeProtocol('causal-trace', ...)` log sits right after that
existing guard inside `generateArtifact()`, not a new button. Key
Concepts and Reflection wired identically to the prior two modules.

Verification: full suite 312/318, same 6 pre-existing failures, 0
introduced. Bundle-checked clean in isolation. Same standing gaps: no
live signed-in verification; `sealArtifact()` still cross-journey and
untouched everywhere.

**Eighth slice: Gender, the last of the four shared-file modules.**
Same treatment as Cause & Effect (its `goToIndex`/`advance` and
`canGenerateArtifact` shape matched almost exactly): `curriculum.startModule`
on mount, `advance()` now routes through an instrumented `goToIndex()`,
`executeProtocol('force-dialogue', ...)` piggybacks on the existing
`canGenerateArtifact` guard inside `generateArtifact()`, Key Concepts
gets a real "Add to concept graph" action, Reflection gets the commit +
concept-linking pipeline.

All four modules sharing `curriculumSections.js` (Polarity, Rhythm,
Cause & Effect, Gender) are now wired to the runtime the same way
Vibration is. Only the Hermetic-Supplied module (the two
faculty-supplied lessons, a different and smaller file) remains.

Verification: full suite 312/318, same 6 pre-existing failures, 0
introduced. Bundle-checked clean in isolation. Same standing gaps: no
live signed-in verification; `sealArtifact()` still untouched
everywhere.

**Ninth slice: the Hermetic-Supplied module (Mentalism, Correspondence)
— last of the six, and structurally the thinnest.** This component
(`HermeticSuppliedModuleExperience.jsx`) renders `MODULE_COPY`, prose
parsed at module-load time out of a `.txt` file
(`hermeticSuppliedModules.txt`) by section heading — there is no
`KEY_CONCEPTS` array, no `PROTOCOL_STEPS` checklist, no structured
artifact fields anywhere in it, unlike the other six modules. Wiring a
per-concept "Add to concept graph" action or a protocol-execution log
here the same way as the other five would mean inventing structure the
source content doesn't actually have — exactly the kind of fabricated
instrument this whole correction has been arguing against. So this
slice is narrower on purpose: `curriculum.startModule` on mount; both
places this component changes tabs (the sidebar buttons and the footer
"Continue" action) now route through one `goToTab()` that also calls
`module.advanceStep`, closing the "viewed" criteria; and the one real
reflection prompt this module has (rendered by `CopyScreen` whenever a
section contains "Reflection Prompt") gets a real "Commit reflection"
button dispatching `commitReflection` at the canonical step id, same as
every other module — with an empty `retainedConcepts` array, since
there is genuinely nothing to link it to here.

All six Hermetic Hall modules are now wired to the Sovereign Runtime.
None of the six call `sealArtifact()` — that remains a single
cross-journey action, correctly out of scope for any one module.

Verification: full suite 312/318 (including this file's own existing
`HermeticSuppliedModuleExperience.test.js`, 2/2, still passing), same 6
pre-existing failures elsewhere, 0 introduced. Bundle-checked clean in
isolation. Same standing gap: no live signed-in verification.

## Closing the gaps: sealArtifact() wired for real, and real verification

Two things were explicitly flagged as deferred at the end of the six-
module slice above — `sealArtifact()` never called anywhere, and every
slice's own verification resting on reading code plus automated tests
that never rendered a single component. Both are closed here, not
deferred again.

**`sealArtifact()`.** It's a single cross-journey action — one Living
Artifact, not one per module — so no individual Hermetic Hall
component's own UI was ever the right place to call it. `SovereignOSShell.jsx`'s
Synthesis Status panel, the one place this whole journey's synthesis is
actually visible across modules, now carries it for real: "Compile &
seal your Living Artifact," gated on real substance (`concepts.selected.length
> 0 || a committed reflection exists` — `sealArtifact()`'s own guard in
`sovereignReducer.js` only refuses a *missing* draft, not an empty one,
since `compileFromSynthesis()` always produces a structurally valid
document even from nothing), with a Markdown export once sealed.
Reachable today via `SovereignOSLive`
(`/experiencemode/sovereign/reclamation-university/sovereign-os`,
linked from the Hermetic Hall's own "Open Sovereign OS" button).

**Real verification.** Every prior slice's "verification" was: the full
test suite still passes, a bundle checks clean in isolation, and the
dispatch path was read end to end. None of that ever rendered a
component, clicked a button, or typed into a field — the actual claim
("clicking this does X") was always inferred, never observed. That gap
is closed by actually setting up the tooling and writing the tests,
rather than continuing to note the gap and move on:

- Installed `@testing-library/react`, `@testing-library/jest-dom`, and
  `jsdom` as real devDependencies (they weren't present at all before —
  two pre-existing test files, `ErrorBoundary.test.js` and
  `AuthContext.test.js`, imported `@testing-library/react` and had
  never once run, "Cannot find package" on both).
- Added `frontend/vitest.config.js` (jsdom environment) and
  `frontend/vitest.setup.js` (jest-dom matchers, RTL's `afterEach(cleanup)`
  registered explicitly since this repo doesn't use vitest's implicit
  globals, and permissive stubs for `matchMedia`/`ResizeObserver`/canvas
  2D context/`scrollIntoView` — none of which jsdom implements, and
  several Hermetic Hall modules use for decorative canvas art alongside
  the real runtime wiring in the same components).
- Fixed `ErrorBoundary.test.js`: swapped `jest.*` for `vi.*` (this repo
  is vitest-only; the file was apparently never updated after an
  earlier jest→vitest migration), and fixed a genuine test-logic bug —
  it asserted a class error boundary would clear its caught-error state
  just because its `children` prop changed, which isn't how React error
  boundaries work; the fix reorders the test to match how `resetError()`
  in `ErrorBoundary.jsx` actually recovers (fix the children first,
  *then* click Try Again). All 5 tests pass for real now.
- Rewrote `AuthContext.test.js` from scratch: the old version mocked
  `axios` and asserted on a setTimeout-based token-refresh flow and an
  axios 401 interceptor — none of which exist in the current,
  Supabase-first `AuthContext.jsx` (see this file's own architecture
  notes on the Supabase-first rewrite). Every async test in the old file
  timed out waiting on a `loading` flag nothing was ever going to
  resolve; it wasn't a jest/vitest syntax problem, it was testing removed
  behavior. Rewritten against the real implementation, mocking
  `services/supabase/client.js` (the one module `AuthContext.jsx`
  actually depends on) — 10 tests, covering session restore, login,
  register, logout, `updateProgress`, a real Supabase
  `onAuthStateChange` event, and the `auth:session-expired` window
  event listener. Along the way, found and worked around a real gotcha:
  `AuthContext.jsx` memoizes its Supabase client promise at module
  scope, outside React, so a naive per-test mock swap silently never
  took effect after the first test — fixed by keeping one stable mock
  object for the file and only swapping its `.auth` methods per test.
- Wrote real interaction tests for two representative modules —
  `VibrationModuleExperience.test.js` (its own bespoke `TABS`/`go()`
  pattern) and `PolarityModuleExperience.test.js` (the `CurriculumSpine`/
  `goToIndex` pattern shared by four other modules, which — unlike
  Vibration — enforces real navigation locks, so reaching a later
  section means actually advancing through the footer CTA the way a
  real learner would, not jumping to a tab). Both mount a real
  `SovereignProvider` (no namespace — local-only, no Supabase — exactly
  the "signed-out" configuration the runtime is documented to support)
  and a `SovereignOSShell.test.js` exercising the new seal action.
  Together: mount, click through real tabs/sections, run a self-audit,
  add a concept to the graph, write and commit a reflection, complete a
  protocol and log it, seal an artifact and export it — and assert on
  the real runtime state read back out via `SovereignContext`, not on
  rendered text alone.

**This surfaced a real, previously shipped bug**, not a hypothetical
one: Vibration's "Add to concept graph" gate was written as
`{auditValue && (...)}`. Picking the *first* self-audit option sets
`auditValue` to `0` — and `0 && (...)` is falsy, so the button silently
never appeared. This had been live on `main` since the Key Concepts PR
merged earlier in this same migration; reading the dispatch path never
would have caught it, because the dispatch path itself was correct —
only the *gate* was wrong, and only for one specific, easy-to-pick
option. Fixed to `auditValue != null`. This is the concrete case for
why "verified by reading the code" and "verified by using it" are not
the same claim.

Verification: full suite 341/347 passing (was 312/318 — 29 net new
passing tests: 5 ErrorBoundary + 10 AuthContext + 4 SovereignOSShell +
5 Vibration + 5 Polarity), same 3 pre-existing legacy-content test
files still failing (`hermeticImportedCurriculum.test.js`,
`hermeticJourneyTabs.test.js`, `hermeticLearningExperience.test.js` —
these test a superseded five-stage/seven-section curriculum engine this
file's own header comment already says "should not be reintroduced";
`HermeticCurriculumModule.jsx`, their subject, is unreachable dead code
in the live route tree per `ReclamationModulePage.jsx`'s routing, not
something this migration touches — left as pre-existing, unrelated
technical debt rather than silently claimed as fixed). `npm run build`
verified clean. The fixed root test command
(`npm test --prefix frontend`) still passes unchanged.

**Extended to all six modules the same day.** The two representative
patterns proved out above (Vibration's bespoke tab strip, Polarity's
shared lock-enforcing `CurriculumSpine`) turned out not to be the only
two shapes in play — real testing surfaced two more real variations,
each verified from the actual data files rather than assumed from the
modules already covered:

- **Rhythm** shares Polarity's plain `protocolComplete` gate, but its
  own `PROTOCOL_STEPS` has eight entries, not six — reading
  `rhythmModuleData.js` directly (`grep -c` on the real array) rather
  than reusing Polarity's count was what caught this before the test
  was written wrong.
- **Cause & Effect** and **Gender** both gate Protocol → Artifact on
  `canGenerateArtifact` (specific fields in `protocolResponses` actually
  filled — `effect`/`causes`/`lever` for Cause & Effect,
  `forces`/`exile`/`practice` for Gender), not on "all steps marked."
  A test that just clicks through all the steps without typing into
  those specific fields silently never logs anything — `generateArtifact()`
  no-ops past its own `canGenerateArtifact` guard, and would report
  nothing here rather than a helpful error. That gap between "I marked
  every step" and "I actually filled what the artifact needs" is a
  behavior a real learner would hit too, not just a testing subtlety —
  and it only became visible by writing a test that clicked through
  without typing first, watching it fail with an empty
  `protocolExecutions` array, and then reading `causeEffectModuleData.js`
  to find out why. Gender additionally has one Protocol step
  (`forces`, step 01) that renders *two* textareas at once
  (`situation` and `forces`), of which only one is actually required —
  targeted by its own placeholder text, not a generic "the textbox on
  this step."
- **Hermetic-Supplied** (Mentalism, Correspondence) has no concept or
  protocol structure to test at all (documented above, "Ninth slice") —
  its test covers only what actually exists: the runtime registering as
  active, tab navigation advancing the step engine, and the one real
  reflection prompt committing for real.

All six modules now have real interaction tests — 356/362 total
(previous entry's 341/347 plus 15 more: 4 Rhythm + 4 Cause & Effect + 4
Gender + 5 Hermetic-Supplied, one more than the other three because it
inherited two pre-existing data-shape tests already in that file).
`npm run build` re-verified clean. Same 3 pre-existing, unrelated
legacy-content failures as every count above.

Real, remaining, honestly stated: the actual signed-in, deployed-site
interaction is still not verified — no test Supabase account exists in
this environment. That is a different claim than "clicking this does X
was never checked at all," which was true for all six modules before
this pass and is no longer true for any of them.

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

## Phase 20: FastAPI removal (executed ahead of schedule)

Phase 1.1 above deliberately deferred this until every phase before it had
replaced the backend's responsibilities. That precondition was **not**
met — the four-Act pathway (payments/licensing, the Protocol AI chat, the
spin-wheel rewards page, onboarding's server-side progress write) was never
migrated onto Supabase/Workers, and the Sovereign Runtime migration itself
only ever reached Hermetic Hall (`SOVEREIGN_STATE_MAP.md`'s Phase 8), not
the four-Act pathway. This phase was executed anyway, on explicit
instruction, accepting the resulting feature breakage rather than waiting
for replacements to exist first.

**Deleted:**
- `backend/` in its entirety (FastAPI app, `db_client.py`, `requirements.txt`,
  `backend/migrations/`, `backend/tests/`, and an orphaned, never-mounted
  Express `backend/api/certificates.js` that lived alongside it).
- `frontend/src/services/apiClient.js` (the axios client configured against
  the backend).
- `frontend/src/pages/ActPage.jsx` and `ActProtocol.jsx` +
  `frontend/src/data/actDefinitions.js` — the legacy `/act/:actNumber` and
  `/protocol/:actNumber` routes and their data. `ActPage.jsx` was already
  superseded by `ActNavigation.jsx`'s real per-Act destinations for Acts
  1–3; `ActProtocol.jsx`/`actDefinitions.js` were dead code (unrouted)
  before this pass except for Act 4's `/protocol/4` link, repointed to the
  existing `/act/4` (`LockedAct.jsx`) instead.
- `frontend/src/pages/SpinWheel.jsx`, `ProtocolChat.jsx`,
  `frontend/src/components/layout/PaywallModal.jsx`,
  `frontend/src/lib/accessFlags.js` — whole features whose only purpose was
  calling the backend (`/spins/*`, `/tracks`, `/protocol/chat`,
  `/payments/*`, `/license/*`). These now have **no replacement**: the
  wheel, the Protocol AI chat, and checkout/license unlock are gone from
  the live app until something rebuilds them on Supabase/Workers.

**Edited** (backend call removed, rest of the feature kept working):
`Onboarding.jsx` (dropped the best-effort `PUT /progress` call, which was
already swallowing its own errors, and the now-dead "Spin The Wheel" entry
option), `GuidedListen.jsx` (dropped the `/tracks` count fetch — cards just
don't show a track count anymore), `LaunchModule.jsx` (dropped
Stripe-checkout-return payment polling), `AuthContext.jsx` (dropped the
side-effecting `import('../services/apiClient')` used only to configure
axios), `AuthContext.test.js` (dropped the now-pointless apiClient mock),
`VMAChat.jsx` (comment only — it was never actually backend-dependent,
just described its auth pattern by analogy to apiClient.js).

**Follow-on navigation fixes**: introduced
`frontend/src/lib/actRoutes.js` (`actEntryRoute(actNumber)`) as the one
place that maps an Act number to its real entry route, since the generic
`/act/:actNumber` catch-all is gone. Repointed every caller that built that
path manually: `AppShell.jsx` (sidebar Act list, "Continue Your Path"/
"Resume Act" CTA, and the Act III/IV locked-state redirect, which used to
open `PaywallModal` via `/dashboard?showUnlock=true` and now just goes to
`/acts` since there's nothing left to unlock with), `Activation.jsx`, and
`LaunchSequencePage.jsx`. `ActNavigation.jsx` already had the right
per-Act destinations for Acts 1–3 (this is where `actEntryRoute()`'s
mapping comes from) and only needed Act 4's link fixed.

**Verification**: `npx vitest run` — same 6 pre-existing unrelated failures
(`hermeticJourneyTabs.test.js`, `hermeticLearningExperience.test.js`), 0
introduced. `npx esbuild --bundle` on `App.jsx`'s full import graph
resolves clean (7.1MB, no missing modules) — confirms no route in the app
still imports a deleted file.

**Not done in this pass**: rebuilding any of the deleted features on
Supabase/Workers. `PaywallModal`/checkout, `ProtocolChat`, `SpinWheel`, and
onboarding's progress persistence are real gaps now, not deferred
work-in-progress — treat rebuilding any of them as new feature work against
the target architecture (Supabase + Workers), not as restoring what was
here before.
