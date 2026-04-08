import { createLogger } from "./logger.js";

const log = createLogger("retry");

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Jitter factor 0–1, added to delay to avoid thundering herd. */
  jitter?: number;
}

const DEFAULTS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitter: 0.25,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 * Retries on any thrown error up to `maxAttempts`.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  opts?: RetryOptions,
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, jitter } = { ...DEFAULTS, ...opts };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitterMs = jitter * exponentialDelay * Math.random();
      const delayMs = Math.min(exponentialDelay + jitterMs, maxDelayMs);

      log.warn(
        `${label} attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delayMs)}ms`,
        err instanceof Error ? err.message : err,
      );

      await sleep(delayMs);
    }
  }

  log.error(`${label} failed after ${maxAttempts} attempts`);
  throw lastError;
}
