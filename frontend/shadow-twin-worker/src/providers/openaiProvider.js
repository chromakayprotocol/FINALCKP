/**
 * The reference real image-generation provider: OpenAI's image edit
 * endpoint (gpt-image-1), used image-to-image so the source photo actually
 * conditions the result (design guide §7's `generateShadowTwin({
 * sourceImage, promptVersion, aspectRatio, background })`). Selected via
 * `IMAGE_PROVIDER=openai` — see providers/index.js's resolver. This is the
 * ONE file in the whole Worker that knows an OpenAI request shape; nothing
 * upstream (the frontend, index.js's request handling) knows this
 * provider exists at all, per the design guide's adapter requirement.
 */

const OPENAI_IMAGES_EDIT_URL = 'https://api.openai.com/v1/images/edits';

export async function generate({ sourceImageBytes, sourceContentType, prompt, aspectRatio }, env, fetchImpl = fetch) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const size = aspectRatio === '9:16' ? '1024x1536' : '1024x1024';
  const extension = sourceContentType === 'image/png' ? 'png' : 'jpg';

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('image', new Blob([sourceImageBytes], { type: sourceContentType }), `source.${extension}`);

  const resp = await fetchImpl(OPENAI_IMAGES_EDIT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Image generation failed (${resp.status}): ${body}`);
  }

  const json = await resp.json();
  const base64 = json?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error('Image generation returned no image data');
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  return { imageBytes: bytes, contentType: 'image/png' };
}
