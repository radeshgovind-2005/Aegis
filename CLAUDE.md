# CLAUDE.md — Operating Rules for Claude Code

**You are working on Aegis, a Semantic WAF built on Cloudflare Workers + Workers AI + Vectorize + D1.**
**Read this file fully before doing anything. Then read `docs/ROADMAP.md` to find the current phase.**

---

## 1. The Golden Loop

Every task, without exception, follows this loop:

1. **Orient** — Read `docs/ROADMAP.md`. Find the current phase. Open `docs/phases/phase-NN-*.md`. Find the next unchecked task.
2. **Branch** — Create a branch: `phase-NN/task-slug` (e.g. `phase-02/vectorize-binding`).
3. **Write failing tests first** — TDD is mandatory. No production code before a red test exists for it.
4. **Implement** — Implement the right solution — not the shortest hack that passes. Code must be readable, well-named, and efficient. A test passing is the floor, not the ceiling. Ask: would I be proud to have written this in six months? Naming is design. If you can't find a clear name for a function, variable, or type, the abstraction is probably wrong. Rename before moving on.
Own every line. Don't paste, don't cargo-cult. If you write something you don't fully understand, log it in DECISIONS.md and resolve it before the PR.
5. **Refactor** — With tests green, review every line for clarity, naming, efficiency, and ownership. Remove dead code. Collapse accidental complexity. The diff should read like intentional design, not a debugging session.
6. **Verify** — Run `npm run verify` (lint + typecheck + test). All must pass.
7. **Log** — Append to `docs/DECISIONS.md` (what & why), `docs/HACKS.md` (any shortcut taken), `docs/TODO.md` (any follow-up), and add a manual-test recipe in `docs/manual-testing/phase-NN.md`.
8. **Commit** — Conventional commit format (§6). One logical change per commit.
9. **PR** — Open a PR with the template (§7). Mark it `needs-review`.
10. **STOP** — Do not merge. Do not start the next task. Wait for the human to merge and say "continue".

**If you ever find yourself about to do step 10 ("merge" or "keep going"), stop. That is the human's job.**

---

## 2. Architecture: Lightweight Hexagonal + DDD

The domain is small. Do not over-engineer. But respect the boundaries.

```
src/
├── domain/           # Pure TS. No Workers types. No fetch. No AI. No DB.
│   ├── payload/      # Payload value object, validation rules
│   ├── verdict/      # Verdict value object (ALLOW / BLOCK / SUSPICIOUS)
│   └── policy/       # SimilarityPolicy — the threshold logic
├── application/      # Use cases. Orchestrates domain + ports.
│   └── classify-request.ts
├── ports/            # Interfaces only. The domain's view of the outside world.
│   ├── embedding-port.ts
│   ├── vector-index-port.ts
│   ├── audit-log-port.ts
│   └── cache-port.ts
├── adapters/         # Concrete implementations of ports.
│   ├── workers-ai-embedder.ts
│   ├── vectorize-index.ts
│   ├── d1-audit-log.ts
│   └── kv-cache.ts
├── interfaces/       # HTTP entry point. The "driver" side.
│   └── http/
│       └── waf-handler.ts
└── index.ts          # Worker entry. Wires adapters into application.
```

**Rules:**
- `domain/` imports nothing except other `domain/` modules. No `cloudflare:workers`, no `@cloudflare/*`.
- `application/` imports `domain/` and `ports/`. Never `adapters/`.
- `adapters/` implement `ports/`. They are the only place Cloudflare bindings appear.
- `interfaces/http/` wires everything via `index.ts`.
- If you feel pressure to violate these boundaries, **stop and log it in `docs/HACKS.md`** with the reason, then do it. Don't hide it.

**DDD warning:** This is a *small* domain. Do not invent aggregates, domain events, or repositories you don't need. Value objects and a pure `SimilarityPolicy` are enough for Phase 2. Grow the model only when a phase demands it.

---

## 3. TDD Discipline

- **Red → Green → Refactor.** Never write production code without a failing test.
- Tests live in `test/` mirroring `src/` structure (e.g. `test/domain/policy/similarity-policy.spec.ts`).
- Domain tests are pure unit tests — no Worker runtime needed.
- Adapter tests use `@cloudflare/vitest-pool-workers` against the local Miniflare.
- Integration tests live in `test/integration/` and exercise the full Worker via `SELF.fetch()`.
- Target: **domain ≥ 95% line coverage, adapters ≥ 80%**. Fail CI below this.
- If a test is hard to write, the design is probably wrong. Log it in `docs/DECISIONS.md` and refactor before pushing through.

---

## 4. The Logging System (Your Memory)

You have no memory between sessions. These files ARE your memory. Keep them current.

