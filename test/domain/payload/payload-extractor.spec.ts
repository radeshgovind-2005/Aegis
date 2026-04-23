import { describe, it, expect } from "vitest";

import { extractPayload, MAX_BODY_BYTES } from "../../../src/domain/payload/payload-extractor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function streamFrom(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function streamFromBytes(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function emptyStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({ start(controller) { controller.close(); } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("extractPayload", () => {
  describe("GET / query parsing", () => {
    it("extracts path and single query param", async () => {
      const url = new URL("https://example.com/path?q=hello");
      const result = await extractPayload("GET", url, new Headers(), null);
      expect(result).toEqual({
        method: "GET",
        path: "/path",
        query: { q: "hello" },
        body: null,
        bodyCapped: false,
      });
    });

    it("decodes URL-encoded query values", async () => {
      const url = new URL("https://example.com/path?q=%2Ffoo");
      const result = await extractPayload("GET", url, new Headers(), null);
      expect(result.query).toEqual({ q: "/foo" });
    });

    it("decodes nested encoding in query values", async () => {
      const url = new URL("https://example.com/path?x=foo%26bar");
      const result = await extractPayload("GET", url, new Headers(), null);
      expect(result.query).toEqual({ x: "foo&bar" });
    });

    it("last-write-wins for duplicate query keys", async () => {
      const url = new URL("https://example.com/path?a=1&a=2");
      const result = await extractPayload("GET", url, new Headers(), null);
      expect(result.query).toEqual({ a: "2" });
    });

    it("returns empty query object when no query string", async () => {
      const url = new URL("https://example.com/path");
      const result = await extractPayload("GET", url, new Headers(), null);
      expect(result.query).toEqual({});
    });
  });

  describe("POST JSON body", () => {
    it("returns raw JSON body as string (not parsed)", async () => {
      const url = new URL("https://example.com/search");
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "application/json" }),
        streamFrom('{"q":"test"}'),
      );
      expect(result).toEqual({
        method: "POST",
        path: "/search",
        query: {},
        body: '{"q":"test"}',
        bodyCapped: false,
      });
    });

    it("preserves multi-byte Unicode characters in JSON body", async () => {
      const url = new URL("https://example.com/search");
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "application/json" }),
        streamFrom('{"q":"日本語"}'),
      );
      expect(result.body).toBe('{"q":"日本語"}');
    });
  });

  describe("POST form-encoded body", () => {
    it("returns raw form-encoded body as string (not pre-decoded)", async () => {
      const url = new URL("https://example.com/form");
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "application/x-www-form-urlencoded" }),
        streamFrom("a=1&b=2"),
      );
      expect(result.body).toBe("a=1&b=2");
      expect(result.bodyCapped).toBe(false);
    });
  });

  describe("binary / unrecognized content type", () => {
    it("returns null body for application/octet-stream", async () => {
      const url = new URL("https://example.com/upload");
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "application/octet-stream" }),
        streamFromBytes(new Uint8Array([0x00, 0x01, 0x02])),
      );
      expect(result.body).toBeNull();
      expect(result.bodyCapped).toBe(false);
    });

    it("returns null body for image/png", async () => {
      const url = new URL("https://example.com/img");
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "image/png" }),
        streamFromBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
      );
      expect(result.body).toBeNull();
    });

    it("returns null body when Content-Type header is absent", async () => {
      const url = new URL("https://example.com/unknown");
      const result = await extractPayload(
        "POST",
        url,
        new Headers(),
        streamFrom("some body content"),
      );
      expect(result.body).toBeNull();
    });
  });

  describe("oversize body", () => {
    it("truncates to MAX_BODY_BYTES and sets bodyCapped: true when over limit", async () => {
      const url = new URL("https://example.com/search");
      const oversizedBody = "a".repeat(MAX_BODY_BYTES + 100);
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "application/json" }),
        streamFrom(oversizedBody),
      );
      expect(result.body).toBe("a".repeat(MAX_BODY_BYTES));
      expect(result.bodyCapped).toBe(true);
    });

    it("does not cap a body of exactly MAX_BODY_BYTES", async () => {
      const url = new URL("https://example.com/search");
      const exactBody = "a".repeat(MAX_BODY_BYTES);
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "application/json" }),
        streamFrom(exactBody),
      );
      expect(result.body).toBe(exactBody);
      expect(result.bodyCapped).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns body: null and bodyCapped: false when stream is null", async () => {
      const url = new URL("https://example.com/path");
      const result = await extractPayload("GET", url, new Headers(), null);
      expect(result.body).toBeNull();
      expect(result.bodyCapped).toBe(false);
    });

    it("returns body: '' (not null) for a present but empty body stream", async () => {
      const url = new URL("https://example.com/search");
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "application/json" }),
        emptyStream(),
      );
      expect(result.body).toBe("");
      expect(result.bodyCapped).toBe(false);
    });

    it("extracts body for text/plain content type", async () => {
      const url = new URL("https://example.com/text");
      const result = await extractPayload(
        "POST",
        url,
        new Headers({ "content-type": "text/plain" }),
        streamFrom("hello world"),
      );
      expect(result.body).toBe("hello world");
    });
  });

  describe("case-insensitive Content-Type header lookup", () => {
    const bodyText = '{"test":true}';

    it("accepts lowercase 'content-type' header", async () => {
      const url = new URL("https://example.com/search");
      const result = await extractPayload(
        "POST",
        url,
        new Headers([["content-type", "application/json"]]),
        streamFrom(bodyText),
      );
      expect(result.body).toBe(bodyText);
    });

    it("accepts mixed-case 'Content-Type' header", async () => {
      const url = new URL("https://example.com/search");
      const result = await extractPayload(
        "POST",
        url,
        new Headers([["Content-Type", "application/json"]]),
        streamFrom(bodyText),
      );
      expect(result.body).toBe(bodyText);
    });

    it("accepts uppercase 'CONTENT-TYPE' header", async () => {
      const url = new URL("https://example.com/search");
      const result = await extractPayload(
        "POST",
        url,
        new Headers([["CONTENT-TYPE", "application/json"]]),
        streamFrom(bodyText),
      );
      expect(result.body).toBe(bodyText);
    });
  });
});
