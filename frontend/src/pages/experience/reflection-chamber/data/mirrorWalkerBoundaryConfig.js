/**
 * Portal Five / "The Mirror-Walker’s Boundary" — the pillar-specific
 * config plugged into the shared PillarExperience + ScreenSequence engine.
 * See sacredRestraintConfig.js's header for how this is built: every
 * shadowCode/lightCode pair is this pillar's own already-authored canon
 * (reflectionChamberModuleData.js's PILLARS[4].shadow/.light). The
 * culminating pillar — Act II's own canonical colour (REFLECTION_META in
 * reflectionChamberModuleData.js) is this pillar's theme, not a new hue.
 */

import { ACTIVE_IMAGINATION_PROMPTS } from './activeImaginationPrompts';

export const TRACKS = [
  {
    id: 'willful-detonation',
    order: 1,
    title: 'Willful Detonation',
    territory: 'THE TRIGGER',
    shadowCode: 'Do not carry a weapon someone else handed you.',
    lightCode: 'Return the weapon. Keep your will.',
    encounterQuestion: 'Where have you been installed as the detonator of a bond that was not yours to destroy?',
    prompts: [
      { key: 'matches', label: 'Who handed you "the matches" and told you the torch belonged to someone else?' },
      { key: 'detonation', label: 'What relationship or moment did you feel armed to destroy?' },
      { key: 'cost', label: 'What did detonating cost you, even when it felt justified?' },
      { key: 'application', label: 'Name the weapon you were handed. Return it — in words, in writing, or by simply refusing to use it again.' },
    ],
  },
  {
    id: 'icarus-aint-cryin-this-time',
    order: 2,
    title: 'Icarus Ain’t Cryin’ This Time',
    territory: 'REBELLION',
    shadowCode: 'I must kneel and accept divine games as a test of love.',
    lightCode: 'I draw the line; I am reborn and do not answer to a sky made of stone.',
    encounterQuestion: 'Where are you still bargaining with something larger than you, hoping compliance will be rewarded?',
    prompts: [
      { key: 'kneeling', label: 'Where have you knelt, hoping obedience would be rewarded with love?' },
      { key: 'test', label: 'What "test" have you been enduring that was never actually about your worth?' },
      { key: 'line', label: 'Where is the line you have not yet drawn?' },
      { key: 'application', label: 'Write the line you are done kneeling at. Say it once, out loud, without asking permission.' },
    ],
  },
  {
    id: 'live-for-me',
    order: 3,
    title: 'Live For Me',
    territory: 'THE SAVIOR',
    shadowCode: 'I must play savior even while you counterfeit the truth and drain my light.',
    lightCode: 'I cut the cords not to hate you, but because I love myself more.',
    encounterQuestion: 'Where are you still playing savior for someone who is counterfeiting the truth to keep you there?',
    prompts: [
      { key: 'swimming', label: 'Who are you still trying to "swim for two" in a tide you did not sow?' },
      { key: 'counterfeit', label: 'What truth is being counterfeited to keep you in the role of savior?' },
      { key: 'drain', label: 'What has this role drained from you?' },
      { key: 'application', label: 'Name one cord you are ready to cut — not from hate, but because you choose yourself. Cut it in writing first.' },
    ],
  },
  {
    id: 'tearin-you-apart',
    order: 4,
    title: 'Tearin’ You Apart',
    territory: 'BORROWED KARMA',
    shadowCode: 'Feeling it does not mean it belongs to you.',
    lightCode: 'I can feel what is yours without carrying it.',
    encounterQuestion: 'Whose karma have you been carrying as though it were your own to resolve?',
    prompts: [
      { key: 'trapped', label: 'Whose cage have you been standing inside, feeling their pain as if it were a summons?' },
      { key: 'obligation', label: 'What obligation to fix it have you assumed that was never yours?' },
      { key: 'distinct', label: 'What would it feel like to feel this fully and still hand it back?' },
      { key: 'application', label: 'Practice feeling someone’s pain fully for one minute, then consciously hand it back to them. Notice what stays with you and what doesn’t.' },
    ],
  },
  {
    id: 'promise',
    order: 5,
    title: 'Promise',
    territory: 'THE VOW',
    shadowCode: 'Loyalty requires that I bleed to keep you standing.',
    lightCode: 'I break the vow to stand by you so I do not turn my own heart into a crime.',
    encounterQuestion: 'What vow are you still keeping that has been turned into a weapon against you?',
    prompts: [
      { key: 'vow', label: 'What promise are you still honoring long after it stopped being mutual?' },
      { key: 'weaponized', label: 'How has your devotion been used against you?' },
      { key: 'ruins', label: 'How many of their ruins have you tried to carry as your own repair work?' },
      { key: 'application', label: 'Name the promise that now costs you your own heart. Write the version of loyalty that keeps you both alive.' },
    ],
  },
  {
    id: 'i-own-every-word',
    order: 6,
    title: 'I Own Every Word',
    territory: 'THE APOLOGY',
    shadowCode: 'I must shrink, walk on defense, and apologize to make others comfortable.',
    lightCode: 'I take my power back and stop living underneath bridges to keep the peace.',
    encounterQuestion: 'How many sentences this week began with a softener that was not required?',
    prompts: [
      { key: 'shrinking', label: 'Where do you enter rooms already on the defensive?' },
      { key: 'tax', label: 'What has this preemptive apology cost your voice?' },
      { key: 'bridges', label: 'What bridge have you been living underneath to keep others comfortable?' },
      { key: 'application', label: 'Say one true sentence this week with no softener, no apology, no bridge underneath it. Notice what doesn’t collapse.' },
    ],
  },
  {
    id: 'not-your-cross',
    order: 7,
    title: 'Not Your Cross (The Seeker’s Initiation)',
    territory: 'THE FURNACE',
    shadowCode: 'I am meant to be a landfill for grief, absorbing corrosion.',
    lightCode: 'Alchemy is not consumption; it is transformation with consent.',
    encounterQuestion: 'List the people or systems for whom you still function as emotional processing plant. Which of those agreements were ever explicit?',
    prompts: [
      { key: 'landfill', label: 'What unnamed grief have you agreed to absorb without ever being asked?' },
      { key: 'designation', label: 'Who designated you "the one who can survive it" — and did you ever actually agree?' },
      { key: 'compounding', label: 'What has absorbing this compounded into inside you?' },
      { key: 'application', label: 'Draft the boundary statement you have never given. Practice it until the voice does not shake. Deliver it, or keep it as standing internal law.' },
    ],
  },
];

