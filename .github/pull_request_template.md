<!--
  Every PR must fill this in. Do not delete sections — mark N/A.
  Claude Code: if any checkbox below is unchecked, you have work left to do.
  Do not mark ready for review until every required box is ✔.
-->

## What

One-line summary. Links to the phase + task:
- Phase: NN
- Task: `phase-NN/task-slug`
- Phase file: `docs/phases/phase-NN-*.md#task-N`

## Why

Why this change, not another. Reference any relevant `DECISIONS.md` entry.

## How

One paragraph of design, or a bullet list if multiple moving parts. No code diffs — those are in the files.

## Test plan

- **Automated:** which test files were added/changed. Before/after of `npm run verify`.
- **Manual:** the recipe added to `docs/manual-testing/phase-NN.md` (paste the diff or link).

## Checklist — required before ready-for-review

- [ ] TDD order respected: failing tests existed in the first commit, code in later commits.
- [ ] `npm run verify` passes locally.
- [ ] No imports from `cloudflare:*` or `@cloudflare/*` in `src/domain/`, `src/application/`, or `src/ports/`.
- [ ] Any shortcut taken is logged in `docs/HACKS.md` with file:line.
- [ ] Any new design decision is logged in `docs/DECISIONS.md`.
- [ ] Manual-test recipe added / updated in `docs/manual-testing/phase-NN.md`.
- [ ] Commit messages follow Conventional Commits (`feat(scope): ...`).
- [ ] No secrets, API tokens, or account IDs in the diff.
- [ ] Coverage thresholds met (domain ≥ 95%, adapters ≥ 80%).
- [ ] If roadmap deviated from, proposal exists in `docs/ROADMAP_CHANGES.md` and is `APPROVED`.

## Checklist — for the human reviewer

- [ ] Tests would catch a regression of the behaviour being added.
- [ ] No hidden state, no "magic" constants without explanation.
- [ ] Docs updated to match behaviour.
- [ ] I, the human, will click merge. Claude will not.

## Screenshots / logs (if applicable)

<!-- e.g. curl output, wrangler dev logs, benchmark numbers -->

---

Phase: NN | Task: task-slug
