import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// Mirrors the three routes of workers/dummy-origin/src/index.ts as inline JS.
// Miniflare requires pre-compiled JavaScript for miniflare.workers entries —
// it cannot compile TypeScript directly. The TS source remains the canonical
// implementation; this script is test infrastructure only.
// See docs/HACKS.md for the trade-off note.
const DUMMY_ORIGIN_SCRIPT = /* js */ `
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { method } = request;
    const { pathname } = url;

    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "GET" && pathname === "/health") {
      return json({ status: "ok" });
    }
    if (method === "GET" && pathname === "/echo") {
      const q = url.searchParams.get("q");
      if (q === null) return json({ error: "Missing required query parameter: q" }, 400);
      return json({ echo: q });
    }
    if (method === "POST" && pathname === "/search") {
      let query;
      try {
        const body = await request.json();
        if (typeof body.query !== "string") {
          return json({ error: "Body must contain a string 'query' field" }, 400);
        }
        query = body.query;
      } catch {
        return json({ error: "Request body must be valid JSON" }, 400);
      }
      return json({ query, results: [] });
    }
    return json({ error: "Not Found" }, 404);
  },
}
`;

export default defineWorkersConfig({
	test: {
		exclude: ["workers/**", "node_modules/**"],
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				miniflare: {
					// Declare dummy-origin as an auxiliary Worker so Miniflare can
					// resolve the env.ORIGIN service binding at test time.
					// Name must match wrangler.jsonc "service": "dummy-origin" and
					// workers/dummy-origin/wrangler.jsonc "name": "dummy-origin".
					workers: [
						{
							name: "dummy-origin",
							modules: true,
							script: DUMMY_ORIGIN_SCRIPT,
						},
					],
				},
			},
		},
	},
});
