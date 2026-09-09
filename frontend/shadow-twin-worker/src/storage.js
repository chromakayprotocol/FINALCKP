/**
 * Supabase Storage I/O for the `shadow-twins` private bucket
 * (supabase/migrations/20260909132000_create_shadow_twin_schema.sql).
 *
 * Deliberately uses the *caller's own* access token, never a service-role
 * key — the bucket's RLS policies already grant an authenticated user
 * read/write on their own `{user_id}/...` prefix, so a Worker acting with
 * that user's token can read their source photo and write their canonical
 * Twin without any elevated credential at all. This is stricter than a
 * service-role key would be (a bug here can only ever touch this one
 * user's objects), and matches the design guide's "Never send the
 * service-role key to the browser" by simply never needing one server-side
 * either.
 */

function storageUrl(env, path) {
  return `${String(env.SUPABASE_URL).replace(/\/+$/, '')}/storage/v1/object/shadow-twins/${path}`;
}

export async function downloadSourceImage(sourceImagePath, accessToken, env, fetchImpl = fetch) {
  const resp = await fetchImpl(storageUrl(env, sourceImagePath), {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    throw new Error(`Could not read source image (${resp.status})`);
  }
  const contentType = resp.headers.get('content-type') || 'image/jpeg';
  const bytes = new Uint8Array(await resp.arrayBuffer());
  return { bytes, contentType };
}

export async function uploadCanonicalImage(userId, imageBytes, contentType, accessToken, env, fetchImpl = fetch) {
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/canonical/${crypto.randomUUID()}.${extension}`;

  const resp = await fetchImpl(storageUrl(env, path), {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'content-type': contentType,
    },
    body: imageBytes,
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Could not store the canonical Shadow Twin (${resp.status}): ${body}`);
  }
  return path;
}
