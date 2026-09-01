/**
 * Reclamation University curriculum configuration.
 *
 * This is the data layer for the University Nexus dashboard. UI components
 * read from here rather than hardcoding domain/module/principle copy, so the
 * curriculum can grow without touching the visual layer.
 *
 * The seven Hermetic principles are the one subsystem with a real,
 * Supabase-backed progress table today (`rec_uni_user_progress`, keyed by
 * these `slug`s — see HermeticHallViewport.jsx). The four Protocols and the
 * bottom-dock subsystems (Light Codes, Field Exercises, Case Studies,
 * Protocol Labs, Examinations, Graduation) don't have dedicated tables or
 * routes yet, so they render as previews/"soon" states until that schema
 * (see spec: university_domains, university_modules, university_lessons,
 * artifacts, user_activity) lands.
 *
 * Exception: Reflection Protocol is live — Act II Water / Reflection Chamber
 * five-pillar module (see reflectionChamberModuleData.js + ReflectionProtocolPage).
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
// route to the Act II five-pillar Reflection Chamber module.
export const universityProtocols = [
  {
    id: 'fracture',
    title: 'The Fracture Protocol',
    theme: 'fracture',
    image: `${NEXUS_BASE}/Nexus_Fracture_Protocol.png`,
    statLabel: 'Academic Mastery',
    statValue: 64,
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
    statValue: 23,
    position: 'top-right',
    available: true,
    // Dedicated Act II Water module — five pillars of governed feeling.
    route: '/experiencemode/sovereign/reclamation-university/reflection-protocol',
  },
  {
    id: 'crucible',
    title: 'The Crucible Protocol',
    theme: 'crucible',
    image: `${NEXUS_BASE}/Nexus_Crucible_Protocol.png`,
    statLabel: 'Knowledge',
    statValue: 32,
    position: 'bottom-left',
    available: false,
  },
  {
    id: 'reclamation',
    title: 'The Reclamation Protocol',
    theme: 'reclamation',
    image: `${NEXUS_BASE}/Nexus_Reclamation_Protocol.png`,
    statLabel: 'Alignment',
    statValue: 27,
    position: 'bottom-right',
    available: false,
  },
];

// Central Academic Axis (the Hermetic Hall medallion) display stats.
export const centralAxisStats = {
  completePercent: 64,
  sovereignSoulsEnrolled: 1287,
};

// Bottom dock meters — placeholder display values until their backing
// subsystems (arsenal/celestial tables) exist; Knowledge Index mirrors the
// same "no dedicated table yet" caveat as defaultSeekerProgress below.
export const nexusDockStats = {
  knowledgeIndex: 72,
  arsenalAttunement: 51,
  celestialAlignment: 68,
};

// Mirrors the slugs/order already used by HermeticHallViewport + rec_uni_user_progress.module_id.
export const hermeticPrinciples = [
  { number: 'I', slug: 'mentalism', name: 'Mentalism', keywords: 'Mind. All. Universe.' },
  { number: 'II', slug: 'correspondence', name: 'Correspondence', keywords: 'Above. Below. Within.' },
  { number: 'III', slug: 'vibration', name: 'Vibration', keywords: 'Motion. Frequency. Change.' },
  { number: 'IV', slug: 'polarity', name: 'Polarity', keywords: 'Opposition. Balance. Contrast.' },
  { number: 'V', slug: 'rhythm', name: 'Rhythm', keywords: 'Flow. Tide. Return.' },
  { number: 'VI', slug: 'cause-and-effect', name: 'Cause & Effect', keywords: 'Action. Consequence. Law.' },
  { number: 'VII', slug: 'gender', name: 'Gender', keywords: 'Masculine. Feminine. Creation.' },
];

// Placeholder seeker-wide stats: these subsystems (modules/lessons/artifacts/
// journal tables) don't exist yet, so these are display defaults rather than
// a computed value. `hermeticProgress` (from useSeekerProgress) is the one
// slice of this that is genuinely computed from Supabase data.
export const defaultSeekerProgress = {
  overallProgress: 64,
  modulesCompleted: 38,
  modulesTotal: 72,
  lessonsCompleted: 112,
  lessonsTotal: 214,
  artifactsSealed: 23,
  artifactsTotal: 72,
  journalEntries: 47,
  daysActive: 19,
};
