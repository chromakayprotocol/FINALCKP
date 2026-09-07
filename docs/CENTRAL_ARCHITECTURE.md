# The Chroma Frame — the Protocol's central architecture

The problem this solves, stated plainly: the Protocol had five beautiful
screens and no shared identity. The Nexus, the Hermetic Hall, the Sovereign
Mainframe, the Visualizer and the Act entries each invented their own chrome,
their own palette, their own type stack and their own way of reporting a
number. Nothing linked them. A Seeker crossing from the Hall to the Mainframe
had no way to know they were still inside the same product.

There is one chassis now.

---

## 1. The idea

Chroma keying works because **the frame is constant and the key is not**. One
frame, one key colour, and any world at all can be composited behind it. This
application is named after that idea, so its interface is built on it.

Every module screen supplies exactly two things:

| | |
|---|---|
| **PLATE** | its own world — environment art, video, canvas, a 3D scene |
| **CHANNEL** | its own key — one entry in the channel registry |

Everything else — brackets, rails, type, spacing, motion, the way a missing
number is reported — is supplied once, by `frontend/src/system/`, and is
identical everywhere.

> **One chassis, many worlds.**

Look at it running: **`/system/chroma-frame`**
(`frontend/src/pages/experience/ChromaFrameReference.jsx`). It renders the
whole system in the frame it documents, using the same components every
screen uses, so it cannot describe an architecture the code does not have.

---

## 2. Six layers

Always these six, always this order, on every screen.

| z | Layer | What it is |
|---|---|---|
| 0 | `PLATE` | The module's own world. Full-bleed, `object-fit: cover`, decorative, `aria-hidden`. |
| 1 | `VEIL` | The grade: vignette + channel wash. **The single most important element in the system** — it is why a gothic hall, a red HUD and a purple portal room read as one product. |
| 2 | `FIELD` | The module's composition, on a fixed 16:9 stage with container-query units. |
| 3 | `CHASSIS` | Corner brackets + hairline edge rules, keyed to the channel. The signature. |
| 4 | `RAILS` | Top rail and dock. Six slots (§4). |
| 5 | `OVERLAY` | Boot, transition, video, modal. Nothing lives here permanently. |

The stage is `min(100%, 177.8vh)` at `aspect-ratio: 16/9` with
`container-type: inline-size`, so a composition scales as one piece instead of
reflowing part by part. Below `--ckp-stage-min` (900px) the frame **pans
horizontally**; it never rebuilds itself as a column. The composition is the
product.

---

## 3. Seven channels

A channel is a *triplet plus a wash*: `key` paints borders, rules and fills;
`key-bright` paints accent **text** and clears 4.5:1 on the obsidian ground;
`key-dim` is dormant and sealed state; `wash` grades the plate.

| Channel | Key | Transmits |
|---|---|---|
| `aurum` | `#C9A227` | Reclamation University, Hermetic Hall, Air |
| `crimson` | `#D2382C` | Sovereign Mainframe |
| `verdant` | `#3F8F4F` | Act I — The Fractured Veil, Fracture Protocol, Earth |
| `azure` | `#3FA9D8` | Act II — The Reflection Chamber, Reflection Protocol, Water |
| `ember` | `#D0431C` | Act III — Reclamation, Fire |
| `violet` | `#8D20EF` | Sonic surfaces — Immersion, Visualizer Core |
| `argent` | `#6E7683` | The system's own voice: chrome, boot, diagnostics, sealed |

None of these are new inventions. They are the colours already on screen,
promoted to canon — which is why adopting the frame changed nothing about how
the screens look, only about how many places define it. Before this, the
Nexus's gold (`#d9a441`) and the University module system's gold (`#C9A227`)
were two different golds eight percent apart on adjacent screens.

A **sealed** module transmits on `argent`, never on a dimmed version of the
channel it will eventually own. "Sealed" and "quiet" have to look different.

### Declaring a channel

Two forms, one contract, identical output:

```jsx
<ChromaFrame channel="aurum" …>   {/* injects the four keys inline */}
```
```html
<div class="hh-scene" data-channel="aurum">   <!-- or takes them from CSS -->
```

The second exists for screens that already own their full-page chrome (the
Nexus, the Mainframe, the Hall), so they inherit the Protocol's identity today
without being rebuilt around the component first. Moving from one form to the
other is a no-op visually.

