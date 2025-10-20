import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { apiReference } from "@scalar/hono-api-reference";
import { loggingMiddleware } from "./middleware/logging.js";
import { initSentry, Sentry } from "./lib/sentry.js";
import { openApiSpec } from "./lib/openapi-spec.js";
import { getPrisma, initializeContainer } from "./container.js";
import bookings from "./routes/bookings.js";
import services from "./routes/services.js";
import properties from "./routes/properties.js";
import customers from "./routes/customers.js";
import auth from "./routes/auth.js";
import users from "./routes/users.js";
import notifications from "./routes/notifications.js";
import testUtils from "./routes/test-utils.js";
import payments from "./routes/payments.js";
import portalAuth from "./routes/portal-auth.js";
import portalBookings from "./routes/portal-bookings.js";

// Initialize Dependency Injection Container
initializeContainer();

// Initialize Sentry
initSentry();

const app = new Hono();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"];

// Logging middleware global
app.use("*", loggingMiddleware);

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const rootHandler = (c: Context) =>
  c.json({
    service: "Brisa Cubana Clean Intelligence API",
    status: "ok",
    version: "0.4.1",
    timestamp: new Date().toISOString(),
  });

const healthHandler = async (c: Context) => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return c.json({
      checks: {
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV ?? "development",
        database: "ok",
      },
      status: "pass",
    });
  } catch (error) {
    c.status(500);
    return c.json({
      checks: {
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV ?? "development",
        database: "error",
      },
      status: "fail",
      error:
        error instanceof Error
          ? error.message
          : "Unknown database connectivity issue",
    });
  }
};

const publicHealthHandler = async (c: Context) => {
  const expectedToken = process.env.HEALTH_CHECK_TOKEN;
  const headerToken = c.req.header("authorization");
  const bearerToken = headerToken?.startsWith("Bearer ")
    ? headerToken.slice("Bearer ".length).trim()
    : undefined;
  const queryToken = c.req.query("token");
  const providedToken = bearerToken ?? queryToken ?? "";

  if (expectedToken && providedToken !== expectedToken) {
    return c.json(
      {
        status: "unauthorized",
        error: "Missing or invalid health check token",
      },
      401,
    );
  }

  return healthHandler(c);
};

// Routes for standalone deployment (without /api prefix)
app.get("/", rootHandler);
app.get("/health", healthHandler);
app.get("/healthz", publicHealthHandler);

// Routes for monorepo deployment (with /api prefix)
app.get("/api", rootHandler);
app.get("/api/health", healthHandler);
app.get("/api/healthz", publicHealthHandler);

// OpenAPI Specification JSON endpoint
app.get("/api/openapi.json", (c) => c.json(openApiSpec));

// API Documentation with Scalar
app.get(
  "/api/docs",
  apiReference({
    url: "/api/openapi.json",
    theme: "purple",
    pageTitle: "Brisa Cubana Clean Intelligence API",
  }),
);

// Business endpoints
app.route("/api/services", services);
app.route("/api/properties", properties);
app.route("/api/customers", customers);
app.route("/api/bookings", bookings);
app.route("/api/users", users);
app.route("/api/notifications", notifications);
app.route("/api/payments", payments);
app.route("/api/portal/auth", portalAuth);
app.route("/api/portal/bookings", portalBookings);
if (process.env.ENABLE_TEST_UTILS === "true") {
  app.route("/api/test-utils", testUtils);
}
// Note: Using /api/authentication instead of /api/auth because Vercel
// reserves /api/auth/* for NextAuth in Next.js projects
app.route("/api/authentication", auth);

// Global error handler - capture errors with Sentry
app.onError((err, c) => {
  // Only capture errors with status >= 500 (server errors)
  if (!c.res.ok && c.res.status >= 500) {
    Sentry.captureException(err, {
      contexts: {
        request: {
          method: c.req.method,
          url: c.req.url,
          headers: Object.fromEntries(c.req.raw.headers),
        },
      },
    });
  }

  // Re-throw to let Hono handle the response
  throw err;
});

export default app;
