# TODO — Future Work

Things noticed but deliberately deferred. Not bugs (→ `ISSUES.md`). Not hacks in committed code (→ `HACKS.md`). Just "we should eventually".

Format:

```
- [ ] [phase-N | deferred] Short description — why it's out of scope now. (noted YYYY-MM-DD)
```

Group by phase when possible. Items marked `deferred` are out of the current roadmap entirely.

---

## Phase 2+ candidates
_(empty — add as discovered)_

## Tooling debt
- [ ] [deferred] Migrate to ESLint v9+ flat config (`eslint.config.js`). Currently on ESLint v8 with legacy `.eslintrc.cjs` because `eslint-plugin-import` compat with v9 legacy mode is unstable and v9/v10 deprecate/remove the legacy format. Acceptable tech debt; pay it after Phase 9 or whenever `eslint-plugin-import` ships a stable v9-native release. (noted 2026-04-22)
- [ ] [deferred] Update `docs/_package-json-additions.md` to reflect that `eslint@^8` is the pinned version (not `^9`) and that `claude-mem` is task 0.6's scope (not task 0.1). The spec doc currently conflicts with the phase file on both points. (noted 2026-04-22)

## Deferred (not in v1 roadmap)
- [ ] [deferred] Admin endpoint to mark verdicts as FP/FN and re-seed the index with corrections. (noted 2026-04-21)
- [ ] [deferred] Threshold auto-tuning based on FP/FN feedback. (noted 2026-04-21)
- [ ] [deferred] Per-tenant policies via Durable Objects. (noted 2026-04-21)
- [ ] [deferred] Multi-region replication strategy for D1 / KV. (noted 2026-04-21)
- [ ] [deferred] Multilingual embeddings (current `bge-large-en` is English-biased). (noted 2026-04-21)
