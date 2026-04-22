# Phase 0 — Manual Test Recipes

**What this phase proves:** The repo is operable. Tooling works. CI catches mistakes. The docs system is navigable by a stranger.

**Prerequisites:** Node 20+, npm 10+, a fresh clone of the repo.

---

## 0.1 — Tooling baseline

**Setup:**
```bash
git clone <your-repo-url> aegis-fresh
cd aegis-fresh
npm install
```

**Command:**
```bash
npm run verify
```

**Expected output:** exits 0. You should see ESLint, TypeScript, and vitest all pass. If any step fails, that's a bug — log it in `docs/ISSUES.md`.

**What this proves:** Lint + typecheck + test are wired correctly and the repo is in a runnable state.

---

## 0.2 — Hexagonal boundary is enforced by tooling

### 0.2a — Automated guard (runs in CI via `npm run verify`)

**Command:**
```bash
npm run test:boundary
```

**Expected output:**
```
PASS: hexagonal boundary rule flagged 1 violation(s) correctly.
```
Exit code 0.

**What this proves:** The `no-restricted-imports` rule in `.eslintrc.cjs` is correctly wired. If this fails, the boundary rule has been removed or misconfigured.

---

### 0.2b — Manual lint rejection of a forbidden domain import

**Setup:** be on a scratch branch.

**Command:** Create a throwaway file at `src/domain/bad.ts` containing:
```ts
import type { Env } from 'cloudflare:workers';
export type _T = Env;
```
Then run:
```bash
npm run lint
```

**Expected output:** ESLint errors with `no-restricted-imports` citing the domain → Cloudflare boundary. Exit code non-zero.

**What this proves:** The hexagonal boundary is enforced by tooling, not just convention.

**Cleanup:** delete `src/domain/bad.ts` and return to `main`.

---

## 0.3 — CI catches a broken PR

**Setup:** you have GitHub Actions enabled on your fork/repo.

**Command:**
1. Create a branch `test/ci-broken`.
2. Introduce a deliberate lint error (e.g. `const x = ;` in any `.ts` file under `src/`).
3. Commit and push, open a PR against `main`.

**Expected output:** GitHub Actions `ci` workflow runs and fails on the lint step within ~2 minutes. The PR is blocked from merging if branch protection is enabled.

**What this proves:** CI is actually wired to PRs and will catch regressions.

**Cleanup:** close the PR, delete the branch.

---

## 0.4 — Branch protection blocks direct push to `main`

**Setup:** you have configured `main` branch protection in GitHub Settings → Branches → Add rule:
- Require a pull request before merging
- Require status checks: `ci`
- Do not allow bypassing the above settings (even for admins, for this project)

**Command:**
```bash
git checkout main
echo "oops" >> README.md
git add README.md && git commit -m "direct push test"
git push origin main
```

**Expected output:** push is rejected by GitHub with a message about branch protection.

**What this proves:** neither you nor Claude Code can accidentally push unreviewed code to `main`. This is the safety net behind the "human merges everything" rule.

**Cleanup:**
```bash
git reset --hard HEAD~1
```

---

## 0.5 — Fresh-session orientation drill

**Setup:** imagine you're a brand new developer (or a fresh Claude Code session).

**Command:** from the repo root, in order:
```bash
cat CLAUDE.md | less
cat docs/ROADMAP.md
ls docs/phases/
cat docs/phases/phase-00-scaffold.md
git log --oneline -10
git status
```

**Expected output:** after reading these, you should be able to answer:
- What is this project trying to build?
- What phase are we in right now?
- What's the next unchecked task?
- What rules must I follow?
- What decisions have already been made?

**What this proves:** the documentation system fulfils its core promise — a stranger (or amnesic agent) can orient in under 5 minutes and know what to do next.

---

## 0.6 — claude-mem is installed and reachable

**Command:**
```bash
npx claude-mem --help
```

**Expected output:** help text from claude-mem, not `command not found`.

**What this proves:** the memory-compression tool is available when Claude Code needs it.
