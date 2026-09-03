import { getSovereignSupabase } from '../../../../lib/supabase/sovereignHelpers';

/**
 * Each Act's default music track — not a per-pillar choice. The Song is one
 * of the app's principal diagnostic instruments (§07 of the Pillar One
 * spec): the whole Act shares one emotional field, so this is keyed by Act
 * number, not by pillar id. Act I and Act IV don't have their track seeded
 * in Supabase yet — resolveActDefaultTrack() below returns null for those
 * rather than guessing at an R2 key, and the caller is expected to just
 * play no music in that case.
 */
export const ACT_DEFAULT_TRACK_TITLE = Object.freeze({
  1: 'Keepers in the Light',
  2: 'H2O',
  3: 'Reclamation',
  4: 'Charioteer',
});

const R2_PUBLIC_BASE_URL = (
  import.meta.env.VITE_APP_R2_PUBLIC_BASE_URL || 'https://media.chromakeyprotocol.com'
).replace(/\/+$/, '');

function buildAssetUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${R2_PUBLIC_BASE_URL}/${String(value).replace(/^\/+/, '')}`;
}

/**
 * Resolves an Act's default track into the shape useAudio()'s playTrack()
 * expects ({ id, audio_url, ... }) — same query + URL-building pattern as
 * ReclamationLessonMedia.jsx. Returns null (never throws) if the Act has no
 * configured default, the track isn't seeded yet, or Supabase isn't
 * reachable — every caller is expected to treat "no track" as "play
 * nothing," not an error.
 */
export async function resolveActDefaultTrack(actNumber, { client } = {}) {
  const title = ACT_DEFAULT_TRACK_TITLE[actNumber];
  if (!title) return null;

  const supabase = client ?? getSovereignSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('id, title, artist, album, duration_ms, r2_audio_key')
      .eq('title', title)
      .maybeSingle();

    if (error || !data?.r2_audio_key) return null;

    const audioUrl = buildAssetUrl(data.r2_audio_key);
    if (!audioUrl) return null;

    return {
      id: data.id,
      title: data.title,
      artist: data.artist,
      album: data.album,
      duration_ms: data.duration_ms,
      audio_url: audioUrl,
    };
  } catch {
    return null;
  }
}
