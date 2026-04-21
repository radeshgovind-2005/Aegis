# Phase 2 — Domain Core & Policy

**Status:** ○ PENDING
**Goal:** Pure-TS domain layer, fully unit-tested, zero Cloudflare dependencies.

## Entry Criteria
- Phase 1 is `✔ DONE`.
- The reverse proxy pass-through is working.

## Why this phase exists
The whole point of hexagonal architecture is that the business rules don't know what infrastructure they run on. If we build this right, we can swap Vectorize for Pinecone, Workers AI for OpenAI, and the `SimilarityPolicy` doesn't change. We prove it by keeping `src/domain/` 100% free of Cloudflare imports — enforced by ESLint.

## Task List

- [ ] **2.1 — `Payload` value object**
  - `src/domain/payload/payload.ts`: immutable, constructor validates (non-empty, length ≤ 8192, is string).
  - Includes `.normalize()` → lowercased, whitespace-collapsed, URL-decoded variant used for embedding input. (Decision: we do NOT aggressively strip special chars — the embedding model should see the raw structure. Log this in DECISIONS.md.)
  - Tests: constructor validation, normalization edge cases (unicode, already-encoded, nested encoding).

- [ ] **2.2 — `Verdict` value object**
  - `src/domain/verdict/verdict.ts`: discriminated union `{ kind: 'ALLOW' } | { kind: 'BLOCK', matchId: string, similarity: number, category: string } | { kind: 'SUSPICIOUS', similarity: number }`.
  - Factory functions: `Verdict.allow()`, `Verdict.block(...)`, `Verdict.suspicious(...)`.
  - Tests: factories produce correct shape, serialization round-trips.

- [ ] **2.3 — `SimilarityPolicy`**
  - `src/domain/policy/similarity-policy.ts`: given a list of `{ score, category, id }` match results (score is cosine similarity in [-1,1], but Vectorize returns [0,1] for normalized vectors), return a `Verdict`.
  - Configurable thresholds: `blockAt` (default 0.85), `suspiciousAt` (default 0.75).
  - Pure function. No I/O.
  - Tests: threshold boundaries, empty match list → ALLOW, ties, negative scores.

- [ ] **2.4 — ESLint guard: no infra imports in domain/**
  - Extend `.eslintrc.cjs` with `no-restricted-imports` for `src/domain/**` — forbid `cloudflare:*`, `@cloudflare/*`, `./adapters/*`, `../adapters/*`.
  - Test: a PR that violates this must fail CI. (Add a commented-out violating line, confirm it flags, remove.)

- [ ] **2.5 — Ports (interfaces only)**
  - `src/ports/embedding-port.ts`: `interface EmbeddingPort { embed(text: string): Promise<Float32Array> }`.
  - `src/ports/vector-index-port.ts`: `interface VectorIndexPort { query(vec: Float32Array, topK: number): Promise<MatchResult[]> }`.
  - `src/ports/audit-log-port.ts`: `interface AuditLogPort { record(entry: AuditEntry): Promise<void> }`.
  - `src/ports/cache-port.ts`: `interface CachePort { get(key: string): Promise<Float32Array | null>; put(key: string, vec: Float32Array, ttlSec: number): Promise<void> }`.
  - Tests: none — these are interfaces. But the `MatchResult`/`AuditEntry` types live here and should have a tiny Zod schema + round-trip test.

- [ ] **2.6 — `ClassifyRequest` application service**
  - `src/application/classify-request.ts`: takes `Payload`, a `SimilarityPolicy`, and all four ports. Returns `Verdict`.
  - Flow: check cache → if miss, embed → query index → apply policy → record audit (if BLOCK) → cache result.
  - Tests: use fakes/stubs for all four ports. Test: cache hit path, cache miss path, embed failure → fail-closed vs fail-open (design decision — log in DECISIONS.md), empty index, block decision writes audit, allow decision does not.

## Exit Criteria
- [ ] All tasks merged.
- [ ] `src/domain/` line coverage ≥ 95%.
- [ ] `src/application/` line coverage ≥ 90%.
- [ ] `grep -rE '(cloudflare:|@cloudflare/)' src/domain/ src/application/ src/ports/` returns nothing.
- [ ] Decision on **fail-open vs fail-closed when embedding fails** is documented in `DECISIONS.md`.

## Human Checkpoint
Human reads the domain tests. Asks: "Can I understand what this system does from the tests alone, without reading any adapter code?" If yes, the hexagon is clean.
