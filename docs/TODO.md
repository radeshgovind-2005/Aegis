# TODO — Future Work

Things noticed but deliberately deferred. Not bugs (→ `ISSUES.md`). Not hacks in committed code (→ `HACKS.md`). Just "we should eventually".

Format:

```
- [ ] [phase-N | deferred] Short description — why it's out of scope now. (noted YYYY-MM-DD)
```

Group by phase when possible. Items marked `deferred` are out of the current roadmap entirely.

---

## Phase 1 candidates
- [ ] [phase-2] Revisit `query: Record<string,string>` in `ExtractedPayload` — last-write-wins for duplicate keys matches the phase spec but loses data. If Phase 2's `Payload` VO needs multi-value params, reshape to `Record<string,string[]>`. (noted 2026-04-23)
- [ ] [phase-4] Revisit missing `Content-Type` handling in `extractPayload` — currently treated as binary → `body: null`. When real attack data is available, check whether attacker tools deliberately omit the header as an evasion tactic; may need a fallback heuristic. (noted 2026-04-23)
- [x] [phase-1/task-1.3] Root `vitest.config.mts` will need a `miniflare.workers` entry declaring the dummy origin as an auxiliary Worker so the Aegis integration tests can use it as a service binding target (`env.ORIGIN`). ✓ Done — inline JS script in `DUMMY_ORIGIN_SCRIPT` constant; see `docs/HACKS.md` for the trade-off. (resolved 2026-04-23)
- [x] [phase-1/task-1.3] Add a `dev:dummy-origin` (or `dev:all`) convenience script to run both Workers simultaneously during local development. ✓ Deferred to task 1.5 (manual-test recipe task). No new dep needed; two separate wrangler invocations documented in the recipe. (resolved 2026-04-23)
- [ ] [phase-1/task-1.5] Add `dev:dummy-origin` and `dev:all` scripts to `package.json` so both Workers can be started with one command. Requires `concurrently` devDep or equivalent. Add alongside the manual-test recipe in task 1.5. (noted 2026-04-23)

## Phase 2+ candidates
- [ ] [phase-2] Task 2.0 — re-install `@vitest/coverage-v8` and add `vitest.unit.config.mts` so coverage works on domain tests. Blocked until Phase 2 begins. (noted 2026-04-22)
- [ ] [phase-2] After task 2.0 adds the Node vitest pool, consider converting `test/domain/boundary.guard.ts` from a tsx script to a proper vitest test. Not required — the current script runs in CI via `test:boundary` — but a vitest test would get coverage tracking and runner integration. (noted 2026-04-22)

## Tooling debt
- [ ] [phase-0 | docs-only] Update spec text in `docs/phases/phase-00-scaffold.md` task 0.3 to reflect that `deploy-staging.yml` is a full credential-gated deploy workflow, not the placeholder echo the spec described. Low priority; no functional impact. (noted 2026-04-22)
- [ ] [phase-0 | docs-only] Remove or create `docs/_templates/` — task 0.5 spec text references it ("see `docs/_templates/`") but the directory was never created. File headers already serve the role; either create stub template files or remove the reference from `docs/phases/phase-00-scaffold.md`. No functional impact. (noted 2026-04-22)
- [ ] [deferred] Migrate to ESLint v9+ flat config (`eslint.config.js`). Currently on ESLint v8 with legacy `.eslintrc.cjs` because `eslint-plugin-import` compat with v9 legacy mode is unstable and v9/v10 deprecate/remove the legacy format. Acceptable tech debt; pay it after Phase 9 or whenever `eslint-plugin-import` ships a stable v9-native release. (noted 2026-04-22)
- [ ] [deferred] Update `docs/_package-json-additions.md` to reflect that `eslint@^8` is the pinned version (not `^9`). The claude-mem conflict in that doc is now moot — task 0.6 reclassified claude-mem as an optional operator tool, not a repo dependency. (noted 2026-04-22)
- [ ] [phase-0 | docs-only] Update spec text in `docs/phases/phase-00-scaffold.md` task 0.6 to reflect the B-decision: claude-mem is an optional operator tool, not a repo devDependency, and there is no `.claude-mem.json` config. Low priority; no functional impact. (noted 2026-04-22)

## Deferred (not in v1 roadmap)
- [ ] [deferred] Admin endpoint to mark verdicts as FP/FN and re-seed the index with corrections. (noted 2026-04-21)
- [ ] [deferred] Threshold auto-tuning based on FP/FN feedback. (noted 2026-04-21)
- [ ] [deferred] Per-tenant policies via Durable Objects. (noted 2026-04-21)
- [ ] [deferred] Multi-region replication strategy for D1 / KV. (noted 2026-04-21)
- [ ] [deferred] Multilingual embeddings (current `bge-large-en` is English-biased). (noted 2026-04-21)
