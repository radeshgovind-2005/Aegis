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

_(No entries yet. Claude Code: if you take any shortcut in Phase 0, log it here before opening the PR.)_
