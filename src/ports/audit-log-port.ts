import { z } from "zod";

import { VerdictSchema } from "../domain/verdict/verdict";

/**
 * Zod schema for AuditEntry — used by the D1 adapter (task 5) to validate
 * rows read back from the audit log table and by tests to verify the shape.
 *
 * Fields:
 *   reqId     — unique request identifier (UUID from crypto.randomUUID)
 *   ts        — ISO 8601 timestamp of the classification decision
 *   verdict   — the full Verdict object (discriminated union)
 *   latencyMs — total classification latency in milliseconds (non-negative integer)
 */
export const AuditEntrySchema = z.object({
  reqId: z.string(),
  ts: z.string(),
  verdict: VerdictSchema,
  latencyMs: z.number().int().nonnegative(),
});

/** A single classification decision written to the audit log. */
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

/**
 * Port: audit log.
 *
 * The application records every BLOCK (and optionally SUSPICIOUS) decision.
 * The adapter (D1AuditLog, task 5) implements this against Cloudflare D1.
 */
export interface AuditLogPort {
  /** Persist an audit entry. Fire-and-forget from the request path. */
  record(entry: AuditEntry): Promise<void>;
}
