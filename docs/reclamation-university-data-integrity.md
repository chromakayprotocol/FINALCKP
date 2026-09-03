# Reclamation University — data integrity

How the Nexus dashboard's numbers are produced, which Supabase objects they
depend on, and how to verify that a deployed environment can actually
produce them. The governing rule:

> Every value displayed as personalized seeker state has exactly one
> authoritative source. A value that cannot be derived renders as an
> explicit non-value — never as a placeholder.

---

## 1. The chain

```
supabase/migrations/          (git)
        ↓  supabase db push
deployed Supabase schema
        ↓  PostgREST schema cache
VITE_SUPABASE_URL project
        ↓  Supabase Auth (auth.uid())
authenticated seeker identity
        ↓  RLS-scoped rows
rec_uni_user_progress + sovereign_module_state
        ↓  nexusProgressSource.loadNexusProgress()
        ↓  nexusState.deriveNexusState()
NexusState
        ↓
UniversityNexus (axis %, protocol %, dock meters)
```

Break any link and the Nexus is required to say so out loud. It has no
fallback path to a plausible-looking number.

---

## 2. Required tables

The deployed project must expose all of these through PostgREST:

| Table | Migration | Used for |
|---|---|---|
| `rec_uni_faculties` | `20260718050923_create_reclamation_university_runtime_schema.sql` | Published faculty registry (optional content) |
| `rec_uni_modules` | same | Published module registry (optional content) |
| `rec_uni_user_progress` | same | **Fracture Protocol** progress; legacy Hermetic rows |
| `rec_uni_module_responses` | same | Module declaration records |
| `rec_uni_journal_entries` | same | Module journal writes |
| `rec_uni_events` | same | `emitAnalyticsEvent()` |
| `rec_uni_certificates` | same | Certificate records |
| `sovereign_module_state` | `20260822051703_create_sovereign_runtime_schema.sql` | **Hermetic Hall** and **Reflection Protocol** progress |

`sovereign_module_state` is on this list deliberately. A verification that
only covers `rec_uni_*` does not cover the Nexus's own data path — two of
the four things the Nexus displays are derived from the Sovereign Runtime's
table, not from `rec_uni_user_progress`.

### Required invariants

**Progress uniqueness**

```sql
unique (user_id, module_id)   -- rec_uni_user_progress
unique (user_id, module_id)   -- sovereign_module_state
```

**Row-level security**

A seeker may read and write only their own learner-state rows. Every
policy on a learner-state table must be `to authenticated` and predicated
on `(select auth.uid()) = user_id`.

Never introduce:

- a `select` policy that returns all progress,
- an `update` policy that can write another user's row,
- an `insert` policy with a `user_id` the caller supplies unchecked.

Never weaken a policy to make a test pass. If a test needs a row, the test
needs a fixture, not a wider policy.

**Credentials**

- The frontend and every check in this repository use only the
  publishable/anon key.
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in browser code, in a
  fixture, or in a unit test. `verify-supabase-schema.mjs` refuses to run
  if it finds one in the environment.

---

## 3. Verifying a deployed environment

### Automated

```bash
SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_PUBLISHABLE_KEY=<publishable key> \
npm run verify:supabase --prefix frontend
```

The script requests `?select=*&limit=1` for each required table with the
anon key and classifies the answer:

| Response | Meaning | Result |
|---|---|---|
| JSON array | Table exposed, RLS permitted the read (usually `[]`) | pass |
| JSON error, `401` / `403` | Table exposed, RLS denied an anonymous read | pass — RLS is working |
| JSON error, `PGRST205` | Not in the schema cache | **fail** |
| JSON error, `404` | Not exposed by PostgREST | **fail** |
| **Non-JSON body, any status** | Not a PostgREST response — a proxy, WAF, or error page answered | **fail** |
| transport error | Endpoint unreachable | **fail** |

The non-JSON rule matters more than it looks. An earlier draft of this
check classified purely on status code, so an egress proxy answering
`403 text/plain` to CONNECT read as "table exists, RLS denied the read" —
and the gate reported a fully green schema for a project it had never
reached. A verification that passes without verifying is worse than none.
The classifier now requires a JSON body shaped like PostgREST's, probes
`/rest/v1/` once up front so an unreachable endpoint fails loudly rather
than eight times misleadingly, and is unit-tested in
`frontend/src/lib/supabase/verifySupabaseSchema.test.js`.

### Manual

1. **Is the migration applied?**
   ```bash
   supabase migration list --linked
   ```
   Compare against `supabase/migrations/`. Git and the deployed project must
   agree.

