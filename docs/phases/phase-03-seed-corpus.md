# Phase 3 — Seed Corpus Pipeline

**Status:** ⏸ HUMAN-BLOCKED
**Blocker:** Human must supply Cloudflare account ID + API token and create the Vectorize index once.

## Goal
An offline Node script (not a Worker) that pulls payloads from PayloadsAllTheThings and SecLists, dedupes & categorises them, generates embeddings via the Workers AI REST API, and upserts into Vectorize.

## Entry Criteria
- Phase 2 is `✔ DONE`.
- Human has:
  - A Cloudflare account.
  - Created an API token with scopes: `Workers AI: Read`, `Vectorize: Edit`, `Account: Read`.
  - Put `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in `.dev.vars` (local) and GitHub Actions secrets (CI).
  - Run: `wrangler vectorize create aegis-payloads --dimensions=1024 --metric=cosine`.
  - Added the `[[vectorize]]` binding to `wrangler.jsonc`.

## Source Data

**Repos to clone (or download via `git archive` / GitHub API):**
- `github.com/swisskyrepo/PayloadsAllTheThings` — paths:
  - `SQL Injection/Intruder/` (~40 files, ~thousands of payloads)
  - `XSS Injection/Intruder/`
  - `Command Injection/Intruder/`
  - `Server Side Request Forgery/`
  - `XXE Injection/`
- `github.com/danielmiessler/SecLists` — paths:
  - `Fuzzing/SQLi/`
  - `Fuzzing/XSS/`
  - `Fuzzing/LFI/`

**Do not commit the raw data to the repo.** The seed script downloads it on demand into `.seed-cache/` (gitignored).

## Task List

- [ ] **3.1 — Pinned source manifest**
  - `scripts/seed/sources.json`: pin each source to a **specific commit SHA**, not a branch. This makes the seed deterministic.
  - Tests: schema validation of the manifest.

- [ ] **3.2 — Downloader**
  - `scripts/seed/download.ts`: fetches each pinned source into `.seed-cache/<source>/<sha>/`. Idempotent — skips if already present. Verifies SHA.
  - Tests: unit tests with a mocked fetch. An integration test against a real small public repo (run only locally, skipped in CI via env flag).

- [ ] **3.3 — Parser & categoriser**
  - `scripts/seed/parse.ts`: walks the cache, reads each file, splits into individual payloads (one per line, strip comments, strip empty lines). Each payload gets a `category` (sqli, xss, cmdi, ssrf, xxe, lfi) and a `source` (file path + line number for provenance).
  - Tests: sample files in `scripts/seed/fixtures/`, verify correct payload counts and categories.

- [ ] **3.4 — Dedupe**
  - `scripts/seed/dedupe.ts`: removes exact duplicates. Also removes near-duplicates via a configurable Jaccard threshold on character 3-grams (cheap pre-filter — we don't want to embed 5 copies of the same payload).
  - Tests: known duplicates are collapsed, distinct payloads survive.

- [ ] **3.5 — Embedder (Node-side)**
  - `scripts/seed/embed.ts`: batches payloads (100 at a time), POSTs to `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/baai/bge-large-en-v1.5` with `{ text: [...] }`. Handles rate limits with exponential backoff. Writes results to `.seed-cache/embeddings.jsonl`.
  - Tests: mock the HTTP call. Verify batching, retry, pooling=`cls`.

- [ ] **3.6 — Upserter**
  - `scripts/seed/upsert.ts`: reads `embeddings.jsonl`, upserts into Vectorize via `wrangler vectorize insert` (NDJSON format) or the REST API. Each vector's metadata: `{ category, source, sha }`.
  - Tests: unit tests on the NDJSON formatter. A dry-run mode (`--dry`) that writes output without hitting Cloudflare.

- [ ] **3.7 — Orchestrator**
  - `scripts/seed/index.ts`: runs all stages. `npm run seed` invokes it. Flags: `--dry`, `--category sqli`, `--limit 100`.
  - Tests: end-to-end dry run against fixtures.

- [ ] **3.8 — Seed provenance log**
  - After every real run, append to `docs/seed-runs.md`: timestamp, commit SHAs of sources, counts per category, Vectorize index size after.

## Exit Criteria
- [ ] All tasks merged.
- [ ] Human has run `npm run seed` once, successfully, and there are ≥5000 vectors in `aegis-payloads`.
- [ ] An entry exists in `docs/seed-runs.md` for the first real run.
- [ ] `docs/manual-testing/phase-03.md` has a step for the human to spot-check: pick a known SQLi payload, embed it manually, query Vectorize, confirm it matches one of its neighbours.

## Human Checkpoint
Human provides credentials, runs the seed, spot-checks the result.

## Cost Warning
PayloadsAllTheThings + SecLists combined have ~50–100k unique payloads. Embedding all of them through Workers AI is not free (check pricing before the first real run). Start with `--limit 5000` and grow.
