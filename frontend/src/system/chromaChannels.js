/* ============================================================================
   THE CHROMA FRAME — CHANNEL REGISTRY
   ----------------------------------------------------------------------------
   One chassis, held constant. One key colour, free to change. Every module
   screen in the Protocol supplies two things and inherits everything else:

     PLATE    its own world  — environment art, video, 3D, whatever it is
     CHANNEL  its own key    — one entry in this file

   The frame (brackets, rails, dock, type, spacing, motion) is supplied once,
   by src/system, and is identical on every screen. That identity is the
   product's signature; a module does not get to restyle it.

   WHAT LIVES HERE
   • CHROMA_CHANNELS — the seven keys. A channel is a *triplet plus a wash*:
     `key` for borders/rules/fills, `keyBright` for accent TEXT (every one of
     these clears 4.5:1 on the obsidian ground), `keyDim` for dormant and
     sealed states, `wash` for the veil that grades the plate.
   • PROTOCOL_SURFACES — every screen the Protocol actually has, the channel
     it transmits on, and its entry route. This is the linking layer: before
     it existed, no single file knew what the whole system contained.

   WHAT DOES NOT LIVE HERE
   Progress, percentages, unlock state, or anything else personalized. Those
   are derived at read time from Supabase (see lib/university/nexusState.js
   and sovereign/persistence). This file is static identity only — the same
   discipline curriculum.js keeps for the University.
   ========================================================================= */

/**
 * The seven keys.
 *
 * Values are not new inventions: they are the colours already on screen,
 * promoted to canon. `aurum` is the University's existing gold
 * (recUniSystem.css), `crimson` the Sovereign Mainframe's existing red,
 * `verdant`/`azure`/`ember` the Nexus's existing protocol accents. Promoting
 * rather than replacing them is why adopting the frame changes nothing about
 * how the screens already look — only about how many places define it.
 */
export const CHROMA_CHANNELS = Object.freeze({
  /* Gold is Act IV's and nothing else's. It briefly did double duty as the
     University's key as well; the Crucible Code owns it. */
  aurum: {
    id: 'aurum',
    label: 'Aurum',
    key: '#C9A227',
    keyBright: '#E9CE72',
    keyDim: '#6E5D2C',
    wash: 'rgba(201, 162, 39, 0.10)',
    element: 'Air',
    domain: 'Act IV — The Crucible Code',
  },

  /* ------------------------------------------------------------------------
     THE TEACHING PAIR

     Indigo and violet are deliberately the same colour family, split by
     shade, because the two surfaces they key ARE a pair: the Hermetic Hall
     teaches through the visual medium and Sonic Surfaces teach through the
     auditory one. A Seeker moving between them should feel the kinship and
     still know which one they are in. Reading them as "too close" misses the
     point — the closeness is the statement, and the shade is the distinction.

     Indigo runs blue-cool (contemplative, read); violet runs hot and
     electric (frequency, heard). Do not converge them.
     --------------------------------------------------------------------- */
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    key: '#4038C9',
    keyBright: '#9B8CFF',
    keyDim: '#211C63',
    wash: 'rgba(64, 56, 201, 0.10)',
    element: null,
    domain: 'Reclamation University — the visual medium',
  },
  crimson: {
    id: 'crimson',
    label: 'Crimson',
    key: '#D2382C',
    keyBright: '#FF5545',
    keyDim: '#6E241D',
    wash: 'rgba(210, 56, 44, 0.10)',
    element: null,
    domain: 'Sovereign Mainframe',
  },
  verdant: {
    id: 'verdant',
    label: 'Verdant',
    key: '#3F8F4F',
    keyBright: '#6FD07F',
    keyDim: '#24512D',
    wash: 'rgba(63, 143, 79, 0.10)',
    element: 'Earth',
    domain: 'Act I — The Fractured Veil',
  },
  azure: {
    id: 'azure',
    label: 'Azure',
    key: '#3FA9D8',
    keyBright: '#7ED4F5',
    keyDim: '#245F79',
    wash: 'rgba(63, 169, 216, 0.10)',
    element: 'Water',
    domain: 'Act II — The Reflection Chamber',
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    key: '#D0431C',
    keyBright: '#FF8352',
    keyDim: '#722410',
    wash: 'rgba(208, 67, 28, 0.10)',
    element: 'Fire',
    domain: 'Act III — Reclamation',
  },
  violet: {
    id: 'violet',
    label: 'Violet',
    key: '#8D20EF',
    keyBright: '#C48BFF',
    keyDim: '#4B1180',
    wash: 'rgba(141, 32, 239, 0.10)',
    element: 'Sound',
    domain: 'Sonic surfaces — the auditory medium',
  },
  /* The system's own voice: chrome, boot, diagnostics, and the rendered
     appearance of anything sealed. A sealed surface RENDERS argent rather
     than a dimmed version of its own key, so "sealed" and "quiet" never look
     alike — but it keeps its canonical channel in the registry, because what
     a surface IS and what it currently looks like are two different facts. */
  argent: {
    id: 'argent',
    label: 'Argent',
    key: '#6E7683',
    keyBright: '#D7DEE6',
    keyDim: '#3A4048',
    wash: 'rgba(155, 166, 180, 0.08)',
    element: null,
    domain: 'System',
  },
});

