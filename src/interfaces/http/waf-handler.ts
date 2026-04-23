import { extractPayload } from "../../domain/payload/payload-extractor";
import { logRequest } from "./logger";

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // Clone before anything else touches the request — request.clone() throws
    // if the body has already been consumed. Extracting from the clone keeps
    // the original body stream intact for forwarding to the origin.
    const clone = request.clone();

    const reqId = crypto.randomUUID();
    const t0 = Date.now();

    const extracted = await extractPayload(
      clone.method,
      new URL(clone.url),
      clone.headers,
      clone.body,
    );

    const response = await env.ORIGIN.fetch(request);

    logRequest({
      reqId,
      method: extracted.method,
      path: extracted.path,
      verdict: "ALLOW",
      latencyMs: Date.now() - t0,
    });

    return response;
  },
} satisfies ExportedHandler<Env>;
