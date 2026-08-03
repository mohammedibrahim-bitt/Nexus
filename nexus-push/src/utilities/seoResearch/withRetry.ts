/**
 * Retries a flaky async operation (SerpApi hiccup, AI provider timeout, etc.)
 * with exponential backoff. Not used for validation/logic errors — only
 * wrap calls where a second attempt might plausibly succeed.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number; onRetry?: (attempt: number, err: unknown) => void } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 1000

  let lastErr: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt === attempts) break
      options.onRetry?.(attempt, err)
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)))
    }
  }
  throw lastErr
}
