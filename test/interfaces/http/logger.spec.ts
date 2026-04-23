import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { logRequest } from "../../../src/interfaces/http/logger";

describe("logRequest", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log");
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("calls console.log exactly once per invocation", () => {
    logRequest({ reqId: "r1", method: "GET", path: "/health", verdict: "ALLOW", latencyMs: 5 });
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("emits valid JSON", () => {
    logRequest({ reqId: "r1", method: "GET", path: "/health", verdict: "ALLOW", latencyMs: 5 });
    const raw = logSpy.mock.calls[0][0] as string;
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("includes all six required fields", () => {
    logRequest({ reqId: "r1", method: "GET", path: "/health", verdict: "ALLOW", latencyMs: 5 });
    const log = JSON.parse(logSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(Object.keys(log).sort()).toEqual(["latencyMs", "method", "path", "reqId", "ts", "verdict"]);
  });

  it("reflects the caller-supplied fields verbatim", () => {
    logRequest({ reqId: "abc-123", method: "POST", path: "/search", verdict: "BLOCK", latencyMs: 42 });
    const log = JSON.parse(logSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(log["reqId"]).toBe("abc-123");
    expect(log["method"]).toBe("POST");
    expect(log["path"]).toBe("/search");
    expect(log["verdict"]).toBe("BLOCK");
    expect(log["latencyMs"]).toBe(42);
  });

  it("ts is an ISO 8601 string generated at call time", () => {
    const before = Date.now();
    logRequest({ reqId: "r1", method: "GET", path: "/", verdict: "ALLOW", latencyMs: 0 });
    const after = Date.now();

    const log = JSON.parse(logSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    const ts = log["ts"] as string;

    // Must be parseable and within the call window
    expect(() => new Date(ts)).not.toThrow();
    const tsMs = new Date(ts).getTime();
    expect(tsMs).toBeGreaterThanOrEqual(before);
    expect(tsMs).toBeLessThanOrEqual(after);
  });

  it("latencyMs is a non-negative number", () => {
    logRequest({ reqId: "r1", method: "GET", path: "/", verdict: "ALLOW", latencyMs: 0 });
    const log = JSON.parse(logSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(typeof log["latencyMs"]).toBe("number");
    expect(log["latencyMs"]).toBeGreaterThanOrEqual(0);
  });
});
