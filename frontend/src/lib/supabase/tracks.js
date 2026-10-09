import { getSovereignSupabase } from './sovereignHelpers';
import { getSuppliedVisualizerLyrics } from '../../data/suppliedVisualizerLyrics';

const VISUALIZER_PLAYLIST_SLUG = 'reclamation-visualizer-preview';
const ACT_TWO_VISUALIZER_PLAYLIST_SLUG = 'act-two-visualizer-preview';
const R2_PUBLIC_BASE_URL = (
  import.meta.env.VITE_APP_R2_PUBLIC_BASE_URL || 'https://media.chromakeyprotocol.com'
).replace(/\/+$/, '');

function buildR2Url(objectKey) {
  if (!objectKey) return null;
  if (/^https?:\/\//i.test(objectKey)) return objectKey;
  return `${R2_PUBLIC_BASE_URL}/${String(objectKey).replace(/^\/+/, '')}`;
}

function resolveAssetUrl(asset) {
  return asset?.source_url || buildR2Url(asset?.r2_object_key) || null;
}

function newestActiveAsset(rows = []) {
  return rows.find((row) => row?.is_active) || null;
}

function groupAssetsByTrack(rows = []) {
  return rows.reduce((grouped, row) => {
    (grouped[row.track_id] ||= []).push(row);
    return grouped;
  }, {});
}

function normalizeTrack(row, position = null, lyricData = null, visualAssets = null) {
  if (!row) return null;
  const timedLyrics = (lyricData?.timedLyrics || []).filter((line) => line.track_id === row.id);
  const protocol = lyricData?.protocol?.track_id === row.id ? lyricData.protocol : null;
  const coverArt = newestActiveAsset(visualAssets?.coverArt);
  const viewportBackground = newestActiveAsset(visualAssets?.viewportBackground);
  const storedLyrics = timedLyrics.length
    ? timedLyrics.map((line) => line.line_text).join('\n')
    : protocol?.lyrics_clean || protocol?.lyrics_full || '';
  const lyrics = storedLyrics || getSuppliedVisualizerLyrics(row.title);

  return {
    ...row,
    track_order: position ?? row.queue_index ?? 0,
    duration_seconds: row.duration_ms ? row.duration_ms / 1000 : null,
    audio_url: buildR2Url(row.r2_audio_key),
    cover_url: resolveAssetUrl(coverArt) || buildR2Url(row.r2_cover_key),
    cover_image_url: resolveAssetUrl(coverArt) || buildR2Url(row.r2_cover_key),
    cover_alt: coverArt?.alt_text || `${row.title} cover art`,
    viewport_background_url: resolveAssetUrl(viewportBackground),
    viewport_background_alt: viewportBackground?.alt_text || `${row.title} visualizer background`,
    viewport_background_type: viewportBackground?.media_type || 'image',
    viewport_background_focal_x: viewportBackground?.focal_x ?? 50,
    viewport_background_focal_y: viewportBackground?.focal_y ?? 50,
    viewport_overlay: viewportBackground?.overlay_config || {},
    display_text: lyrics,
    lyrics,
    lyrics_track_id: lyrics ? row.id : null,
    light_code: row.light_code || protocol?.primary_light_code || null,
    shadow_code: row.shadow_code || null,
    lyric_summary: protocol?.lyric_summary || null,
    timed_lyrics: timedLyrics,
    visual_preset: row.visual_presets || null,
  };
}

const TRACK_COLUMNS = `
  id,
  title,
  artist,
  album,
  duration_ms,
  bpm,
  queue_index,
  r2_audio_key,
  r2_cover_key,
  light_code,
  shadow_code,
  preset_id,
  visual_presets (
    id,
    name,
    shader_name,
    palette_json,
    intensity
  )
`;

const REFLECTION_CHAMBER_ARTIFACT_COLUMNS = `
  id,
  track_id,
  chamber_order,
  sonic_artifact_name,
  artifact_snapshot,
  artifact_stage,
  shadow_code,
  light_code,
  behavioral_test,
  stage_number,
  what_you_bring,
  shadow_code_quote,
  light_code_quote,
  make_the_turn,
  life_domains,
  where_this_shows_up,
  jungian_lens,
  reflection_title,
  reflection_prompt,
  movement_criteria,
  handoff,
  source_edition
`;

const REFLECTION_CHAMBER_STAGE_COLUMNS = `
  stage_number,
  stage_name,
  core_question,
  stage_intent,
  gate_question
`;

function getCodexLyricExcerpt(track, maxLines = 8) {
  const lines = String(track?.lyrics || track?.display_text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\[[^\]]+\]$/.test(line));

  return lines.slice(0, maxLines);
}


