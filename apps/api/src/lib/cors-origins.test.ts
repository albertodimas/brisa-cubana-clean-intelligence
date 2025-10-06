import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildAllowedOrigins, originMatcher } from "./cors-origins";

describe("CORS Origins", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalWebAppUrl = process.env.WEB_APP_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.WEB_APP_URL = originalWebAppUrl;
    process.env.VERCEL_URL = originalVercelUrl;
  });

  describe("buildAllowedOrigins", () => {
    it("should return development origins in dev environment", () => {
      process.env.NODE_ENV = "development";
      const origins = buildAllowedOrigins();

      expect(origins).toContain("http://localhost:3000");
      expect(origins).toContain("http://127.0.0.1:3000");
      expect(origins).toContain("http://localhost:3001");
      expect(origins).toContain("http://127.0.0.1:3001");
    });

    it("should return production origins in production environment", () => {
      process.env.NODE_ENV = "production";
      const origins = buildAllowedOrigins();

      expect(origins).toContain("https://brisacubana.com");
      expect(origins).toContain("https://www.brisacubana.com");
      expect(origins).toContain("https://app.brisacubana.com");
      expect(origins).toContain("https://brisa-cubana.vercel.app");
    });

    it("should include WEB_APP_URL if provided", () => {
      process.env.NODE_ENV = "production";
      process.env.WEB_APP_URL = "https://custom.example.com";
      const origins = buildAllowedOrigins();

      expect(origins).toContain("https://custom.example.com");
    });

    it("should include VERCEL_URL if provided", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_URL = "custom-preview.vercel.app";
      const origins = buildAllowedOrigins();

      expect(origins).toContain("https://custom-preview.vercel.app");
    });

    it("should normalize WEB_APP_URL to origin only", () => {
      process.env.NODE_ENV = "production";
      process.env.WEB_APP_URL = "https://example.com/path/to/resource";
      const origins = buildAllowedOrigins();

      expect(origins).toContain("https://example.com");
      expect(origins).not.toContain("https://example.com/path/to/resource");
    });

    it("should handle invalid WEB_APP_URL gracefully", () => {
      process.env.NODE_ENV = "production";
      process.env.WEB_APP_URL = "not-a-valid-url";
      const origins = buildAllowedOrigins();

      // Should not include the invalid URL
      expect(origins).not.toContain("not-a-valid-url");
      // Should still contain production origins
      expect(origins).toContain("https://brisacubana.com");
    });

    it("should remove duplicate origins", () => {
      process.env.NODE_ENV = "production";
      process.env.WEB_APP_URL = "https://brisacubana.com"; // duplicate
      const origins = buildAllowedOrigins();

      const count = origins.filter(
        (o) => o === "https://brisacubana.com",
      ).length;
      expect(count).toBe(1);
    });
  });

  describe("originMatcher", () => {
    it("should allow approved origins", () => {
      const origins = ["http://localhost:3000", "https://brisacubana.com"];
      const matcher = originMatcher(origins);

      expect(matcher("http://localhost:3000")).toBe("http://localhost:3000");
      expect(matcher("https://brisacubana.com")).toBe(
        "https://brisacubana.com",
      );
    });

    it("should block unknown origins", () => {
      const origins = ["http://localhost:3000", "https://brisacubana.com"];
      const matcher = originMatcher(origins);

      expect(matcher("https://evil.com")).toBeNull();
      expect(matcher("https://malicious.attacker.com")).toBeNull();
    });

    it("should return null for missing origin header", () => {
      const origins = ["http://localhost:3000", "https://brisacubana.com"];
      const matcher = originMatcher(origins);

      expect(matcher(undefined)).toBeNull();
    });

    it("should be case-sensitive for origins", () => {
      const origins = ["https://brisacubana.com"];
      const matcher = originMatcher(origins);

      expect(matcher("https://brisacubana.com")).toBe(
        "https://brisacubana.com",
      );
      expect(matcher("https://BRISACUBANA.COM")).toBeNull();
      expect(matcher("https://BrisaCubana.com")).toBeNull();
    });

    it("should not match origins with different protocols", () => {
      const origins = ["https://brisacubana.com"];
      const matcher = originMatcher(origins);

      expect(matcher("http://brisacubana.com")).toBeNull();
    });

    it("should not match origins with different ports", () => {
      const origins = ["http://localhost:3000"];
      const matcher = originMatcher(origins);

      expect(matcher("http://localhost:3001")).toBeNull();
      expect(matcher("http://localhost:8080")).toBeNull();
    });

    it("should handle origins with subdomains correctly", () => {
      const origins = [
        "https://www.brisacubana.com",
        "https://brisacubana.com",
      ];
      const matcher = originMatcher(origins);

      expect(matcher("https://www.brisacubana.com")).toBe(
        "https://www.brisacubana.com",
      );
      expect(matcher("https://brisacubana.com")).toBe(
        "https://brisacubana.com",
      );
      expect(matcher("https://api.brisacubana.com")).toBeNull();
    });
  });
});
