export default {
	async fetch(_request: Request): Promise<Response> {
		return json({ error: "Not Found" }, 404);
	},
} satisfies ExportedHandler;

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
