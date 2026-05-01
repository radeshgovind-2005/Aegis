/**
 * Port: embedding cache.
 *
 * Stores and retrieves embedding vectors keyed by a payload hash
 * (sha256 of the normalised payload string) to avoid re-embedding
 * identical payloads on the hot path.
 *
 * The adapter (KvCache, task 5) implements this against Cloudflare Workers KV.
 */
export interface CachePort {
  /**
   * Retrieve a cached embedding vector, or null if not present.
   * @param key sha256 hex digest of the normalised payload
   */
  get(key: string): Promise<Float32Array | null>;

  /**
   * Store an embedding vector in the cache.
   * @param key    sha256 hex digest of the normalised payload
   * @param vec    the embedding vector to cache
   * @param ttlSec TTL in seconds; the KV adapter passes this to the KV put options
   */
  put(key: string, vec: Float32Array, ttlSec: number): Promise<void>;
}
