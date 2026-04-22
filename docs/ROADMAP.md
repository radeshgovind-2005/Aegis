# Aegis — Roadmap

**Status legend:** `○ PENDING` · `▶ IN PROGRESS` · `✔ DONE` · `⏸ HUMAN-BLOCKED`

**Rules:**
- Phases are strictly sequential. Do not start Phase N+1 before Phase N is `✔ DONE` and sign-off is recorded.
- Each phase has `entry_criteria`, an explicit `task_list`, `exit_criteria`, and a `human_checkpoint`.
- The human marks a phase `✔ DONE` by editing this file and committing on `main`. Claude never does this.
- Deviations require a proposal in `docs/ROADMAP_CHANGES.md`, approved by the human before execution.

---

## Phase 0 — Scaffold & Guardrails  ✔ DONE
**Goal:** A repo where Claude Code can operate safely and a fresh session can pick up without drift. No business logic yet.

- See `docs/phases/phase-00-scaffold.md`
- **Human checkpoint:** Human reviews the full scaffold, runs `npm install && npm run verify`, and confirms CI passes on a throwaway PR.

---

## Phase 1 — Dummy Origin & Reverse Proxy  ▶ IN PROGRESS
**Goal:** The Worker acts as a reverse proxy in front of a tiny dummy origin. No AI yet. Prove the request-path plumbing.

- See `docs/phases/phase-01-reverse-proxy.md`
- **Human checkpoint:** Human hits the local Worker, sees requests forwarded to the dummy origin, inspects logs.

---

## Phase 2 — Domain Core & Policy  ○ PENDING
**Goal:** Pure-TS domain layer: `Payload`, `Verdict`, `SimilarityPolicy`. Fully unit-tested, zero Cloudflare dependencies. This is the hexagon's core.

- See `docs/phases/phase-02-domain-core.md`
- **Human checkpoint:** Human reviews the domain tests and is satisfied that the semantic classification logic is testable in isolation.

---

## Phase 3 — Seed Corpus Pipeline  ⏸ HUMAN-BLOCKED (Cloudflare account needed)
**Goal:** Offline script that pulls payloads from PayloadsAllTheThings + SecLists, dedupes, categorises, and upserts embeddings into Vectorize.

- See `docs/phases/phase-03-seed-corpus.md`
- **Blocker:** Human must provide Cloudflare account ID, API token with Workers AI + Vectorize permissions, and run `wrangler vectorize create` once.
- **Human checkpoint:** Human runs the seed script, confirms vectors land in Vectorize, and spot-checks a query.

---

## Phase 4 — AI & Vector Adapters  ○ PENDING
**Goal:** Implement `WorkersAiEmbedder` and `VectorizeIndex` adapters against real bindings. Contract tests prove they satisfy the ports.

- See `docs/phases/phase-04-ai-vector-adapters.md`
- **Human checkpoint:** Human runs the Worker locally, POSTs a known-malicious payload, sees a `BLOCK` verdict.

---

## Phase 5 — D1 Audit Log & KV Cache  ○ PENDING
**Goal:** Block decisions logged to D1. Embeddings cached in Workers KV keyed by `sha256(payload)` to cut P95 latency on repeated payloads.

- See `docs/phases/phase-05-d1-kv.md`
- **Human checkpoint:** Human sends the same payload twice, confirms the second is served from cache and a row exists in D1.

---

## Phase 6 — Async Path via Queues  ○ PENDING
**Goal:** For endpoints tagged `mode: async`, embedding + classification happen off the request path via Cloudflare Queues. The request is allowed by default and blocked retroactively (IP-level) if malicious.

- See `docs/phases/phase-06-queues-async.md`
- **Human checkpoint:** Human reviews the latency tradeoff and confirms the sync/async split is correct for the demo.

---

## Phase 7 — Latency Benchmarks & Observability  ○ PENDING
**Goal:** Reproducible benchmark script producing P50/P95/P99 numbers for sync and async paths, with and without KV cache. This is the "engineering flex" artefact.

- See `docs/phases/phase-07-benchmarks.md`
- **Human checkpoint:** Human reviews the benchmark output and judges whether the numbers are pitch-worthy.

---

## Phase 8 — Deploy Pipeline & Staging  ⏸ HUMAN-BLOCKED (Cloudflare account + GH secrets)
**Goal:** CI deploys to a `aegis-staging` Worker on every merge to `main`. Prod deploy is a manual GitHub Actions trigger.

- See `docs/phases/phase-08-deploy.md`
- **Blocker:** Human must add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to GitHub Actions secrets.
- **Human checkpoint:** Human merges a trivial PR, watches the staging deploy succeed, hits the live URL.

---

## Phase 9 — README & Pitch Artefacts  ○ PENDING
**Goal:** Public-facing README (problem → theory → architecture → results), architecture diagram, benchmark charts.

- See `docs/phases/phase-09-readme.md`
- **Human checkpoint:** Human reads the README as if they'd never seen the project. No unanswered questions.

---

## Deferred / Out of Scope (v1)

These belong to the "Agentic SDLC" half of Aegis and are tracked separately. They are **not** part of this roadmap and should not be started without the human opening a new phase plan.

- False-positive feedback loop (admin endpoint to mark verdicts as FP/FN and re-seed).
- Threshold auto-tuning.
- Per-tenant policies via Durable Objects.
- Multi-region replication strategy.
