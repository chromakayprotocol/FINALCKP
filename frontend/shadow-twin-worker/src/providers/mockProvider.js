/**
 * A deterministic, dependency-free provider used in tests and local dev
 * when no real image-generation credential is configured
 * (`IMAGE_PROVIDER=mock`, or the fallback when nothing else is set). It
 * never calls a network — it draws a tiny solid-white 9:16 PNG so the full
 * pipeline (auth -> download source -> "generate" -> upload canonical) is
 * exercisable end-to-end without an API key, matching the design guide's
 * "pure, solid white background" canonical asset requirement even in this
 * placeholder form.
 */

// A pre-encoded 1x1 white PNG (smallest valid PNG). Real providers return
// an actual 9:16 image; the mock's job is pipeline correctness, not visual
// fidelity, so pixel dimensions don't matter here.
const WHITE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function generate() {
  return {
    imageBytes: base64ToBytes(WHITE_PIXEL_PNG_BASE64),
    contentType: 'image/png',
  };
}