export const CHANNEL_IDS = Object.freeze(Object.keys(CHROMA_CHANNELS));

/** Unknown ids resolve to the system voice rather than throwing mid-render. */
export function resolveChannel(channelId) {
  return CHROMA_CHANNELS[channelId] ?? CHROMA_CHANNELS.argent;
}

/**
 * The CSS custom properties a channel injects.
 *
 * Spread onto any element's `style` and everything inside it — frame parts
 * and module content alike — is keyed to that channel. This is the whole
 * theming mechanism: no channel-specific classes, no per-screen stylesheets
 * competing to own the same colour.
 */
export function channelStyle(channelId) {
  const channel = resolveChannel(channelId);
  return {
    '--ckp-key': channel.key,
    '--ckp-key-bright': channel.keyBright,
    '--ckp-key-dim': channel.keyDim,
    '--ckp-key-wash': channel.wash,
  };
}

/* --------------------------------------------------------------------------
   PROTOCOL SURFACES
   Every screen the Protocol has, in the order a Seeker meets it.

   `status` is authored reality, not aspiration:
     live     the screen exists and is reachable
     sealed   deliberately gated content that is authored
     vacant   the surface is named but has no implementation yet

   `vacant` is load-bearing. Checkout/licensing, the AI protocol chat and the
   spin-wheel went with the FastAPI backend (see docs/ARCHITECTURE.md Phase
   20) and have no replacement. A registry that quietly omitted them would
   read as a complete system; one that lists them as vacant tells the truth.
   -------------------------------------------------------------------------- */
export const SURFACE_STATUS = Object.freeze({
  LIVE: 'live',
  SEALED: 'sealed',
  VACANT: 'vacant',
});

