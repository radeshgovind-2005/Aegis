import { z } from "zod";

import { Verdict } from "../verdict/verdict";

/**
 * A single nearest-neighbour result from the vector index.
 *
 * Defined here (domain layer) so the SimilarityPolicy can consume it without
 * importing from ports/. The VectorIndexPort (task 2.5) imports this type
 * rather than defining its own, keeping the dependency arrow pointing inward.
 *
 * score is cosine similarity as returned by Vectorize for normalised vectors:
 * range [0, 1] in practice (theoretically [-1, 1] for un-normalised vectors).
 */
/**
 * Zod schema for MatchResult — used by adapters to validate raw Vectorize
 * query responses before passing them into the domain.
 */
export const MatchResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  category: z.string(),
});

export interface MatchResult {
  id: string;
  score: number;
  category: string;
}

/** Default similarity score at or above which a request is blocked. */
export const DEFAULT_BLOCK_AT = 0.85;

/** Default similarity score at or above which a request is flagged suspicious. */
export const DEFAULT_SUSPICIOUS_AT = 0.75;

export interface PolicyOptions {
  /** Score threshold for BLOCK verdict (inclusive). Default: 0.85. */
  blockAt?: number;
  /** Score threshold for SUSPICIOUS verdict (inclusive). Default: 0.75. */
  suspiciousAt?: number;
}

/**
 * Pure classification policy: maps a ranked list of vector-index matches
 * to a Verdict.
 *
 * Rules (evaluated in order):
 *   1. No matches → ALLOW.
 *   2. Highest score ≥ blockAt → BLOCK (matchId + category from that match).
 *   3. Highest score ≥ suspiciousAt → SUSPICIOUS.
 *   4. Otherwise → ALLOW.
 *
 * Ties: when multiple matches share the highest score, the first one in the
 * input array is used. Vectorize returns results ranked by score descending,
 * so the first tied result is as good as any other.
 *
 * The policy is injected into ClassifyRequest (task 2.6) so thresholds can
 * be tuned per environment without touching application logic.
 */
export class SimilarityPolicy {
  private readonly blockAt: number;
  private readonly suspiciousAt: number;

  constructor({ blockAt = DEFAULT_BLOCK_AT, suspiciousAt = DEFAULT_SUSPICIOUS_AT }: PolicyOptions = {}) {
    if (suspiciousAt >= blockAt) {
      throw new Error(
        `SimilarityPolicy: suspiciousAt (${suspiciousAt}) must be strictly less than blockAt (${blockAt})`,
      );
    }
    this.blockAt = blockAt;
    this.suspiciousAt = suspiciousAt;
  }

  /**
   * Evaluate a list of match results and return a Verdict.
   * Pure: no I/O, no side-effects, same input always yields same output.
   */
  evaluate(matches: MatchResult[]): Verdict {
    if (matches.length === 0) {
      return Verdict.allow();
    }

    // Find the first match with the highest score (stable: first wins on tie).
    const best = matches.reduce((a, b) => (b.score > a.score ? b : a));

    if (best.score >= this.blockAt) {
      return Verdict.block(best.id, best.score, best.category);
    }

    if (best.score >= this.suspiciousAt) {
      return Verdict.suspicious(best.score);
    }

    return Verdict.allow();
  }
}
