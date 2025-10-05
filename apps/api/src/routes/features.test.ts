import { describe, it, expect, beforeEach, afterEach } from "vitest";
import features from "./features";

describe("Features Route", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe("GET /", () => {
    it("should return feature flags with all disabled by default", async () => {
      // Clear all feature flags
      delete process.env.CLEAN_SCORE_AI;
      delete process.env.ENABLE_CLEANSCORE;
      delete process.env.CONCIERGE_MODE;
      delete process.env.ENABLE_AI_CONCIERGE;
      delete process.env.ENABLE_PAYMENTS;

      const res = await features.request("/");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.generatedAt).toBeDefined();
      expect(data.features).toMatchObject({
        cleanScoreAI: {
          enabled: false,
          source: null,
        },
        conciergeAI: {
          enabled: false,
          mode: "mock",
        },
        payments: {
          enabled: true, // defaults to true
        },
      });
    });

    it("should enable CleanScore AI via CLEAN_SCORE_AI flag", async () => {
      process.env.CLEAN_SCORE_AI = "1";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
      expect(data.features.cleanScoreAI.source).toBe("CLEAN_SCORE_AI");
    });

    it("should enable CleanScore AI via ENABLE_CLEANSCORE flag", async () => {
      delete process.env.CLEAN_SCORE_AI;
      process.env.ENABLE_CLEANSCORE = "true";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
      expect(data.features.cleanScoreAI.source).toBe("ENABLE_CLEANSCORE");
    });

    it("should recognize '1' as true for feature flags", async () => {
      process.env.ENABLE_CLEANSCORE = "1";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
    });

    it("should recognize 'true' as true for feature flags", async () => {
      process.env.ENABLE_CLEANSCORE = "true";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
    });

    it("should recognize 'TRUE' (case insensitive) as true", async () => {
      process.env.ENABLE_CLEANSCORE = "TRUE";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
    });

    it("should recognize 'on' as true for feature flags", async () => {
      process.env.ENABLE_CLEANSCORE = "on";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
    });

    it("should recognize 'ON' (case insensitive) as true", async () => {
      process.env.ENABLE_CLEANSCORE = "ON";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
    });

    it("should handle whitespace in flag values", async () => {
      process.env.ENABLE_CLEANSCORE = "  true  ";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
    });

    it("should treat '0' as false", async () => {
      process.env.ENABLE_CLEANSCORE = "0";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(false);
    });

    it("should treat 'false' as false", async () => {
      process.env.ENABLE_CLEANSCORE = "false";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(false);
    });

    it("should treat empty string as false", async () => {
      process.env.ENABLE_CLEANSCORE = "";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(false);
    });

    it("should enable Concierge AI via CONCIERGE_MODE", async () => {
      process.env.CONCIERGE_MODE = "llm";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.conciergeAI.enabled).toBe(true);
      expect(data.features.conciergeAI.mode).toBe("llm");
    });

    it("should disable Concierge when CONCIERGE_MODE is 'off'", async () => {
      process.env.CONCIERGE_MODE = "off";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.conciergeAI.enabled).toBe(false);
      expect(data.features.conciergeAI.mode).toBe("off");
    });

    it("should enable Concierge via ENABLE_AI_CONCIERGE", async () => {
      delete process.env.CONCIERGE_MODE;
      process.env.ENABLE_AI_CONCIERGE = "1";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.conciergeAI.enabled).toBe(true);
      expect(data.features.conciergeAI.mode).toBe("llm");
    });

    it("should use mock mode when Concierge is disabled", async () => {
      delete process.env.CONCIERGE_MODE;
      delete process.env.ENABLE_AI_CONCIERGE;

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.conciergeAI.enabled).toBe(false);
      expect(data.features.conciergeAI.mode).toBe("mock");
    });

    it("should enable payments by default", async () => {
      delete process.env.ENABLE_PAYMENTS;

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.payments.enabled).toBe(true);
    });

    it("should allow disabling payments", async () => {
      process.env.ENABLE_PAYMENTS = "0";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.payments.enabled).toBe(false);
    });

    it("should include ISO timestamp", async () => {
      const res = await features.request("/");
      const data = await res.json();

      expect(data.generatedAt).toBeDefined();
      const timestamp = new Date(data.generatedAt);
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(timestamp.toISOString()).toBe(data.generatedAt);
    });

    it("should prioritize CLEAN_SCORE_AI over ENABLE_CLEANSCORE", async () => {
      process.env.CLEAN_SCORE_AI = "1";
      process.env.ENABLE_CLEANSCORE = "1";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.source).toBe("CLEAN_SCORE_AI");
    });

    it("should handle all features enabled simultaneously", async () => {
      process.env.CLEAN_SCORE_AI = "1";
      process.env.CONCIERGE_MODE = "llm";
      process.env.ENABLE_PAYMENTS = "true";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(true);
      expect(data.features.conciergeAI.enabled).toBe(true);
      expect(data.features.payments.enabled).toBe(true);
    });

    it("should handle all features disabled", async () => {
      process.env.CLEAN_SCORE_AI = "0";
      process.env.CONCIERGE_MODE = "off";
      process.env.ENABLE_PAYMENTS = "false";

      const res = await features.request("/");
      const data = await res.json();

      expect(data.features.cleanScoreAI.enabled).toBe(false);
      expect(data.features.conciergeAI.enabled).toBe(false);
      expect(data.features.payments.enabled).toBe(false);
    });
  });
});
