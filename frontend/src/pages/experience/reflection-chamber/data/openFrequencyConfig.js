/**
 * Portal Four / "Open Frequency" — the pillar-specific config plugged into
 * the shared PillarExperience + ScreenSequence engine. See
 * sacredRestraintConfig.js's header for how this is built: every
 * shadowCode/lightCode pair is this pillar's own already-authored canon
 * (reflectionChamberModuleData.js's PILLARS[3].shadow/.light).
 */

import { ACTIVE_IMAGINATION_PROMPTS } from './activeImaginationPrompts';

export const TRACKS = [
  {
    id: 'sun-dont-invoice',
    order: 1,
    title: 'Sun Don’t Invoice',
    territory: 'THE LEDGER',
    shadowCode: 'Giving with an invoice is still a transaction.',
    lightCode: 'I give without requiring repayment.',
    encounterQuestion: 'Review the last five significant acts of giving. What subtle receipt were you still waiting for?',
    prompts: [
      { key: 'ego', label: 'Where does ego turn your giving sour?' },
      { key: 'leverage', label: 'What did you expect back — credit, gratitude, obligation?' },
      { key: 'cost', label: 'What has keeping the ledger cost your generosity?' },
      { key: 'application', label: 'Perform one genuine act of giving with zero documentation, zero announcement, zero internal scorekeeping. Notice only the state of your own field afterward.' },
    ],
  },
  {
    id: 'not-alone',
    order: 2,
    title: 'Not Alone',
    territory: 'SUFFERING',
    shadowCode: 'I must earn love with suffering and chains.',
    lightCode: 'You don’t need to prove it, just allow; you are not alone.',
    encounterQuestion: 'Where do you believe love must be earned through suffering rather than simply received?',
    prompts: [
      { key: 'earning', label: 'What are you still trying to earn that was already offered freely?' },
      { key: 'chains', label: 'What chains do you mistake for proof of loyalty?' },
      { key: 'allow', label: 'What would it feel like to simply receive, with no debt attached?' },
      { key: 'application', label: 'Offer your presence to someone without trying to fix, save, or prove anything. Just stay.' },
    ],
  },
  {
    id: 'the-great-turning',
    order: 3,
    title: 'The Great Turning',
    territory: 'THE TURNING',
    shadowCode: 'The crumbling of the world is a punishment.',
    lightCode: 'The turning is a preparation; everything we lose, we outgrew.',
    encounterQuestion: 'What collapse are you still grieving as punishment rather than clearing?',
    prompts: [
      { key: 'collapse', label: 'What fell apart that you have not yet forgiven reality for?' },
      { key: 'punishment', label: 'What story of punishment have you attached to this loss?' },
      { key: 'clearing', label: 'What might this collapse actually be making room for?' },
      { key: 'application', label: 'Name one thing that fell apart this year. Write what it was actually making room for.' },
    ],
  },
  {
    id: 'this-aint-the-limit',
    order: 4,
    title: 'This Ain’t The Limit',
    territory: 'THE CEILING',
    shadowCode: 'The ceiling of reality is a glass cage built from fear.',
    lightCode: 'The limit is a firewall wrapped in wisdom and mercy.',
    encounterQuestion: 'What limit have you been reading as a cage that might actually be a mercy?',
    prompts: [
      { key: 'ceiling', label: 'What ceiling do you resent the most?' },
      { key: 'fear', label: 'What fear built this particular cage?' },
      { key: 'mercy', label: 'Where might this limit actually be protecting you?' },
      { key: 'application', label: 'Name one boundary of your life you have resented. Write what it might be protecting you from.' },
    ],
  },
];

export const SYNTHESIS_PROMPTS = [
  { key: 'commonPattern', label: 'What did all four patterns of the ledger have in common?' },
  { key: 'invoice', label: 'Where has your giving stopped requiring a receipt?' },
  { key: 'receiving', label: 'What are you finally willing to receive without earning it?' },
  { key: 'newRule', label: 'What is your new rule for exchange?' },
];

const SCREENS = [
  { id: 'intro', type: 'intro' },
  ...TRACKS.map((track) => ({ id: track.id, type: 'track', trackId: track.id })),
  { id: 'synthesis', type: 'synthesis' },
  { id: 'record', type: 'record' },
  { id: 'seal', type: 'seal' },
];

function buildRecord({ pillar, state }) {
  const tracksState = state.experience?.tracks || {};
  const integration = state.experience?.integration || {};

  const sections = TRACKS.map((track) => {
    const trackState = tracksState[track.id] || {};
    const values = track.prompts.map((p) => trackState[p.key]).filter((v) => v && v.trim());
    return { label: track.title, values };
  }).filter((section) => section.values.length > 0);

  if (integration.carryCode) {
    sections.push({ label: 'Carry Code', value: integration.carryCode });
  }

  return {
    sections,
    summary: pillar?.seal,
  };
}

export const OPEN_FREQUENCY_CONFIG = {
  pillarId: 'open-frequency',
  themeClass: 'open-frequency-pillar',

  intro: {
    eyebrow: 'Portal Four',
    word: 'Belief',
    title: 'Open Frequency',
    subtitle: 'The Current Itself',
    tagline: 'Generosity with an invoice is still control.',
  },

  screens: SCREENS,
  buildRecord,

  tracks: TRACKS,
  activeImaginationPrompts: ACTIVE_IMAGINATION_PROMPTS,
  synthesisPrompts: SYNTHESIS_PROMPTS,

  seal: {
    eyebrow: 'Pillar Four Complete',
    word: 'Open Frequency',
    lines: [
      'I was not built to hoard the light.',
      'I was engineered to be.',
      'My giving has no invoice.',
      'My exit has no revenge.',
    ],
  },
};

export default OPEN_FREQUENCY_CONFIG;
