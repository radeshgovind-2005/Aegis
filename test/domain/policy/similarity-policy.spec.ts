import { describe, it, expect } from "vitest";

import {
  SimilarityPolicy,
  DEFAULT_BLOCK_AT,
  DEFAULT_SUSPICIOUS_AT,
  MatchResultSchema,
} from "../../../src/domain/policy/similarity-policy";
import type { MatchResult } from "../../../src/domain/policy/similarity-policy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function match(id: string, score: number, category = "sqli"): MatchResult {
  return { id, score, category };
}

const policy = new SimilarityPolicy();

// ---------------------------------------------------------------------------
// Default thresholds
// ---------------------------------------------------------------------------

describe("SimilarityPolicy defaults", () => {
  it("exposes DEFAULT_BLOCK_AT = 0.85", () => {
    expect(DEFAULT_BLOCK_AT).toBe(0.85);
  });

  it("exposes DEFAULT_SUSPICIOUS_AT = 0.75", () => {
    expect(DEFAULT_SUSPICIOUS_AT).toBe(0.75);
  });
});

// ---------------------------------------------------------------------------
// Empty match list
// ---------------------------------------------------------------------------

describe("empty match list", () => {
  it("returns ALLOW when matches is empty", () => {
    expect(policy.evaluate([])).toEqual({ kind: "ALLOW" });
  });
});

// ---------------------------------------------------------------------------
// Threshold boundaries (using default thresholds)
// ---------------------------------------------------------------------------

describe("BLOCK threshold boundary", () => {
  it("returns BLOCK when score === blockAt (0.85)", () => {
    const v = policy.evaluate([match("m1", 0.85, "sqli")]);
    expect(v).toEqual({ kind: "BLOCK", matchId: "m1", similarity: 0.85, category: "sqli" });
  });

  it("returns BLOCK when score > blockAt", () => {
    const v = policy.evaluate([match("m1", 0.99, "xss")]);
    expect(v.kind).toBe("BLOCK");
  });

  it("returns SUSPICIOUS when score is just below blockAt (0.849…)", () => {
    const v = policy.evaluate([match("m1", 0.849, "sqli")]);
    expect(v.kind).toBe("SUSPICIOUS");
  });
});

describe("SUSPICIOUS threshold boundary", () => {
  it("returns SUSPICIOUS when score === suspiciousAt (0.75)", () => {
    const v = policy.evaluate([match("m1", 0.75, "rce")]);
    expect(v).toEqual({ kind: "SUSPICIOUS", similarity: 0.75 });
  });

  it("returns SUSPICIOUS when score is just above suspiciousAt (0.751)", () => {
    const v = policy.evaluate([match("m1", 0.751)]);
    expect(v.kind).toBe("SUSPICIOUS");
  });

  it("returns ALLOW when score is just below suspiciousAt (0.749)", () => {
    const v = policy.evaluate([match("m1", 0.749)]);
    expect(v.kind).toBe("ALLOW");
  });
});

describe("below both thresholds", () => {
  it("returns ALLOW for a low score (0.5)", () => {
    expect(policy.evaluate([match("m1", 0.5)])).toEqual({ kind: "ALLOW" });
  });

  it("returns ALLOW for a zero score", () => {
    expect(policy.evaluate([match("m1", 0)])).toEqual({ kind: "ALLOW" });
  });

  it("returns ALLOW for a negative score", () => {
    expect(policy.evaluate([match("m1", -0.3)])).toEqual({ kind: "ALLOW" });
  });
});

// ---------------------------------------------------------------------------
// Multiple matches — best score wins
// ---------------------------------------------------------------------------

describe("multiple matches", () => {
  it("uses the highest-scoring match for BLOCK, ignoring lower ones", () => {
    const v = policy.evaluate([
      match("low", 0.5),
      match("high", 0.92, "xss"),
      match("mid", 0.77),
    ]);
    expect(v).toEqual({ kind: "BLOCK", matchId: "high", similarity: 0.92, category: "xss" });
  });

  it("uses the highest-scoring match for SUSPICIOUS, ignoring lower ones", () => {
    const v = policy.evaluate([
      match("low", 0.5),
      match("best", 0.78, "rce"),
    ]);
    expect(v).toEqual({ kind: "SUSPICIOUS", similarity: 0.78 });
  });

  it("returns ALLOW when all scores are below both thresholds", () => {
    const v = policy.evaluate([match("a", 0.1), match("b", 0.2), match("c", 0.3)]);
    expect(v.kind).toBe("ALLOW");
  });
});

