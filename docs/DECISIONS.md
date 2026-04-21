# Decisions Log

Append-only. Never edit or delete past entries — correct them with a new entry that references the old one.

Format per entry:

```
## YYYY-MM-DD — Short title
**Context:** One paragraph.
**Options:** Bulleted.
**Decision:** What we chose.
**Rationale:** Why.
**Consequences:** Tradeoffs.
**Links:** Commit / PR / phase file.
```

---

## 2026-04-21 — Repository scaffold and guardrails

**Context:** Project start. Need a structure that lets a fresh Claude Code session pick up deterministically and enforces TDD + hexagonal boundaries + human-in-the-loop reviews.

**Options:**
- Loose structure, rely on prompting per session. *Rejected — drift within one session, catastrophic across sessions.*
- Heavyweight full-DDD project with aggregates, domain events, repositories. *Rejected — scope mismatch; domain is small.*
- Lightweight hexagonal: pure domain, ports, adapters, thin interfaces layer. **Chosen.**

**Decision:** Hexagonal with pure domain and four ports (embedding, vector-index, audit-log, cache). ESLint enforces the domain → no-Cloudflare-imports boundary. Phased roadmap with explicit human checkpoints. Append-only docs as cross-session memory.

**Rationale:** Small domain + infrastructure swap-ability + interview credibility. The port boundary is what lets us demonstrate the classification logic is pure, which is the whole point of the pitch.

**Consequences:** Slight overhead for Phase 2 — a few extra files for what could be inlined. Worth it because the pitch story ("the domain doesn't know what runs it") is concrete, not hand-waved.

**Links:** CLAUDE.md, docs/ROADMAP.md, docs/adr/0001-hexagonal-architecture.md
