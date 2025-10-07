import { Hono } from "hono";
import { cors } from "hono/cors";
import { prisma } from "./lib/prisma";
import bookings from "./routes/bookings";
import services from "./routes/services";
import auth from "./routes/auth";

const app = new Hono();

const allowedOrigin = process.env.WEB_APP_URL ?? "http://localhost:3000";

app.use("*", cors({
  origin: allowedOrigin,
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

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
app.route("/api/auth", auth);

export default app;
