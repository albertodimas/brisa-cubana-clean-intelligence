import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  WEB_APP_URL: z.string().url().optional(),
  STRIPE_SUCCESS_URL: z.string().url().optional(),
  STRIPE_CANCEL_URL: z.string().url().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  AI_PROVIDER: z.enum(["mock", "openai", "anthropic"]).optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ALERTS_SLACK_WEBHOOK: z.string().url().optional(),
  ENABLE_AI_CONCIERGE: z.string().optional(),
  CONCIERGE_MODE: z.string().optional(),
  USE_PINO_PRETTY: z.string().optional(),
  ENABLE_TEST_LOGS: z.string().optional(),
});

const parseBoolean = (value?: string | null): boolean | undefined => {
  if (value == null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "on", "yes"].includes(normalized)) return true;
  if (["false", "0", "off", "no"].includes(normalized)) return false;
  return undefined;
};

const rawEnv = baseSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  JWT_SECRET: process.env.JWT_SECRET,
  WEB_APP_URL: process.env.WEB_APP_URL,
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  AI_PROVIDER: process.env.AI_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ALERTS_SLACK_WEBHOOK: process.env.ALERTS_SLACK_WEBHOOK,
  ENABLE_AI_CONCIERGE: process.env.ENABLE_AI_CONCIERGE,
  CONCIERGE_MODE: process.env.CONCIERGE_MODE,
  USE_PINO_PRETTY: process.env.USE_PINO_PRETTY,
  ENABLE_TEST_LOGS: process.env.ENABLE_TEST_LOGS,
});

const resolvedJwtSecret =
  rawEnv.JWT_SECRET ?? (rawEnv.NODE_ENV === "test" ? "test-secret" : undefined);

if (!resolvedJwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const env = {
  nodeEnv: rawEnv.NODE_ENV,
  logLevel: rawEnv.LOG_LEVEL,
  jwtSecret: resolvedJwtSecret,
  webAppUrl: rawEnv.WEB_APP_URL ?? "http://localhost:3000",
  stripe: {
    successUrl:
      rawEnv.STRIPE_SUCCESS_URL ??
      `${rawEnv.WEB_APP_URL ?? "http://localhost:3000"}/dashboard?payment=success`,
    cancelUrl:
      rawEnv.STRIPE_CANCEL_URL ??
      `${rawEnv.WEB_APP_URL ?? "http://localhost:3000"}/dashboard?payment=cancelled`,
    webhookSecret: rawEnv.STRIPE_WEBHOOK_SECRET,
  },
  ai: {
    provider: rawEnv.AI_PROVIDER ?? "mock",
    openAIApiKey: rawEnv.OPENAI_API_KEY,
    anthropicApiKey: rawEnv.ANTHROPIC_API_KEY,
    conciergeMode: rawEnv.CONCIERGE_MODE,
    enableConcierge: parseBoolean(rawEnv.ENABLE_AI_CONCIERGE),
  },
  alerts: {
    slackWebhook: rawEnv.ALERTS_SLACK_WEBHOOK,
  },
  logger: {
    usePretty:
      parseBoolean(rawEnv.USE_PINO_PRETTY) ??
      (rawEnv.USE_PINO_PRETTY
        ? rawEnv.USE_PINO_PRETTY.trim().toLowerCase() !== "false"
        : undefined),
    enableTestLogs:
      parseBoolean(rawEnv.ENABLE_TEST_LOGS) ??
      rawEnv.ENABLE_TEST_LOGS?.trim().toLowerCase() === "true",
  },
};

export type Env = typeof env;
