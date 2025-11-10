import type { Context, MiddlewareHandler } from "hono";
import honoRateLimiter from "hono-rate-limiter";
import type { Store } from "hono-rate-limiter";
import Redis from "ioredis";
import { rateLimitLogger } from "./logger.js";

const INTERNAL_REMOTE_ADDR_HEADER = "x-internal-remote-address";

type RateLimitClientInfo = {
  totalHits: number;
  resetTime: Date;
};

type ResettableStore = Store & {
  resetAll?: () => Promise<void>;
};

const registeredStores: ResettableStore[] = [];

class FixedWindowMemoryStore implements Store {
  private windowMs = 60_000;
  private readonly clients = new Map<string, RateLimitClientInfo>();
  private sweepTimer: NodeJS.Timeout | null = null;
  public readonly localKeys = true;

  init(options: { windowMs: number }): void {
    this.windowMs = options.windowMs ?? this.windowMs;
    this.startTimer();
  }

  async get(key: string): Promise<RateLimitClientInfo | undefined> {
    return this.clients.get(key);
  }

  async increment(key: string): Promise<RateLimitClientInfo> {
    const now = Date.now();
    let client = this.clients.get(key);

    if (!client || client.resetTime.getTime() <= now) {
      client = {
        totalHits: 0,
        resetTime: new Date(now + this.windowMs),
      };
    }

    client.totalHits += 1;
    this.clients.set(key, client);
    return client;
  }

  async decrement(_key: string): Promise<void> {
    // No-op: queremos limitar por ventana fija, no por concurrencia.
  }

  async resetKey(key: string): Promise<void> {
    this.clients.delete(key);
  }

  async resetAll(): Promise<void> {
    this.clients.clear();
  }

  async shutdown(): Promise<void> {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    await this.resetAll();
  }

  private startTimer(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
    }
    this.sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, client] of this.clients.entries()) {
        if (client.resetTime.getTime() <= now) {
          this.clients.delete(key);
        }
      }
    }, this.windowMs);
    this.sweepTimer.unref?.();
  }
}

class FixedWindowRedisStore implements Store {
  private windowMs = 60_000;
  private redis: Redis | null = null;
  private fallbackStore: FixedWindowMemoryStore | null = null;
  public readonly localKeys = false;
  public readonly prefix = "rl:";

  init(options: { windowMs: number }): void {
    this.windowMs = options.windowMs ?? this.windowMs;
    if (!this.fallbackStore) {
      this.fallbackStore = new FixedWindowMemoryStore();
    }
    this.fallbackStore.init({ windowMs: this.windowMs });

    // Solo crear conexión Redis si REDIS_URL está configurado
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
        });

        this.redis.on("error", (err) => {
          rateLimitLogger.error(
            { error: err },
            "Redis connection error in rate limiter",
          );
        });

        // Intentar conectar
        this.redis.connect().catch((err) => {
          rateLimitLogger.warn(
            { error: err },
            "Failed to connect to Redis, falling back to memory store",
          );
          this.redis = null;
        });
      } catch (error) {
        rateLimitLogger.warn(
          { error },
          "Failed to initialize Redis, falling back to memory store",
        );
        this.redis = null;
        // fallbackStore ya inicializado, así que no hacemos nada extra
      }
    }
  }

  async get(key: string): Promise<RateLimitClientInfo | undefined> {
    if (!this.redis) {
      return this.fallbackStore?.get(key);
    }

    try {
      const data = await this.redis.get(this.prefix + key);
      if (!data) return undefined;

      const parsed = JSON.parse(data) as RateLimitClientInfo;
      return {
        totalHits: parsed.totalHits,
        resetTime: new Date(parsed.resetTime),
      };
    } catch (error) {
      rateLimitLogger.error({ error, key }, "Redis get error");
      return undefined;
    }
  }

  async increment(key: string): Promise<RateLimitClientInfo> {
    if (!this.redis) {
      return this.fallbackStore!.increment(key);
    }

    try {
      const now = Date.now();
      const redisKey = this.prefix + key;

      // Usar pipeline para operaciones atómicas
      const pipeline = this.redis.pipeline();

      // Intentar obtener el valor actual
      pipeline.get(redisKey);

      const results = await pipeline.exec();
      const currentData = results?.[0]?.[1] as string | null;

      let client: RateLimitClientInfo;

      if (currentData) {
        const parsed = JSON.parse(currentData) as RateLimitClientInfo;
        const resetTime = new Date(parsed.resetTime);

        if (resetTime.getTime() <= now) {
          // Ventana expirada, crear nueva
          client = {
            totalHits: 1,
            resetTime: new Date(now + this.windowMs),
          };
        } else {
          // Incrementar hits existentes
          client = {
            totalHits: parsed.totalHits + 1,
            resetTime,
          };
        }
      } else {
        // Crear nueva entrada
        client = {
          totalHits: 1,
          resetTime: new Date(now + this.windowMs),
        };
      }

      // Guardar en Redis con TTL
      const ttlSeconds = Math.ceil(this.windowMs / 1000);
      await this.redis.setex(redisKey, ttlSeconds, JSON.stringify(client));

      return client;
    } catch (error) {
      rateLimitLogger.error({ error, key }, "Redis increment error");
      return this.fallbackStore!.increment(key);
    }
  }

  async decrement(_key: string): Promise<void> {
    // No-op: queremos limitar por ventana fija, no por concurrencia.
  }

  async resetKey(key: string): Promise<void> {
    if (!this.redis) {
      await this.fallbackStore?.resetKey(key);
      return;
    }

    try {
      await this.redis.del(this.prefix + key);
    } catch (error) {
      rateLimitLogger.error({ error, key }, "Redis resetKey error");
    }
  }

  async resetAll(): Promise<void> {
    if (!this.redis) {
      await this.fallbackStore?.resetAll();
      return;
    }

    try {
      const keys = await this.redis.keys(this.prefix + "*");
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      rateLimitLogger.error({ error }, "Redis resetAll error");
    }
  }

  async shutdown(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        rateLimitLogger.error({ error }, "Redis shutdown error");
      }
      this.redis = null;
    }

    await this.fallbackStore?.shutdown();
  }
}

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  errorMessage: string;
  identifier?: string;
  keyGenerator?: (c: Context) => string;
};

