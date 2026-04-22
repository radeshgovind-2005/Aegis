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

## 2026-04-22 — `seed` script references non-existent Phase 3 entry point
**Where:** package.json `scripts.seed`
**What:** `tsx scripts/seed/index.ts` is wired but `scripts/seed/index.ts` does not exist yet.
**Why:** Spec (`docs/_package-json-additions.md`) says to add it in task 0.1. It is inert until invoked.
**To fix:** Phase 3, task "seed corpus pipeline" — create `scripts/seed/index.ts`.
**Priority:** low
**Blocks phase:** 3 (not 0)
