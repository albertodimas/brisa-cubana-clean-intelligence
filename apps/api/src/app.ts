import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import services from "./routes/services";
import bookings from "./routes/bookings";
import users from "./routes/users";
import auth from "./routes/auth";
import payments from "./routes/payments";
import alerts from "./routes/alerts";
import notes from "./routes/reconciliation";
import { Sentry, sentryEnabled } from "./telemetry/sentry";

export const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);

// Health check
app.get("/", (c) =>
  c.json({
    service: "Brisa Cubana Clean Intelligence API",
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/healthz", (c) =>
  c.json({
    ok: true,
  }),
);

// API routes
app.route("/api/services", services);
app.route("/api/bookings", bookings);
app.route("/api/users", users);
app.route("/api/auth", auth);
app.route("/api/payments", payments);
app.route("/api/alerts", alerts);
app.route("/api/reconciliation", notes);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  if (sentryEnabled) {
    Sentry.captureException(err);
  }
  return c.json({ error: err.message || "Internal server error" }, 500);
});
