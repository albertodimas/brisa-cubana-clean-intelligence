import { beforeEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;

describe("generateAIResponse", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    globalThis.fetch = originalFetch;
  });

  it("returns mock response by default", async () => {
    const { generateAIResponse } = await import("./ai");

    const response = await generateAIResponse(
      [{ role: "USER", content: "Hola" }],
      {
        user: { email: "client@example.com" },
        availableServices: [{ name: "Deep Clean", basePrice: 150 }],
      },
    );

    expect(response.model).toBe("mock-concierge-v1");
    expect(response.content).toContain("Brisa Cubana");
  });

  it("falls back to mock when OpenAI provider lacks API key", async () => {
    process.env.AI_PROVIDER = "openai";
    const { generateAIResponse } = await import("./ai");

    const response = await generateAIResponse(
      [{ role: "USER", content: "Necesito precios" }],
      {
        user: { email: "client@example.com" },
        availableServices: [{ name: "Standard", basePrice: 100 }],
      },
    );

    expect(response.model).toBe("mock-concierge-v1");
    expect(response.content).toContain("servicios");
  });

  it("falls back to mock when OpenAI request fails", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({}) as unknown,
    });

    const { generateAIResponse } = await import("./ai");

    const response = await generateAIResponse(
      [{ role: "USER", content: "Hola" }],
      {
        user: { email: "client@example.com" },
        availableServices: [{ name: "Post-Construction", basePrice: 249 }],
      },
    );

    expect(response.model).toBe("mock-concierge-v1");
    expect(response.content).toContain("Brisa Cubana");
  });
});
