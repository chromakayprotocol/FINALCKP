/* Reclamation University — the canonical curriculum.
 *
 * Every Hermetic Hall module runs these eleven sections in this order. The ids
 * are the stable identifiers progress and analytics reference, so they must not
 * be renamed to suit a layout: presentation changes, `id` does not.
 *
 * This replaces both the earlier seven-section structure and the five-stage
 * ReclamationModuleEngine flow. Neither should be reintroduced for a Hall module.
 */

import { SOVEREIGN_STEP_IDS } from '../../../sovereign/runtime';

export const CURRICULUM_SECTIONS = [
  { id: 'intro',          n: '01', label: 'Intro',          phase: 'UNDERSTAND' },
  { id: 'principle',      n: '02', label: 'Principle',      phase: 'UNDERSTAND' },
  { id: 'key-concepts',   n: '03', label: 'Key Concepts',   phase: 'UNDERSTAND' },
  { id: 'why-it-matters', n: '04', label: 'Why It Matters', phase: 'CONNECT' },
  { id: 'domains',        n: '05', label: 'Domains',        phase: 'CONNECT' },
  { id: 'reclamation',    n: '06', label: 'Reclamation',    phase: 'CONNECT' },
  { id: '2026-lens',      n: '07', label: '2026 Lens',      phase: 'CONNECT' },
  { id: 'reflection',     n: '08', label: 'Reflection',     phase: 'APPLY' },
  { id: 'protocol',       n: '09', label: 'Protocol',       phase: 'APPLY' },
  { id: 'artifact',       n: '10', label: 'Artifact',       phase: 'APPLY' },
  { id: 'summary',        n: '11', label: 'Summary',        phase: 'INTEGRATE' },
];

export const SECTION_IDS = CURRICULUM_SECTIONS.map((s) => s.id);

export const SECTION_COUNT = CURRICULUM_SECTIONS.length;

export function getSectionIndex(id) {
  return SECTION_IDS.indexOf(id);
}

export function getSection(id) {
  return CURRICULUM_SECTIONS.find((s) => s.id === id) || null;
}

/* available | active | completed | locked — the four states §29 requires the
   interface to support. Completion is supplied by the module, never inferred
   from which screens happen to have been rendered. */
export function sectionState({ index, activeIndex, maxIndex, completedIds = [] }) {
  const section = CURRICULUM_SECTIONS[index];
  if (index === activeIndex) return 'active';
  if (section && completedIds.includes(section.id)) return 'completed';
  if (index > maxIndex) return 'locked';
  return 'available';
}

/* This eleven-section arc and the Sovereign Runtime's SOVEREIGN_STEPS
   (sovereign/runtime/sovereignSteps.js) describe the same journey in the
   same order, under different id strings — 'key-concepts' here versus
   '03-key-concepts' there, etc. Every module built against this file
   should route its navigation through this map (not invent its own),
   so a section id here and the runtime step it advances can never drift
   independently across the four modules that share this file. */
const SOVEREIGN_STEP_ID_BY_SECTION = {
  'intro': SOVEREIGN_STEP_IDS.INTRO,
  'principle': SOVEREIGN_STEP_IDS.PRINCIPLE,
  'key-concepts': SOVEREIGN_STEP_IDS.KEY_CONCEPTS,
  'why-it-matters': SOVEREIGN_STEP_IDS.WHY_IT_MATTERS,
  'domains': SOVEREIGN_STEP_IDS.DOMAINS,
  'reclamation': SOVEREIGN_STEP_IDS.RECLAMATION,
  '2026-lens': SOVEREIGN_STEP_IDS.LENS_2026,
  'reflection': SOVEREIGN_STEP_IDS.REFLECTION,
  'protocol': SOVEREIGN_STEP_IDS.PROTOCOL,
  'artifact': SOVEREIGN_STEP_IDS.ARTIFACT,
  'summary': SOVEREIGN_STEP_IDS.SUMMARY,
};

export function sovereignStepIdForSection(sectionId) {
  return SOVEREIGN_STEP_ID_BY_SECTION[sectionId] ?? null;
}
