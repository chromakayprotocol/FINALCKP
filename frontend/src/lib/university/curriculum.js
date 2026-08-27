/**
 * Reclamation University curriculum configuration.
 *
 * This is the data layer for the University Nexus dashboard. UI components
 * read from here rather than hardcoding domain/module/principle copy, so the
 * curriculum can grow without touching the visual layer.
 *
 * The seven Hermetic principles are the one subsystem with a real,
 * Supabase-backed progress table today (`rec_uni_user_progress`, keyed by
 * these `slug`s — see HermeticHallViewport.jsx). The three Domains and the
 * bottom-dock subsystems (Light Codes, Field Exercises, Case Studies,
 * Protocol Labs, Examinations, Graduation) don't have dedicated tables or
 * routes yet, so they render as previews/"soon" states until that schema
 * (see spec: university_domains, university_modules, university_lessons,
 * artifacts, user_activity) lands.
 */

// R2-hosted pathway art, supplied directly — do not swap these for
// generated/placeholder art (same bucket/convention as HermeticHallHub.jsx).
const R2_SHELL_BASE = 'https://pub-7db585eeeb464a9d9f749f0307532c22.r2.dev/images/shell';

export const hermeticHallImage = `${R2_SHELL_BASE}/Reclamation_Hall_Pathway.png`;

export const universityDomains = [
  {
    id: 'foundation',
    number: 'I',
    title: 'Foundation',
    subtitle: 'Understand Yourself',
    theme: 'foundation',
    image: `${R2_SHELL_BASE}/Foundation_Pathway.png`,
    modules: ['Consciousness', 'Identity', 'Perception', 'Belief Systems', 'Mental Architecture'],
    available: false,
  },
  {
    id: 'language',
    number: 'II',
    title: 'Language',
    subtitle: 'Understand the Code',
    theme: 'language',
    image: `${R2_SHELL_BASE}/Language_Pathway.png`,
    modules: ['Language', 'Narrative', 'Symbols', 'Thought Forms', 'Programming', 'Media & Conditioning'],
    available: false,
  },
  {
    id: 'sovereignty',
    number: 'III',
    title: 'Sovereignty',
    subtitle: 'Reclaim Your Power',
    theme: 'sovereignty',
    image: `${R2_SHELL_BASE}/Sovereign_Pathway.png`,
    modules: ['Agency', 'Boundaries', 'Decision Making', 'Power', 'Reclamation', 'Integration', 'Applied Protocols'],
    available: false,
  },
];

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

export const dockItems = [
  { id: 'light-codes', label: 'Light Codes', description: 'Activations', icon: 'Zap', available: false },
  { id: 'field-exercises', label: 'Field Exercises', description: 'Practice', icon: 'Target', available: false },
  { id: 'case-studies', label: 'Case Studies', description: 'Real World', icon: 'ScrollText', available: false },
  { id: 'protocol-labs', label: 'Protocol Labs', description: 'Apply', icon: 'FlaskConical', available: false },
  { id: 'examinations', label: 'Examinations', description: 'Test', icon: 'ClipboardCheck', available: false },
  { id: 'graduation', label: 'Graduation', description: 'Ascend', icon: 'GraduationCap', available: false },
];

export const universityNavigation = [
  { id: 'nexus', label: 'Nexus', description: 'University Home', icon: 'Compass' },
  { id: 'domains', label: 'The Domains', description: 'Your Curriculum', icon: 'LayoutGrid' },
  { id: 'hermetic-hall', label: 'Hermetic Hall', description: '7 Principles', icon: 'Landmark' },
  { id: 'archive', label: 'Archive', description: 'Library & Records', icon: 'BookOpen', available: false },
  { id: 'journal', label: 'Journal', description: 'Reflections', icon: 'BookMarked', available: false },
  { id: 'artifacts', label: 'Artifacts', description: 'Sealed Knowledge', icon: 'Gem', available: false },
  { id: 'protocol', label: 'Protocol', description: 'Tools & Resources', icon: 'Wrench', available: false },
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

export const defaultActiveArtifact = {
  id: 'polarity-key',
  name: 'Polarity Key',
  level: 2,
  description: 'Reveals the forces of opposition and balance.',
  type: 'key',
};

export const defaultRecentActivity = [
  { id: 'a1', type: 'lesson', title: 'Completed Lesson 2', subtitle: 'Principle IV: Polarity', timestamp: '2h ago' },
  { id: 'a2', type: 'artifact', title: 'Sealed New Artifact', subtitle: 'Polarity Key', timestamp: '5h ago' },
  { id: 'a3', type: 'journal', title: 'Journal Entry Added', subtitle: 'Reflection on Balance', timestamp: '1d ago' },
];

export const universityQuotes = [
  { text: 'The more you know the code, the more you reclaim the realm.', attribution: 'MM' },
  { text: 'Seven principles. Seven paths. One system.', attribution: 'MM' },
  { text: 'Sovereignty begins where self-knowledge ends.', attribution: 'MM' },
];

export function getUniversityQuote(seed = 0) {
  return universityQuotes[seed % universityQuotes.length];
}

export function getUniversityTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour12: false });
}
