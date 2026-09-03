/**
 * One lazily-created AudioContext shared by the water ambience and the
 * interface tones (audio/waterAmbience.js, audio/uiTones.js) — two
 * AudioContexts for one screen is wasteful and some browsers cap how many
 * can exist at once. Not created until first requested (and browsers
 * create it "suspended" until a user gesture resumes it regardless), so
 * importing this module has no side effect on its own.
 */
let ctx = null;

/** Returns the shared context, or null in an environment with no Web Audio
    API (jsdom in tests, very old browsers) — every caller must treat null
    as "audio isn't available here" and no-op, never throw. */
export function getSharedAudioContext() {
  if (ctx) return ctx;
  const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Browsers create/keep an AudioContext "suspended" until a user gesture —
    call this from inside a real click handler (never on mount) to satisfy
    that policy. Safe to call when no context exists or resume() itself
    rejects (both silently no-op). */
export function resumeSharedAudioContext() {
  const context = getSharedAudioContext();
  if (context?.state === 'suspended') {
    context.resume().catch(() => {});
  }
}
