import { describe, expect, it } from 'vitest';
import {
  STAGE_PORTAL_IDS,
  buildProductionPillars,
  buildProductionPortalConfig,
} from './productionMasterAdapter';

function makeCodex() {
  return Array.from({ length: 20 }, (_, index) => {
    const chamberOrder = index + 1;
    const stageNumber = Math.floor(index / 4) + 1;
    return {
      track: {
        id: `track-${chamberOrder}`,
        title: `Track ${chamberOrder}`,
        audio_url: `https://example.test/${chamberOrder}.mp3`,
      },
      entry: {
        chamber_order: chamberOrder,
        sonic_artifact_name: `Artifact ${chamberOrder}`,
        artifact_snapshot: `Snapshot ${chamberOrder}`,
        stage_number: stageNumber,
        shadow_code: `Shadow ${chamberOrder}`,
        shadow_code_quote: `Shadow quote ${chamberOrder}`,
        light_code: `Light ${chamberOrder}`,
        light_code_quote: `Light quote ${chamberOrder}`,
        make_the_turn: `Turn ${chamberOrder}`,
        life_domains: ['Relationships'],
        where_this_shows_up: `Context ${chamberOrder}`,
        jungian_lens: `Lens ${chamberOrder}`,
        reflection_title: `Reflection ${chamberOrder}`,
        reflection_prompt: `Prompt ${chamberOrder}`,
        movement_criteria: `Movement ${chamberOrder}`,
        handoff: `Handoff ${chamberOrder}`,
        stage: {
          stage_number: stageNumber,
          stage_name: `Stage ${stageNumber}`,
          core_question: `Question ${stageNumber}`,
          stage_intent: `Intent ${stageNumber}`,
          gate_question: `Gate ${stageNumber}`,
        },
      },
    };
  });
}

const FALLBACK_PILLARS = STAGE_PORTAL_IDS.map((id, index) => ({
  id,
  index: index + 1,
  title: `Legacy ${index + 1}`,
  teaching: ['legacy teaching'],
  parallelTo: 'legacy parallel',
}));

describe('2026 Reflection Chamber production-master adapter', () => {
  it('maps 20 artifacts into five stable portal IDs with four artifacts per stage', () => {
    const pillars = buildProductionPillars(makeCodex(), FALLBACK_PILLARS);

    expect(pillars).toHaveLength(5);
    expect(pillars.map((pillar) => pillar.id)).toEqual([...STAGE_PORTAL_IDS]);
    expect(pillars.map((pillar) => pillar.tracks.length)).toEqual([4, 4, 4, 4, 4]);
    expect(pillars[0].title).toBe('Stage 1');
    expect(pillars[4].seal).toBe('Gate 5');
    expect(pillars[0].parallelTo).toBeNull();
    expect(pillars[0].teaching).not.toContain('legacy teaching');
  });

  it('refuses an incomplete curriculum instead of silently presenting legacy content', () => {
    expect(buildProductionPillars(makeCodex().slice(0, 19), FALLBACK_PILLARS)).toEqual([]);
  });

  it('builds a four-artifact runtime config without Active Imagination', () => {
    const codex = makeCodex();
    const pillars = buildProductionPillars(codex, FALLBACK_PILLARS);
    const config = buildProductionPortalConfig(
      { pillarId: 'forged-witness', themeClass: 'forged-witness-pillar' },
      pillars[1],
      codex,
    );

    expect(config.productionMaster).toBe(true);
    expect(config.tracks).toHaveLength(4);
    expect(config.tracks[0]).toMatchObject({
      id: 'production-2026-05',
      order: 5,
      title: 'Track 5',
      productionMaster: true,
      skipEncounterResponse: true,
      skipActiveImagination: true,
      shadowCode: 'Shadow 5',
      lightCode: 'Light 5',
      reflectionPrompt: 'Prompt 5',
    });
    expect(config.screens.filter((screen) => screen.type === 'track')).toHaveLength(4);
    expect(config.synthesisPrompts).toEqual([{ key: 'newRule', label: 'Gate 2' }]);
  });
});
