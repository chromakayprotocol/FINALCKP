/**
 * Shadow Twin storage + generation client (Act II Reflection Chamber).
 *
 * Client-side half of the pipeline the design guide lays out (§7, §27):
 * upload -> client validation -> secure image storage -> generation request.
 * Source photo upload goes straight from the browser to Supabase Storage's
 * private `shadow-twins` bucket (RLS-scoped to the signed-in user — see
 * supabase/migrations/20260909132000_create_shadow_twin_schema.sql); the
 * actual image generation is isolated behind requestShadowTwinGeneration(),
 * which calls frontend/shadow-twin-worker so the generation credential
 * never reaches the browser (same pattern as VMAChat.jsx calling
 * frontend/vma-worker) — this file never talks to an image provider
 * directly, and nothing here hardcodes which provider the Worker uses.
 */

import { getSupabaseClient } from '../../services/supabase/client';

const SHADOW_TWIN_BUCKET = 'shadow-twins';
const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_DIMENSION_PX = 400;

const SHADOW_TWIN_WORKER_URL = (import.meta.env.VITE_APP_SHADOW_TWIN_WORKER_URL || '').replace(/\/+$/, '');

function fileExtension(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
}

/**
 * Client-side validation only (design guide §6 — "Do not over-engineer
 * this into a forensic identity-validation system. The photograph is an
 * artistic identity reference, not a biometric enrollment mechanism.").
 * Checks: exists, supported MIME type, reasonable size, reasonable
 * resolution. Deliberately does NOT attempt person-detection — that's a
 * UX nicety the guide explicitly says not to build here.
 */
export async function validateShadowTwinSourceImage(file) {
  if (!file) return { valid: false, reason: 'No image was selected.' };
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return { valid: false, reason: 'Use a JPEG, PNG, or WebP photograph.' };
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return { valid: false, reason: 'That image is too large. Use a photo under 15MB.' };
  }

  const dimensions = await readImageDimensions(file).catch(() => null);
  if (!dimensions) {
    return { valid: false, reason: 'That file could not be read as an image.' };
  }
  if (dimensions.width < MIN_DIMENSION_PX || dimensions.height < MIN_DIMENSION_PX) {
    return { valid: false, reason: 'Use a higher-resolution photograph — at least 400px on each side.' };
  }

  return { valid: true, dimensions };
}

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // No DOM Image constructor available (e.g. a non-browser test
      // environment) — skip the dimension check rather than fail closed.
      resolve({ width: MIN_DIMENSION_PX, height: MIN_DIMENSION_PX });
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unreadable image'));
    };
    image.src = url;
  });
}

/**
 * Uploads the validated source photo to the user's private storage prefix.
 * Never overwrites a prior source (design guide §28) — each upload gets a
 * fresh uuid-named object, so a retried initialization always has a clean
 * identity reference and the original never needs to be touched again.
 */
export async function uploadShadowTwinSourceImage(userId, file, client) {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return { path: null, error: new Error('Supabase client is not configured.') };
  if (!userId) return { path: null, error: new Error('A user id is required to upload a source image.') };

  const path = `${userId}/source/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage.from(SHADOW_TWIN_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { path: null, error };
  return { path, error: null };
}

/**
 * A short-lived signed URL for a private shadow-twins object (source or
 * canonical). Never a public URL — the bucket is private (design guide §27:
 * "Do not expose arbitrary user paths publicly").
 */
export async function getShadowTwinSignedUrl(path, { expiresInSeconds = 3600, client } = {}) {
  if (!path) return { url: null, error: null };
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return { url: null, error: new Error('Supabase client is not configured.') };

  const { data, error } = await supabase.storage
    .from(SHADOW_TWIN_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return { url: null, error };
  return { url: data?.signedUrl ?? null, error: null };
}

/**
 * Requests generation of the canonical Shadow Twin from the given source
 * image path. Isolated behind this one function per the design guide's
 * §7 adapter instruction — the UI calls this, nothing else, and never
 * learns which provider actually ran behind frontend/shadow-twin-worker.
 * Auth follows VMAChat.jsx's exact pattern: pull the live Supabase access
 * token per-request, send it as a bearer token, no token stored.
 */
export async function generateShadowTwin({ sourceImagePath, promptVersion }, client) {
  if (!SHADOW_TWIN_WORKER_URL) {
    return { canonicalImagePath: null, visualIdentitySeed: null, error: new Error('The Shadow Twin generator is not configured yet.') };
  }

  const supabase = client ?? getSupabaseClient();
  const { data } = supabase ? await supabase.auth.getSession() : { data: {} };
  const token = data?.session?.access_token;
  if (!token) {
    return { canonicalImagePath: null, visualIdentitySeed: null, error: new Error('Sign in to initialize your Shadow Twin.') };
  }

  let response;
  try {
    response = await fetch(`${SHADOW_TWIN_WORKER_URL}/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ sourceImagePath, promptVersion }),
    });
  } catch (err) {
    return { canonicalImagePath: null, visualIdentitySeed: null, error: new Error('The Chamber could not reach the generator.') };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    // Never surface the raw provider/API error to the user (design guide
    // §41) — the Worker already returns a safe `error` string; fall back
    // to a generic one if even that is missing.
    return {
      canonicalImagePath: null,
      visualIdentitySeed: null,
      error: new Error(body?.error || 'The Chamber could not complete the initialization.'),
    };
  }

  return {
    canonicalImagePath: body.canonicalImagePath,
    visualIdentitySeed: body.visualIdentitySeed ?? null,
    error: null,
  };
}
