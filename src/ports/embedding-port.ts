/**
 * Port: embedding service.
 *
 * The domain asks for a text string to be converted into a vector embedding.
 * The adapter (WorkersAiEmbedder, task 4) implements this against Workers AI.
 */
export interface EmbeddingPort {
  /**
   * Convert a text string to a dense vector embedding.
   * The returned Float32Array is suitable for direct use with VectorIndexPort.
   */
  embed(text: string): Promise<Float32Array>;
}
