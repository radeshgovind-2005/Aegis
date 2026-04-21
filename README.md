# Aegis

**A semantic Web Application Firewall built on Cloudflare Workers.**
Instead of blocking requests by matching attack strings against a regex list, Aegis reads the request the way a security engineer would — by understanding what it's *trying to do* — and blocks it when its intent looks too much like a known attack.

> **Status:** in active development. This repo is scaffolded for deterministic, phased construction. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for current progress.

---

## Why build this?

Traditional Web Application Firewalls work like spam filters circa 2004: a long, hand-written list of patterns like "block any request body containing `SELECT * FROM`". The problem is obvious the moment you say it out loud — an attacker can write `S/**/E/**/L/**/E/**/C/**/T`, or `%53ELECT`, or `/*!50000SELECT*/`, and the regex misses it. Security teams live in a permanent game of whack-a-mole, and overly aggressive rules end up blocking real customers (the "false positive tax").

Aegis takes a different bet: **the intent of an attack is harder to obfuscate than the syntax**. A text embedding model reads a payload and produces a 1024-dimensional vector representing what it *means*. Two SQL injections written in wildly different styles produce vectors that sit close together in that space, because they mean the same thing to the model. An honest query sits far away — even if it happens to contain the word `SELECT`.

We then ask a simple question: is this incoming request close to any known attack? If yes, block it.

---

## The idea in one paragraph

