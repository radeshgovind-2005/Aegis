import type { MatchResult } from "../domain/policy/similarity-policy";

// Re-export so adapter code can import MatchResult from the ports layer
// without reaching into the domain directly.
export type { MatchResult };

/**
 * Port: vector similarity index.
 *
 * The domain asks for the topK nearest neighbours of a query vector.
 * The adapter (VectorizeIndex, task 4) implements this against Cloudflare Vectorize.
 *
 * MatchResult is defined in src/domain/policy/similarity-policy.ts (domain layer)
 * because SimilarityPolicy consumes it directly and domain cannot import from ports.
 * See docs/DECISIONS.md — 2026-05-01.
 */
export interface VectorIndexPort {
  /**
   * Query the index for the topK most similar vectors to vec.
   * Results are returned in descending score order.
   */
  query(vec: Float32Array, topK: number): Promise<MatchResult[]>;
}
