import { serve } from "@hono/node-server";
import app from "./app";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

serve({ fetch: app.fetch, port }, ({ port: boundPort }) => {
  // eslint-disable-next-line no-console -- CLI logging for local dev
  console.log(`API server running on http://localhost:${boundPort}`);
});
