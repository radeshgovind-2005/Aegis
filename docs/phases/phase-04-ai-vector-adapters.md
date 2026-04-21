# Phase 4 — AI & Vector Adapters

**Status:** ○ PENDING
**Goal:** Implement `WorkersAiEmbedder` and `VectorizeIndex` adapters that satisfy the ports from Phase 2.

## Entry Criteria
- Phase 3 is `✔ DONE`.
- Vectorize index `aegis-payloads` is populated.
- `[[ai]]` and `[[vectorize]]` bindings are in `wrangler.jsonc`.

## Task List

- [ ] **4.1 — `WorkersAiEmbedder`**
  - `src/adapters/workers-ai-embedder.ts` implements `EmbeddingPort`.
  - Uses `env.AI.run('@cf/baai/bge-large-en-v1.5', { text: [input], pooling: 'cls' })`.
  - Returns `Float32Array(1024)`.
  - Tests: vitest-pool-workers integration test against the real binding (local Miniflare stubs it). Contract test: satisfies `EmbeddingPort`.

- [ ] **4.2 — `VectorizeIndex`**
  - `src/adapters/vectorize-index.ts` implements `VectorIndexPort`.
  - Uses `env.VECTORIZE.query(vec, { topK: 5, returnMetadata: 'all' })`.
  - Maps Vectorize's `{ matches: [{ id, score, metadata }] }` → our `MatchResult[]`.
  - **Vectorize returns a similarity score in [0,1] for cosine when vectors are normalized.** Document in DECISIONS.md whether we normalize before insert (Workers AI outputs already normalized from bge models — verify this in a test).
  - Tests: contract test, integration test against the local Vectorize stub.

- [ ] **4.3 — Wiring in `src/index.ts`**
  - The Worker's `fetch` handler composes: `PayloadExtractor` → `Payload` → `ClassifyRequest(embedder, index, policy, auditLog, cache)` → if BLOCK return 403, else forward to origin.
  - Tests: integration test via `SELF.fetch()` with a known-malicious payload → 403, a benign payload → 200 from dummy origin.

- [ ] **4.4 — Response shape**
  - On BLOCK: return `HTTP 403` with JSON `{ error: 'BLOCKED', reason: 'semantic-match', matchId, similarity, requestId }`. Log full details server-side; return minimum to client.
  - On SUSPICIOUS: forward to origin but add header `X-Aegis-Suspicious: <similarity>`.
  - Tests: response shape assertions.

- [ ] **4.5 — Threshold tuning fixtures**
  - `test/fixtures/payloads/`:
    - `malicious/*.txt` — known-bad from a held-out split of PayloadsAllTheThings (NOT seeded into Vectorize).
    - `benign/*.txt` — legitimate strings (normal search queries, usernames, code snippets from Stack Overflow that mention SQL but aren't attacks).
  - `test/integration/threshold.spec.ts`: runs the full pipeline against every fixture, produces a confusion matrix, asserts precision ≥ 0.9 and recall ≥ 0.8 at the default threshold.
  - These numbers are the "engineering flex" for the pitch.

## Exit Criteria
- [ ] All tasks merged.
- [ ] `wrangler dev` locally: curl with a malicious payload returns 403, curl with a benign payload returns the origin's response.
- [ ] Threshold test produces a written result in `docs/threshold-results.md`.

## Human Checkpoint
Human runs curl commands against the local Worker, confirms the semantic match is actually working, reviews the confusion matrix.
