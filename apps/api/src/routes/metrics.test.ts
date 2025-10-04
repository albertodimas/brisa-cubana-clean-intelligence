import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import metrics from "./metrics";
import { register } from "../lib/metrics";

const app = new Hono();
app.route("/metrics", metrics);

describe("metrics route", () => {
  beforeEach(() => {
    register.resetMetrics();
  });

  it("retorna métricas cuando el registro está disponible", async () => {
    const response = await app.request("/metrics");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    const body = await response.text();
    expect(body).toContain("brisa_api_http_requests_total");
  });

  it("maneja errores del registro", async () => {
    const spy = vi
      .spyOn(register, "metrics")
      .mockRejectedValueOnce(new Error("collect failed"));

    const response = await app.request("/metrics");

    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.error).toBe("Failed to collect metrics");
    expect(body.message).toBe("collect failed");

    spy.mockRestore();
  });
});
