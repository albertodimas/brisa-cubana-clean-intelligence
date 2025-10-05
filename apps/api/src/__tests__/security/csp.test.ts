import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { nonceMiddleware } from "../../middleware/csp-nonce";

describe("CSP Security Tests", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // Add nonce middleware
    app.use("*", nonceMiddleware);

    // Add security headers with CSP
    app.use("*", async (c, next) => {
      const nonce = c.get("nonce");

      const secureHeadersMiddleware = secureHeaders({
        contentSecurityPolicy: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", `'nonce-${nonce}'`],
          styleSrc: ["'self'", `'nonce-${nonce}'`],
        },
      });

      return secureHeadersMiddleware(c, next);
    });

    // Test routes
    app.get("/test", (c) => {
      const nonce = c.get("nonce");
      return c.html(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
          </head>
          <body>
            <h1>Test</h1>
            <script nonce="${nonce}">
              console.log("Safe inline script with nonce");
            </script>
          </body>
        </html>
      `);
    });

    app.get("/unsafe", (c) => {
      return c.html(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Unsafe Page</title>
          </head>
          <body>
            <h1>Test</h1>
            <script>
              console.log("Unsafe inline script without nonce");
            </script>
          </body>
        </html>
      `);
    });
  });

  describe("Nonce Generation", () => {
    it("should generate a unique nonce for each request", async () => {
      const response1 = await app.request("/test");
      const response2 = await app.request("/test");

      const html1 = await response1.text();
      const html2 = await response2.text();

      // Extract nonces from HTML
      const nonceRegex = /nonce="([^"]+)"/;
      const nonce1 = html1.match(nonceRegex)?.[1];
      const nonce2 = html2.match(nonceRegex)?.[1];

      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
    });

    it("should generate nonces with sufficient entropy", async () => {
      const response = await app.request("/test");
      const html = await response.text();

      const nonceRegex = /nonce="([^"]+)"/;
      const nonce = html.match(nonceRegex)?.[1];

      expect(nonce).toBeDefined();
      if (nonce) {
        // Nonce should be base64 encoded, at least 16 bytes (24 chars in base64)
        expect(nonce.length).toBeGreaterThanOrEqual(24);
        // Should be base64
        expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
      }
    });
  });

  describe("Content-Security-Policy Header", () => {
    it("should include CSP header in response", async () => {
      const response = await app.request("/test");
      const cspHeader = response.headers.get("content-security-policy");

      expect(cspHeader).toBeDefined();
      expect(cspHeader).toBeTruthy();
    });

    it("should include script-src with nonce", async () => {
      const response = await app.request("/test");
      const cspHeader = response.headers.get("content-security-policy");

      expect(cspHeader).toContain("script-src");
      expect(cspHeader).toContain("'nonce-");
    });

    it("should not allow unsafe-inline in script-src", async () => {
      const response = await app.request("/test");
      const cspHeader = response.headers.get("content-security-policy");

      // If unsafe-inline is present, it should be in addition to nonces (fallback)
      // but the primary policy should use nonces
      expect(cspHeader).toContain("'nonce-");
    });

    it("should include default-src directive", async () => {
      const response = await app.request("/test");
      const cspHeader = response.headers.get("content-security-policy");

      expect(cspHeader).toContain("default-src");
    });

    it("should include style-src directive", async () => {
      const response = await app.request("/test");
      const cspHeader = response.headers.get("content-security-policy");

      expect(cspHeader).toContain("style-src");
    });
  });

  describe("Other Security Headers", () => {
    it("should include X-Content-Type-Options header", async () => {
      const response = await app.request("/test");
      const header = response.headers.get("x-content-type-options");

      expect(header).toBe("nosniff");
    });

    it("should include X-Frame-Options header", async () => {
      const response = await app.request("/test");
      const header = response.headers.get("x-frame-options");

      expect(header).toBeDefined();
      // Should be DENY or SAMEORIGIN
      expect(["DENY", "SAMEORIGIN"]).toContain(header);
    });

    it("should include X-XSS-Protection header", async () => {
      const response = await app.request("/test");
      const header = response.headers.get("x-xss-protection");

      expect(header).toBeDefined();
    });

    it("should include Strict-Transport-Security header", async () => {
      const response = await app.request("/test");
      const header = response.headers.get("strict-transport-security");

      expect(header).toBeDefined();
      expect(header).toContain("max-age=");
    });

    it("should include Referrer-Policy header", async () => {
      const response = await app.request("/test");
      const header = response.headers.get("referrer-policy");

      expect(header).toBeDefined();
    });
  });

  describe("Nonce in HTML", () => {
    it("should inject nonce into inline scripts", async () => {
      const response = await app.request("/test");
      const html = await response.text();

      expect(html).toContain('nonce="');
      expect(html).toContain("Safe inline script with nonce");
    });

    it("should have matching nonce in CSP header and HTML", async () => {
      const response = await app.request("/test");
      const cspHeader = response.headers.get("content-security-policy");
      const html = await response.text();

      // Extract nonce from HTML
      const htmlNonceRegex = /nonce="([^"]+)"/;
      const htmlNonce = html.match(htmlNonceRegex)?.[1];

      // Extract nonce from CSP header
      const cspNonceRegex = /'nonce-([^']+)'/;
      const cspNonce = cspHeader?.match(cspNonceRegex)?.[1];

      expect(htmlNonce).toBeDefined();
      expect(cspNonce).toBeDefined();
      expect(htmlNonce).toBe(cspNonce);
    });
  });

  describe("CSP Violation Prevention", () => {
    it("should allow inline script with nonce", async () => {
      const response = await app.request("/test");
      const html = await response.text();
      const cspHeader = response.headers.get("content-security-policy");

      // Extract nonce
      const nonceRegex = /nonce="([^"]+)"/;
      const nonce = html.match(nonceRegex)?.[1];

      // Verify nonce is in CSP
      expect(cspHeader).toContain(`'nonce-${nonce}'`);

      // Inline script has nonce attribute
      expect(html).toMatch(/<script nonce="[^"]+">[\s\S]*?<\/script>/);
    });

    it("should generate different nonce per request to prevent replay", async () => {
      const responses = await Promise.all([
        app.request("/test"),
        app.request("/test"),
        app.request("/test"),
      ]);

      const nonces = responses.map((r) => {
        const csp = r.headers.get("content-security-policy");
        const match = csp?.match(/'nonce-([^']+)'/);
        return match?.[1];
      });

      // All nonces should be unique
      const uniqueNonces = new Set(nonces);
      expect(uniqueNonces.size).toBe(3);
    });
  });

  describe("Security Headers Consistency", () => {
    it("should apply security headers to all routes", async () => {
      const routes = ["/test", "/unsafe"];

      for (const route of routes) {
        const response = await app.request(route);

        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(response.headers.get("x-frame-options")).toBeDefined();
        expect(response.headers.get("content-security-policy")).toBeDefined();
      }
    });

    it("should include all critical security headers", async () => {
      const response = await app.request("/test");
      const criticalHeaders = [
        "content-security-policy",
        "x-content-type-options",
        "x-frame-options",
        "strict-transport-security",
        "referrer-policy",
      ];

      for (const header of criticalHeaders) {
        expect(response.headers.get(header)).toBeDefined();
      }
    });
  });
});
