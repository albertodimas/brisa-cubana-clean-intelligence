/**
 * Environment validation and configuration management
 * Validates required environment variables at startup (fail-fast)
 * Created: October 5, 2025
 */

import { logger } from "./logger";

interface EnvConfig {
  // Application
  NODE_ENV: "development" | "test" | "production";
  PORT: number;

  // Database
  DATABASE_URL: string;

  // Authentication
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;

  // Security
  ENABLE_RATE_LIMITING: boolean;
  ENABLE_CORS: boolean;
  ALLOWED_ORIGINS: string[];

  // Optional: External services
  REDIS_URL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SENDGRID_API_KEY?: string;

  // Optional: Monitoring
  SENTRY_DSN?: string;
  GRAFANA_API_KEY?: string;
}

/**
 * Required environment variables for production
 */
const REQUIRED_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_ACCESS_EXPIRATION",
  "JWT_REFRESH_EXPIRATION",
] as const;

/**
 * Environment variables that should be set in production
 * (warning if missing, but not fatal)
 */
const RECOMMENDED_VARS_PRODUCTION = [
  "REDIS_URL",
  "SENTRY_DSN",
  "ALLOWED_ORIGINS",
] as const;

/**
 * Validate and parse environment variables
 * Throws error if critical variables are missing
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Special validation: DATABASE_URL format
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.startsWith("postgresql://")
  ) {
    errors.push(
      "DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...)",
    );
  }

  // Special validation: JWT_SECRET length (minimum 32 characters for security)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long for security");
  }

  // Validate recommended variables for production
  if (process.env.NODE_ENV === "production") {
    for (const varName of RECOMMENDED_VARS_PRODUCTION) {
      if (!process.env[varName]) {
        warnings.push(`Recommended environment variable not set: ${varName}`);
      }
    }
  }

  // Fail fast if critical errors
  if (errors.length > 0) {
    logger.error("❌ Environment validation failed:");
    errors.forEach((error) => logger.error(`   - ${error}`));
    logger.error(
      "\nPlease set the required environment variables and restart the application.",
    );
    logger.error("See .env.example for reference.");
    throw new Error(`Environment validation failed: ${errors.join(", ")}`);
  }

  // Log warnings but continue
  if (warnings.length > 0) {
    logger.warn("⚠️  Environment warnings:");
    warnings.forEach((warning) => logger.warn(`   - ${warning}`));
  }

  // Parse and return validated config
  const config: EnvConfig = {
    // Application
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) ?? "development",
    PORT: parseInt(process.env.PORT ?? "3001", 10),

    // Database
    DATABASE_URL: process.env.DATABASE_URL!,

    // Authentication
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION ?? "15m",
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION ?? "7d",

    // Security
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== "false",
    ENABLE_CORS: process.env.ENABLE_CORS !== "false",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : ["http://localhost:3000", "http://localhost:3001"],

    // Optional services
    REDIS_URL: process.env.REDIS_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,

    // Monitoring
    SENTRY_DSN: process.env.SENTRY_DSN,
    GRAFANA_API_KEY: process.env.GRAFANA_API_KEY,
  };

  // Log successful validation
  logger.info("✅ Environment validation passed");
  logger.info(`   Environment: ${config.NODE_ENV}`);
  logger.info(`   Port: ${config.PORT}`);
  logger.info(`   Database: ${maskDatabaseUrl(config.DATABASE_URL)}`);
  logger.info(
    `   JWT expiration: access=${config.JWT_ACCESS_EXPIRATION}, refresh=${config.JWT_REFRESH_EXPIRATION}`,
  );
  logger.info(
    `   Rate limiting: ${config.ENABLE_RATE_LIMITING ? "enabled" : "disabled"}`,
  );
  logger.info(
    `   CORS: ${config.ENABLE_CORS ? "enabled" : "disabled"} (${config.ALLOWED_ORIGINS.length} origins)`,
  );

  if (config.REDIS_URL) {
    logger.info(`   Redis: ${maskRedisUrl(config.REDIS_URL)}`);
  }

  return config;
}

/**
 * Mask sensitive parts of DATABASE_URL for logging
 */
function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "****";
    }
    return parsed.toString();
  } catch {
    return "postgresql://****:****@****";
  }
}

/**
 * Mask sensitive parts of REDIS_URL for logging
 */
function maskRedisUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "****";
    }
    return parsed.toString();
  } catch {
    return "redis://****:****@****";
  }
}

/**
 * Get current environment config
 * Call validateEnv() first at startup to ensure config is valid
 */
export function getEnv(): EnvConfig {
  return {
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) ?? "development",
    PORT: parseInt(process.env.PORT ?? "3001", 10),
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION ?? "15m",
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION ?? "7d",
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== "false",
    ENABLE_CORS: process.env.ENABLE_CORS !== "false",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : ["http://localhost:3000", "http://localhost:3001"],
    REDIS_URL: process.env.REDIS_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    GRAFANA_API_KEY: process.env.GRAFANA_API_KEY,
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}