2. **If a migration is missing**, apply the canonical one:
   ```bash
   supabase db push
   ```
   Do **not** author a duplicate migration that recreates a table merely
   because the table is missing remotely. There is one migration system:
   `supabase/migrations/`. (`supabase/migrations_legacy_finalckp/` is
   archived — do not extend it.)

3. **If the migration is applied but PostgREST still answers `PGRST205`**,
   the schema cache is stale. Reload it:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
   (or restart the API from the Supabase dashboard), then re-run the check.

4. **Is the deployment pointed at the project you just inspected?**
   The Pages workflow injects `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` from GitHub Actions secrets. Confirm the
   secret's project ref matches the project whose schema you verified.

   Note: `frontend/src/services/supabase/client.js` carries a bundled
   fallback URL/key for local development. Environment variables take
   precedence, and `validateSupabaseConfiguration().usesBundledFallback`
   reports when the fallback is in play. A deployment running on the
   fallback is a misconfiguration — the CI verification step exists to
   catch exactly that.

### Current status

As of this document's authoring, the deployed Supabase project could **not**
be reached from the environment this work was performed in — outbound HTTPS
to `*.supabase.co` is blocked by that environment's network policy, so
`verify:supabase` returned a transport failure rather than a schema answer.

The verification is therefore **automated but not yet executed against
production**. Run `npm run verify:supabase --prefix frontend` (or let the
deploy workflow's `Verify Supabase schema` step run it) from an environment
with network access to the project before treating the schema as confirmed.
The migration file's presence in git is not evidence that the table exists.

---

## 4. How each displayed value is derived

Defined in `frontend/src/lib/university/nexusState.js`. All of it is pure —
rows in, projection out — so every case below is unit-tested in
`nexusState.test.js`.

### Which table backs which track

Which store a module writes to is decided by which engine renders it:

| Track | Engine | Table | `module_id` shape |
|---|---|---|---|
| Hermetic Hall (7 principles) | Sovereign Runtime experiences | `sovereign_module_state` | `hermetic-hall/<slug>` |
| Reflection Protocol (5 pillars) | Reflection Chamber | `sovereign_module_state` | `reflection-chamber/<pillar>` |
| Fracture Protocol (`foundations` faculty) | `ReclamationModuleEngine` | `rec_uni_user_progress` | curriculum `module.id` |

> **Fixed in this pass.** The previous Nexus hook queried
> `rec_uni_user_progress` for the bare principle slugs (`mentalism`,
> `correspondence`, …). No writer in this repository has ever produced a row
> with those ids — the Hermetic Hall experiences moved onto the Sovereign
> Runtime in Phase 8/15. That query could only ever return zero rows, so the
> Hall percentage was structurally pinned to 0% for every seeker, and the
> hardcoded `centralAxisStats.completePercent = 64` fallback stood in for it
> on every render. Both halves of that are gone.

`HERMETIC_HALL_MODULES` still recognises the legacy `rec_uni_user_progress`
ids (`hermetic-principle-N`, and the bare slug) so an older row, if one
exists, still counts. A principle is complete if **any** store that
legitimately writes it says so.

### Protocol progress

```
completed modules
-----------------  × 100   (Math.round)
  total modules
```

| Status | Condition |
|---|---|
| `not_started` | 0% |
| `in_progress` | 1–99% |
| `completed` | 100% |
| `unavailable` | the protocol has no production modules |
| `unknown` | real protocol, but this seeker's state could not be read |

A module counts as complete when its row has `status = 'completed'` or a
non-null `completed_at`.

### Availability

| Protocol | Available | Destination |
|---|---|---|
| Fracture | yes | `/experiencemode/sovereign/reclamation-university/foundations` |
| Reflection | yes | `/experiencemode/sovereign/reclamation-university/reflection-protocol` |
| Crucible | **no** | — |
| Reclamation | **no** | — |

Crucible and Reclamation have no underlying learner experience. They remain
visible as architectural nodes with `available: false`, `progress: null`,
`status: unavailable`, a lock affordance, and an accessible name ending in
`— coming soon`. They must not be enabled to make the Nexus look complete.

### Central Academic Axis

Derived from real Hermetic Hall state: completed principles over seven.
There is no static fallback for an authenticated user.

The old `sovereignSoulsEnrolled: 1287` enrollment count is no longer
rendered — it was not backed by a live source. If a platform-wide count is
wanted, it needs a real query and should be labelled as global, not seeker,
state.

### Dock meters

| Meter | Definition | Status today |
|---|---|---|
| **Knowledge Index** | completed educational modules ÷ available educational modules, across the Hermetic Hall's seven principles plus every available Protocol's modules | **derived** |
| **Arsenal Attunement** | completed applicable exercises/artifacts ÷ total | **`unavailable`** — no arsenal/artifact curriculum defines an enumerable denominator |
| **Celestial Alignment** | alignment curriculum completion ÷ total | **`unavailable`** — no alignment curriculum exists |

The two unavailable meters render "Coming Soon" with an empty track. A null
production value is preferable to false personalization; when a backing
subsystem lands, give it a real definition here first.

---

## 5. State-by-state UI contract

| Condition | `dataState` | What the Nexus shows |
|---|---|---|
| Load in flight | `loading` | Shell renders; no values yet |
| No authenticated seeker | `signed_out` | Shell renders; "Signed out — personalized progress is hidden"; every personalized value `null` |
| Authenticated, rows read | `ready` | Real derived values |
| Authenticated, read failed | `error` | Shell renders; "Learner state unavailable … (PGRST205)"; every personalized value `null`; structured `console.error('[nexus] learner-state load failed', …)` |

Signed-out and authenticated-failure are deliberately **different** messages.
Collapsing them is the confusion that a hardcoded fallback used to hide.

`UniversityNexus.test.js` asserts that none of the retired placeholder
percentages (64, 72, 51, 68, 23, 32, 27) can appear in any non-ready state.

---

## 6. Canonical entry architecture

```
Reclamation University
      │
      └── /experiencemode/sovereign/reclamation-university/nexus   ← canonical landing surface
            ├── Hermetic Hall     → …/hermetic-hall (→ …/hermetic-hall/:principle)
            ├── Fracture Protocol → …/foundations (→ …/foundations/:moduleSlug)
            ├── Reflection Protocol → …/reflection-protocol
            ├── Crucible Protocol   (locked)
            └── Reclamation Protocol (locked)
```

### Route audit

| Route | Role | Disposition |
|---|---|---|
| `…/reclamation-university/nexus` | Canonical University landing surface | **canonical** |
| `…/reclamation-university` | Former University home | Redirects to `/nexus`. Every "return to university" exit across the module experiences targets this path, so the redirect (rather than deletion) keeps all of them working. |
| `/reclamation-university` | Legacy short path | Now redirects **directly** to `/nexus` (was a double hop through the base route). |
| `…/reclamation-university/hermetic-hall` | Hall gateway | **preserved** — legitimate deep link |
| `…/reclamation-university/reflection-protocol` | Reflection Chamber | **preserved** — legitimate deep link, matched ahead of `:facultySlug` |
| `…/reclamation-university/:facultySlug[/:moduleSlug]` | Faculty + module deep links | **preserved** |
| `…/reclamation-university/sovereign-os` | Sovereign OS Shell | **preserved** — a distinct experience, not a University home |
| `/qa/hermetic-hall`, `/qa/sovereign-os` | QA harnesses | **preserved** |
| `/reclamation_pathway` | Redirects to `/experiencemode/sovereign` | **preserved** — Sovereign-mode home, not University home |

The older circular principle-selector viewport that used to act as a second
University home has already been retired; no component in the tree still
renders one. This audit found no remaining duplicate University-home route.

Enforced by `nexusRoutes.test.js`.

**Flagged, out of scope:** `/Reclamation_User_Journey` (`Reclamation_User_Journey.jsx`)
is an Act III journey picker, not a University entry, and is unlinked from
anywhere else in `src/`. Its "LAUNCH SOVEREIGN PROTOCOL" button targets
`/protocol/3`, a route deleted in the Phase 20 backend removal. That is a
pre-existing broken link outside this reconciliation's scope — recorded here
rather than changed.

---

## 7. Checks and where they run

| Check | Command | Gate |
|---|---|---|
| Unit + integration tests (CI) | `npm run test:ci --prefix frontend` | pre-deploy |
| Unit + integration tests (unfiltered) | `npm run test:unit --prefix frontend` | local truth |
| Nexus asset integrity | `npm run check:nexus-assets --prefix frontend` | pre-deploy |
| Production build | `npm run build --prefix frontend` | pre-deploy |
| Static route smoke | `npm run smoke:routes --prefix frontend` | post-build, pre-deploy |
| Supabase schema | `npm run verify:supabase --prefix frontend` | pre-deploy (needs secrets) |
| Post-deploy smoke | `npm run smoke:routes --prefix frontend -- --base <url>` | post-deploy |
| 16:9 layout + zoom validation | `npm run test:layout --prefix frontend` | opt-in (real browser) |

A successful Vite build is not evidence that the Nexus works. It proves the
module graph compiles and nothing else — which is why every row above it and
below it exists.

Unit tests never require production credentials. They use mocks and
fixtures; Supabase verification is a separate, environment-aware CI stage.

### The CI test quarantine

`test:ci` runs `src/**/*.test.js` minus three files, listed individually
(never by glob) with their reasons in `frontend/vitest.ci.config.js`:

| File | Why it fails |
|---|---|
| `src/data/hermeticImportedCurriculum.test.js` | Asserts 44 authored lesson records; `hermeticCourseData.js` ships `lessons: []` for all seven modules — the content the assertion describes is not in the repository. |
| `src/modules/sovereign/reclamation-university/hermeticJourneyTabs.test.js` | Derives its fixtures from the same empty `COURSE_MODULES` lessons. |
| `src/modules/sovereign/reclamation-university/hermeticLearningExperience.test.js` | Same missing-content cause. |

All three predate this work — `docs/ARCHITECTURE.md`'s Phase 20 entry
already records them as "6 pre-existing unrelated failures". They are
excluded so the deploy gate is enforceable at all, **not** to make a
failing assertion pass, and no test was edited or weakened. Removing an
entry means restoring the lesson content the test asserts. `test:unit`
runs them, so their real state stays visible.

Excluded from both: `vma-worker/` — a separate Cloudflare Worker with its
own `node_modules`, whose test file cannot load under the frontend's
resolver.

---

## 8. 16:9 layout validation

`npm run test:layout --prefix frontend` (Playwright, `frontend/e2e/`).

Deliberately **not** in the deploy gate: it drives a real browser, so it is
opt-in rather than a cost every push pays. It runs against
`frontend/e2e/harness`, a standalone Vite entry that mounts
`UniversityNexus` with stubbed auth and stubbed Supabase — the Nexus lives
behind `ProtectedRoute` in the real app, and no credential may ever reach
CI. Add `?state=signed-out` or `?state=error` to the harness URL to render
those data states.

Its purpose is **validation of the existing composition**, never leverage to
convert the Nexus into a conventional responsive page.

Matrix: 1920×1080, 1440×900, 1366×768, iPad landscape (1024×768), iPad
portrait (768×1024), narrow mobile (375×667), plus 125% / 150% / 200%
browser zoom. At every one it asserts: the frame keeps its 16:9 ratio, the
background art resolves, the central Hall and all four protocol nodes are
present, the locked state stays obvious, the dock stays usable, no text is
clipped by its own box, no unintended scrollbars, and every control is
keyboard reachable.

### The 720px poster contract

`UniversityNexus.css` has a `@media (max-width: 720px)` rule that pins the
stage to a fixed 720px width inside an `overflow-x: auto` container — a
deliberate choice to keep the radial layout as a scrollable poster rather
than reflow it into a stack. Below that breakpoint, horizontal scrolling is
therefore the **contract**, not a defect: the suite marks those viewports
`poster: true` and asserts the composition stays reachable by scrolling and
that the *document* still does not scroll, instead of demanding everything
fit at once. The first draft of this suite failed at 375×667 for exactly
this reason; the test was corrected, not the CSS.

---

## 9. Accessibility contract

Covered by `nexusAccessibility.test.js` (jsdom) and the keyboard assertions
in the layout suite.

- Every protocol node is a real `<button type="button">`, so Enter/Space
  activate it and it stays in the tab order.
- Every protocol node has an accessible name containing its title.
- Unavailable protocols carry `aria-disabled="true"` and an accessible name
  ending in `— coming soon`, so their state is not conveyed by the lock icon
  or colour alone. The lock glyph itself is `aria-hidden`. Locked nodes stay
  focusable — `aria-disabled` rather than `disabled` — so the state is
  actually announced instead of the node vanishing from the tab order.
- The visible stat ring reads `Coming Soon` for those two, so the state is
  also visible without assistive technology.
- Dock meters use `role="meter"` with `aria-valuetext`; an unresolved meter
  exposes the wording, never a number.
- The data-state notice is a `role="status"`.
- All artwork is decorative (`alt=""`, `aria-hidden`); meaning lives in the
  adjacent accessible names.
- Focus-visible treatments are defined in CSS, and no rule blanket-removes
  focus outlines (asserted).
