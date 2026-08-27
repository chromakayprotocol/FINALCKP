/**
 * Access decisions for gated audio, mirroring backend/server.py's
 * stream_audio (GET /api/audio/{track_id}) and download_audio
 * (GET /api/audio/{track_id}/download) exactly — same fields, same
 * precedence, same license-tier carve-out for Act III tracks. Kept as
 * pure functions (no fetch/R2/env) so the gating rules themselves are
 * unit-testable without a network or a Worker runtime.
 */

/** Streaming just requires a resolved app user (any authenticated user). */
export function canStream(user) {
  return Boolean(user);
}

/**
 * Downloading requires one of: admin, full tier, owns-all-albums, or a
 * license-tier user downloading specifically an Act III track.
 */
export function canDownload(user, track) {
  if (!user) return false;
  if (user.is_admin || user.tier === 'full' || user.owns_all_albums) return true;
  if (user.tier === 'license' && track?.act === 3) return true;
  return false;
}
