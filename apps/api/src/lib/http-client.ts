import { setTimeout as delay } from "node:timers/promises";
import { logger } from "./logger";

interface CircuitState {
  failures: number;
  nextAttemptAt: number;
}

const circuitBreakers = new Map<string, CircuitState>();

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitOpenError";
  }
}

export interface HttpClientOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryOn?: (result: Response | Error) => boolean;
  circuitBreakerKey?: string;
  circuitBreakerThreshold?: number;
  circuitBreakerCooldownMs?: number;
  name?: string;
}

const defaultRetryStrategy = (result: Response | Error): boolean => {
  if (result instanceof Response) {
    if (
      result.status >= 500 ||
      result.status === 429 ||
      result.status === 408
    ) {
      return true;
    }
    return false;
  }
  return true;
};

function isCircuitOpen(key: string, now: number): CircuitState | undefined {
  const state = circuitBreakers.get(key);
  if (!state) {
    return undefined;
  }
  if (state.nextAttemptAt > now) {
    return state;
  }
  // Cooldown elapsed, reset
  circuitBreakers.delete(key);
  return undefined;
}

function recordFailure(
  key: string,
  threshold: number,
  cooldownMs: number,
  now: number,
): void {
  const state = circuitBreakers.get(key);
  if (!state) {
    circuitBreakers.set(key, {
      failures: 1,
      nextAttemptAt: 0,
    });
    return;
  }
  const updatedFailures = state.failures + 1;
  if (updatedFailures >= threshold) {
    circuitBreakers.set(key, {
      failures: updatedFailures,
      nextAttemptAt: now + cooldownMs,
    });
  } else {
    circuitBreakers.set(key, {
      failures: updatedFailures,
      nextAttemptAt: state.nextAttemptAt,
    });
  }
}

function resetCircuit(key: string): void {
  circuitBreakers.delete(key);
}

export async function fetchWithRetry(
  url: string,
  options: HttpClientOptions = {},
): Promise<Response> {
  const {
    timeoutMs = 5000,
    retries = 2,
    retryDelayMs = 200,
    retryOn = defaultRetryStrategy,
    circuitBreakerKey,
    circuitBreakerThreshold = 3,
    circuitBreakerCooldownMs = 30_000,
    name = "http",
    signal,
    ...fetchOptions
  } = options;

  const now = Date.now();
  if (circuitBreakerKey) {
    const state = isCircuitOpen(circuitBreakerKey, now);
    if (state) {
      throw new CircuitOpenError(
        `${name} circuit "${circuitBreakerKey}" open until ${new Date(state.nextAttemptAt).toISOString()}`,
      );
    }
  }

  let lastError: unknown;
  const body = fetchOptions.body;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const abortListener = () => {
      controller.abort(
        (signal as AbortSignal | undefined)?.reason ??
          new DOMException("Aborted", "AbortError"),
      );
    };

    if (signal) {
      if (signal.aborted) {
        // eslint-disable-next-line no-undef
        clearTimeout(timeout);
        throw new DOMException("Aborted", "AbortError");
      }
      signal.addEventListener("abort", abortListener, { once: true });
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        body,
        signal: controller.signal,
      });
      // eslint-disable-next-line no-undef
      clearTimeout(timeout);
      if (signal) {
        signal.removeEventListener("abort", abortListener);
      }

      if (!retryOn(response)) {
        if (circuitBreakerKey) {
          resetCircuit(circuitBreakerKey);
        }
        return response;
      }

      const retryReason = `${name} got retryable status ${response.status}`;
      lastError = new Error(retryReason);
      logger.warn(
        {
          url,
          attempt,
          status: response.status,
          retryable: true,
          name,
        },
        retryReason,
      );
    } catch (error) {
      // eslint-disable-next-line no-undef
      clearTimeout(timeout);
      if (signal) {
        signal.removeEventListener("abort", abortListener);
      }
      lastError = error;
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";
      logger.warn(
        {
          url,
          attempt,
          name,
          timeoutMs,
          aborted: isAbortError,
          error:
            error instanceof Error
              ? { message: error.message }
              : { message: "unknown" },
        },
        `${name} request failed`,
      );
      if (!retryOn(error as Error)) {
        break;
      }
    }

    const shouldRetry = attempt < retries;
    if (!shouldRetry) {
      break;
    }

    if (circuitBreakerKey) {
      recordFailure(
        circuitBreakerKey,
        circuitBreakerThreshold,
        circuitBreakerCooldownMs,
        Date.now(),
      );
    }

    const backoff = retryDelayMs * Math.pow(2, attempt);
    await delay(backoff);
  }

  if (circuitBreakerKey && lastError instanceof Error) {
    logger.error(
      {
        url,
        name,
        error: { message: lastError.message },
      },
      `${name} request exhausted retries`,
    );
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`${name} request failed without specific error`);
}
