import { z } from "zod";

/**
 * Zod schema for runtime validation of Verdict objects when they cross system
 * boundaries (e.g. deserialised from D1 rows or JSON responses).
 *
 * Mirrors the Verdict type exactly. Used by AuditEntrySchema (ports layer)
 * and any adapter that needs to parse an external verdict shape.
 */
export const VerdictSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ALLOW") }),
  z.object({
    kind: z.literal("BLOCK"),
    matchId: z.string(),
    similarity: z.number(),
    category: z.string(),
  }),
  z.object({
    kind: z.literal("SUSPICIOUS"),
    similarity: z.number(),
  }),
]);

/**
 * The outcome of classifying a single request payload.
 *
 * A discriminated union on `kind` so callers can narrow with a switch.
 * All variants are plain, serialisable objects — no class instances.
 * Construct via the factory functions in the `Verdict` namespace below.
 *
 * Similarity values reflect cosine similarity as returned by Vectorize for
 * normalised vectors: range [0, 1] where 1 is identical. The SimilarityPolicy
 * (task 2.3) owns the threshold logic; Verdict is just the output shape.
 */
export type Verdict =
  | { readonly kind: "ALLOW" }
  | {
      readonly kind: "BLOCK";
      readonly matchId: string;
      readonly similarity: number;
      readonly category: string;
    }
  | { readonly kind: "SUSPICIOUS"; readonly similarity: number };

/**
 * Factory functions for constructing Verdict values.
 *
 * Named `Verdict` to match the type so callers write `Verdict.allow()` etc.
 * TypeScript merges the type alias and the namespace into one export symbol.
 * See docs/DECISIONS.md — 2026-04-29 — for the namespace-vs-class rationale.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Verdict {
  /** The payload is benign — allow the request through. */
  export function allow(): Verdict {
    return { kind: "ALLOW" };
  }

  /**
   * The payload is malicious — block the request.
   *
   * @param matchId   The Vectorize vector ID of the nearest matching attack sample.
   * @param similarity Cosine similarity score [0, 1].
   * @param category  Attack category label (e.g. "sqli", "xss", "rce").
   */
  export function block(
    matchId: string,
    similarity: number,
    category: string,
  ): Verdict {
    return { kind: "BLOCK", matchId, similarity, category };
  }

  /**
   * The payload is suspicious but below the block threshold — flag for review.
   *
   * @param similarity Cosine similarity score [0, 1].
   */
  export function suspicious(similarity: number): Verdict {
    return { kind: "SUSPICIOUS", similarity };
  }
}
