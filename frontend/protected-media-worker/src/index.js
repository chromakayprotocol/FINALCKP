import { canStream, canDownload } from './gating.js';
import { verifySupabaseAccessToken, fetchAppUser, fetchTrack } from './supabaseClient.js';

/**
 * Phase 17 (Cloudflare Consolidation) — the authenticated half of the
 * media-gateway split. `chroma-key-media-gateway` (frontend/r2-worker)
 * already proved a Worker can serve real R2 objects with Range support
 * at the edge, but it is deliberately fully public — fine for the Act
 * III visualizer preview catalog it serves, wrong for the paid
 * Protocol catalog backend/server.py currently gates behind
 * get_current_user() + tier checks.
 *
 * This Worker replicates that gating for real, at the edge: the same
 * Supabase Auth verification call, the same users-table tier lookup,
 * the same stream-vs-download rules (see gating.js), reading from the
 * same R2 bucket via track.audio_storage_path — the exact column
 * backend/server.py's stream_audio/download_audio read. It is NOT
 * wired up as the frontend's live audio path; see this file's sibling
 * docs/ARCHITECTURE.md Phase 17 section for why (an unauthenticated
 * cutover of a real purchase-gated audio path is exactly the kind of
 * decision this migration's own rule reserves for an explicit go-ahead,
 * not a phase built to "next").
 */

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-headers': 'Authorization, Range, If-None-Match',
  'access-control-expose-headers': 'Accept-Ranges, Content-Length, Content-Range, ETag',
  'access-control-max-age': '86400',
};

function withCors(headers) {
  for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value);
  return headers;
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: withCors(new Headers({ 'content-type': 'application/json' })),
  });
}

function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
}

/** Matches /audio/:trackId or /audio/:trackId/download. */
function parseAudioPath(pathname) {
  const match = pathname.match(/^\/audio\/([^/]+)(\/download)?\/?$/);
  if (!match) return null;
  return { trackId: decodeURIComponent(match[1]), isDownload: Boolean(match[2]) };
}

async function serveObject(request, bucket, key, { filename, contentType, disposition }) {
  const rangeHeader = request.headers.get('range');
  const object = await bucket.get(key, rangeHeader ? { range: request.headers } : undefined);
  if (!object) return jsonError(404, 'Audio not found');

  const headers = new Headers();
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'private, max-age=0, no-store');
  headers.set('content-disposition', `${disposition}; filename="${filename}"`);
  if (contentType) headers.set('content-type', contentType);

  let status = 200;
  if (rangeHeader && object.range) {
    status = 206;
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? object.size;
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set('content-length', String(length));
  } else {
    headers.set('content-length', String(object.size));
  }

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status,
    headers: withCors(headers),
  });
}

/**
 * Handles one request. `deps` is injectable so this can be exercised
 * with fake Supabase responses and a fake R2 bucket in tests, without a
 * network call or a real Workers runtime.
 */
export async function handleRequest(request, env, deps = {}) {
  const {
    verifyToken = verifySupabaseAccessToken,
    getAppUser = fetchAppUser,
    getTrack = fetchTrack,
  } = deps;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonError(405, 'Method not allowed');
  }

  const url = new URL(request.url);
  const parsed = parseAudioPath(url.pathname);
  if (!parsed) return jsonError(404, 'Not found');

  const token = bearerToken(request);
  if (!token) return jsonError(401, 'Not authenticated');

  const supabaseUser = await verifyToken(token, env);
  if (!supabaseUser) return jsonError(401, 'Not authenticated');

  const track = await getTrack(parsed.trackId, env);
  if (!track || !track.audio_storage_path) return jsonError(404, 'Audio not found');

  if (parsed.isDownload) {
    // Download gating needs real tier data, so it's the one path that
    // depends on the local `users` row existing — unlike streaming
    // (below), a not-yet-provisioned user correctly can't download,
    // same as a freshly auto-provisioned free-tier user on the backend
    // couldn't either.
    const appUser = await getAppUser(supabaseUser.id, env);
    if (!canDownload(appUser, track)) {
      return jsonError(403, 'Upgrade to download. Full access includes ownership of all digital files.');
    }
  } else if (!canStream(supabaseUser)) {
    // Matches backend/server.py's stream_audio: any authenticated
    // Supabase user can stream, whether or not their local `users` row
    // has been provisioned yet — the backend auto-provisions it right
    // here; this Worker just doesn't gate streaming on it existing.
    return jsonError(401, 'Not authenticated');
  }

  return serveObject(request, env.MEDIA, track.audio_storage_path, {
    filename: track.audio_filename || 'audio.mp3',
    contentType: track.audio_content_type || null,
    disposition: parsed.isDownload ? 'attachment' : 'inline',
  });
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
