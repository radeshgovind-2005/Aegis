# Phase 9 — README & Pitch Artefacts

**Status:** ○ PENDING
**Goal:** A README that a stranger can read end-to-end and walk away understanding the problem, the theory, and the solution.

## Entry Criteria
- Phases 0–7 done. (Phase 8 optional but ideal.)

## Task List

- [ ] **9.1 — README structure**
  Replace the Wrangler-generated README. Sections in this order:
  1. **What is this?** — one paragraph, plain English, no jargon.
  2. **The problem with traditional WAFs** — the regex-vs-obfuscation whack-a-mole.
  3. **The idea: semantics over syntax** — vector embeddings + cosine similarity, with a diagram.
  4. **Architecture** — the Cloudflare stack (Workers, Workers AI, Vectorize, D1, KV, Queues). Include the architecture diagram from 9.2.
  5. **How it works end to end** — one labelled sequence diagram of a request's journey.
  6. **Results** — the numbers from Phase 7. Honest P95s. Precision/recall from the threshold tests.
  7. **Limitations & honest tradeoffs** — inference on the hot path costs latency; seed corpus determines coverage; novel attack families may miss; fail-open vs fail-closed choice.
  8. **Getting started** — prereqs, `npm install`, `wrangler vectorize create`, `npm run seed`, `npm run dev`.
  9. **Architecture deep-dive** — for the reader who wants the hexagonal-ports-and-adapters story.
  10. **Pitch notes** — the Cloudflare-specific talking points (why edge inference, KV-as-cache math, async-via-Queues).

- [ ] **9.2 — Architecture diagram**
  - `docs/assets/architecture.svg` — sync path and async path side by side. Show: client → Worker → (cache check, AI embed, Vectorize query, policy decision) → origin OR 403. And the async branch: enqueue → Queue Consumer → (same pipeline) → blocklist KV.
  - Source the diagram from a text format (Mermaid or D2) committed alongside the SVG so it's editable.

- [ ] **9.3 — Honest limitations section**
  - Spell out explicitly:
    - Novel attack classes absent from seed → likely misses.
    - Long payloads (> 8KB) truncated.
    - Embedding latency on sync path (cite the P95 number).
    - Seed corpus is English-biased (the model is `bge-large-en`).
    - False-positive risk on legitimate SQL discussion contexts (e.g. dev forums).

- [ ] **9.4 — "Why I built it on Cloudflare" section**
  - This is the bit the Cloudflare interviewer cares about. Explain the *why* for each piece:
    - Workers: edge proximity, no cold starts, fits reverse-proxy model.
    - Workers AI: inference at the same PoP as the request — no round-trip to a central inference service.
    - Vectorize: edge-replicated vector store, cosine built-in, no operational burden.
    - D1: SQL at the edge, per-region, honest about replication latency.
    - KV: eventual consistency acceptable for embedding cache; instant for blocklist reads.
    - Queues: the escape hatch for when inference latency is unacceptable on the hot path.

- [ ] **9.5 — Review pass**
  - Hand the README to someone who knows nothing about WAFs. Record their questions. If a question is common, the README needs to answer it.

## Exit Criteria
- [ ] README renders cleanly on GitHub.
- [ ] Architecture diagram present.
- [ ] Numbers section is populated from real runs.
- [ ] Limitations section exists and is honest.

## Human Checkpoint
Human reads the README cold. If there's any sentence they'd be uncomfortable defending in an interview, rewrite it.
