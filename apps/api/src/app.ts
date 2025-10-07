import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    service: "Brisa Cubana Clean Intelligence API",
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/health", (c) =>
  c.json({
    checks: {
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? "development",
    },
    status: "pass",
  }),
);

export default app;
