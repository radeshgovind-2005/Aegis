# Applying This Scaffold to Your Existing Repo

You already ran `wrangler init` and have a working TypeScript Worker project. This scaffold adds everything *around* that starter — docs, guardrails, CI, the operating rules for Claude Code. It does **not** replace your existing `src/index.ts`, `test/index.spec.ts`, `tsconfig.json`, `vitest.config.mts`, `wrangler.jsonc`, or `worker-configuration.d.ts`.

## Step 1 — Copy the scaffold over

Copy every file and folder from this bundle into your repo root. Safe to merge on top of your existing project — nothing here collides with `wrangler init` output.

After copy, your tree should include:

```
aegis/
├── CLAUDE.md                 ← NEW, the thing Claude Code reads first
├── README.md                 ← NEW (replaces the wrangler-generated one)
├── SETUP.md                  ← NEW, this file
├── .editorconfig             ← NEW
├── .eslintrc.cjs             ← NEW
├── .prettierrc               ← NEW
├── .gitignore                ← NEW (extends what was there)
├── .dev.vars.example         ← NEW
├── .github/
│   ├── CODEOWNERS            ← edit: replace @your-github-username
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-prod.yml
├── docs/                     ← entire folder NEW
├── scripts/
│   └── check-coverage.mjs    ← NEW
├── src/index.ts              ← kept as-is (wrangler init output)
├── test/index.spec.ts        ← kept as-is
├── package.json              ← will edit in step 2
├── package-lock.json         ← will change in step 2
├── tsconfig.json             ← kept as-is
├── vitest.config.mts         ← kept as-is
├── wrangler.jsonc            ← kept as-is for now; Phase 3+ will edit
└── worker-configuration.d.ts ← kept as-is
```

## Step 2 — Patch package.json and install new dev deps

Open `package.json`. Merge the scripts from `docs/_package-json-additions.md` into your existing `scripts` block. Then run:

```bash
npm install --save-dev \
  eslint@^9 \
  @typescript-eslint/parser@^8 \
  @typescript-eslint/eslint-plugin@^8 \
  eslint-config-prettier@^9 \
  eslint-plugin-import@^2 \
  eslint-import-resolver-typescript@^3 \
  prettier@^3 \
  tsx@^4 \
  claude-mem
```

Then verify:
```bash
npm run verify
```

It might fail on lint (the pre-existing `src/index.ts` and `test/index.spec.ts` weren't written against these rules). Run `npm run lint:fix` and `npm run format` to auto-fix what can be fixed. Anything remaining is real — fix by hand or log in `docs/ISSUES.md`.

## Step 3 — Edit `CODEOWNERS`

Open `.github/CODEOWNERS` and replace `@your-github-username` with your actual GitHub handle. Commit.

## Step 4 — Push to GitHub and enable branch protection

```bash
git add .
git commit -m "chore(repo): add Claude Code operating system (CLAUDE.md, docs, CI, guardrails)

Introduces the deterministic scaffold described in docs/ROADMAP.md.
Phase 0 begins after this commit lands on main.

Phase: 00 | Task: bootstrap"
git push origin main
```

Then in GitHub UI:
1. Settings → Branches → Add rule for `main`.
2. Check: "Require a pull request before merging".
3. Check: "Require status checks to pass before merging" and add `ci` (it'll appear after your first PR).
4. Check: "Do not allow bypassing the above settings".

## Step 5 — Configure GitHub Actions secrets (later)

You can skip this until Phase 8, but to set up early:

1. Settings → Secrets and variables → Actions → New repository secret.
2. Add `CLOUDFLARE_API_TOKEN` (create at https://dash.cloudflare.com/profile/api-tokens with scopes: Workers AI Read, Vectorize Edit, D1 Edit, KV Edit, Queues Edit, Workers Scripts Edit).
3. Add `CLOUDFLARE_ACCOUNT_ID` (from the Cloudflare dashboard sidebar).

## Step 6 — Hand it to Claude Code

```bash
cd aegis
claude
```

First thing Claude Code should do on its own, per `CLAUDE.md` § 12:

1. Read `CLAUDE.md` in full.
2. Read `docs/ROADMAP.md` — find that Phase 0 is `▶ IN PROGRESS`.
3. Read `docs/phases/phase-00-scaffold.md`.
4. Find the first unchecked task (`0.1 — Package scripts & tooling`).
5. Realise that step 2 above partially did this already — it can either tick 0.1 as done (and log in `DECISIONS.md` that a human performed it) or finish any loose ends.
6. Open a branch for task 0.2, write failing ESLint-boundary tests, then make them pass.

That's the loop. Every phase, every task, same rhythm.

## What could go wrong at this stage

- **ESLint config choke on the `project` reference.** If `tsconfig.json` has `"include"` that doesn't cover the files being linted, ESLint will complain. Add `eslint.config.mjs` includes or extend `tsconfig.json`'s `include` to cover `scripts/`, `test/`, and root config files. Log as ISSUE if it bites.
- **`wrangler deploy --dry-run` in CI wants an account ID.** The workflow passes a placeholder; if wrangler starts rejecting placeholders in future versions, remove the `wrangler-validate` job and rely on the main verify step. This is logged as future-work in `docs/TODO.md` if it breaks.
- **claude-mem version pin.** This is a young project — the CLI may have breaking changes. If `npx claude-mem --help` fails after install, log in ISSUES and pin a known-good version.
