import { logger } from "./logger";

interface CorsOrigins {
  production: string[];
  staging: string[];
  development: string[];
}

export function buildAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV ?? "development";

  const origins: CorsOrigins = {
    production: [
      "https://brisacubana.com",
      "https://www.brisacubana.com",
      "https://app.brisacubana.com",
      "https://brisa-cubana.vercel.app",
    ],
    staging: ["https://brisa-cubana-staging.vercel.app"],
    development: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ],
  };

  // Normalize environment to valid key, fallback to development
  const envKey = (
    ["production", "staging", "development"].includes(env) ? env : "development"
  ) as keyof CorsOrigins;

  // Add environment variables
  if (process.env.WEB_APP_URL) {
    const normalized = normalizeOrigin(process.env.WEB_APP_URL);
    if (normalized) {
      origins[envKey].push(normalized);
    }
  }
  if (process.env.VERCEL_URL) {
    origins[envKey].push(`https://${process.env.VERCEL_URL}`);
  }

  const allowedOrigins = [...new Set(origins[envKey])];

  logger.info(
    {
      environment: env,
      count: allowedOrigins.length,
    },
    "CORS origins configured",
  );

  return allowedOrigins;
}

function normalizeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    logger.warn({ url }, "Invalid origin URL");
    return "";
  }
}

export function originMatcher(allowedOrigins: string[]) {
  return (origin: string | undefined): string | null => {
    if (!origin) {
      // No origin header = same-origin request or curl without Origin
      return null;
    }

    if (allowedOrigins.includes(origin)) {
      return origin;
    }

    logger.warn(
      {
        origin,
        allowedOrigins: allowedOrigins.length,
      },
      "CORS origin blocked",
    );
    return null;
  };
}