export const PROTOCOL_SURFACES = Object.freeze([
  {
    id: 'acts',
    title: 'Act Navigation',
    location: 'Protocol · Acts',
    channel: 'argent',
    route: '/acts',
    status: SURFACE_STATUS.LIVE,
    summary: 'The four-Act spine and where the Seeker stands on it.',
  },
  {
    id: 'act-one',
    title: 'The Fractured Veil',
    location: 'Act I · Earth',
    channel: 'verdant',
    route: '/act/1/entry',
    status: SURFACE_STATUS.LIVE,
    summary: 'Journaling the fracture. The Protocol’s first honest look.',
  },
  {
    id: 'act-two',
    title: 'The Reflection Chamber',
    location: 'Act II · Water',
    channel: 'azure',
    route: '/experiencemode/act-two/visualizer',
    status: SURFACE_STATUS.LIVE,
    summary: 'Five pillars of governed feeling, scored to the visualizer.',
  },
  {
    id: 'act-three',
    title: 'Reclamation',
    location: 'Act III · Fire',
    channel: 'ember',
    route: '/experiencemode/sovereign/module/audio-visualizer-core',
    status: SURFACE_STATUS.LIVE,
    summary: 'The fire Act. Reclaiming what the fracture took.',
  },
  {
    id: 'act-four',
    title: 'The Crucible Code',
    location: 'Act IV · Air',
    channel: 'aurum',
    route: null,
    status: SURFACE_STATUS.SEALED,
    summary: 'Gold is reserved here. Sealed until the Protocol opens it.',
  },
  {
    id: 'immersion',
    title: 'Immersion Protocol',
    location: 'Protocol · Guided Audio',
    channel: 'violet',
    route: '/experiencemode/immersion',
    status: SURFACE_STATUS.LIVE,
    summary: 'Guided listening — the audio spine every visual reads from.',
  },
  {
    id: 'visualizer-core',
    title: 'Audio Visualizer Core',
    location: 'Sovereign · AVC',
    channel: 'violet',
    route: '/visualizer-core',
    status: SURFACE_STATUS.LIVE,
    summary: 'See the waveform. Shape the sound. Amplify the vision.',
  },
  {
    id: 'sovereign-mainframe',
    title: 'Reclamation Mainframe',
    location: 'Sovereign Mode · Mainframe',
    channel: 'crimson',
    route: '/experiencemode/sovereign',
    status: SURFACE_STATUS.LIVE,
    summary: 'The orbital module deck. Every Sovereign module, one carousel.',
  },
  {
    id: 'university-nexus',
    title: 'Reclamation University',
    location: 'University · Nexus',
    channel: 'indigo',
    route: '/experiencemode/sovereign/reclamation-university/nexus',
    status: SURFACE_STATUS.LIVE,
    summary: 'A synthesized framework for the Sovereign Self.',
  },
  {
    id: 'hermetic-hall',
    title: 'Hermetic Hall',
    location: 'University · Hermetic Hall',
    channel: 'indigo',
    route: '/experiencemode/sovereign/reclamation-university/hermetic-hall',
    status: SURFACE_STATUS.LIVE,
    summary: 'Seven principles on the Hermetic Wheel. Seven pillars to restore.',
  },
  {
    id: 'reflection-protocol',
    title: 'The Reflection Protocol',
    location: 'University · Reflection',
    channel: 'azure',
    route: '/experiencemode/sovereign/reclamation-university/reflection-protocol',
    status: SURFACE_STATUS.LIVE,
    summary: 'Act II’s water discipline, taught as curriculum.',
  },
  {
    id: 'fracture-protocol',
    title: 'The Fracture Protocol',
    location: 'University · Foundations',
    channel: 'verdant',
    route: '/experiencemode/sovereign/reclamation-university/foundations',
    status: SURFACE_STATUS.LIVE,
    summary: 'The foundations faculty. Where academic mastery is measured.',
  },
  /* `channel` is canonical IDENTITY, not current appearance. These two are
     sealed, so their chrome renders argent while they stay shut — but the
     Crucible faculty is Act IV's and the Reclamation faculty is Act III's,
     and the registry says so. Recording them as argent conflated "this is
     the system's own voice" with "this is not open yet", which are two
     different facts; collapsing them is the same mistake the readout rule
     exists to prevent one layer down. */
  {
    id: 'crucible-protocol',
    title: 'The Crucible Protocol',
    location: 'University · Crucible',
    channel: 'aurum',
    route: null,
    status: SURFACE_STATUS.SEALED,
    summary: 'Act IV’s faculty. Authored, sealed, no production modules yet.',
  },
  {
    id: 'reclamation-protocol',
    title: 'The Reclamation Protocol',
    location: 'University · Reclamation',
    channel: 'ember',
    route: null,
    status: SURFACE_STATUS.SEALED,
    summary: 'Act III’s faculty. Authored, sealed, no production modules yet.',
  },
  {
    id: 'paywall',
    title: 'Licensing & Checkout',
    location: 'Protocol · Access',
    channel: 'argent',
    route: null,
    status: SURFACE_STATUS.VACANT,
    summary: 'Removed with the FastAPI backend. No Supabase/Worker replacement yet.',
  },
  {
    id: 'protocol-chat',
    title: 'Protocol Chat',
    location: 'Protocol · Counsel',
    channel: 'argent',
    route: null,
    status: SURFACE_STATUS.VACANT,
    summary: 'Removed with the FastAPI backend. Awaiting a Worker-hosted rebuild.',
  },
]);

/** Only surfaces a Seeker can actually reach — what a hub should ever link. */
export function liveSurfaces() {
  return PROTOCOL_SURFACES.filter(
    (surface) => surface.status === SURFACE_STATUS.LIVE && Boolean(surface.route),
  );
}

export function surfacesForChannel(channelId) {
  return PROTOCOL_SURFACES.filter((surface) => surface.channel === channelId);
}

export function findSurface(surfaceId) {
  return PROTOCOL_SURFACES.find((surface) => surface.id === surfaceId) ?? null;
}
