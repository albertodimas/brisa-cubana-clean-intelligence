import { Hono } from "hono";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";

function envFlag(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

const features = new Hono();
features.use("/*", rateLimiter(RateLimits.read));

features.get("/", (c) => {
  const cleanScoreEnabled =
    envFlag(process.env.CLEAN_SCORE_AI) ||
    envFlag(process.env.ENABLE_CLEANSCORE);
  const conciergeEnabled = process.env.CONCIERGE_MODE
    ? process.env.CONCIERGE_MODE.toLowerCase() !== "off"
    : envFlag(process.env.ENABLE_AI_CONCIERGE);
  const paymentsEnabled = envFlag(process.env.ENABLE_PAYMENTS ?? "true");

  return c.json({
    generatedAt: new Date().toISOString(),
    features: {
      cleanScoreAI: {
        enabled: cleanScoreEnabled,
        source: cleanScoreEnabled
          ? process.env.CLEAN_SCORE_AI
            ? "CLEAN_SCORE_AI"
            : "ENABLE_CLEANSCORE"
          : null,
      },
      conciergeAI: {
        enabled: conciergeEnabled,
        mode: process.env.CONCIERGE_MODE ?? (conciergeEnabled ? "llm" : "mock"),
      },
      payments: {
        enabled: paymentsEnabled,
      },
    },
  });
});

export default features;
