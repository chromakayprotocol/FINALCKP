# chroma-key-vma

Phase 18 (AI/VMA) of the Sovereign OS migration. A Cloudflare Worker
that gives Sovereign OS a companion chat grounded in the user's real
journey — see `docs/ARCHITECTURE.md`'s Phase 18 section for the full
writeup and `src/index.js` for the cost-conscious design choices
(claude-haiku-4-5, no thinking, bounded `max_tokens`, a cached persona
prefix).

Not wired into any live route or UI yet — this proves VMA can consume
Sovereign State and produce grounded replies for real, not that it's
live in the product.

## Local checks

```bash
npm install
npm test                        # vitest — auth, request validation, the real turn
npx wrangler deploy --dry-run   # validates bindings/config without deploying
```

## Deploying for real

Manual only, via the `Deploy VMA Worker (manual)` GitHub Actions
workflow (`workflow_dispatch`). Needs `CLOUDFARE_API_TOKEN`/
`CLOUDFARE_ACCOUNT_ID` (already used by the Pages and protected-media
deploys) plus one Worker-specific secret:

- `ANTHROPIC_API_KEY` — an Anthropic API key. The workflow fails loudly
  at a dedicated check step if it's missing, rather than deploying a
  Worker where every chat turn would fail.

To deploy manually instead: `cd frontend/vma-worker && npx wrangler
login && npx wrangler secret put ANTHROPIC_API_KEY && npx wrangler
deploy`.

## Calling it

```
POST /chat
Authorization: Bearer <supabase access token>
Content-Type: application/json

{
  "context": <buildVMAContext(state) from frontend/src/sovereign/vma/buildVMAContext.js>,
  "message": "what patterns have I found?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

Returns `{ "reply": "..." }`.
