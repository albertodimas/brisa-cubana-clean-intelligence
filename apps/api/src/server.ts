import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number.parseInt(
  process.env.API_PORT ?? process.env.PORT ?? "3001",
  10,
);

serve(
  {
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0", // Listen on all network interfaces for Docker
  },
  (info) => {
    console.log(
      `API ready on http://localhost:${info.port} (pid ${process.pid}, env ${process.env.NODE_ENV ?? "development"})`,
    );
  },
);
