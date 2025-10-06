import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

describe("buildCsp", () => {
  it("genera una política sin unsafe-inline y con nonce por request", () => {
    const nonce = "test-nonce";
    const policy = buildCsp({
      nonce,
      connectSrcValue: ["'self'", "https://api.brisacubana.com"],
    });

    expect(policy).toContain(
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    );
    expect(policy).toContain(`style-src 'self' 'nonce-${nonce}'`);
    expect(policy).toContain("connect-src 'self' https://api.brisacubana.com");
    expect(policy.includes("unsafe-inline")).toBe(false);
  });

  it("incluye directivas defensivas clave", () => {
    const policy = buildCsp({
      nonce: "abc123",
      connectSrcValue: ["'self'"],
    });

    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("upgrade-insecure-requests");
  });
});