| File | Purpose | When to write |
|---|---|---|
| `docs/DECISIONS.md` | Every non-trivial design choice. Problem, options considered, decision, rationale. | Any time you pick between ≥2 reasonable approaches. |
| `docs/HACKS.md` | Hardcoded values, mocks, shortcuts, "TODO: fix properly". | The moment you write one. Include file path + line. |
| `docs/TODO.md` | Future work that's out of scope for the current phase. | When you notice it. |
| `docs/ISSUES.md` | Bugs, flaky tests, broken assumptions, external blockers. | When encountered. |
| `docs/manual-testing/phase-NN.md` | Step-by-step recipes the human can run to verify the phase. | After every completed task in a phase. |
| `docs/ROADMAP_CHANGES.md` | Any deviation from `ROADMAP.md`. Phase split, task added, order changed. | Before deviating. Human must approve. |

**Format for `DECISIONS.md` entries (ADR-lite):**
```
## YYYY-MM-DD — <short title>
**Context:** <one-paragraph problem statement>
**Options:** <bullet list>
**Decision:** <what you chose>
**Rationale:** <why>
**Consequences:** <tradeoffs accepted>
**Links:** <commit hash, PR number, phase file>
```

---

## 5. Memory Compression (claude-mem)

The repo is configured to use [`claude-mem`](https://github.com/thedotmack/claude-mem) for compressing long conversation histories. Use it when your context is filling up. The markdown logs in `docs/` are still the source of truth — claude-mem compresses conversations, not decisions.

---

## 6. Commits

**Format** (Conventional Commits):
```
<type>(<scope>): <subject>

<body>

<footer>
```

- `type` ∈ {feat, fix, refactor, test, docs, chore, ci, perf}
- `scope` ∈ {domain, app, adapter-ai, adapter-vector, adapter-d1, adapter-kv, http, ci, docs, seed}
- Subject: imperative, ≤72 chars, no trailing period.
- Body: **why**, not what. Reference the phase and task.
- Footer: `Phase: NN | Task: <slug>` and `Co-Authored-By: Claude <noreply@anthropic.com>`.

**Example:**
```
feat(domain): add SimilarityPolicy with configurable threshold

The policy encapsulates the block/allow decision so the application
layer never touches raw scores. Threshold defaults to 0.85 per
Cloudflare's recommendation but is injectable for testing.

Phase: 02 | Task: similarity-policy
Co-Authored-By: Radesh Govind <radesh.govind@gmail.com>
```

---

## 7. Pull Requests

- One PR per task. Never bundle.
- Title: same as commit subject.
- Body: use `.github/pull_request_template.md`.
- Labels: `phase-NN`, `needs-review`.
- **You never merge.** CI must be green. Human clicks merge.

---

## 8. Hard Stops — When to Wait for the Human

Stop and wait (do not proceed) when:
- You finished a task → wait for PR merge.
- You finished a phase → wait for phase sign-off in `docs/ROADMAP.md`.
- Anything needs a Cloudflare API token, account ID, or real deploy (§10).
- You'd need to deviate from `ROADMAP.md` → write proposal in `docs/ROADMAP_CHANGES.md` and stop.
- A test is flaky and you don't understand why → log in `ISSUES.md` and stop.
- You're tempted to `--force`, `--no-verify`, or skip a test → stop.

---

## 9. What You Never Do

- Push to `main` directly.
- Merge your own PRs.
- Commit secrets. Ever. `.dev.vars` is gitignored; use `wrangler secret` for prod.
- Skip tests to "move faster".
- Rewrite git history on shared branches.
- Delete or edit past entries in `DECISIONS.md`/`HACKS.md`. Append a new entry instead.
- Silently change the roadmap.
- Run `wrangler deploy` without explicit human instruction.

---

## 10. Secrets & Cloudflare Credentials

You will never have direct access to real Cloudflare credentials. The human sets them up:
- Local dev: `.dev.vars` (gitignored) — human creates from `.dev.vars.example`.
- CI: GitHub Actions secrets — human configures.
- Prod: `wrangler secret put` — human runs.

If a task requires real credentials (e.g. first-time Vectorize index creation), mark the task `HUMAN-BLOCKED` in the phase file and stop.

---

## 11. Quick Reference

```bash
npm run dev           # wrangler dev — local Worker
npm run test          # vitest run
npm run test:watch    # vitest watch
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm run verify        # lint + typecheck + test (run before every commit)
npm run seed          # populate Vectorize from PayloadsAllTheThings (Phase 3+)
```

---

## 12. Starting a Fresh Session

When you `cd` into this repo with no context:

1. Read this file (`CLAUDE.md`) in full.
2. `cat docs/ROADMAP.md` — find the phase marked `▶ IN PROGRESS` (or the first `○ PENDING`).
3. `cat docs/phases/phase-NN-*.md` — find the next unchecked `[ ]` task.
4. `cat docs/DECISIONS.md | tail -100` — load recent context.
5. `cat docs/HACKS.md` — know what's already ugly.
6. `git status && git log --oneline -20` — know where git is.
7. If the roadmap says `HUMAN-BLOCKED`, stop and ask the human.
8. Otherwise, begin the Golden Loop (§1).

**Do not skip the orient step. Do not trust your memory over these files.**
