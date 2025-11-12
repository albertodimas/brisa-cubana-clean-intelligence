import { z } from "zod";

const DEFAULT_DEVELOPMENT_ALLOWED_ORIGINS = "http://localhost:3000";
const DEFAULT_PRODUCTION_ALLOWED_ORIGINS =
  "https://brisacubanacleanintelligence.com";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_URL_UNPOOLED: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    ALLOWED_ORIGINS: z.string().optional(),
    ENABLE_TEST_UTILS: z.enum(["true", "false"]).optional(),
    HEALTH_CHECK_TOKEN: z.string().optional(),
    REDIS_URL: z.string().url().optional(),
    NOTIFICATION_SMTP_HOST: z.string().optional(),
    NOTIFICATION_SMTP_PORT: z.string().optional(),
    NOTIFICATION_SMTP_USER: z.string().optional(),
    NOTIFICATION_SMTP_PASSWORD: z.string().optional(),
    NOTIFICATION_SMTP_SECURE: z.enum(["true", "false"]).optional(),
    NOTIFICATION_FROM_EMAIL: z.string().email().optional(),
    NOTIFICATION_STREAM_HEARTBEAT_MS: z.string().optional(),
    NOTIFICATION_STREAM_LIMIT: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
  })
  .passthrough();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten();
  const fieldErrors = Object.entries(formatted.fieldErrors)
    .map(([key, errors]) => `${key}: ${errors?.join(", ")}`)
    .join("\n");
  console.error(
    "❌ Invalid environment configuration. Please review the following issues:\n",
    fieldErrors || formatted.formErrors.join("\n"),
  );
  throw new Error("Invalid environment variables");
}

const fallbackAllowedOrigins =
  parsed.data.ALLOWED_ORIGINS && parsed.data.ALLOWED_ORIGINS.trim().length > 0
    ? parsed.data.ALLOWED_ORIGINS
    : parsed.data.NODE_ENV === "production"
      ? DEFAULT_PRODUCTION_ALLOWED_ORIGINS
      : DEFAULT_DEVELOPMENT_ALLOWED_ORIGINS;

if (
  parsed.data.NODE_ENV === "production" &&
  (!parsed.data.ALLOWED_ORIGINS ||
    parsed.data.ALLOWED_ORIGINS.trim().length === 0)
) {
  console.warn(
    "⚠️ ALLOWED_ORIGINS no está configurado en producción. Usando fallback por defecto:",
    fallbackAllowedOrigins,
  );
}

export const env = Object.freeze({
  ...parsed.data,
  ALLOWED_ORIGINS: fallbackAllowedOrigins,
});

export type Env = typeof env;
