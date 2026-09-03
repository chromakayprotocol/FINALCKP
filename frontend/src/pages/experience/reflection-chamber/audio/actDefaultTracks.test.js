import { describe, test, expect, vi } from 'vitest';
import { ACT_DEFAULT_TRACK_TITLE, resolveActDefaultTrack } from './actDefaultTracks';

/* Guards the exact per-Act default the user specified directly — not a
   per-pillar choice, and not something to be inferred from a pillar's own
   title track. Getting this table right matters more than the resolver
   logic around it: a wrong title here silently plays the wrong Act's music
   with no error anywhere. */
describe('ACT_DEFAULT_TRACK_TITLE', () => {
  test('matches the exact per-Act defaults', () => {
    expect(ACT_DEFAULT_TRACK_TITLE).toEqual({
      1: 'Keepers in the Light',
      2: 'H2O',
      3: 'Reclamation',
      4: 'Charioteer',
    });
  });
});

function fakeSupabase(row, { error = null } = {}) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: row, error })),
        })),
      })),
    })),
  };
}

describe('resolveActDefaultTrack', () => {
  test('resolves Act Two to H2O, building the R2 URL from r2_audio_key', async () => {
    const client = fakeSupabase({
      id: 'track-16',
      title: 'H2O',
      artist: 'Musiq Matrix',
      album: 'The Reflection Chamber',
      duration_ms: 246000,
      r2_audio_key: 'act_two/media/tracks/16 - Musiq Matrix - H20.mp3',
    });

    const track = await resolveActDefaultTrack(2, { client });

    expect(track.id).toBe('track-16');
    expect(track.title).toBe('H2O');
    expect(track.audio_url).toContain('act_two/media/tracks/16 - Musiq Matrix - H20.mp3');
  });

  test('resolves Act Three to Reclamation', async () => {
    const client = fakeSupabase({
      id: 'track-r',
      title: 'Reclamation',
      r2_audio_key: 'act_three/media/tracks/Reclamation.mp3',
    });

    const track = await resolveActDefaultTrack(3, { client });
    expect(track.title).toBe('Reclamation');
  });

  test('queries by the exact title for the requested Act', async () => {
    const eq = vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) }));
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) };

    await resolveActDefaultTrack(1, { client });
    expect(eq).toHaveBeenCalledWith('title', 'Keepers in the Light');

    await resolveActDefaultTrack(4, { client });
    expect(eq).toHaveBeenCalledWith('title', 'Charioteer');
  });

  test('returns null for Act One and Four when the track has not been seeded yet', async () => {
    // Real state today per the user: Keepers in the Light and Charioteer
    // exist nowhere in the tracks table or its migrations yet.
    const client = fakeSupabase(null);

    expect(await resolveActDefaultTrack(1, { client })).toBeNull();
    expect(await resolveActDefaultTrack(4, { client })).toBeNull();
  });

  test('returns null, never throws, on a Supabase error', async () => {
    const client = fakeSupabase(null, { error: new Error('network down') });
    await expect(resolveActDefaultTrack(2, { client })).resolves.toBeNull();
  });

  test('returns null for an Act with no configured default', async () => {
    const client = fakeSupabase({ title: 'Something' });
    expect(await resolveActDefaultTrack(5, { client })).toBeNull();
  });

  test('returns null, never throws, with no Supabase client at all', async () => {
    await expect(resolveActDefaultTrack(2, { client: null })).resolves.toBeNull();
  });
});
