export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const { method } = request;
		const { pathname } = url;

		if (method === "GET" && pathname === "/health") {
			return json({ status: "ok" });
		}

		if (method === "GET" && pathname === "/echo") {
			const q = url.searchParams.get("q");
			if (q === null) {
				return json({ error: "Missing required query parameter: q" }, 400);
			}
			return json({ echo: q });
		}

		if (method === "POST" && pathname === "/search") {
			let query: string;
			try {
				const body = (await request.json()) as { query?: unknown };
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
} satisfies ExportedHandler;

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
