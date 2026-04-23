# Phase 1 — Dummy Origin & Reverse Proxy

**Status:** ▶ IN PROGRESS
**Goal:** Prove the request-path plumbing. Worker sits in front of a tiny dummy origin and forwards requests. No AI yet.

## Entry Criteria
- Phase 0 is `✔ DONE`.
- `npm run verify` is green on `main`.

## Why this phase exists
Before adding inference on the hot path, we need rock-solid plumbing: request parsing, body/query extraction, forwarding to origin, response streaming. Adding AI on top of broken plumbing means every bug is ambiguous.

## Task List

- [x] **1.1 — Dummy origin Worker**
  - A second Worker (`workers/dummy-origin/`) with 3 endpoints: `GET /echo?q=...`, `POST /search` (JSON body), `GET /health`.
  - Deployed separately (or same repo, separate wrangler config).
  - Tests: contract tests for each endpoint.

- [x] **1.2 — `PayloadExtractor` (domain-adjacent, no ports yet)**
  - Pure function: given a `Request`, return `{ method, path, query: Record<string,string>, body: string | null }`.
  - Tests: unit tests covering GET with query, POST with JSON, POST with form-encoded, binary bodies (return null), oversize bodies (truncate + flag).
  - **Important:** This is still pure TS. No Worker types here — accept a plain `URL` + headers + body reader.

- [ ] **1.3 — HTTP handler: pass-through mode**
  - `src/interfaces/http/waf-handler.ts` — implements `fetch`. Uses `PayloadExtractor` then forwards to `env.ORIGIN` (a Service binding).
  - Default verdict: `ALLOW` (we have no classifier yet).
  - Tests: integration tests via `@cloudflare/vitest-pool-workers` + `SELF.fetch()`.

- [ ] **1.4 — Structured logging**
  - A tiny logger that emits JSON to `console.log`. Fields: `ts`, `reqId`, `method`, `path`, `verdict`, `latencyMs`.
  - Tests: unit tests on the logger.

- [ ] **1.5 — Manual-test recipe**
  - `docs/manual-testing/phase-01.md`: how to run both Workers locally, send curl requests, read logs.

## Exit Criteria
- [ ] All tasks merged.
- [ ] Human can run `npm run dev` and hit `curl localhost:8787/echo?q=hello` and see `hello` echoed from the dummy origin, with a structured log line showing `verdict=ALLOW`.
- [ ] Test coverage on `src/` ≥ 90%.

## Human Checkpoint
Human runs the manual-test recipe and confirms the proxy works end-to-end.
