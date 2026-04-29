import { describe, it, expect } from "vitest";

import { Verdict } from "../../../src/domain/verdict/verdict";

// ---------------------------------------------------------------------------
// Factory shapes
// ---------------------------------------------------------------------------

describe("Verdict.allow()", () => {
  it("produces kind: ALLOW", () => {
    expect(Verdict.allow()).toEqual({ kind: "ALLOW" });
  });

  it("has no extra fields beyond kind", () => {
    const v = Verdict.allow();
    expect(Object.keys(v)).toEqual(["kind"]);
  });
});

describe("Verdict.block()", () => {
  it("produces kind: BLOCK with all required fields", () => {
    const v = Verdict.block("match-1", 0.92, "sqli");
    expect(v).toEqual({
      kind: "BLOCK",
      matchId: "match-1",
      similarity: 0.92,
      category: "sqli",
    });
  });

  it("preserves the exact matchId, similarity, and category supplied", () => {
    const v = Verdict.block("vec-abc", 0.999, "xss");
    expect(v.matchId).toBe("vec-abc");
    expect(v.similarity).toBe(0.999);
    expect(v.category).toBe("xss");
  });

  it("has exactly four fields: kind, matchId, similarity, category", () => {
    const v = Verdict.block("id", 0.9, "rce");
    expect(Object.keys(v).sort()).toEqual(
      ["category", "kind", "matchId", "similarity"],
    );
  });
});

describe("Verdict.suspicious()", () => {
  it("produces kind: SUSPICIOUS with similarity", () => {
    const v = Verdict.suspicious(0.78);
    expect(v).toEqual({ kind: "SUSPICIOUS", similarity: 0.78 });
  });

  it("has exactly two fields: kind and similarity", () => {
    const v = Verdict.suspicious(0.76);
    expect(Object.keys(v).sort()).toEqual(["kind", "similarity"]);
  });

  it("does not have matchId or category", () => {
    const v = Verdict.suspicious(0.8);
    expect(v).not.toHaveProperty("matchId");
    expect(v).not.toHaveProperty("category");
  });
});

// ---------------------------------------------------------------------------
// Serialization round-trips
// ---------------------------------------------------------------------------

describe("Verdict serialization round-trips", () => {
  it("ALLOW round-trips through JSON", () => {
    const original = Verdict.allow();
    expect(JSON.parse(JSON.stringify(original))).toEqual(original);
  });

  it("BLOCK round-trips through JSON", () => {
    const original = Verdict.block("id-xyz", 0.95, "path-traversal");
    expect(JSON.parse(JSON.stringify(original))).toEqual(original);
  });

  it("SUSPICIOUS round-trips through JSON", () => {
    const original = Verdict.suspicious(0.77);
    expect(JSON.parse(JSON.stringify(original))).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// Discriminated union narrowing
// ---------------------------------------------------------------------------

describe("Verdict discriminated union narrowing", () => {
  it("switch on kind correctly narrows each branch", () => {
    const results: string[] = [];

    for (const v of [
      Verdict.allow(),
      Verdict.block("id", 0.9, "sqli"),
      Verdict.suspicious(0.77),
    ]) {
      switch (v.kind) {
        case "ALLOW":
          results.push("allow");
          break;
        case "BLOCK":
          // TypeScript knows v has matchId, similarity, category here
          results.push(`block:${v.matchId}:${v.similarity}:${v.category}`);
          break;
        case "SUSPICIOUS":
          // TypeScript knows v has similarity here
          results.push(`suspicious:${v.similarity}`);
          break;
      }
    }

    expect(results).toEqual([
      "allow",
      "block:id:0.9:sqli",
      "suspicious:0.77",
    ]);
  });
});
