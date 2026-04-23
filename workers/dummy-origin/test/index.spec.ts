import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("dummy-origin Worker", () => {
	describe("GET /health", () => {
		it("returns 200 with {status: ok}", async () => {
			const res = await SELF.fetch("https://example.com/health");
			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toContain("application/json");
			expect(await res.json()).toEqual({ status: "ok" });
		});
	});

	describe("GET /echo", () => {
		it("echoes the q query parameter", async () => {
			const res = await SELF.fetch("https://example.com/echo?q=hello");
			expect(res.status).toBe(200);
			expect(await res.json()).toEqual({ echo: "hello" });
		});

		it("returns 400 when q is absent", async () => {
			const res = await SELF.fetch("https://example.com/echo");
			expect(res.status).toBe(400);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body).toHaveProperty("error");
		});
	});

	describe("POST /search", () => {
		it("returns 200 with results array and echoed query", async () => {
			const res = await SELF.fetch("https://example.com/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: "sql injection" }),
			});
			expect(res.status).toBe(200);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body.query).toBe("sql injection");
			expect(Array.isArray(body.results)).toBe(true);
		});

		it("returns 400 when body is not valid JSON", async () => {
			const res = await SELF.fetch("https://example.com/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not-json{",
			});
			expect(res.status).toBe(400);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body).toHaveProperty("error");
		});
	});

	describe("unknown routes", () => {
		it("returns 404 for unrecognized paths", async () => {
			const res = await SELF.fetch("https://example.com/does-not-exist");
			expect(res.status).toBe(404);
		});
	});
});
