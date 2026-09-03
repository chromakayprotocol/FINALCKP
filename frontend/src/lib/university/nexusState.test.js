import { describe, test, expect } from 'vitest';
import {
  HERMETIC_HALL_MODULES,
  NEXUS_DATA_STATE,
  NEXUS_METRIC_STATUS,
  NEXUS_STATUS,
  PROTOCOL_MODULE_MAP,
  completionPercent,
  deriveNexusState,
  nexusTrackedModuleIds,
  statusForProgress,
} from './nexusState';

const hallRow = (slug, status = 'completed') => ({
  module_id: `hermetic-hall/${slug}`,
  status,
});

describe('Nexus protocol → module mapping', () => {
  test('derives Fracture from the foundations faculty, not a hardcoded list', () => {
    const ids = PROTOCOL_MODULE_MAP.fracture.map((module) => module.key);
    expect(ids).toContain('module-fractured-veil');
    expect(ids.length).toBeGreaterThan(0);
    // Fracture's modules are persisted in rec_uni_user_progress.
    for (const module of PROTOCOL_MODULE_MAP.fracture) {
      expect(module.recUniIds.length).toBeGreaterThan(0);
    }
  });

  test('derives Reflection from the five Reflection Chamber pillars', () => {
    expect(PROTOCOL_MODULE_MAP.reflection.map((m) => m.key)).toEqual([
      'reflection-chamber/owned-interior',
      'reflection-chamber/forged-witness',
      'reflection-chamber/sacred-restraint',
      'reflection-chamber/open-frequency',
      'reflection-chamber/mirror-walker-boundary',
    ]);
  });

  test('Crucible and Reclamation have no production modules', () => {
    expect(PROTOCOL_MODULE_MAP.crucible).toHaveLength(0);
    expect(PROTOCOL_MODULE_MAP.reclamation).toHaveLength(0);
  });

  test('tracks all seven Hermetic principles under their real writer ids', () => {
    expect(HERMETIC_HALL_MODULES).toHaveLength(7);
    expect(HERMETIC_HALL_MODULES[0].sovereignId).toBe('hermetic-hall/mentalism');
    // Legacy rec_uni ids stay recognised so an older row still counts.
    expect(HERMETIC_HALL_MODULES[0].recUniIds).toContain('hermetic-principle-1');
  });

  test('exposes the module ids to query, grouped by source table', () => {
    const { recUni, sovereign } = nexusTrackedModuleIds();
    expect(sovereign).toContain('hermetic-hall/vibration');
    expect(sovereign).toContain('reflection-chamber/owned-interior');
    expect(recUni).toContain('module-fractured-veil');
  });
});

describe('deterministic derivation helpers', () => {
  test('completionPercent rounds deterministically and refuses empty denominators', () => {
    expect(completionPercent(0, 7)).toBe(0);
    expect(completionPercent(4, 7)).toBe(57);
    expect(completionPercent(7, 7)).toBe(100);
    expect(completionPercent(0, 0)).toBeNull();
  });

  test('statusForProgress uses the 0 / 1-99 / 100 bands', () => {
    expect(statusForProgress(0)).toBe(NEXUS_STATUS.NOT_STARTED);
    expect(statusForProgress(1)).toBe(NEXUS_STATUS.IN_PROGRESS);
    expect(statusForProgress(99)).toBe(NEXUS_STATUS.IN_PROGRESS);
    expect(statusForProgress(100)).toBe(NEXUS_STATUS.COMPLETED);
    expect(statusForProgress(null)).toBe(NEXUS_STATUS.UNKNOWN);
  });
});

