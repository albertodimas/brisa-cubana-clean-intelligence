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
import leads from "./routes/leads.js";
import invoices from "./routes/invoices.js";
import calendar from "./routes/calendar.js";
import marketing from "./routes/marketing.js";

// Initialize Dependency Injection Container
initializeContainer();

// Initialize Sentry
initSentry();

const app = new Hono();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"];

const isOriginAllowed = (origin: string | undefined) => {
  if (!origin) {
    return false;
  }

  if (allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.some((allowed) => {
    if (!allowed) {
      return false;
    }
    if (allowed.startsWith("*.")) {
      const suffix = allowed.slice(1);
      return origin.endsWith(suffix);
    }
    return origin === allowed;
  });
};

// Logging middleware global
app.use("*", loggingMiddleware);

app.use(
  "*",
  cors({
    origin: (origin) => (isOriginAllowed(origin) ? origin : null),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const rootHandler = (c: Context) =>
  c.json({
    service: "Brisa Cubana Clean Intelligence API",
    status: "ok",
    version: "0.4.2",
    timestamp: new Date().toISOString(),
  });

type ServiceCheck =
  | { status: "ok"; details?: Record<string, unknown> }
  | { status: "warning"; message: string }
  | { status: "error"; message: string }
  | { status: "disabled"; message: string };

const stripeHealthTimeoutMs = Number(
  process.env.HEALTH_STRIPE_TIMEOUT_MS ?? "3000",
);

async function checkDatabase(): Promise<ServiceCheck> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return { status: "ok" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    return {
      status: "error",
      message,
    };
  }
}

async function checkStripe(): Promise<ServiceCheck> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      status: "disabled",
      message: "STRIPE_SECRET_KEY not configured",
    };
  }
  if (process.env.STRIPE_HEALTH_CHECK_ENABLED === "false") {
    return {
      status: "disabled",
      message: "Stripe health check disabled by configuration",
    };
  }
  if (/brisa|demo/i.test(secret)) {
    return {
      status: "disabled",
      message: "Stripe placeholder key detected; skipping verification",
    };
  }

  const { default: Stripe } = await import("stripe");
  const runtimeApiVersion = process.env.STRIPE_API_VERSION ?? "2023-10-16";

  try {
    const client = new Stripe(secret, { apiVersion: runtimeApiVersion as any });
    await Promise.race([
      client.balance.retrieve(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Stripe health check timed out")),
          stripeHealthTimeoutMs,
        ),
      ),
    ]);
    return { status: "ok" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Stripe error";
    return {
      status: "warning",
      message,
    };
  }
}

function checkEmail(): ServiceCheck {
  const host = process.env.PORTAL_MAGIC_LINK_SMTP_HOST;
  const port = process.env.PORTAL_MAGIC_LINK_SMTP_PORT;
  const user = process.env.PORTAL_MAGIC_LINK_SMTP_USER;
  const pass = process.env.PORTAL_MAGIC_LINK_SMTP_PASSWORD;
  const from = process.env.PORTAL_MAGIC_LINK_FROM;

  if (!host || !port || !user || !pass || !from) {
    return {
      status: "disabled",
      message: "SMTP credentials not fully configured",
    };
  }

  return { status: "ok" };
}

function checkSentry(): ServiceCheck {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return {
      status: "disabled",
      message: "SENTRY_DSN not configured",
    };
  }

  const client = (Sentry as any).getCurrentHub?.()?.getClient?.() ?? null;
  if (!client) {
    return {
      status: "warning",
      message: "Sentry client not initialized",
    };
  }

  return { status: "ok" };
}

function calculateOverallStatus(checks: Record<string, ServiceCheck>): {
  overall: "pass" | "warn" | "fail";
  httpStatus: number;
} {
  const statuses = Object.values(checks).map((check) => check.status);

  if (statuses.includes("error")) {
    return { overall: "fail", httpStatus: 500 };
  }

  if (statuses.includes("warning")) {
    return { overall: "warn", httpStatus: 200 };
  }

  return { overall: "pass", httpStatus: 200 };
}

const healthHandler = async (c: Context) => {
  const [database, stripe] = await Promise.all([
    checkDatabase(),
    checkStripe(),
  ]);
  const email = checkEmail();
  const sentry = checkSentry();

  const checks: Record<string, ServiceCheck> = {
    database,
    stripe,
    email,
    sentry,
  };

  const { overall, httpStatus } = calculateOverallStatus(checks);

  return c.json(
    {
      status: overall,
      checks: {
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV ?? "development",
        ...checks,
      },
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus as any },
  );
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
app.route("/api/calendar", calendar);
app.route("/api/users", users);
app.route("/api/notifications", notifications);
app.route("/api/payments", payments);
app.route("/api/leads", leads);
app.route("/api/invoices", invoices);
app.route("/api/marketing", marketing);
app.route("/api/portal/auth", portalAuth);
app.route("/api/portal/bookings", portalBookings);
const testUtilsEnabled =
  process.env.ENABLE_TEST_UTILS === "true" ||
  process.env.PLAYWRIGHT_TEST_RUN === "true";
if (testUtilsEnabled) {
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
          headers: (() => {
            const collected: Record<string, string> = {};
            c.req.raw.headers.forEach((value, key) => {
              collected[key] = value;
            });
            return collected;
          })(),
        },
      },
    });
  }

  // Re-throw to let Hono handle the response
  throw err;
});

export default app;
