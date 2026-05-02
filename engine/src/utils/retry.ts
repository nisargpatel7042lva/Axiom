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

function parseRetryAfterMs(err: unknown): number | null {
  const e = err as {
    response?: { headers?: Record<string, string | number | string[] | undefined> };
  };
  const headers = e?.response?.headers;
  if (!headers) return null;
  const raw = headers["retry-after"] ?? headers["Retry-After"];
  if (raw == null) return null;
  const token = Array.isArray(raw) ? raw[0] : String(raw);
  const seconds = Number(token);
  if (Number.isFinite(seconds) && seconds > 0) return Math.round(seconds * 1000);
  const at = Date.parse(token);
  if (Number.isFinite(at)) {
    const ms = at - Date.now();
    return ms > 0 ? ms : null;
  }
  return null;
}

function shouldRetryError(err: unknown): boolean {
  const e = err as {
    response?: { status?: number };
    code?: string;
  };
  const status = e?.response?.status;
  const code = e?.code;

  if (status === 429) return true;
  if (status != null) return status >= 500;
  if (!code) return true;
  return code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ENETUNREACH";
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
      if (!shouldRetryError(err)) break;
      if (attempt === maxAttempts) break;

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitterMs = jitter * exponentialDelay * Math.random();
      const delayMs = Math.min(
        Math.max(exponentialDelay + jitterMs, parseRetryAfterMs(err) ?? 0),
        maxDelayMs,
      );

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