async function getVisualizerTracksByPlaylist(slug) {
  const supabase = getSovereignSupabase();
  if (!supabase) return [];

  const { data: playlist, error: playlistError } = await supabase
    .from('visualizer_playlists')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (playlistError || !playlist) {
    console.error('Unable to load the active visualizer playlist.', playlistError);
    return [];
  }

  const { data: playlistRows, error: playlistTracksError } = await supabase
    .from('visualizer_playlist_tracks')
    .select('track_id, position')
    .eq('playlist_id', playlist.id)
    .order('position', { ascending: true });

  if (playlistTracksError || !playlistRows?.length) {
    console.error('Unable to load visualizer playlist tracks.', playlistTracksError);
    return [];
  }

  const ids = playlistRows.map((row) => row.track_id);
  const [tracksResult, coversResult, backgroundsResult, timedLyricsResult, protocolResult] = await Promise.all([
    supabase.from('tracks').select(TRACK_COLUMNS).in('id', ids),
    supabase
      .from('track_cover_art')
      .select('track_id, source_url, r2_object_key, alt_text, is_active, updated_at')
      .in('track_id', ids)
      .eq('is_active', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('visualizer_viewport_backgrounds')
      .select('track_id, source_url, r2_object_key, alt_text, media_type, focal_x, focal_y, overlay_config, is_active, updated_at')
      .in('track_id', ids)
      .eq('is_active', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('track_lyrics')
      .select('track_id, line_order, line_text, start_ms, end_ms')
      .in('track_id', ids)
      .order('line_order', { ascending: true }),
    supabase
      .from('lyrics_protocol')
      .select('track_id, lyrics_full, lyrics_clean, primary_light_code, lyric_summary, display_mode')
      .in('track_id', ids),
  ]);

  if (tracksResult.error) {
    console.error('Unable to load visualizer tracks.', tracksResult.error);
    return [];
  }

  if (coversResult.error) console.error('Unable to load assigned track cover art.', coversResult.error);
  if (backgroundsResult.error) console.error('Unable to load assigned viewport backgrounds.', backgroundsResult.error);
  if (timedLyricsResult.error) console.error('Unable to load timed lyrics for the visualizer queue.', timedLyricsResult.error);
  if (protocolResult.error) console.error('Unable to load the lyric protocol for the visualizer queue.', protocolResult.error);

  const tracksById = new Map((tracksResult.data || []).map((row) => [row.id, row]));
  const coversByTrack = groupAssetsByTrack(coversResult.data);
  const backgroundsByTrack = groupAssetsByTrack(backgroundsResult.data);
  const protocolByTrack = new Map((protocolResult.data || []).map((row) => [row.track_id, row]));
  return playlistRows
    .map((item) => normalizeTrack(tracksById.get(item.track_id), item.position, {
      timedLyrics: timedLyricsResult.data || [],
      protocol: protocolByTrack.get(item.track_id) || null,
    }, {
      coverArt: coversByTrack[item.track_id],
      viewportBackground: backgroundsByTrack[item.track_id],
    }))
    .filter(Boolean);
}

export async function getActThreeTracks() {
  return getVisualizerTracksByPlaylist(VISUALIZER_PLAYLIST_SLUG);
}

export async function getActTwoTracks() {
  return getVisualizerTracksByPlaylist(ACT_TWO_VISUALIZER_PLAYLIST_SLUG);
}

export async function getActTwoReflectionChamberCodex() {
  const supabase = getSovereignSupabase();
  if (!supabase) return [];

  const [artifactsResult, stagesResult] = await Promise.all([
    supabase
      .from('act_two_sonic_artifacts')
      .select(REFLECTION_CHAMBER_ARTIFACT_COLUMNS)
      .order('chamber_order', { ascending: true }),
    supabase
      .from('act_two_stages')
      .select(REFLECTION_CHAMBER_STAGE_COLUMNS)
      .order('stage_number', { ascending: true }),
  ]);

  if (artifactsResult.error) {
    console.error('Unable to load the Reflection Chamber production master.', artifactsResult.error);
    return [];
  }

  if (stagesResult.error) {
    console.error('Unable to load the Reflection Chamber stage architecture.', stagesResult.error);
    return [];
  }

  const artifacts = artifactsResult.data || [];
  if (!artifacts.length) return [];

  const ids = artifacts.map((artifact) => artifact.track_id);
  const [tracksResult, coversResult, backgroundsResult, timedLyricsResult, protocolResult] = await Promise.all([
    supabase.from('tracks').select(TRACK_COLUMNS).in('id', ids),
    supabase
      .from('track_cover_art')
      .select('track_id, source_url, r2_object_key, alt_text, is_active, updated_at')
      .in('track_id', ids)
      .eq('is_active', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('visualizer_viewport_backgrounds')
      .select('track_id, source_url, r2_object_key, alt_text, media_type, focal_x, focal_y, overlay_config, is_active, updated_at')
      .in('track_id', ids)
      .eq('is_active', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('track_lyrics')
      .select('track_id, line_order, line_text, start_ms, end_ms')
      .in('track_id', ids)
      .order('line_order', { ascending: true }),
    supabase
      .from('lyrics_protocol')
      .select('track_id, lyrics_full, lyrics_clean, primary_light_code, lyric_summary, display_mode')
      .in('track_id', ids),
  ]);

  if (tracksResult.error) {
    console.error('Unable to load Reflection Chamber track media.', tracksResult.error);
    return [];
  }

  if (coversResult.error) console.error('Unable to load Reflection Chamber cover art.', coversResult.error);
  if (backgroundsResult.error) console.error('Unable to load Reflection Chamber backgrounds.', backgroundsResult.error);
  if (timedLyricsResult.error) console.error('Unable to load Reflection Chamber timed lyrics.', timedLyricsResult.error);
  if (protocolResult.error) console.error('Unable to load Reflection Chamber lyric protocol.', protocolResult.error);

  const tracksById = new Map((tracksResult.data || []).map((row) => [row.id, row]));
  const stagesByNumber = new Map((stagesResult.data || []).map((row) => [row.stage_number, row]));
  const coversByTrack = groupAssetsByTrack(coversResult.data || []);
  const backgroundsByTrack = groupAssetsByTrack(backgroundsResult.data || []);
  const protocolByTrack = new Map((protocolResult.data || []).map((row) => [row.track_id, row]));

  return artifacts
    .map((artifact, index) => {
      const rawTrack = tracksById.get(artifact.track_id);
      if (!rawTrack) return null;

      const track = normalizeTrack(rawTrack, artifact.chamber_order, {
        timedLyrics: timedLyricsResult.data || [],
        protocol: protocolByTrack.get(artifact.track_id) || null,
      }, {
        coverArt: coversByTrack[artifact.track_id],
        viewportBackground: backgroundsByTrack[artifact.track_id],
      });

      const nextArtifact = artifacts[index + 1] || null;
      return {
        track,
        entry: {
          ...artifact,
          stage: stagesByNumber.get(artifact.stage_number) || null,
          chapterLyrics: getCodexLyricExcerpt(track),
          shadowCodeQuote: artifact.shadow_code,
          lightCodeQuote: artifact.light_code,
          shadowEvidenceQuote: artifact.shadow_code_quote,
          lightEvidenceQuote: artifact.light_code_quote,
          isStageBoundary: !nextArtifact || nextArtifact.stage_number !== artifact.stage_number,
        },
      };
    })
    .filter(Boolean);
}

export async function getTrackById(trackId) {
  if (!trackId) return null;
  const supabase = getSovereignSupabase();
  if (!supabase) return null;

  const [trackResult, timedLyricsResult, protocolResult, coverResult, backgroundResult] = await Promise.all([
    supabase.from('tracks').select(TRACK_COLUMNS).eq('id', trackId).maybeSingle(),
    supabase
      .from('track_lyrics')
      .select('track_id, line_order, line_text, start_ms, end_ms')
      .eq('track_id', trackId)
      .order('line_order', { ascending: true }),
    supabase
      .from('lyrics_protocol')
      .select('track_id, lyrics_full, lyrics_clean, primary_light_code, lyric_summary, display_mode')
      .eq('track_id', trackId)
      .maybeSingle(),
    supabase
      .from('track_cover_art')
      .select('source_url, r2_object_key, alt_text, is_active, updated_at')
      .eq('track_id', trackId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('visualizer_viewport_backgrounds')
      .select('source_url, r2_object_key, alt_text, media_type, focal_x, focal_y, overlay_config, is_active, updated_at')
      .eq('track_id', trackId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1),
  ]);

  if (trackResult.error) {
    console.error('Unable to load visualizer track.', trackResult.error);
    return null;
  }
  if (timedLyricsResult.error) {
    console.error('Unable to load timed lyrics for the selected track.', timedLyricsResult.error);
  }
  if (protocolResult.error) {
    console.error('Unable to load the lyric protocol for the selected track.', protocolResult.error);
  }

  return normalizeTrack(trackResult.data, trackResult.data?.queue_index, {
    timedLyrics: timedLyricsResult.data || [],
    protocol: protocolResult.data || null,
  }, {
    coverArt: coverResult.data || [],
    viewportBackground: backgroundResult.data || [],
  });
}
