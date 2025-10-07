import { Hono } from "hono";
import { prisma } from "./lib/prisma";
import bookings from "./routes/bookings";
import services from "./routes/services";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    service: "Brisa Cubana Clean Intelligence API",
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({
      checks: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV ?? "development",
        database: "ok",
      },
      status: "pass",
    });
  } catch (error) {
    c.status(500);
    return c.json({
      checks: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV ?? "development",
        database: "error",
      },
      status: "fail",
      error:
        error instanceof Error ? error.message : "Unknown database connectivity issue",
    });
  }
});

app.route("/api/services", services);
app.route("/api/bookings", bookings);

export default app;
