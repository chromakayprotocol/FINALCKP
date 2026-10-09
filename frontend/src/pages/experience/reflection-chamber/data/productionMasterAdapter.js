const STAGE_PORTAL_IDS = Object.freeze([
  'owned-interior',
  'forged-witness',
  'sacred-restraint',
  'open-frequency',
  'mirror-walker-boundary',
]);

function stageRows(codex, stageNumber) {
  return (codex || [])
    .filter(({ entry }) => entry?.stage_number === stageNumber)
    .sort((a, b) => a.entry.chamber_order - b.entry.chamber_order);
}

function productionTrackId(chamberOrder) {
  return `production-2026-${String(chamberOrder).padStart(2, '0')}`;
}

export function buildProductionPillars(codex, fallbackPillars = []) {
  if (!Array.isArray(codex) || codex.length !== 20) return [];

  const pillars = STAGE_PORTAL_IDS.map((pillarId, index) => {
    const stageNumber = index + 1;
    const rows = stageRows(codex, stageNumber);
    if (rows.length !== 4) return null;

    const stage = rows[0].entry.stage;
    if (!stage || stage.stage_number !== stageNumber) return null;

    const fallback = fallbackPillars.find((pillar) => pillar.id === pillarId) || {};
    const finalEntry = rows[rows.length - 1].entry;

    return {
      ...fallback,
      id: pillarId,
      index: stageNumber,
      title: stage.stage_name,
      question: stage.core_question,
      layer: `Stage ${stageNumber}`,
      summary: stage.stage_intent,
      parallelTo: null,
      teaching: [stage.stage_intent],
      tracks: rows.map(({ track }) => track.title),
      shadow: rows.map(({ track, entry }) => ({
        name: entry.sonic_artifact_name,
        track: track.title,
        code: entry.shadow_code,
        body: entry.artifact_snapshot,
        diagnostic: entry.reflection_prompt,
      })),
      light: rows.map(({ track, entry }) => ({
        name: entry.reflection_title,
        track: track.title,
        code: entry.light_code,
        body: entry.make_the_turn,
        instructional: entry.reflection_prompt,
      })),
      practices: rows.map(({ entry }) => ({
        id: `artifact-${entry.chamber_order}-reflection`,
        title: entry.reflection_title,
        prompt: entry.reflection_prompt,
      })),
      canonicalCodes: {
        shadow: {
          pattern: rows[0].entry.sonic_artifact_name,
          code: rows[0].entry.shadow_code,
          body: rows[0].entry.artifact_snapshot,
        },
        light: {
          pattern: rows[0].entry.reflection_title,
          code: rows[0].entry.light_code,
          body: rows[0].entry.make_the_turn,
        },
      },
      mantra: finalEntry.light_code,
      seal: stage.gate_question,
      stage,
      productionMaster: true,
    };
  });

  return pillars.every(Boolean) ? pillars : [];
}

function buildRecord({ pillar, state, config }) {
  const tracksState = state.experience?.tracks || {};
  const integration = state.experience?.integration || {};

  const sections = (config.tracks || [])
    .map((track) => {
      const trackState = tracksState[track.id] || {};
      const values = [
        trackState.reflection,
        trackState.encounter,
      ].filter((value) => value && value.trim());

      return { label: track.title, values };
    })
    .filter((section) => section.values.length > 0);

  if (integration.newRule) {
    sections.push({ label: 'Stage Gate', value: integration.newRule });
  }

  if (integration.carryCode) {
    sections.push({ label: 'Carry Code', value: integration.carryCode });
  }

  return {
    sections,
    summary: pillar?.seal,
  };
}

export function buildProductionPortalConfig(baseConfig, pillar, codex) {
  if (!pillar?.stage || !Array.isArray(codex)) return baseConfig;

  const rows = stageRows(codex, pillar.stage.stage_number);
  if (rows.length !== 4) return baseConfig;

  const tracks = rows.map(({ track, entry }) => ({
    id: productionTrackId(entry.chamber_order),
    order: entry.chamber_order,
    title: track.title,
    territory: entry.reflection_title,
    audioUrl: track.audio_url,
    productionMaster: true,
    skipEncounterResponse: true,
    skipActiveImagination: true,
    artifactSnapshot: entry.artifact_snapshot,
    whatYouBring: entry.what_you_bring,
    shadowCode: entry.shadow_code,
    shadowEvidenceQuote: entry.shadow_code_quote,
    lightCode: entry.light_code,
    lightEvidenceQuote: entry.light_code_quote,
    makeTheTurn: entry.make_the_turn,
    lifeDomains: entry.life_domains || [],
    whereThisShowsUp: entry.where_this_shows_up,
    jungianLens: entry.jungian_lens,
    reflectionTitle: entry.reflection_title,
    reflectionPrompt: entry.reflection_prompt,
    movementCriteria: entry.movement_criteria,
    handoff: entry.handoff,
    prompts: [
      {
        key: 'reflection',
        label: entry.reflection_prompt,
      },
    ],
  }));

  const screens = [
    { id: 'intro', type: 'intro' },
    ...tracks.map((track) => ({ id: track.id, type: 'track', trackId: track.id })),
    { id: 'synthesis', type: 'synthesis' },
    { id: 'record', type: 'record' },
    { id: 'seal', type: 'seal' },
  ];

  return {
    ...baseConfig,
    productionMaster: true,
    tracks,
    screens,
    buildRecord,
    activeImaginationPrompts: [],
    synthesisPrompts: [
      {
        key: 'newRule',
        label: pillar.stage.gate_question,
      },
    ],
    intro: {
      eyebrow: `Stage ${pillar.stage.stage_number}`,
      word: pillar.stage.stage_name,
      title: pillar.stage.stage_name,
      subtitle: pillar.stage.core_question,
      tagline: pillar.stage.stage_intent,
    },
    seal: {
      eyebrow: `Stage ${pillar.stage.stage_number} Complete`,
      word: pillar.stage.stage_name,
      lines: [
        pillar.stage.stage_intent,
        pillar.stage.gate_question,
      ],
    },
  };
}

export { STAGE_PORTAL_IDS };
