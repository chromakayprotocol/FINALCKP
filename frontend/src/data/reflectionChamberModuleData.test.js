import { describe, expect, it } from 'vitest';
import { PILLARS, PILLAR_TRACK_MAP, PILLAR_TRACK_CODES, PILLAR_CANONICAL_CODES } from './reflectionChamberModuleData';

/* The 27-track source manifest (Chroma_Key_Act_Two_Reflection_Chamber_Track_Matrix),
   in its own numbering. Track 13 has no row in public.tracks (its R2 key is
   unconfirmed — see the seed migration's header) but is still curriculum. */
const ALL_27_TRACKS = [
  'The Reflection Chamber', 'Unsent Messages Season', 'Version of Me',
  'Before The Verdict and the Door', 'Sun Don’t Invoice', 'The Ones We Still Carry',
  'Willful Detonation', '5 Minutes From The Edge', 'Not Alone',
  'The Shadow Magician', 'The Great Turning', 'Icarus Ain’t Cryin’ This Time',
  'The Seeker and the Silent',
  'Safer Lie', 'Ashes and Iron (Bloodline and Flame)', 'H2O',
  'Live For Me', 'Tearin’ You Apart', 'Felt That Drift',
  'Phantom', 'If He Could Only See', 'If You Really Listened',
  'Promise', 'This Ain’t The Limit', 'I Own Every Word',
  'The Veil Thins', 'Not Your Cross (The Seeker’s Initiation)',
];

/**
 * Guards the canonical track → pillar mapping. The music is structurally tied
 * to the Shadow/Light curriculum, so a track cited by the wrong pillar produces
 * the wrong diagnostic architecture — that is a data bug, not a cosmetic one.
 */
describe('canonical track mapping', () => {
  const entriesFor = (pillar) => [...pillar.shadow, ...pillar.light].filter((entry) => entry.track);

  it('accounts for all 27 tracks across the five pillars, none twice', () => {
    const all = Object.values(PILLAR_TRACK_MAP).flat();
    expect(all.length).toBe(27);
    expect(new Set(all).size).toBe(27);
    expect(new Set(all)).toEqual(new Set(ALL_27_TRACKS));
  });

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

  it('places Willful Detonation in Pillar Five only', () => {
    expect(PILLAR_TRACK_MAP['mirror-walker-boundary']).toContain('Willful Detonation');
    expect(PILLAR_TRACK_MAP['owned-interior']).not.toContain('Willful Detonation');
    expect(PILLAR_TRACK_MAP['forged-witness']).not.toContain('Willful Detonation');
  });

  it.each(Object.keys(PILLAR_TRACK_MAP))('gives every track of %s its own distinct code pair', (pillarId) => {
    const codes = PILLAR_TRACK_CODES[pillarId];
    expect(codes.map((c) => c.track).sort()).toEqual([...PILLAR_TRACK_MAP[pillarId]].sort());

    const shadows = new Set(codes.map((c) => c.shadow));
    const lights = new Set(codes.map((c) => c.light));
    expect(shadows.size).toBe(codes.length);
    expect(lights.size).toBe(codes.length);
  });

  it.each(Object.keys(PILLAR_TRACK_MAP))('every shadow/light entry with a `code` matches its track\'s canonical phrase: %s', (pillarId) => {
    const pillar = PILLARS.find((p) => p.id === pillarId);
    const codesByTrack = new Map(PILLAR_TRACK_CODES[pillarId].map((c) => [c.track, c]));

    for (const entry of pillar.shadow.filter((e) => e.track && e.code)) {
      expect(entry.code).toBe(codesByTrack.get(entry.track).shadow);
    }
    for (const entry of pillar.light.filter((e) => e.track && e.code)) {
      expect(entry.code).toBe(codesByTrack.get(entry.track).light);
    }
  });

  it.each(Object.keys(PILLAR_TRACK_MAP))('has a canonical macro-theme code pair drawn from one of its own tracks: %s', (pillarId) => {
    const canonical = PILLAR_CANONICAL_CODES[pillarId];
    const codes = PILLAR_TRACK_CODES[pillarId];
    expect(codes.some((c) => c.shadow === canonical.shadow.code)).toBe(true);
    expect(codes.some((c) => c.light === canonical.light.code)).toBe(true);
  });
});
