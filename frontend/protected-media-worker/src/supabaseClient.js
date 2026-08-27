/**
 * Fetch-based Supabase access, deliberately mirroring how
 * backend/server.py does it (verify_supabase_access_token,
 * get_current_user) rather than reimplementing JWT verification:
 * the same GET {SUPABASE_URL}/auth/v1/user call, the same
 * apikey/Authorization header shape, the same "look up the local
 * users row by id" follow-up.
 *
 * One deliberate, documented difference from the backend: this Worker
 * does NOT auto-provision a missing `users` row the way
 * app_user_from_supabase_user()/verify_supabase_access_token() do.
 * By the time a real user is requesting gated audio, the frontend's
 * existing Supabase-first auth flow has already caused that row to
 * exist (see docs/ARCHITECTURE.md's Phase 17 section) — so a missing
 * row here just means "not yet provisioned," and this Worker treats it
 * as a normal unauthorized/free-tier case rather than duplicating the
 * backend's insert-on-first-sight business logic.
 *
 * `fetchImpl` is injectable (defaults to the global fetch) purely so
 * these can be unit-tested without a network call — the same
 * dependency-injection convention used throughout
 * frontend/src/lib/supabase/*.js and the Sovereign Runtime's
 * fake-client test pattern.
 */

function trimTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

export async function verifySupabaseAccessToken(token, env, fetchImpl = fetch) {
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  let resp;
  try {
    resp = await fetchImpl(`${trimTrailingSlash(env.SUPABASE_URL)}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return null;
  }

  if (!resp.ok) return null;
  const supabaseUser = await resp.json();
  if (!supabaseUser?.id || !supabaseUser?.email) return null;
  return supabaseUser;
}

async function restSelectOne(path, env, fetchImpl) {
  let resp;
  try {
    resp = await fetchImpl(`${trimTrailingSlash(env.SUPABASE_URL)}/rest/v1/${path}`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
  } catch {
    return null;
  }

  if (!resp.ok) return null;
  const rows = await resp.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/** Looks up the app-level `users` row for a verified Supabase user id. Null if not (yet) provisioned. */
export async function fetchAppUser(supabaseUserId, env, fetchImpl = fetch) {
  return restSelectOne(`users?user_id=eq.${encodeURIComponent(supabaseUserId)}&select=*`, env, fetchImpl);
}

/** Looks up the `tracks` row backing a track id. Null if it doesn't exist. */
export async function fetchTrack(trackId, env, fetchImpl = fetch) {
  return restSelectOne(`tracks?track_id=eq.${encodeURIComponent(trackId)}&select=*`, env, fetchImpl);
}