describe('authenticated seeker with real rows', () => {
  const state = deriveNexusState({
    isAuthenticated: true,
    sovereignRows: [
      hallRow('mentalism'),
      hallRow('correspondence'),
      hallRow('vibration'),
      hallRow('polarity', 'in_progress'),
      { module_id: 'reflection-chamber/owned-interior', status: 'completed' },
    ],
    progressRows: [{ module_id: 'module-fractured-veil', status: 'completed' }],
  });

  test('derives the Hermetic Hall percentage from completed principle rows', () => {
    expect(state.dataState).toBe(NEXUS_DATA_STATE.READY);
    expect(state.hermeticHall.completedCount).toBe(3);
    expect(state.hermeticHall.totalCount).toBe(7);
    expect(state.hermeticHall.progress).toBe(43);
    expect(state.hermeticHall.status).toBe(NEXUS_STATUS.IN_PROGRESS);
    expect(state.hermeticHall.current.slug).toBe('polarity');
  });

  test('derives Fracture from rec_uni_user_progress rows', () => {
    const total = PROTOCOL_MODULE_MAP.fracture.length;
    expect(state.fracture.completedCount).toBe(1);
    expect(state.fracture.progress).toBe(Math.round((1 / total) * 100));
    expect(state.fracture.available).toBe(true);
  });

  test('derives Reflection from sovereign_module_state pillar rows', () => {
    expect(state.reflection.completedCount).toBe(1);
    expect(state.reflection.progress).toBe(20);
  });

  test('keeps Crucible and Reclamation unavailable with a null progress', () => {
    for (const track of [state.crucible, state.reclamation]) {
      expect(track.available).toBe(false);
      expect(track.progress).toBeNull();
      expect(track.status).toBe(NEXUS_STATUS.UNAVAILABLE);
    }
  });

  test('Knowledge Index is a real ratio over available educational modules', () => {
    const total = 7 + PROTOCOL_MODULE_MAP.fracture.length + PROTOCOL_MODULE_MAP.reflection.length;
    expect(state.knowledgeIndex.status).toBe(NEXUS_METRIC_STATUS.OK);
    expect(state.knowledgeIndex.totalCount).toBe(total);
    expect(state.knowledgeIndex.completedCount).toBe(5);
    expect(state.knowledgeIndex.value).toBe(Math.round((5 / total) * 100));
  });

  test('metrics with no backing subsystem report unavailable, never a number', () => {
    for (const metric of [state.arsenalAttunement, state.celestialAlignment]) {
      expect(metric.value).toBeNull();
      expect(metric.status).toBe(NEXUS_METRIC_STATUS.UNAVAILABLE);
    }
  });

  test('counts a completed_at row with no status as complete', () => {
    const withCompletedAt = deriveNexusState({
      isAuthenticated: true,
      progressRows: [
        { module_id: 'module-fractured-veil', status: 'in_progress', completed_at: '2026-01-01T00:00:00Z' },
      ],
    });
    expect(withCompletedAt.fracture.completedCount).toBe(1);
  });
});

describe('signed-out and failure states are never fake progress', () => {
  const NEVER = [64, 72, 51, 68, 23, 32, 27];

  const numbersIn = (state) =>
    [
      state.hermeticHall.progress,
      state.fracture.progress,
      state.reflection.progress,
      state.crucible.progress,
      state.reclamation.progress,
      state.knowledgeIndex.value,
      state.arsenalAttunement.value,
      state.celestialAlignment.value,
    ].filter((value) => typeof value === 'number');

  test('signed out reports no personalized value at all', () => {
    const state = deriveNexusState({ isAuthenticated: false });
    expect(state.dataState).toBe(NEXUS_DATA_STATE.SIGNED_OUT);
    expect(state.hermeticHall.progress).toBeNull();
    expect(state.fracture.progress).toBeNull();
    expect(state.knowledgeIndex.value).toBeNull();
    expect(numbersIn(state)).toHaveLength(0);
  });

  test('a PGRST205 schema failure is distinguishable from signed out', () => {
    const error = {
      code: 'PGRST205',
      message: "Could not find the table 'public.rec_uni_user_progress' in the schema cache",
      table: 'rec_uni_user_progress',
      stage: 'query',
    };
    const state = deriveNexusState({ isAuthenticated: true, error });

    expect(state.dataState).toBe(NEXUS_DATA_STATE.ERROR);
    expect(state.isAuthenticated).toBe(true);
    expect(state.error.code).toBe('PGRST205');
    expect(state.hermeticHall.status).toBe(NEXUS_STATUS.UNKNOWN);
    expect(numbersIn(state)).toHaveLength(0);
  });

  test('none of the retired hardcoded percentages can ever be produced', () => {
    for (const input of [
      { isAuthenticated: false },
      { isAuthenticated: true, error: { code: 'PGRST205' } },
      { isAuthenticated: true, loading: true },
    ]) {
      const values = numbersIn(deriveNexusState(input));
      for (const forbidden of NEVER) expect(values).not.toContain(forbidden);
    }
  });

  test('loading is its own state, not a zeroed one', () => {
    const state = deriveNexusState({ isAuthenticated: true, loading: true });
    expect(state.dataState).toBe(NEXUS_DATA_STATE.LOADING);
    expect(state.hermeticHall.progress).toBeNull();
  });
});