For every incoming HTTP request, we extract the payload (query string + JSON body), turn it into a vector using [`@cf/baai/bge-large-en-v1.5`](https://developers.cloudflare.com/workers-ai/models/bge-large-en-v1.5/) on Workers AI, and query [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) — a serverless vector database pre-populated with embeddings of real-world attack payloads from [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings) and [SecLists](https://github.com/danielmiessler/SecLists). If the cosine similarity to the nearest attack in the database is above a threshold (0.85 by default), we return `403 Forbidden`. Otherwise the request passes through to the origin.

The math:

$$\text{similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\|\\,\|\mathbf{B}\|}$$

Scores close to 1.0 mean "same intent". Below the threshold we either let the request through (`ALLOW`) or flag it with a header for monitoring (`SUSPICIOUS`).

---

## Architecture

Aegis runs entirely on Cloudflare's developer platform. Everything is at the edge — there is no origin call to a separate inference API and no database round-trip outside the PoP.

```
                ┌──────────────┐
incoming req ──►│              │    cache miss     ┌──────────────┐
                │   Worker     │──────────────────►│  Workers AI  │  embed payload
                │  (entry point│                   │ bge-large    │  → Float32[1024]
                │   handler)   │◄───── vector ─────┤ cls pooling  │
                │              │                   └──────────────┘
                │              │     query
                │              │──────────────────►┌──────────────┐
                │              │                   │  Vectorize   │  top-k nearest
                │              │◄───── matches ────┤ cosine       │  known attacks
                │              │                   └──────────────┘
                │              │
                │   policy     │   if BLOCK:
                │  (≥ 0.85)    │   ┌──────────────┐  ┌──────────────┐
                │              │──►│  D1 (audit)  │  │ KV blocklist │
                │              │   └──────────────┘  └──────────────┘
                │              │
                │              │   if ALLOW / SUSPICIOUS:
                │              │──► fetch origin
                └──────────────┘

 async-mode endpoints:
     Worker ─► Queue ─► Consumer Worker runs the same pipeline off the request path.
                         On BLOCK, writes the offending IP to the KV blocklist.
```

**Why each piece:**

| Component          | Role                             | Why this, not something else                                                              |
|--------------------|----------------------------------|--------------------------------------------------------------------------------------------|
| **Workers**        | Reverse proxy at every edge PoP  | Zero cold start, globally distributed, fits a per-request filter model.                    |
| **Workers AI**     | Run the embedding model inline   | Same-PoP inference — no round-trip to a central AI endpoint, which would dominate latency.|
| **Vectorize**      | Store and query attack vectors   | Managed, cosine built-in, edge-replicated, no servers to run.                              |
| **D1**             | Audit log of block decisions     | SQL at the edge with prepared statements. Only store hashes of payloads, never raw.        |
| **KV**             | Embedding cache + IP blocklist   | Eventually consistent reads in ~milliseconds. Fine for cache; acceptable for blocklist.    |
| **Queues**         | Async classification path        | Lets us put slow inference off the hot path for endpoints that tolerate "allow-then-block". |

---

## How a request flows, end to end

1. Request hits the Worker.
2. The Worker computes `clientIp` and checks the KV blocklist. If the IP is there, return `403` immediately — no embedding needed.
3. Extract the payload (query params + JSON body if present, up to 8 KB).
4. Compute `sha256(normalizedPayload)`. Check KV cache for a prior embedding.
5. If miss, call Workers AI with `bge-large-en-v1.5` to get a 1024-dim vector. Cache it in KV with a 24h TTL.
6. Query Vectorize for the top-5 nearest neighbours.
7. Apply `SimilarityPolicy`:
   - top score ≥ 0.85 → `BLOCK` (return 403 + write D1 audit row).
   - 0.75 ≤ top score < 0.85 → `SUSPICIOUS` (forward to origin with `X-Aegis-Suspicious` header).
   - else → `ALLOW` (forward to origin normally).
8. For endpoints configured as `async`: steps 3–7 happen on a Queue consumer instead. The request is allowed immediately; if the consumer decides `BLOCK`, the IP lands on the KV blocklist so the *next* request from that IP is rejected at step 2.

---

## Honest tradeoffs

This section is deliberately prominent. A WAF that oversells itself is dangerous.

- **Inference on the hot path costs latency.** Expect tens of milliseconds added for cache misses. We mitigate with the KV embedding cache (repeated payloads are ~free) and with the Queue-based async path for endpoints where "allow-then-block" is acceptable. Real P50/P95/P99 numbers will be published in [`docs/benchmarks.md`](docs/benchmarks.md) at Phase 7.
- **Seed corpus shapes coverage.** We can only find attacks whose *intent* sits near something in our Vectorize index. Truly novel attack families — for which no prior exists in PayloadsAllTheThings or SecLists — will be missed. This is not a hypothetical limitation; it's the model's nature. Plan to complement with other defences, not replace them.
- **False positives on legitimate security-adjacent traffic.** A developer posting a SQL query to Stack Overflow, or a security researcher submitting a bug report describing XSS, may embed close to the attack corpus. Aegis is not a fit for every endpoint — pair it with traffic classification.
- **English-biased.** `bge-large-en-v1.5` is trained primarily on English. Non-Latin-script payloads may embed unevenly. Switching to a multilingual model is tracked in [`docs/TODO.md`](docs/TODO.md).
- **The first request from a new IP in async mode lands on the origin.** That's the whole point of async — latency goes to the origin, classification runs in parallel. Do not use async mode on auth or payment endpoints.

---

## Project layout

```
src/
├── domain/           Pure TypeScript. Payload, Verdict, SimilarityPolicy.
├── application/      Use cases. classify-request.ts is the main one.
├── ports/            Interfaces describing what the domain needs.
├── adapters/         Cloudflare-specific implementations of ports.
├── interfaces/http/  HTTP handler — the driver side of the hexagon.
└── index.ts          Worker entry point; wires adapters into application.

docs/
├── ROADMAP.md        Phased plan. What to build next and in what order.
├── phases/           One file per phase with detailed task lists.
├── DECISIONS.md      Append-only log of non-trivial design choices.
├── HACKS.md          Honest log of shortcuts taken.
├── TODO.md           Future work, not current scope.
├── ISSUES.md         Known bugs and broken assumptions.
├── manual-testing/   Human-runnable recipes to verify each phase.
└── adr/              Formal Architecture Decision Records.

scripts/
├── seed/             Phase 3+: pulls PayloadsAllTheThings & SecLists,
│                     embeds, upserts into Vectorize.
└── bench/            Phase 7: latency & throughput benchmarks.
```

Read [`docs/adr/0001-hexagonal-architecture.md`](docs/adr/0001-hexagonal-architecture.md) to understand why it's split this way. Short version: the classification logic doesn't know what infrastructure runs it, enforced by ESLint.

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (only needed from Phase 3 onward)
- `wrangler` — installed as a dev dependency; no global install required

### First-time setup

```bash
git clone <this-repo>
cd aegis
npm install
cp .dev.vars.example .dev.vars    # edit with real values before Phase 3
npm run verify                    # lint + typecheck + test
```

### Local development

```bash
npm run dev          # wrangler dev — local Worker at localhost:8787
npm run test:watch   # vitest in watch mode
```

### Once Phase 3 is ready (Vectorize setup)

```bash
# Create the index (one-time, run manually)
npx wrangler vectorize create aegis-payloads --dimensions=1024 --metric=cosine

# Create the D1 database (one-time)
npx wrangler d1 create aegis-audit
# copy the returned database_id into wrangler.jsonc

# Create KV namespaces (one-time)
npx wrangler kv namespace create aegis-embed-cache
npx wrangler kv namespace create aegis-blocklist
# copy the returned ids into wrangler.jsonc

# Seed the index from public attack corpora
npm run seed -- --limit 5000
```

---

## Development model

This project is built by [Claude Code](https://claude.com/product/claude-code) under a strict agentic SDLC:

- **TDD.** Failing test first, then the minimum code to pass it, then refactor.
- **Hexagonal boundaries enforced by ESLint.** `src/domain/` cannot import from Cloudflare SDKs.
- **Every change is a branch, a PR, and a human merge.** The agent never merges its own work.
- **Every decision, shortcut, and follow-up is logged in plain markdown.** These files are the project's cross-session memory.
- **The roadmap is deterministic.** A fresh Claude Code session can read [`CLAUDE.md`](CLAUDE.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md) and know exactly what to do next.

If you're a human picking this up, start at [`CLAUDE.md`](CLAUDE.md) — same as the agent does.

---

## License

TBD. Do not assume permissive licensing.
