import { Redis } from "ioredis";
import { logger } from "./logger";

let redisClient: Redis | null = null;

/**
 * Get or create Redis client for rate limiting
 * Falls back to null if RATE_LIMIT_REDIS_URL is not configured
 */
export function getRedisClient(): Redis | null {
  // If already initialized, return cached instance
  if (redisClient !== undefined) {
    return redisClient;
  }

  const redisUrl = process.env.RATE_LIMIT_REDIS_URL;

  // No Redis configured - use in-memory fallback
  if (!redisUrl) {
    logger.info(
      "[redis] RATE_LIMIT_REDIS_URL not configured, using in-memory rate limiting",
    );
    redisClient = null;
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.error(
            "[redis] Max retries reached, falling back to in-memory rate limiting",
          );
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      reconnectOnError(err) {
        const targetErrors = ["READONLY", "ECONNRESET"];
        if (targetErrors.some((e) => err.message.includes(e))) {
          return true;
        }
        return false;
      },
    });

    redisClient.on("error", (err) => {
      logger.error({ err }, "[redis] Client error");
    });

    redisClient.on("connect", () => {
      logger.info("[redis] Connected successfully");
    });

    logger.info("[redis] Client initialized");
    return redisClient;
  } catch (error) {
    logger.error({ error }, "[redis] Failed to initialize client");
    redisClient = null;
    return null;
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("[redis] Connection closed");
  }
}
