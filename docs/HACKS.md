# Hacks, Shortcuts, and Known-Ugly

Every time you write a hardcoded value, a mock that will need replacing, a "good enough for now" shortcut, or a workaround — log it here the moment you do it. The point of this file is to be brutally honest so nothing hides.

Format:

```
## YYYY-MM-DD — Short title
**Where:** file:line
**What:** The shortcut in one sentence.
**Why:** Why we took it now instead of doing it right.
**To fix:** What "doing it right" looks like.
**Priority:** high | medium | low
**Blocks phase:** N (or "nothing")
```

Sort newest-first. Never delete entries — when fixed, add a `**Resolved:** YYYY-MM-DD, commit <sha>` line and strike through with `~~...~~`.

---

## 2026-04-23 — console.log placeholder for structured logger
**Where:** `src/interfaces/http/waf-handler.ts:24`
**What:** `console.log(JSON.stringify({...}))` inline in the handler instead of the real structured logger.
**Why:** Task 1.4 owns the structured logger. Adding a named stub would create a file task 1.4 deletes entirely.
**To fix:** Task 1.4 — implement the logger, replace the `console.log` call with `logger.log(...)`, remove the `eslint-disable` comment.
**Priority:** low
**Blocks phase:** nothing (task 1.4 is next)

---

## 2026-04-23 — Miniflare aux Worker declared as inline JS, duplicating dummy-origin
**Where:** `vitest.config.mts` — `DUMMY_ORIGIN_SCRIPT` constant
**What:** The dummy-origin Worker logic is duplicated as a plain-JS string so Miniflare can load it as an auxiliary Worker at test time. Miniflare does not compile TypeScript; it requires pre-compiled JavaScript for `miniflare.workers[]` entries.
**Why:** The simplest way to satisfy the `miniflare.workers` requirement without adding a build step for the dummy-origin. The logic is ~30 lines and stable.
**To fix:** Add a `wrangler build` step for `workers/dummy-origin` (producing a compiled `.js` artefact), then replace `script: DUMMY_ORIGIN_SCRIPT` with `scriptPath: "./workers/dummy-origin/.wrangler/tmp/..."` or similar. Alternatively, investigate whether a vitest `globalSetup` file can pre-bundle the aux worker before Miniflare starts.
**Priority:** low
**Blocks phase:** nothing

---

## 2026-04-22 — `seed` script references non-existent Phase 3 entry point
**Where:** package.json `scripts.seed`
**What:** `tsx scripts/seed/index.ts` is wired but `scripts/seed/index.ts` does not exist yet.
**Why:** Spec (`docs/_package-json-additions.md`) says to add it in task 0.1. It is inert until invoked.
**To fix:** Phase 3, task "seed corpus pipeline" — create `scripts/seed/index.ts`.
**Priority:** low
**Blocks phase:** 3 (not 0)
