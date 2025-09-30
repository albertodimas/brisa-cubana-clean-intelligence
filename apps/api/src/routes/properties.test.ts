import { describe, it, expect } from "vitest";
import properties from "./properties";

describe("Properties Routes", () => {
  describe("GET /", () => {
    it("should require authentication", async () => {
      const res = await properties.request("/");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /", () => {
    it("should require authentication", async () => {
      const res = await properties.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Property",
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /:id", () => {
    it("should require authentication", async () => {
      const res = await properties.request("/test-id");
      expect(res.status).toBe(401);
    });
  });
});
