# chroma-key-shadow-twin

Act II Reflection Chamber — Shadow Twin generation. A Cloudflare Worker
that isolates the image-generation provider behind one adapter (see
`src/providers/index.js`), so `IMAGE_PROVIDER` is the only place a real
provider is chosen. Ships defaulted to `mock` (a dependency-free
placeholder — see `src/providers/mockProvider.js`) so the full pipeline
(auth -> download source -> generate -> upload canonical) is exercisable
without any credential; switch to `openai` and provision `OPENAI_API_KEY`
once a real provider is ready.

Never uses a service-role key: it reads/writes Supabase Storage with the
*caller's own* access token, which the `shadow-twins` bucket's RLS policies
already scope to that user's own `{user_id}/...` prefix — see
`src/storage.js`'s header.

## Local checks

```bash
npm install
npm test                        # vitest — auth, request validation, the real pipeline
npx wrangler deploy --dry-run   # validates bindings/config without deploying
```

## Deploying for real

`cd frontend/shadow-twin-worker && npx wrangler login && npx wrangler
secret put OPENAI_API_KEY && npx wrangler deploy`, then flip
`IMAGE_PROVIDER` to `openai` in `wrangler.jsonc`.

## Calling it

```
POST /generate
Authorization: Bearer <supabase access token>
Content-Type: application/json

{
  "sourceImagePath": "<user_id>/source/<uuid>.jpg",
  "promptVersion": "shadow-twin-v1"
}
```

Returns `{ "canonicalImagePath": "...", "visualIdentitySeed": "...", "promptVersion": "..." }`.
