# Act II — The Reflection Chamber: Interactive Architecture

This is the architecture guide for turning Act II's Reflection Protocol from a
static curriculum page into the interactive "Reflection Chamber" — Mirror
Field, Key Fragments, Mirror Clarity, protocol-shaped exercises per pillar —
described in the original request. It follows that request's own governing
rule (*"the Reflection Chamber is an Act II feature, not a separate
application, route tree, database, or authentication system"*) and its
closing rule (*"build vertically, not horizontally"*), but rewrites every
concrete step against what is actually in this repository today. The
generic version named systems to build — a Reflection Engine, a Progression
Engine, a Fragment Manager, a Protocol interface, an event pipeline — that,
on inspection, **already exist** here as the Sovereign Runtime. The real
architectural work is *attaching* the Reflection Chamber to that runtime the
same way six Hermetic Hall modules already do, not building a parallel
engine next to it.

Read this alongside `docs/ARCHITECTURE.md` (the Sovereign OS migration plan)
and `docs/SOVEREIGN_STATE_MAP.md` (the fragmented-state inventory the
migration is resolving) — this document is a leaf off that tree, not a
competing one.

## 1. What "existing Act II" actually is

Before any of this can attach to anything, know which of the four things in
this codebase called "Act II" is the live one:

| Path | Status | Notes |
|---|---|---|
| University Nexus → **Reflection Protocol** card → `ReflectionProtocolPage.jsx` at `/experiencemode/sovereign/reclamation-university/reflection-protocol` | **Live, current, actively developed.** `curriculum.js` says so explicitly: *"Reflection Protocol is live — Act II Water / Reflection Chamber five-pillar module."* This is the newest content in the repo (the two most recent commits on `main` before this branch added `reflectionChamberModuleData.js` and wired it into the Nexus). | Currently **read-only**: five pillars rendered as tabs/accordions, no state, no persistence, no `useSovereign()`. This is the page the interactive layer attaches to. |
| `/act/:actNumber` → `ActPage.jsx` (`actConfigs[2]`) | **Legacy, still routed, not the active development target.** Backend-driven (`axios.get('/reflections/...')`, `axios.put('/reflections', ...)` against `backend/server.py`) with its own inline `actConfigs`. | Do not extend this. It predates Reclamation University / Sovereign Mode and duplicates content that now lives in `reflectionChamberModuleData.js`. |
| `ActProtocol.jsx` + `data/actDefinitions.js[2]` | **Dead code.** `actDefinitions.js` is imported nowhere except `ActProtocol.jsx`, and `ActProtocol.jsx` is imported nowhere in `App.jsx`. It is a real, mostly-built interactive protocol prototype (sliders, checklists, pill-select, AI "agent transmission" prompts) but it is unreachable by any route. | Worth knowing about only because its exercise *shapes* (`domain_sliders`, `checklist`, `pills`, `witness_sliders`, `declaration`) are a useful reference for the new pillar UI — do not route to it or resurrect it as-is; it predates the Sovereign Runtime and has no persistence path. |
| Reclamation University's Sovereign Runtime (`frontend/src/sovereign/**`) | **Live, general-purpose, currently used by 6 other modules.** Not Act-II-specific — it is the curriculum engine for all of Reclamation University. | This is the "Reflection Engine / Progression Engine / Fragment Manager / event pipeline" the original guide asked to build. See §3. |

**Conclusion:** "Act II hosts the new Chamber systems" (M01) means: the
Reflection Chamber attaches to `ReflectionProtocolPage.jsx` / the `reflection`
entry in `universityProtocols` (`lib/university/curriculum.js`), using the
same Sovereign Runtime integration pattern as Hermetic Hall. It does not
touch `/act/2` (`ActPage.jsx`) or resurrect `ActProtocol.jsx`.

## 2. The existing dependency map (per the guide's step 2)

```text
University Nexus (UniversityNexus.jsx)
     │
     ├── universityProtocols['reflection'] (curriculum.js) — card, route, availability
     │
     ▼
ReflectionProtocolPage.jsx  (route: .../reflection-protocol)
     │
     ├── reflectionChamberModuleData.js — REFLECTION_META, ACT_LEVEL_PAIR, PILLARS[5], EXIT_CRITERIA, CADENCE, CLOSING
     ├── ReflectionProtocolPage.css — visual shell (already on-brand: chroma-water blue)
     └── (today) local useState only — activePillarId, expandedCode. No progression, no persistence.

Sibling, already-working integration pattern to copy:
ReclamationModulePage.jsx (route: .../:facultySlug/:moduleSlug)
     ├── one shared <SovereignProvider> hoisted around the page (Phase 15 fix — don't reintroduce a per-module provider)
     ├── dispatches by moduleSlug to a dedicated *ModuleExperience.jsx component:
     │     VibrationModuleExperience.jsx, PolarityModuleExperience.jsx, RhythmModuleExperience.jsx,
     │     CauseEffectModuleExperience.jsx, GenderModuleExperience.jsx, HermeticSuppliedModuleExperience.jsx
     └── each *ModuleExperience.jsx calls useSovereign() + SOVEREIGN_STEP_IDS directly
```

Audio/VMA/codex integration points that already exist and don't need to be
invented (guide step 27):

- **VMA**: `frontend/src/sovereign/vma/buildVMAContext.js` already projects
  runtime state (active module, reflections, concepts) into the VMA chat
  context. Once Reflection Chamber pillars are real Sovereign modules, VMA
  awareness of Chamber progress is free.
- **Audio**: `context/audioprovider.jsx` / `modules/sovereign/AudioVisualizerCore.jsx`
  own playback today; the Sovereign Runtime's Media domain (`sovereignActions.loadTrack/play/pause/seek`)
  exists but nothing dispatches it yet (per `eventTypes.js`'s own comment). Wiring Chamber
  audio reactivity to Mirror Clarity (guide step 31) should go through that Media domain, not
  a third playback owner.
- **Visualizer**: `three` and `@react-three/fiber`/`drei` are already dependencies (used by the
  visualizer stack), so a genuinely 3D Mirror Field/Chamber environment is feasible without adding
  a new engine — see §6.
- **Reclamation University persistence duplication**: `curriculum.js` notes the 7 Hermetic
  principles persist through a *separate*, older table (`rec_uni_user_progress`) alongside the
  Sovereign Runtime's own `sovereign_module_state`. This is a known, documented duplication
  (`docs/SOVEREIGN_STATE_MAP.md`), not a pattern to extend. The Reflection Chamber should use
  the Sovereign Runtime path only (§4) — it would otherwise become a *third* progress table.

## 3. Reflection Engine / Progression Engine / Fragment Manager — already built

The guide's steps 5–12 ask for: an event object type, an event pipeline
(action → engine → consequence → state change → persistence), a Protocol
interface every game mode implements, a Mirror Clarity service, and a
Fragment/Archive manager. All five already exist as the Sovereign Runtime.
Building new versions of any of them for Act II specifically would be the
exact "beautiful but disconnected game module" failure mode the guide warns
against — the fix here is to *reuse*, not *port*.

| Guide concept | Real implementation | File |
|---|---|---|
| `ReflectionEvent` / event pipeline | `SOVEREIGN_EVENT_TYPES` + the reducer + `mapActionToEvents.js`, dispatched through `SovereignEventBus` | `sovereign/events/eventTypes.js`, `sovereign/events/SovereignEventBus.js`, `sovereign/events/mapActionToEvents.js` |
| Reflection Engine (action → consequence) | `sovereignReducer.js` — every dispatched action (`startModule`, `advanceStep`, `completeStep`, `selectConcept`, `executeProtocol`, `startReflection`/`updateReflection`/`commitReflection`, `generateArtifact`, `sealArtifact`) is the consequence step | `sovereign/runtime/sovereignReducer.js`, `sovereign/runtime/sovereignActions.js` |
| Progression Engine / Act II state object | Per-module `SovereignModuleState` (`viewedSteps`, `completedSteps`, `selectedConcepts`, `status`) plus the 11-step lifecycle evaluator | `sovereign/runtime/sovereignState.js`, `sovereign/runtime/sovereignSteps.js` (`evaluateModuleSteps`) |
| Protocol interface every implementation conforms to | The 11-step curriculum lifecycle (`SOVEREIGN_STEP_IDS`: intro → principle → key-concepts → why-it-matters → domains → reclamation → 2026-lens → reflection → protocol → artifact → summary), with `isComplete` evaluated against real state, not navigation | `sovereign/runtime/sovereignSteps.js` |
| Key Fragment / Reflection Archive | The Concept Graph (`selectConcept`, `connectConcepts`, `mapConceptToDomain`) plus the structured reflection pipeline (`startReflection → updateReflection → extractConcepts → commitReflection`) | `sovereign/runtime/sovereignState.js` (`concepts`, `reflection`), `sovereign/runtime/sovereignActions.js` |
| Reflection Core / convergence point | The Artifact Compiler (`generateArtifact`, `sealArtifact`, `compileFromSynthesis`), which reads the Synthesis Engine's derived state across every completed module | `sovereign/artifact/*`, `sovereign/synthesis/sovereignSynthesis.js` |
| Measurement/event system | `sovereign_events` (append-only Supabase table) fed by the same event bus, already the intended eventual replacement for the `rec_uni_events`/PostHog split | `supabase/migrations/20260822051703_create_sovereign_runtime_schema.sql` |
| Persistence | `sovereignSupabaseSync.js` / `sovereignReconciliation.js` sync the reducer's state to `sovereign_sessions`, `sovereign_module_state`, `sovereign_reflections`, `sovereign_concepts`, `sovereign_connections`, `sovereign_domain_mappings`, `sovereign_artifacts` — all scoped by `user_id` | `sovereign/persistence/*`, same migration file above |

**What genuinely doesn't exist yet** and is real new work:

1. Reflection Chamber content isn't modeled as Sovereign modules at all yet
   (§4).
2. Mirror Clarity — a derived environmental-progress score, distinct from
   any one module's `synthesisReadiness` (§5). *(Landed in this branch —
   see `sovereign/reflectionChamber/mirrorClarity.js`.)*
3. The actual Chamber environment/visual layer that mirror clarity drives
   (§6) — canvas/3D rendering, not state.
4. A `*ModuleExperience.jsx` per pillar and the `ReclamationModulePage.jsx`
   wiring to reach them (§4).

## 4. Modeling the five pillars as Sovereign modules

`reflectionChamberModuleData.js` already has five pillars, each already
containing both a "shadow" (diagnostic) and "light" (instructional) track
plus practices — this **is** the guide's four-Protocol structure, just with
five real, already-written protocols instead of four invented ones
(Emotion Decoder / Boundary Portal / Timeline Weaver / Shadow Integration).
Do not write new fictional scenarios; the content already exists and is far
more specific than generic placeholders would be:

| Pillar (`PILLARS[].id`) | Title | Sovereign moduleId |
|---|---|---|
| `owned-interior` | The Owned Interior | `reflection-chamber/owned-interior` |
| `forged-witness` | The Forged Witness | `reflection-chamber/forged-witness` |
| `sacred-restraint` | Sacred Restraint & Reflection | `reflection-chamber/sacred-restraint` |
| `open-frequency` | Open Frequency | `reflection-chamber/open-frequency` |
| `mirror-walker-boundary` | The Mirror-Walker's Boundary | `reflection-chamber/mirror-walker-boundary` |

This namespacing (`reflection-chamber/<pillar-id>`) matches how Hermetic
Hall already namespaces its principles (`hermetic-hall/vibration`,
`hermetic-hall/polarity`, ...) — see `curriculum.startModule('hermetic-hall/mentalism')`
in `SovereignOSDemo.jsx`. `mirrorClarity.js` (§5) already assumes this exact
convention via `reflectionChamberModuleId()`.

Mapping each pillar onto the existing 11-step lifecycle (no new steps
needed — the lifecycle is already generic):

- `01-intro` / `02-principle`: `REFLECTION_META`, `ACT_LEVEL_PAIR`, and the
  pillar's `summary`/`question`/`layer`.
- `03-key-concepts`: each shadow/light **code** (`code.name`) becomes a
  `selectConcept(conceptId, moduleId)` call when the Seeker opens/claims it
  — this *is* the Key Fragment system (guide step 11); no separate
  `FragmentManager` needed, the Concept Graph already is one.
- `04-why-it-matters` / `05-domains` / `06-reclamation` / `07-2026-lens`:
  the pillar's `teaching[]` array and `parallelTo` cross-reference to Act I.
- `08-reflection`: the diagnostic prompts (`code.diagnostic`) drive
  `startReflection` → `updateReflection` → `commitReflection`, exactly the
  staged pipeline Phase 12 built — this replaces `ActProtocol.jsx`'s
  abandoned free-text-to-FastAPI pattern.
- `09-protocol`: the instructional practices (`pillar.practices[]`) map to
  `executeProtocol(practiceId, payload, moduleId)` — each practice *is* a
  Protocol execution in the runtime's existing vocabulary.
- `10-artifact` / `11-summary`: the pillar's `mantra`/`seal` feed into the
  cross-journey Living Artifact (shared across all Reclamation University
  modules, not per-pillar — this is already how `ARTIFACT` works for every
  other module).

Route/dispatch wiring (mirrors `ReclamationModulePage.jsx` exactly): either
extend that page's `facultySlug` dispatch table with a `reflection-chamber`
faculty and five `moduleSlug`s, or keep the five pillars inside
`ReflectionProtocolPage.jsx` itself (tabs already exist) and mount one
shared `<SovereignProvider>` there, dispatching internally by
`activePillarId`. Prefer the second: the five pillars are one continuous
five-pillar Protocol (`CADENCE.suggested` groups them in pairs across
weeks), not five independent faculty modules a Seeker picks in any order,
so a single page-level provider matches the content's real shape better
than `ReclamationModulePage.jsx`'s "any module, any order" model.

## 5. Mirror Clarity (landed)

`frontend/src/sovereign/reflectionChamber/mirrorClarity.js` (+ test) is a
pure derivation, following the exact pattern `moduleSynthesisReadiness()`
and `buildDomainMatrix()` already established: no new mutable state, no
reducer case, no table.

```text
mirrorClarity(state, pillarIds?) → {
  score: 0..1,                         // average synthesisReadiness across the 5 pillar modules
  state: FRACTURED|DISTORTED|ALIGNED|INTEGRATED|CLEAR,
  perPillar: [{ pillarId, moduleId, readiness }],
}
```

This satisfies guide step 10 ("Mirror Clarity represents restoration of the
Chamber, not simply points") for free — `synthesisReadiness` is itself
derived from real step completion (concept selections, committed
reflections, protocol executions), not a manually incremented counter.

## 6. The Chamber environment (genuinely new work)

Everything above is state and logic; none of it renders anything. The
Mirror Field / Portal Gallery / Timeline Vault / Shadow Chamber / Reflection
Core areas the guide describes are a presentation layer that *reads*
`mirrorClarity()` and per-pillar step status — they do not own state.

Two viable approaches given what's already in this codebase, in order of
recommended effort:

1. **2D/canvas ambient layer**, following the pattern already proven in
   `modules/sovereign/reclamation-university/VibrationModuleExperience.jsx`'s
   `ResonanceField` (a `<canvas>` driven by `requestAnimationFrame`, reactive
   to pointer proximity, respecting `prefers-reduced-motion`). A water/mirror
   analog of that component, re-themed per `clarityStateFor()`'s five states
   (distortion amplitude decreasing as clarity rises), delivers the "the
   environment is the visual representation of progression" goal (guide step
   9) with no new dependency and a known performance budget.
2. **Real 3D Chamber** via `@react-three/fiber`/`drei`/`three` (already
   dependencies, presumably used by the visualizer — confirm current usage
   before assuming budget headroom). This is what the guide's "Timeline
   Weaver... walk through different possibilities" language implies, but
   it's a materially larger commitment (asset pipeline, lazy-loading per
   guide step 34, mobile/input strategy per step 35). Treat this as a
   deliberate scope decision to make explicitly with whoever owns the
   visual direction, not something to default into because the packages
   happen to be installed.

