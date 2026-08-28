const principles = [
  ['mentalism', 'Mentalism', 'Before the Body, the All-Mind.'],
  ['correspondence', 'Correspondence', 'As Above, So Below.'],
  ['vibration', 'Vibration', 'Nothing Rests. Everything Moves.'],
  ['polarity', 'Polarity', 'Everything Is Dual.'],
  ['rhythm', 'Rhythm', 'Everything Flows, Out and In.'],
  ['cause-and-effect', 'Cause and Effect', 'Every Cause Has Its Effect.'],
  ['gender', 'Gender', 'Creation Holds Both Principles.'],
];

export const HERMETIC_HALL_FACULTY = {
  id: 'hermetic-hall',
  slug: 'hermetic-hall',
  title: 'The Hermetic Hall',
  subtitle: 'Seven principles. Seven paths. One system.',
  description: 'The new Reclamation University begins here.',
  accent: 'antique-gold',
  artwork: '/reclamation-university/hermetic-hall-selector.webp',
  artworkAlt: 'The seven illuminated chambers of the Hermetic Hall',
  modules: principles.map(([slug, title, subtitle], index) => ({
    id: `hermetic-principle-${index + 1}`,
    slug,
    order: index + 1,
    title,
    subtitle,
    lessons: [],
    curriculumSections: [],
  })),
};

export function getHermeticHallModule(moduleSlug) {
  return HERMETIC_HALL_FACULTY.modules.find((module) => module.slug === moduleSlug);
}
