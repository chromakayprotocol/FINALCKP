/**
 * Auth verification — same shape as frontend/vma-worker/src/supabaseAuth.js
 * (proof the caller is a real signed-in Supabase user; the anon/publishable
 * key is enough, no service-role key needed here either). `fetchImpl` is
 * injectable for tests, same convention as the rest of this codebase.
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