Either way, the environment component should take `clarityStateFor(score)`
and per-pillar `readiness` as props/hooks and render *from* them — never
duplicate the clarity calculation in the component.

## 7. Vertical slice — what "done" looks like for the first PR

Per the guide's own closing rule, the first slice is one pillar, through the
whole real stack, not a mocked one:

```text
Nexus → Reflection Protocol card
     → ReflectionProtocolPage.jsx (shared SovereignProvider mounted)
     → Seeker opens Pillar 1 "The Owned Interior"
     → curriculum.startModule('reflection-chamber/owned-interior')   [real dispatch]
     → Seeker expands a shadow code ("The Displaced War")
     → concepts.selectConcept('the-displaced-war', 'reflection-chamber/owned-interior')  [real dispatch → Key Fragment]
     → STEP_COMPLETED / CONCEPT_SELECTED events on the real SovereignEventBus
     → mirrorClarity(state) score rises, state moves FRACTURED → DISTORTED
     → Chamber environment component re-renders from that score            [new, §6]
     → sovereignSupabaseSync flushes sovereign_module_state + sovereign_concepts rows
     → Seeker leaves, returns later → SovereignProvider hydrates from Supabase → same clarity
```

Everything left of "Chamber environment component" already exists and is
exercised by this branch's `mirrorClarity` tests against the real reducer.
The next PR's job is: wire one pillar's real content into the 11-step
lifecycle inside `ReflectionProtocolPage.jsx`, and build the smallest
possible environment component that reads `mirrorClarity()`. Resist doing
this for all five pillars before that loop is proven end-to-end (including
a real logout/login persistence check) — that is the one failure mode this
whole document exists to prevent.

## 8. What NOT to build (guide step 39, made concrete)

- No new `protocol_events` / `act2_progress` / `key_fragments` / `reflection_sessions`
  Supabase tables — `sovereign_events`, `sovereign_module_state`,
  `sovereign_concepts`, `sovereign_reflections` already cover them.
- No new React context/provider for Act II state — one `<SovereignProvider>`
  per page, per the Phase 15 fix already landed in `ReclamationModulePage.jsx`.
- No new "FragmentManager" class — the Concept Graph actions
  (`selectConcept`/`connectConcepts`/`mapConceptToDomain`) are it.
- No routing/extending of `/act/2` (`ActPage.jsx`) or resurrecting
  `ActProtocol.jsx` — both predate this runtime and duplicate content that
  now lives in `reflectionChamberModuleData.js`.
- No invented Protocol names/scenarios (Emotion Decoder, Boundary Portal,
  Timeline Weaver, Shadow Integration) in place of the five already-authored
  pillars — extend what's written, don't replace it with placeholders.