Screens that need to depict a channel **other than their own** — the Nexus
renders four protocol nodes in four keys; the Mainframe shows five elements —
read the standing palette: `--ckp-ch-<channel>` and `--ckp-ch-<channel>-bright`.

---

## 4. Six slots

The rails are not there because they are attractive. They are there because
they are **identical**. A Seeker who learns once that "where am I" is
top-left and "how am I doing" is top-right never re-learns it — not in the
Hall, not on the Mainframe, not in the Visualizer. That transfer is the whole
return on a shared frame.

```
TOP RAIL    system  ·  location  ...........................  readout
DOCK        seeker  ·  meters  .............................  actions
```

| Slot | Rule |
|---|---|
| `system` | Always "Chroma Key Protocol" + the sigil mark. Nothing else ever occupies this slot. |
| `location` | Where the Seeker is. A breadcrumb, not a title. |
| `readout` | **The one number that matters on this screen.** Derived, never placeheld. |
| `seeker` | Who the Seeker is. |
| `meters` | Up to three channel-keyed progressions. The frame renders at most three, so the slot cannot overflow. |
| `actions` | Exits and controls. |

---

## 5. Three voices. Never a fourth.

Eight families were in play across these screens — Cinzel, Cormorant, Inter,
JetBrains Mono, Oxanium, Archivo, IBM Plex, Chakra Petch. The Protocol speaks
in three registers:

| Voice | Family | Register |
|---|---|---|
| **SIGIL** | Cinzel | Place names, module titles. Mythic. |
| **SIGNAL** | JetBrains Mono, uppercase, `0.22em` | Every system label and telemetry. Machine. |
| **SCRIPT** | Inter | Prose and instruction. Human. |

That tracking is as much the brand as the gold is.

