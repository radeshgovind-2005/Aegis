# Phase 0 — Scaffold & Guardrails

**Status:** ▶ IN PROGRESS
**Goal:** A repo where Claude Code can operate safely and a fresh session can pick up without drift.

## Entry Criteria
- [x] `wrangler init` has produced a TypeScript Worker project.
- [x] `CLAUDE.md`, `docs/ROADMAP.md`, and this file exist.

## Task List

Work these tasks in order. One task = one branch = one PR = one human merge.

- [x] **0.1 — Package scripts & tooling**
  - Add scripts to `package.json`: `dev`, `test`, `test:watch`, `lint`, `typecheck`, `verify`, `format`.
  - Install dev deps: `eslint`, `@typescript-eslint/*`, `prettier`, `eslint-config-prettier`.
  - Add `.eslintrc.cjs`, `.prettierrc`, `.editorconfig`.
  - Tests: none (tooling PR).
  - Manual verify: `npm run verify` exits 0.

- [x] **0.2 — Directory skeleton for hexagonal layout**
  - Create empty `src/{domain,application,ports,adapters,interfaces/http}/.gitkeep`.
  - Create empty `test/{domain,application,adapters,integration}/.gitkeep`.
  - Add `docs/adr/0001-hexagonal-architecture.md` (ADR explaining the choice — template in `docs/adr/_template.md`).
  - Tests: add a single guard test that fails if `domain/` imports from `adapters/` or `cloudflare:workers` (use `eslint-plugin-import` + `no-restricted-imports`).
  - Manual verify: introduce a forbidden import, confirm ESLint catches it, revert.

- [x] **0.3 — GitHub Actions CI**
  - `.github/workflows/ci.yml` — runs on every PR. Steps: checkout, setup-node 20, `npm ci`, `npm run verify`, upload coverage artefact.
  - `.github/workflows/deploy-staging.yml` — runs on push to `main`. Gated by secrets; skip gracefully if absent (for Phase 0, just `echo "staging deploy placeholder"`).
  - `.github/pull_request_template.md` — PR template (checklist: tests written first, docs updated, manual-test recipe added).
  - `.github/CODEOWNERS` — `* @<human-username>` so every PR requires the human's review.
  - Branch protection note: task description must remind the human to enable branch protection on `main` in GitHub UI (Claude can't do this).
  - Tests: none — CI itself is the test.
  - Manual verify: open a throwaway PR with a deliberate lint error, confirm CI fails.

- [x] **0.4 — .gitignore, .dev.vars.example, wrangler hygiene**
  - Expand `.gitignore`: `.dev.vars`, `.wrangler/`, `coverage/`, `.DS_Store`, `*.log`.
  - Create `.dev.vars.example` with placeholders for any secrets future phases will need (empty for now).
  - Verify `wrangler.jsonc` has `name = "aegis"` and no leaked account ID.
  - Tests: none.
  - Manual verify: `git status` shows no untracked files after a fresh checkout + `npm install`.

- [x] **0.5 — Seed the docs/ memory files**
  - Create `docs/DECISIONS.md`, `docs/HACKS.md`, `docs/TODO.md`, `docs/ISSUES.md`, `docs/ROADMAP_CHANGES.md` with their headers (see `docs/_templates/`).
  - Create `docs/manual-testing/README.md` explaining the structure.
  - Create `docs/manual-testing/phase-00.md` with a step-by-step recipe for the human to verify Phase 0 (run `npm install`, `npm run verify`, `npm run dev`, hit `localhost:8787`).
  - Tests: none.
  - Manual verify: human reads the docs cold, understands what each file is for.

- [X] **0.6 — claude-mem configuration**
  - Add `claude-mem` as a dev dependency.
  - Add a `.claude-mem.json` config (compression policy, paths to exclude, etc.).
  - Document its usage in `CLAUDE.md` §5 (already done, confirm it's accurate).
  - Tests: none.
  - Manual verify: `npx claude-mem --help` works.

## Exit Criteria

All of:
- [x] Every task above is ✔ and merged into `main`.
- [ ] `npm run verify` is green on `main`.
- [x] CI is green on `main`.
- [x] Human has read `docs/manual-testing/phase-00.md` and executed it successfully.
- [x] Human has enabled branch protection on `main` (required status checks: `ci`).
- [x] Human edits `docs/ROADMAP.md` to mark Phase 0 `✔ DONE` and Phase 1 `▶ IN PROGRESS`.

## Human Checkpoint

After all tasks are merged, the human does:
1. Fresh clone the repo in a throwaway directory.
2. `npm install && npm run verify` — must pass.
3. Read `docs/manual-testing/phase-00.md` cold. Follow it. Everything should make sense.
4. Try to push directly to `main`. Should be blocked by branch protection.
5. Mark Phase 0 done in `ROADMAP.md`.
