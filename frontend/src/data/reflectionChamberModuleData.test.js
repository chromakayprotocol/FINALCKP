import { describe, expect, it } from 'vitest';
import { PILLARS, PILLAR_TRACK_MAP, PILLAR_ONE_TRACK_CODES } from './reflectionChamberModuleData';

/**
 * Guards the canonical track → pillar mapping. The music is structurally tied
 * to the Shadow/Light curriculum, so a track cited by the wrong pillar produces
 * the wrong diagnostic architecture — that is a data bug, not a cosmetic one.
 */
describe('canonical track mapping', () => {
  const entriesFor = (pillar) => [...pillar.shadow, ...pillar.light].filter((entry) => entry.track);

  it.each(Object.keys(PILLAR_TRACK_MAP))('only cites its own canonical tracks: %s', (pillarId) => {
    const pillar = PILLARS.find((p) => p.id === pillarId);
    expect(pillar).toBeDefined();

    for (const entry of entriesFor(pillar)) {
      expect(PILLAR_TRACK_MAP[pillarId]).toContain(entry.track);
    }
  });

  it('never lets another pillar claim a canonically mapped track', () => {
    const owners = new Map();
    for (const [pillarId, tracks] of Object.entries(PILLAR_TRACK_MAP)) {
      for (const track of tracks) owners.set(track, pillarId);
    }

    for (const pillar of PILLARS) {
      for (const entry of entriesFor(pillar)) {
        const owner = owners.get(entry.track);
        if (owner) expect(owner).toBe(pillar.id);
      }
    }
  });

  it('keeps Willful Detonation out of Pillars One and Two', () => {
    for (const tracks of Object.values(PILLAR_TRACK_MAP)) {
      expect(tracks).not.toContain('Willful Detonation');
    }
  });

  it('gives each of Pillar One’s five tracks its own distinct code pair', () => {
    expect(PILLAR_ONE_TRACK_CODES.map((c) => c.track)).toEqual(PILLAR_TRACK_MAP['owned-interior']);

    const shadows = new Set(PILLAR_ONE_TRACK_CODES.map((c) => c.shadow));
    const lights = new Set(PILLAR_ONE_TRACK_CODES.map((c) => c.light));
    expect(shadows.size).toBe(PILLAR_ONE_TRACK_CODES.length);
    expect(lights.size).toBe(PILLAR_ONE_TRACK_CODES.length);
  });
});