(`--ckp-quote`, Cormorant Garamond, is the one sanctioned addition: Cinzel has
no true italic, and the University's pull-quotes need one.)

---

## 6. The readout rule

> Every value the frame displays as Seeker state has exactly one authoritative
> source. A value that cannot be derived renders as an explicit non-value that
> **says why** — never as a placeholder, and never as a plausible-looking
> default.

The University already held this line
(`lib/university/nexusState.js`, `docs/reclamation-university-data-integrity.md`).
It held it in one wing while the Sovereign Mainframe next door rendered
`TRACK 15 OF 27`, `55%` and `ENERGY OUTPUT 93%` from module-scope constants.
The rule now belongs to the frame, so any screen that mounts in the frame
inherits it whether its author thought about it or not.

Five states. Only one carries a number:

| State | Renders | Because |
|---|---|---|
| `ok` | the value | derived from a real source |
| `loading` | `—` "Reading…" | the read is in flight |
| `signed_out` | `—` "Sign in to track" | no authenticated Seeker |
| `unavailable` | `—` "Not yet built" | authored-but-unbuilt, not broken |
| `error` | `—` "Unavailable" | a real source that failed |

These are four different facts. Collapsing them into one grey dash is exactly
the confusion a placeholder used to hide.

Two mechanical consequences, both enforced in `frameReadout.js`:

- **A numeric value in any state other than `ok` is discarded, not rendered.**
  Otherwise a stale number survives the very failure the rule exists to surface.
- **An unresolved meter gets a hatched rail**, not just an empty one. An empty
  track and a broken track must not look the same.

`normalizeState()` accepts the University's vocabulary (`ready`, `unknown`) as
well as the frame's, so the Nexus's own projection mounts without a translation
layer at each call site.

---

## 7. Rules that are not negotiable

- **No type below 11px.** Anywhere. (Inherited from `recUniSystem.css`, which
  already retired the 7–10px HUD tier inside the University.)
- **`--ckp-key` is for borders, rules and fills. Accent text uses
  `--ckp-key-bright`.** `chromaChannels.test.js` fails if any `key-bright`
  drops below 4.5:1 on the obsidian ground.
- **The corner brackets are the signature.** Never removed, never restyled per
  screen, never rounded.
- **The frame does not scroll.** Modules compose onto the stage; they do not
  grow it.
- **A module may change its plate and its channel. It may not change the frame.**
  A screen that wants to restyle a rail, move a slot, or add a seventh layer
  has found a gap in the system — widen the system, do not work around it in
  one screen. That divergence is what produced five unrelated chromes in the
  first place.

---

## 8. The surface map

`PROTOCOL_SURFACES` in `chromaChannels.js` is the linking layer: before it,
no single file knew what the whole system contained. Every surface carries a
channel, an entry route, and an honest status:

- `live` — reachable today
- `sealed` — authored, deliberately gated
- `vacant` — **named but not implemented**

`vacant` is load-bearing. Checkout/licensing and the AI protocol chat went with
the FastAPI backend (see `docs/ARCHITECTURE.md`, Phase 20) and have no
replacement. A registry that quietly omitted them would read as a complete
system; one that lists them as vacant tells the truth. The reference route
renders them struck through.

---

## 9. Using it

```jsx
import { ChromaFrame, FrameAction, FrameExit, READOUT_STATE } from '@/system';

<ChromaFrame
  channel="aurum"
  plate={<img src={hallArt} alt="" />}
  location="University · Hermetic Hall"
  readout={{ label: 'Pillars restored', value: mended, unit: ' / 7',
             state: loaded ? READOUT_STATE.OK : READOUT_STATE.LOADING }}
  seeker={{ name: user?.name, picture: user?.picture }}
  meters={[{ label: 'Knowledge Index', value: index, state: indexState }]}
  actions={<FrameExit onClick={withdraw} />}
>
  {/* the module's own composition, on the stage */}
</ChromaFrame>
```

Hand the readout a **value and a state**, never a formatted string. The frame —
not the screen — decides what an underivable value looks like, which is why a
screen cannot accidentally print an optimistic default: it never gets to print
anything there.

`FramePanel` applies the corner signature to any box inside the field. Use it
instead of authoring another bordered card; the Hall's video well and the
Mainframe's module cards are the same object.

---

## 10. Adoption state

| Screen | State |
|---|---|
| `/system/chroma-frame` | Built **in** the frame. The reference. |
| Hermetic Hall | Renders the shared `FrameRail`; declares `aurum`; fonts and colours derived. Full `ChromaFrame` adoption pending. |
| University Nexus | Colours and voices derived from the channel layer. Composition untouched — its 47-test Playwright layout contract still passes unchanged. |
| Sovereign Mainframe | Declares `crimson`; ink, elements and body voice derived. |
| RU module system (`recUniSystem.css`) | Declares `aurum`; ground, materials and all three voices derived. Every Hermetic module inherits it. |
| Visualizer Core, Act entries, `AppShell` | Not yet adopted. |

**The path for the rest is the same every time:** declare the channel, replace
the bespoke header with `FrameRail`, hand the screen's numbers to the readout
rule as value + state, then move the composition onto the stage inside
`<ChromaFrame>`. Do them one screen at a time; each step is independently
shippable, and none of them requires the next.

### What this does not do yet

- `AppShell` (the sidebar dashboard chrome) is a *second* full navigation
  system that still exists alongside the frame. It has not been reconciled,
  and reconciling it is the largest remaining piece of this work.
- `frontend/src/mainframe/` is an unrouted skeleton (`MainframeLayout.jsx` is
  empty; `PortalGrid.jsx` has unreachable code after its `return`). The
  surface registry supersedes what it was reaching for; it should be deleted
  or rebuilt on the frame rather than left as a third chrome.
- No screen yet mounts a live `<ChromaFrame>` as its root. The reference route
  is the only full-frame surface. That is deliberate for a first pass — the
  token and rail layers unify the identity now, at near-zero risk to the
  compositions that already work.

---

## 11. Where things live

```
frontend/src/system/
  chromaChannels.js      channel registry + protocol surface map
  chromaFrame.css        the chassis: tokens, six layers, rails, type scale
  ChromaFrame.jsx        the shell + FramePanel
  FrameRail.jsx          rails, readout, meter, action, exit
  frameReadout.js        the readout rule
  index.js               the barrel — import from '@/system'
  *.test.js              59 tests: registry, contrast, CSS/JS drift, the rule
```

`chromaChannels.test.js` reads `chromaFrame.css` and fails if the JS registry
and the CSS palette drift apart. Two copies of the same value is a risk, and
drift between those two files is precisely the failure this architecture
exists to end — so it is asserted rather than trusted.