function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/i, "").trim();
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const secondOctet = Number.parseInt(ip.split(".")[1] ?? "0", 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }
  if (ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }
  return false;
}

function firstForwardedAddress(
  header: string | null | undefined,
): string | null {
  if (!header) return null;
  const [first] = header.split(",");
  const trimmed = first?.trim();
  return trimmed ? normalizeIp(trimmed) : null;
}

function extractClientIdentifier(c: Context, identifier?: string): string {
  const internalAddress = firstForwardedAddress(
    c.req.header(INTERNAL_REMOTE_ADDR_HEADER),
  );

  if (internalAddress) {
    if (!isPrivateIp(internalAddress)) {
      return internalAddress;
    }

    const trustedForwarded = firstForwardedAddress(
      c.req.header("x-forwarded-for") ??
        c.req.raw.headers.get("x-forwarded-for"),
    );

    if (trustedForwarded) {
      rateLimitLogger.debug(
        {
          clientId: trustedForwarded,
          proxyIp: internalAddress,
        },
        "Using forwarded client IP behind trusted proxy",
      );
      return trustedForwarded;
    }

    return internalAddress;
  }

  const forwarded = firstForwardedAddress(c.req.header("x-forwarded-for"));
  if (forwarded) {
    rateLimitLogger.warn(
      {
        endpoint: identifier ?? "unknown",
        forwarded,
      },
      "Falling back to x-forwarded-for header for rate limiting",
    );
    return forwarded;
  }

  const realIp = firstForwardedAddress(
    c.req.header("x-real-ip") ??
      c.req.header("cf-connecting-ip") ??
      c.req.header("fastly-client-ip") ??
      c.req.raw.headers.get("x-real-ip") ??
      c.req.raw.headers.get("cf-connecting-ip"),
  );
  if (realIp) {
    return realIp;
  }

  return "anonymous";
}

export function createRateLimiter({
  limit,
  windowMs,
  errorMessage,
  identifier,
  keyGenerator,
}: RateLimiterOptions): MiddlewareHandler {
  const { rateLimiter } = honoRateLimiter as {
    rateLimiter: (config: {
      windowMs: number;
      limit: number;
      standardHeaders: string;
      keyGenerator: (c: Context) => string;
      handler: MiddlewareHandler;
      store: Store;
    }) => MiddlewareHandler;
  };

  const resolveKey =
    keyGenerator ??
    ((ctx: Context) => extractClientIdentifier(ctx, identifier));

  // Usar Redis si REDIS_URL está configurado, sino usar MemoryStore
  const useRedis = Boolean(process.env.REDIS_URL);
  const store: ResettableStore = useRedis
    ? new FixedWindowRedisStore()
    : new FixedWindowMemoryStore();
  registeredStores.push(store);

  if (useRedis) {
    rateLimitLogger.info(
      { endpoint: identifier ?? "unknown" },
      "Using Redis for rate limiting",
    );
  } else {
    rateLimitLogger.info(
      { endpoint: identifier ?? "unknown" },
      "Using in-memory store for rate limiting",
    );
  }

  return rateLimiter({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    keyGenerator: (c: Context) => {
      const key = resolveKey(c);
      rateLimitLogger.debug(
        {
          endpoint: identifier ?? "unknown",
          clientId: key,
          limit,
          windowMs,
        },
        `Rate limit verificado para ${identifier ?? "endpoint"}`,
      );
      return key;
    },
    handler: async (ctx: Context) => {
      const key = resolveKey(ctx);
      rateLimitLogger.warn(
        {
          endpoint: identifier ?? "unknown",
          clientId: key,
          limit,
          windowMs,
          path: ctx.req.path,
        },
        `Rate limit excedido para ${identifier ?? "endpoint"}`,
      );
      return ctx.json({ error: errorMessage }, 429);
    },
    store,
  });
}

export function defaultRateLimitKey(c: Context): string {
  return extractClientIdentifier(c);
}

export async function resetRateLimiterStoresForTests(): Promise<void> {
  if (registeredStores.length === 0) {
    return;
  }

  await Promise.all(
    registeredStores.map((store) =>
      typeof store.resetAll === "function"
        ? store.resetAll()
        : Promise.resolve(),
    ),
  );
}
