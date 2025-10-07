import { serve } from "@hono/node-server";
import app from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

serve({ fetch: app.fetch, port }, ({ port: boundPort }) => {
  console.log(`API server running on http://localhost:${boundPort}`);
});
