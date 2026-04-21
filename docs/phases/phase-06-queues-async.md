# Phase 6 — Async Path via Queues

**Status:** ○ PENDING
**Goal:** For endpoints tagged `mode: async`, the classification happens off the request path. Request is allowed immediately; if the async verdict is BLOCK, the source IP is blocked for future requests.

## Entry Criteria
- Phase 5 is `✔ DONE`.
- Human has run `wrangler queues create aegis-classify`.
- Binding added to `wrangler.jsonc`.

## Task List

- [ ] **6.1 — Endpoint mode config**
  - `src/domain/policy/endpoint-mode.ts`: maps path patterns → `sync | async`. Default `sync`.
  - Source of truth: a static config object for now. (Future: KV-backed for dynamic updates — log as TODO.)
  - Tests: pattern matching.

- [ ] **6.2 — Producer: enqueue for async paths**
  - In the main handler, if `mode=async`: compute payload hash, allow the request, enqueue `{ payloadHash, payload, reqId, ts, ip }` to `env.CLASSIFY_QUEUE`.
  - Tests: integration test confirming the request returns quickly and a message is produced.

- [ ] **6.3 — Consumer: Queue handler**
  - `export const queue: ExportedHandlerQueueHandler = async (batch, env) => { ... }`.
  - For each message: run the same `ClassifyRequest` pipeline. If BLOCK, write to D1 *and* add `ip` to a blocklist KV (`blocklist:ip:${ip}` → `{ until: ts+3600, reason }`).
  - Tests: queue handler unit test with a mock batch.

- [ ] **6.4 — IP blocklist check on the hot path**
  - Very first thing in the handler: `await env.BLOCKLIST.get('ip:' + clientIp)`. If present, 403 immediately. This is O(1) and keeps the async design honest.
  - Tests: blocklisted IP gets 403 without any embedding.

- [ ] **6.5 — Dead-letter handling**
  - Configure queue DLQ in `wrangler.jsonc`. Messages that fail 3x go to `aegis-classify-dlq`.
  - Add a tiny DLQ-drain script in `scripts/` that the human can run to inspect failed messages.

## Exit Criteria
- [ ] All tasks merged.
- [ ] Human sends a malicious payload to an `async`-tagged endpoint, sees a 200 response, waits 2 seconds, sends a benign payload from the same IP, sees a 403 (because the IP got blocklisted).
- [ ] Latency measurement shows async endpoints have near-origin latency (the embedding is not on the path).

## Human Checkpoint
Human runs the sync vs async comparison and confirms the latency difference.

## Honest Caveat
The async design has a real security cost: the **first** malicious request from a new IP lands on the origin. This is an acceptable tradeoff for non-critical endpoints (e.g. marketing search) but not for auth/payment flows. Make sure the config reflects that. Document it loudly in the README so the interviewer sees you thought about it.
