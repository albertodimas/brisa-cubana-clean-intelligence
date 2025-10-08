import { serve } from "@hono/node-server";
import app from "./app.js";
import { logServerStart } from "./lib/logger.js";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

serve({ fetch: app.fetch, port }, ({ port: boundPort }) => {
  logServerStart(boundPort);
});
