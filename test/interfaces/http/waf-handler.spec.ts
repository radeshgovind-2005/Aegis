import {
  SELF,
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import worker from "../../../src/index";

// ---------------------------------------------------------------------------
// Integration tests — SELF.fetch hits the full Aegis Worker, which forwards
// every request to env.ORIGIN (the dummy-origin aux Worker in Miniflare).
// ---------------------------------------------------------------------------

describe("waf-handler", () => {
  describe("integration: request forwarding via SELF.fetch", () => {
    it("forwards GET /echo?q=hello and returns origin response", async () => {
      const res = await SELF.fetch("http://example.com/echo?q=hello");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ echo: "hello" });
    });

    it("forwards POST /search with JSON body and returns origin response", async () => {
      const res = await SELF.fetch("http://example.com/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: "test-query" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ query: "test-query", results: [] });
    });

    it("forwards GET /health and returns origin response", async () => {
      const res = await SELF.fetch("http://example.com/health");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: "ok" });
    });

    it("forwards unknown paths and returns origin 404 unchanged", async () => {
      const res = await SELF.fetch("http://example.com/not-a-real-path");
      expect(res.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // Unit test — direct handler invocation so vi.spyOn can intercept console.log
  // in the same workerd isolate. SELF.fetch runs in a separate network context
  // and its console output cannot be intercepted by a test-side spy.
  // -------------------------------------------------------------------------

  describe("unit: structured log output", () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, "log");
    });

    afterEach(() => {
      logSpy.mockRestore();
    });

    it("emits one JSON log line per request with required fields", async () => {
      const request = new Request("http://example.com/health");
      const ctx = createExecutionContext();
      await worker.fetch(request, env as Env, ctx);
      await waitOnExecutionContext(ctx);

      expect(logSpy).toHaveBeenCalledTimes(1);

      const raw = logSpy.mock.calls[0][0] as string;
      const logged: unknown = JSON.parse(raw);

      expect(logged).toMatchObject({
        ts: expect.any(String),
        reqId: expect.any(String),
        method: "GET",
        path: "/health",
        verdict: "ALLOW",
        latencyMs: expect.any(Number),
      });

      const log = logged as Record<string, unknown>;
      expect(log["reqId"]).not.toBe("");
      expect(log["latencyMs"]).toBeGreaterThanOrEqual(0);
    });
  });
});
