# Phase 8 — Deploy Pipeline & Staging

**Status:** ⏸ HUMAN-BLOCKED
**Blocker:** GitHub Actions secrets + Cloudflare setup.

## Entry Criteria
- Phase 7 `✔ DONE`.
- Human has added to GitHub repo Settings → Secrets and variables → Actions:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Staging Vectorize index `aegis-payloads-staging` exists (and has been seeded).

## Task List

- [ ] **8.1 — `wrangler.jsonc` environments**
  - Add `[env.staging]` and `[env.production]` sections with distinct binding names / index names / KV namespaces.
  - Tests: `wrangler deploy --env staging --dry-run` passes locally.

- [ ] **8.2 — `deploy-staging.yml`**
  - Triggered on push to `main` (after PR merge).
  - Steps: checkout → setup-node → `npm ci` → `npm run verify` → `wrangler deploy --env staging`.
  - Uses `CLOUDFLARE_API_TOKEN` secret.

- [ ] **8.3 — `deploy-prod.yml`**
  - Triggered manually (`workflow_dispatch`).
  - Requires a GitHub Environment `production` with required reviewers (human).
  - Same steps, `--env production`.

- [ ] **8.4 — Release tagging**
  - A small script or GH Action that tags each prod deploy with `prod-YYYY-MM-DD-<sha>` and writes a row to a `docs/releases.md` file.

- [ ] **8.5 — Rollback recipe**
  - `docs/runbooks/rollback.md`: how to revert a bad prod deploy (`wrangler rollback` or re-deploy previous commit).

## Exit Criteria
- [ ] Merging a trivial PR deploys to staging automatically.
- [ ] Staging URL is reachable and returns 200 on `/_aegis/health`.
- [ ] Manual prod deploy works end-to-end.
- [ ] Rollback runbook has been walked through at least once (even if just in staging).

## Human Checkpoint
Human merges a trivial PR, watches deploy, hits the staging URL. Then triggers a prod deploy manually.
