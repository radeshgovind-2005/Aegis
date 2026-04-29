import { describe, it, expect } from "vitest";

import { Payload, PayloadValidationError, MAX_PAYLOAD_LENGTH } from "../../../src/domain/payload/payload";

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe("Payload construction", () => {
  it("accepts a valid non-empty string", () => {
    const p = new Payload("SELECT * FROM users");
    expect(p.value).toBe("SELECT * FROM users");
  });

  it("throws PayloadValidationError for an empty string", () => {
    expect(() => new Payload("")).toThrow(PayloadValidationError);
  });

  it("throws PayloadValidationError for a string of MAX_PAYLOAD_LENGTH + 1 chars", () => {
    const tooLong = "a".repeat(MAX_PAYLOAD_LENGTH + 1);
    expect(() => new Payload(tooLong)).toThrow(PayloadValidationError);
  });

  it("accepts a string of exactly MAX_PAYLOAD_LENGTH chars", () => {
    const exact = "a".repeat(MAX_PAYLOAD_LENGTH);
    expect(() => new Payload(exact)).not.toThrow();
  });

  it("throws PayloadValidationError when the argument is not a string", () => {
    // Runtime guard — TypeScript callers are protected at compile time,
    // but JS callers or any cast can still reach this path.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => new Payload(42 as any)).toThrow(PayloadValidationError);
  });

  it("is immutable — direct property reassignment has no effect", () => {
    const p = new Payload("hello");
    // Frozen objects silently ignore property writes in non-strict mode and
    // throw in strict mode. Either way the value must remain unchanged.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p as any).extraProp = "injected";
    } catch {
      // Strict-mode throw is acceptable
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((p as any).extraProp).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// normalize()
// ---------------------------------------------------------------------------

describe("Payload.normalize()", () => {
  it("lowercases ASCII characters", () => {
    expect(new Payload("SELECT * FROM Users").normalize()).toBe(
      "select * from users",
    );
  });

  it("collapses multiple internal whitespace to a single space", () => {
    expect(new Payload("foo   bar\t\tbaz").normalize()).toBe("foo bar baz");
  });

  it("trims leading and trailing whitespace", () => {
    expect(new Payload("  hello world  ").normalize()).toBe("hello world");
  });

  it("URL-decodes a single-encoded string", () => {
    // %3D is '=', common in SQL injection probes
    expect(new Payload("foo%3Dbar").normalize()).toBe("foo=bar");
  });

  it("does not mutate an already-clean string", () => {
    const clean = "select * from users where id = 1";
    expect(new Payload(clean).normalize()).toBe(clean);
  });

  it("applies only one decoding pass — %2520 becomes %20, not a space", () => {
    // %2520 → first pass decodes %25 → %; result is %20
    // A second pass would decode %20 → space, but we do NOT double-decode.
    expect(new Payload("%2520").normalize()).toBe("%20");
  });

  it("preserves unicode characters", () => {
    expect(new Payload("こんにちは World").normalize()).toBe("こんにちは world");
  });

  it("preserves special characters — does NOT strip < > { } ' \"", () => {
    const probe = "<script>alert('xss')</script>";
    expect(new Payload(probe).normalize()).toBe(
      "<script>alert('xss')</script>",
    );
  });

  it("handles malformed percent-sequences without throwing", () => {
    // % followed by non-hex characters is invalid; normalize() must not throw.
    // The malformed sequence is passed through as-is.
    expect(() => new Payload("foo%GGbar").normalize()).not.toThrow();
  });
});