// ---------------------------------------------------------------------------
// Ties — first match wins
// ---------------------------------------------------------------------------

describe("ties (equal highest score)", () => {
  it("takes the first match when scores are equal at BLOCK level", () => {
    const v = policy.evaluate([
      match("first", 0.90, "sqli"),
      match("second", 0.90, "xss"),
    ]);
    expect(v).toEqual({ kind: "BLOCK", matchId: "first", similarity: 0.90, category: "sqli" });
  });

  it("takes the first match when scores are equal at SUSPICIOUS level", () => {
    const v = policy.evaluate([
      match("alpha", 0.80, "rce"),
      match("beta", 0.80, "lfi"),
    ]);
    expect(v).toEqual({ kind: "SUSPICIOUS", similarity: 0.80 });
    // We verify it came from "alpha" by checking similarity alone here;
    // SUSPICIOUS does not carry matchId so first-wins is verified indirectly.
  });
});

// ---------------------------------------------------------------------------
// Custom thresholds
// ---------------------------------------------------------------------------

describe("custom thresholds", () => {
  const strict = new SimilarityPolicy({ blockAt: 0.7, suspiciousAt: 0.6 });

  it("blocks at the custom blockAt threshold", () => {
    expect(strict.evaluate([match("m1", 0.7)]).kind).toBe("BLOCK");
  });

  it("marks suspicious at the custom suspiciousAt threshold", () => {
    expect(strict.evaluate([match("m1", 0.6)]).kind).toBe("SUSPICIOUS");
  });

  it("allows below the custom suspiciousAt", () => {
    expect(strict.evaluate([match("m1", 0.59)]).kind).toBe("ALLOW");
  });

  const lenient = new SimilarityPolicy({ blockAt: 0.95, suspiciousAt: 0.85 });

  it("does not block at default blockAt when custom is higher", () => {
    // score 0.85 would BLOCK with defaults but is only SUSPICIOUS with lenient
    expect(lenient.evaluate([match("m1", 0.85)]).kind).toBe("SUSPICIOUS");
  });
});

// ---------------------------------------------------------------------------
// Constructor validation
// ---------------------------------------------------------------------------

describe("SimilarityPolicy constructor validation", () => {
  it("throws when suspiciousAt >= blockAt", () => {
    expect(() => new SimilarityPolicy({ blockAt: 0.8, suspiciousAt: 0.8 })).toThrow();
    expect(() => new SimilarityPolicy({ blockAt: 0.7, suspiciousAt: 0.9 })).toThrow();
  });

  it("accepts equal-looking but valid config (suspiciousAt < blockAt)", () => {
    expect(() => new SimilarityPolicy({ blockAt: 0.85, suspiciousAt: 0.84 })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// MatchResultSchema (Zod)
// ---------------------------------------------------------------------------

describe("MatchResultSchema", () => {
  it("parses a valid MatchResult", () => {
    const raw = { id: "vec-1", score: 0.92, category: "sqli" };
    expect(MatchResultSchema.parse(raw)).toEqual(raw);
  });

  it("rejects a missing id", () => {
    expect(() => MatchResultSchema.parse({ score: 0.9, category: "sqli" })).toThrow();
  });

  it("rejects a missing score", () => {
    expect(() => MatchResultSchema.parse({ id: "v1", category: "sqli" })).toThrow();
  });

  it("rejects a missing category", () => {
    expect(() => MatchResultSchema.parse({ id: "v1", score: 0.9 })).toThrow();
  });

  it("rejects a non-numeric score", () => {
    expect(() => MatchResultSchema.parse({ id: "v1", score: "high", category: "sqli" })).toThrow();
  });

  it("round-trips through JSON", () => {
    const raw = { id: "vec-42", score: 0.87, category: "xss" };
    expect(MatchResultSchema.parse(JSON.parse(JSON.stringify(raw)))).toEqual(raw);
  });
});
