import { describe, it, expect } from "vitest";

import { AuditEntrySchema } from "../../src/ports/audit-log-port";

// ---------------------------------------------------------------------------
// AuditEntrySchema (Zod)
// ---------------------------------------------------------------------------

describe("AuditEntrySchema", () => {
  const allowEntry = {
    reqId: "550e8400-e29b-41d4-a716-446655440000",
    ts: "2026-05-01T12:00:00.000Z",
    verdict: { kind: "ALLOW" },
    latencyMs: 8,
  };

  const blockEntry = {
    reqId: "550e8400-e29b-41d4-a716-446655440001",
    ts: "2026-05-01T12:00:01.000Z",
    verdict: { kind: "BLOCK", matchId: "vec-99", similarity: 0.93, category: "sqli" },
    latencyMs: 42,
  };

  const suspiciousEntry = {
    reqId: "550e8400-e29b-41d4-a716-446655440002",
    ts: "2026-05-01T12:00:02.000Z",
    verdict: { kind: "SUSPICIOUS", similarity: 0.78 },
    latencyMs: 15,
  };

  it("parses an ALLOW audit entry", () => {
    expect(AuditEntrySchema.parse(allowEntry)).toEqual(allowEntry);
  });

  it("parses a BLOCK audit entry", () => {
    expect(AuditEntrySchema.parse(blockEntry)).toEqual(blockEntry);
  });

  it("parses a SUSPICIOUS audit entry", () => {
    expect(AuditEntrySchema.parse(suspiciousEntry)).toEqual(suspiciousEntry);
  });

  it("rejects a missing reqId", () => {
    const { reqId: _, ...noReqId } = allowEntry;
    expect(() => AuditEntrySchema.parse(noReqId)).toThrow();
  });

  it("rejects a missing ts", () => {
    const { ts: _, ...noTs } = allowEntry;
    expect(() => AuditEntrySchema.parse(noTs)).toThrow();
  });

  it("rejects a missing verdict", () => {
    const { verdict: _, ...noVerdict } = allowEntry;
    expect(() => AuditEntrySchema.parse(noVerdict)).toThrow();
  });

  it("rejects an unknown verdict kind", () => {
    expect(() =>
      AuditEntrySchema.parse({ ...allowEntry, verdict: { kind: "SKIP" } }),
    ).toThrow();
  });

  it("rejects a negative latencyMs", () => {
    expect(() => AuditEntrySchema.parse({ ...allowEntry, latencyMs: -1 })).toThrow();
  });

  it("round-trips an ALLOW entry through JSON", () => {
    expect(AuditEntrySchema.parse(JSON.parse(JSON.stringify(allowEntry)))).toEqual(allowEntry);
  });

  it("round-trips a BLOCK entry through JSON", () => {
    expect(AuditEntrySchema.parse(JSON.parse(JSON.stringify(blockEntry)))).toEqual(blockEntry);
  });

  it("round-trips a SUSPICIOUS entry through JSON", () => {
    expect(AuditEntrySchema.parse(JSON.parse(JSON.stringify(suspiciousEntry)))).toEqual(
      suspiciousEntry,
    );
  });
});
