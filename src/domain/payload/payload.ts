/**
 * Maximum character length of a Payload value.
 *
 * Matches the 8 KB byte limit enforced by extractPayload (MAX_BODY_BYTES in
 * payload-extractor.ts). The two constants share the same number but have
 * different semantics: MAX_BODY_BYTES is a network I/O byte limit; this is a
 * domain validation rule on the already-decoded string length.
 */
export const MAX_PAYLOAD_LENGTH = 8192;

/**
 * Thrown when a Payload cannot be constructed because the raw string fails
 * domain validation. Callers can instanceof-check to distinguish domain
 * errors from unexpected runtime errors.
 */
export class PayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadValidationError";
  }
}

/**
 * Immutable value object representing the inspectable text of an HTTP request.
 *
 * Construction validates the raw string. Once constructed, the value is frozen.
 * `.normalize()` returns the canonical form used as embedding input: lowercased,
 * whitespace-collapsed, URL-decoded (one pass). Special characters are NOT
 * stripped — the embedding model is expected to learn from raw structure.
 * See docs/DECISIONS.md for the rationale.
 */
export class Payload {
  readonly #value: string;

  constructor(raw: string) {
    if (typeof raw !== "string") {
      throw new PayloadValidationError(
        `Payload must be a string, received ${typeof raw}`,
      );
    }
    if (raw.length === 0) {
      throw new PayloadValidationError("Payload must not be empty");
    }
    if (raw.length > MAX_PAYLOAD_LENGTH) {
      throw new PayloadValidationError(
        `Payload length ${raw.length} exceeds maximum of ${MAX_PAYLOAD_LENGTH} characters`,
      );
    }
    this.#value = raw;
    Object.freeze(this);
  }

  /** The original, unmodified string supplied to the constructor. */
  get value(): string {
    return this.#value;
  }

  /**
   * Returns the canonical embedding-input form of this payload:
   *   1. URL-decode one pass (malformed %-sequences are left as-is)
   *   2. Lowercase
   *   3. Trim leading/trailing whitespace
   *   4. Collapse internal whitespace runs to a single space
   *
   * Special characters (< > { } ' " etc.) are intentionally preserved.
   * See docs/DECISIONS.md — 2026-04-29 Payload normalize strategy.
   */
  normalize(): string {
    let s: string;
    try {
      s = decodeURIComponent(this.#value);
    } catch {
      // Malformed percent-sequences (e.g. %GG) cause decodeURIComponent to
      // throw URIError. Fall back to the raw value so the embedding still runs.
      s = this.#value;
    }
    return s.toLowerCase().trim().replace(/\s+/g, " ");
  }
}
