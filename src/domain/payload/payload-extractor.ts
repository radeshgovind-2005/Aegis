/**
 * Maximum number of bytes read from a request body before truncation.
 * Bodies exceeding this limit are sliced to MAX_BODY_BYTES and the caller
 * receives bodyCapped: true. Matches the "up to 8 KB" limit documented in
 * the Aegis architecture overview (README.md) — the number is chosen because
 * larger bodies dominate embedding latency on the hot path.
 */
export const MAX_BODY_BYTES = 8 * 1024;

/**
 * The structured payload extracted from raw HTTP request parts.
 *
 * body is the raw request body string — NOT parsed (JSON is not parsed,
 * form-encoded values are not decoded). Parsing is Phase 2's responsibility
 * when it creates the Payload value object.
 *
 * bodyCapped is true when the original body exceeded MAX_BODY_BYTES and was
 * silently truncated. The Phase 4 classifier must treat capped payloads with
 * reduced confidence.
 */
export interface ExtractedPayload {
  method: string;
  path: string;
  /** Duplicate keys use last-write-wins. URLSearchParams handles decoding. */
  query: Record<string, string>;
  body: string | null;
  bodyCapped: boolean;
}

/**
 * Content types whose bodies are treated as inspectable text.
 * All other types — including a missing or unrecognised Content-Type — are
 * treated as binary and yield body: null. The list is intentionally narrow:
 * exactly the types this WAF is designed to inspect. Do not expand without a
 * DECISIONS.md entry.
 */
const TEXT_CONTENT_TYPES = new Set([
  "application/json",
  "application/x-www-form-urlencoded",
]);

function isTextContentType(contentType: string): boolean {
  if (contentType.startsWith("text/")) return true;
  return TEXT_CONTENT_TYPES.has(contentType);
}

/**
 * Extracts a structured payload from raw HTTP request parts.
 *
 * Accepts plain Web Platform types (URL, Headers, ReadableStream) rather than
 * a Cloudflare Request, keeping this function pure TypeScript with no runtime
 * dependency. The task 1.3 caller is responsible for destructuring:
 *   extractPayload(req.method, new URL(req.url), req.headers, req.body)
 */
export async function extractPayload(
  method: string,
  url: URL,
  headers: Headers,
  body: ReadableStream<Uint8Array> | null,
): Promise<ExtractedPayload> {
  const path = url.pathname;

  const query: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    query[key] = value; // last-write-wins for duplicate keys
  }

  if (body === null) {
    return { method, path, query, body: null, bodyCapped: false };
  }

  const contentType = (headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!isTextContentType(contentType)) {
    return { method, path, query, body: null, bodyCapped: false };
  }

  // Read MAX_BODY_BYTES + 1 bytes: the +1 lets us detect overflow (body longer
  // than the limit) without consuming the entire stream.
  const bytes = await readAtMost(body, MAX_BODY_BYTES + 1);
  const capped = bytes.byteLength > MAX_BODY_BYTES;
  const slice = capped ? bytes.slice(0, MAX_BODY_BYTES) : bytes;

  return {
    method,
    path,
    query,
    body: new TextDecoder().decode(slice),
    bodyCapped: capped,
  };
}

async function readAtMost(
  stream: ReadableStream<Uint8Array>,
  limit: number,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}
