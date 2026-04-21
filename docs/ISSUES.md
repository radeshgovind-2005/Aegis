# Issues — Bugs, Flaky Tests, Broken Assumptions

For things that are *broken* or *surprising*, not things that are *deferred* (→ `TODO.md`) or *ugly-but-working* (→ `HACKS.md`).

Format:

```
## YYYY-MM-DD — Short title — severity: critical|high|medium|low
**What happened:** Observable symptom.
**Where:** file / phase / command.
**Hypothesis:** What might be wrong.
**Impact:** What it blocks.
**Status:** open | investigating | mitigated | resolved
**Links:** Test output, logs, commit.
```

Append newest-first. When resolved, add a `**Resolved:** YYYY-MM-DD, commit <sha>, root cause: ...` trailer and keep the entry.

---

_(empty)_
