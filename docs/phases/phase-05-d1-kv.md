# Phase 5 — D1 Audit Log & KV Cache

**Status:** ○ PENDING
**Goal:** Block decisions logged to D1. Embeddings cached in KV to cut P95 latency on repeated payloads.

## Entry Criteria
- Phase 4 is `✔ DONE`.
- Human has run `wrangler d1 create aegis-audit` and `wrangler kv namespace create aegis-embed-cache`.
- Bindings added to `wrangler.jsonc`.

## Task List

- [ ] **5.1 — D1 schema**
  - `migrations/0001_audit_log.sql`: table `audit_log(id TEXT PRIMARY KEY, ts INTEGER, payload_hash TEXT, category TEXT, similarity REAL, verdict TEXT, path TEXT, ip TEXT)`.
  - **Do not store the raw payload** — only `sha256(payload)`. Storing attack payloads in a D1 is itself a risk (log poisoning, re-reflection).
  - Index on `ts` and `payload_hash`.
  - Tests: migration applies cleanly.

- [ ] **5.2 — `D1AuditLog` adapter**
  - `src/adapters/d1-audit-log.ts` implements `AuditLogPort`.
  - Uses prepared statements. Never string-concatenates.
  - Tests: contract test + integration with the Miniflare D1.

- [ ] **5.3 — `KVEmbeddingCache` adapter**
  - `src/adapters/kv-cache.ts` implements `CachePort`.
  - Key: `emb:${sha256(normalizedPayload)}`. Value: `Float32Array` serialized as base64 of its underlying ArrayBuffer. TTL: 24h default.
  - **Design note:** This cache only helps with *exact* payload replays. It does NOT help with novel payloads (they'd still need embedding). That's fine — attackers often replay the same obfuscated payload across many endpoints and IPs. Log this in DECISIONS.md.
  - Tests: put/get round-trip preserves the Float32Array, cache miss returns null.

- [ ] **5.4 — Wire cache into `ClassifyRequest`**
  - Already designed in Phase 2.6; now wire the real `KVEmbeddingCache`.
  - Tests: integration test showing second identical request skips the embed call. Use a `spy` embedder.

- [ ] **5.5 — Metrics endpoint (dev only)**
  - `GET /_aegis/stats` (protected by a dev-only token in `env.DEV_TOKEN`): returns cache hit rate, recent block count from D1.
  - Tests: endpoint returns 401 without token, returns JSON with token.

## Exit Criteria
- [ ] All tasks merged.
- [ ] Same-payload replay: second request shows `cacheHit=true` in logs.
- [ ] D1 contains a row for every BLOCK.
- [ ] `docs/manual-testing/phase-05.md`: human hits the endpoint twice, checks logs, runs `wrangler d1 execute aegis-audit --command "SELECT * FROM audit_log LIMIT 10"` and sees the entry.

## Human Checkpoint
Human verifies cache hit and inspects the D1 row.
