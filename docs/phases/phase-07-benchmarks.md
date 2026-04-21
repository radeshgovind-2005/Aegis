# Phase 7 — Latency Benchmarks & Observability

**Status:** ○ PENDING
**Goal:** Reproducible benchmark producing P50/P95/P99 for sync path, sync+cache-hit path, and async path. These numbers are the pitch artefact.

## Entry Criteria
- Phase 6 is `✔ DONE`.
- Worker is deployed to a staging environment (either local `wrangler dev` with real bindings, or the future staging deploy — whichever exists first).

## Task List

- [ ] **7.1 — Benchmark harness**
  - `scripts/bench/`: Node script using `autocannon` or a simple custom loop. Configurable: target URL, concurrency, duration, payload mix (% malicious vs benign, held-out from seed corpus).
  - Emits JSON results with histograms.

- [ ] **7.2 — Scenarios**
  - `sync-cold` — every request unique, no cache hits.
  - `sync-warm` — requests cycle through a fixed set of 10 payloads, cache hits after warmup.
  - `async` — target async-mode endpoint.
  - `baseline` — bypass Worker, hit origin directly (control).

- [ ] **7.3 — Results doc**
  - `docs/benchmarks.md` (auto-appended, never overwritten): run date, commit SHA, scenario, concurrency, P50/P95/P99, requests/sec.
  - A chart-generating script in `scripts/bench/chart.ts` → outputs `docs/assets/bench-<date>.svg`.

- [ ] **7.4 — CI smoke benchmark (optional)**
  - A tiny benchmark in CI that asserts P95 < 500ms on a 100-request run. Fails the build if latency regresses.
  - Keep this gentle — CI is not a valid load-testing environment, just a regression tripwire.

## Exit Criteria
- [ ] A populated `docs/benchmarks.md` with at least one run of each scenario.
- [ ] A generated chart in `docs/assets/`.
- [ ] A paragraph in the README referencing the numbers honestly (don't cherry-pick the best run — show range).

## Human Checkpoint
Human reads the numbers. Decides if they're credible and pitch-worthy. If the sync path is too slow for a production WAF story, human decides whether to: (a) accept the honest limitation and pitch it as "for non-auth endpoints use async", (b) investigate smaller embedding model (`bge-small-en-v1.5` → 384 dims), (c) defer to v2. Document the decision.

## Pitch-Framing Warning
These numbers will be scrutinised by a Cloudflare security engineer. Be honest:
- Don't report the fastest run; report P95.
- Don't compare against "a traditional WAF" unless you actually benchmarked one.
- Do compare: sync vs async, warm vs cold, with vs without cache.
- The interesting story is not "this is faster than a WAF" (it isn't). The interesting story is "this catches attacks that regex can't, at an acceptable latency for the right endpoints".
