# ADR 0001 — Lightweight Hexagonal Architecture with Pure Domain Core

**Status:** accepted
**Date:** 2026-04-21
**Deciders:** Claude, project owner

## Context

Aegis is a Cloudflare Worker that classifies incoming HTTP payloads as malicious or benign using vector embeddings and cosine similarity. The classification logic — "given a payload and a set of neighbour matches, decide ALLOW/BLOCK/SUSPICIOUS" — is the core intellectual property. Everything else (fetching embeddings, querying the vector DB, logging, caching) is infrastructure.

Two failure modes to avoid:
1. **Classification logic tangled with Cloudflare SDKs** → cannot unit-test in isolation, cannot swap Vectorize for another DB, the pitch story collapses.
2. **Over-engineered DDD** → aggregates and domain events for a stateless classifier are pure ceremony, obscure the small amount of real logic, and slow every future change.

## Decision

We will use **lightweight hexagonal architecture**:

- `src/domain/` — pure TypeScript. No `cloudflare:*`, no `@cloudflare/*`, no `fetch`. Contains value objects (`Payload`, `Verdict`) and the `SimilarityPolicy` pure function. Enforced via ESLint `no-restricted-imports`.
- `src/ports/` — interface-only declarations describing what the domain needs from the outside world: `EmbeddingPort`, `VectorIndexPort`, `AuditLogPort`, `CachePort`.
- `src/application/` — use cases composed from domain + ports. One per user-facing operation. Currently just `ClassifyRequest`.
- `src/adapters/` — concrete implementations of ports. The only layer allowed to import Cloudflare types.
- `src/interfaces/http/` — the driver: parses incoming `Request`, invokes the application, formats the `Response`.

We will **not** use the full DDD tactical pattern set (aggregates, domain events, repositories, unit of work) unless a future phase demonstrably needs them. Value objects and pure services are sufficient for the current domain.

## Consequences

**Easier:**
- Domain tests run in milliseconds with no Miniflare — pure Node + vitest.
- The interview pitch ("swap Vectorize for Pinecone — the policy code doesn't change") becomes a demonstrable fact, not a claim.
- Adapter-specific quirks (Vectorize's score semantics, Workers AI's pooling modes) stay in adapters and don't leak into the policy.

**Harder:**
- ~4 extra files in Phase 2 that could otherwise be one. Acceptable tax.
- New contributors need to learn the ports convention. The ESLint rule + `CLAUDE.md` § 2 exist to teach them.

**Risks accepted:**
- We may discover the port interfaces are wrong mid-implementation. That's fine — ports are ours to reshape, and we log the reshape in `DECISIONS.md`.
- The "pure domain" discipline adds friction when someone wants to quickly `console.log` in a policy function. Policy errors must throw typed exceptions; logging happens at the adapter boundary.

## Alternatives Considered

- **Flat, single-file Worker.** Fastest to write; zero interview credibility; untestable without Miniflare; rejected.
- **Full DDD (aggregates, events, repositories).** Ceremony without payoff for a stateless classifier; rejected.
- **Classic "service + repository" layering.** Works, but the "domain must not know infrastructure" constraint is weaker and tends to erode. Hexagonal's explicit ports make the constraint self-enforcing. Rejected in favour of hexagonal.

## Links
- `CLAUDE.md` § 2
- `docs/DECISIONS.md` — 2026-04-21 entry
- `docs/phases/phase-02-domain-core.md`
