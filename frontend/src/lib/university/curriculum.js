/**
 * Reclamation University curriculum METADATA.
 *
 * Static, seeker-independent configuration for the University Nexus
 * dashboard: artwork paths, titles, themes, node positions, routes and
 * availability. UI components read from here rather than hardcoding
 * domain/module/principle copy, so the curriculum can grow without
 * touching the visual layer.
 *
 * This file owns NO personalized learner state. Every percentage the Nexus
 * displays for a seeker is derived in `nexusState.js` from rows that a real
 * writer in this app persists. The `statValue`, `centralAxisStats
 * .completePercent`, `nexusDockStats` and `defaultSeekerProgress` display
 * placeholders that used to live here were removed rather than relocated:
 * a hardcoded 64% rendered in a personalized slot is indistinguishable from
 * real progress, which is exactly the failure mode this split prevents.
 *
 * Exception: Reflection Protocol is live — Act II Water / Reflection Chamber
 * five-stage / twenty-artifact production master (see ReflectionProtocolPage).
 */

// Locally hosted Nexus art (frontend/public/reclamation-university/Nexus) —
// the radial dashboard shell, not R2-hosted, since these ship with the app
// bundle. A manual commit outside any Claude session ("commitgit", PR #63)
// moved these into a Nexus/ subfolder without updating this base path,
// 404ing every image below until this fix.
const NEXUS_BASE = '/reclamation-university/Nexus';

export const nexusBackgroundImage = `${NEXUS_BASE}/Nexus_Background.png`;
export const hermeticHallImage = `${NEXUS_BASE}/Nexus_Hermetic_Hall.png`;

// The four Protocols replace the old three-Domain model on the Nexus screen.
// Each maps onto one of the original Domains' theme colors/routes (Reflection
// = Foundation's blue "Understand Yourself"; Fracture = Language's green
// "Understand the Code"; Crucible = Sovereignty's red "Reclaim Your Power")
// plus a new fourth, gold Reclamation Protocol for later synthesis/graduation
// content. Fracture uses facultySlug → foundations. Reflection uses a dedicated
// route to the Act II five-stage Reflection Chamber production master.
export const universityProtocols = [
  {
    id: 'fracture',
    title: 'The Fracture Protocol',
    theme: 'fracture',
    image: `${NEXUS_BASE}/Nexus_Fracture_Protocol.png`,
    statLabel: 'Academic Mastery',
    position: 'top-left',
    available: true,
    facultySlug: 'foundations',
  },
  {
    id: 'reflection',
    title: 'The Reflection Protocol',
    theme: 'reflection',
    image: `${NEXUS_BASE}/Nexus_Reflection_Protocol.png`,
    statLabel: 'Spiritual Mastery',
    position: 'top-right',
    available: true,
    // Dedicated Act II Water module — five stages / twenty sonic artifacts.
    route: '/experiencemode/sovereign/reclamation-university/reflection-protocol',
  },
  {
    id: 'crucible',
    title: 'The Crucible Protocol',
    theme: 'crucible',
    image: `${NEXUS_BASE}/Nexus_Crucible_Protocol.png`,
    statLabel: 'Knowledge',
    position: 'bottom-left',
    available: false,
  },
  {
    id: 'reclamation',
    title: 'The Reclamation Protocol',
    theme: 'reclamation',
    image: `${NEXUS_BASE}/Nexus_Reclamation_Protocol.png`,
    statLabel: 'Alignment',
    position: 'bottom-right',
    available: false,
  },
];

// Central Academic Axis (the Hermetic Hall medallion).
//
// `completePercent` used to live here as a hardcoded 64 and was used as the
// fallback whenever the real Hermetic Hall query returned nothing — which,
// given that query's module-id mismatch, was always. It is gone: the axis
// percentage is derived state (nexusState.js) with no static fallback.
//
// Nothing personalized remains in this object. `sovereignSoulsEnrolled` is
// not backed by a live source, so it is not exported as a displayable stat;
// see the Nexus component, which no longer renders an enrollment count.

// The seven Hermetic principles as static metadata (numbering + keywords for
// display). These slugs are the Hall's canonical principle identifiers; the
// module ids their progress is actually persisted under are resolved in
// nexusState.js (`hermetic-hall/<slug>` in sovereign_module_state), not here.
export const hermeticPrinciples = [
  { number: 'I', slug: 'mentalism', name: 'Mentalism', keywords: 'Mind. All. Universe.' },
  { number: 'II', slug: 'correspondence', name: 'Correspondence', keywords: 'Above. Below. Within.' },
  { number: 'III', slug: 'vibration', name: 'Vibration', keywords: 'Motion. Frequency. Change.' },
  { number: 'IV', slug: 'polarity', name: 'Polarity', keywords: 'Opposition. Balance. Contrast.' },
  { number: 'V', slug: 'rhythm', name: 'Rhythm', keywords: 'Flow. Tide. Return.' },
  { number: 'VI', slug: 'cause-and-effect', name: 'Cause & Effect', keywords: 'Action. Consequence. Law.' },
  { number: 'VII', slug: 'gender', name: 'Gender', keywords: 'Masculine. Feminine. Creation.' },
];

// `defaultSeekerProgress` used to live here: a block of invented seeker-wide
// totals (38/72 modules, 112/214 lessons, 23/72 artifacts, 47 journal
// entries, 19 days active) that the Nexus hook installed as its state
// whenever Supabase was unavailable. Nothing distinguished it from real
// data once rendered, so it was removed rather than renamed. If preview
// fixtures are ever needed for design work, they belong in a file whose
// name says so (`*.fixture.js`) and must never be reachable from the
// production Nexus state path.