export const SYNTHESIS_PROMPTS = [
  { key: 'commonPattern', label: 'What did all seven borrowed weapons and borrowed griefs have in common?' },
  { key: 'membrane', label: 'Where is your membrane now intact that used to be open?' },
  { key: 'governed', label: 'What current do you now govern instead of absorb?' },
  { key: 'newRule', label: 'What is your final boundary statement — the one you can speak without collapse or grandiosity?' },
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

export const MIRROR_WALKER_BOUNDARY_CONFIG = {
  pillarId: 'mirror-walker-boundary',
  themeClass: 'mirror-walker-boundary-pillar',

  intro: {
    eyebrow: 'Portal Five',
    word: 'Architecture',
    title: 'The Mirror-Walker’s Boundary',
    subtitle: 'The Banks',
    tagline: 'Bring me your shadow — I will diagram its frame. I will not carry what you refuse to name.',
  },

  screens: SCREENS,
  buildRecord,

  tracks: TRACKS,
  activeImaginationPrompts: ACTIVE_IMAGINATION_PROMPTS,
  synthesisPrompts: SYNTHESIS_PROMPTS,

  seal: {
    eyebrow: 'Pillar Five Complete — Act II Sealed',
    word: "The Mirror-Walker's Boundary",
    lines: [
      'Bring me your shadow.',
      'I will diagram its frame.',
      'I will not carry what you refuse to name.',
      'My membrane is intact. My current is governed. I am ready for the fire.',
    ],
  },
};

export default MIRROR_WALKER_BOUNDARY_CONFIG;
