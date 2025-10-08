import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { prisma } from "./lib/prisma.js";
import { loggingMiddleware } from "./middleware/logging.js";
import bookings from "./routes/bookings.js";
import services from "./routes/services.js";
import properties from "./routes/properties.js";
import customers from "./routes/customers.js";
import auth from "./routes/auth.js";

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
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const rootHandler = (c: Context) =>
  c.json({
    service: "Brisa Cubana Clean Intelligence API",
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });

const healthHandler = async (c: Context) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
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

// Routes for standalone deployment (without /api prefix)
app.get("/", rootHandler);
app.get("/health", healthHandler);

// Routes for monorepo deployment (with /api prefix)
app.get("/api", rootHandler);
app.get("/api/health", healthHandler);

app.route("/api/services", services);
app.route("/api/properties", properties);
app.route("/api/customers", customers);
app.route("/api/bookings", bookings);
// Note: Using /api/authentication instead of /api/auth because Vercel
// reserves /api/auth/* for NextAuth in Next.js projects
app.route("/api/authentication", auth);

export default app;
