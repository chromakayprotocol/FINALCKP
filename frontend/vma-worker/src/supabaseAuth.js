/**
 * Auth verification only — VMA doesn't need tier/download gating
 * (frontend/protected-media-worker/src/supabaseClient.js), just proof
 * the caller is a real signed-in user, so the anon/publishable key is
 * enough (same public value already shipped as
 * VITE_SUPABASE_PUBLISHABLE_KEY). No service-role key, no `users`/
 * `tracks` REST reads — this Worker's only real secret is
 * ANTHROPIC_API_KEY. `fetchImpl` is injectable for tests, same
 * convention as the rest of this codebase.
 */
export async function verifySupabaseAccessToken(token, env, fetchImpl = fetch) {
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  let resp;
  try {
    resp = await fetchImpl(`${String(env.SUPABASE_URL).replace(/\/+$/, '')}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }

  if (!resp.ok) return null;
  const supabaseUser = await resp.json();
  if (!supabaseUser?.id || !supabaseUser?.email) return null;
  return supabaseUser;
}
