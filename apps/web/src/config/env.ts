import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
  CLEAN_SCORE_AI: z.string().optional(),
  USE_FAKE_API_DATA: z.string().optional(),
  NEXT_PUBLIC_USE_FAKE_API_DATA: z.string().optional(),
});

const parseBoolean = (value?: string | null): boolean | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "on", "yes"].includes(normalized)) return true;
  if (["false", "0", "off", "no"].includes(normalized)) return false;
  return undefined;
};

const raw = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  CLEAN_SCORE_AI: process.env.CLEAN_SCORE_AI,
  USE_FAKE_API_DATA: process.env.USE_FAKE_API_DATA,
  NEXT_PUBLIC_USE_FAKE_API_DATA: process.env.NEXT_PUBLIC_USE_FAKE_API_DATA,
});

const resolvedApiUrl =
  raw.API_URL ?? raw.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const resolvedAppUrl = raw.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const cleanScoreAi =
  parseBoolean(raw.CLEAN_SCORE_AI) ??
  parseBoolean(raw.USE_FAKE_API_DATA) ??
  false;

const useFakeData =
  parseBoolean(raw.USE_FAKE_API_DATA) ??
  parseBoolean(raw.NEXT_PUBLIC_USE_FAKE_API_DATA) ??
  false;

if (raw.NODE_ENV === "production" && !raw.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required in production");
}

const resolvedNextAuthSecret =
  raw.NEXTAUTH_SECRET ??
  (raw.NODE_ENV === "test" ? "test-nextauth-secret" : "dev-nextauth-secret");

export const env = {
  nodeEnv: raw.NODE_ENV,
  apiUrl: resolvedApiUrl,
  appUrl: resolvedAppUrl,
  nextAuth: {
    url: raw.NEXTAUTH_URL ?? resolvedAppUrl,
    secret: resolvedNextAuthSecret,
  },
  sentry: {
    dsn: raw.SENTRY_DSN ?? raw.NEXT_PUBLIC_SENTRY_DSN,
    environment:
      raw.SENTRY_ENVIRONMENT ??
      raw.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      raw.NODE_ENV,
  },
  features: {
    cleanScoreAi,
    useFakeData,
  },
};

export type Env = typeof env;
