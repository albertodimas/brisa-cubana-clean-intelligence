import { serve } from "@hono/node-server";
import app from "./app.js";
import { logServerStart } from "./lib/logger.js";
import "./lib/unhandled.js";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

serve(
  {
    fetch: (request, connInfo) => {
      const remoteAddress =
        connInfo?.incoming?.socket?.remoteAddress ??
        connInfo?.incoming?.connection?.remoteAddress ??
        null;

      if (!remoteAddress) {
        return app.fetch(request, connInfo);
      }

      const headers = new Headers(request.headers);
      headers.set("x-internal-remote-address", remoteAddress);

      const enrichedRequest = new Request(request, { headers });
      return app.fetch(enrichedRequest, connInfo);
    },
    port,
  },
  ({ port: boundPort }) => {
    logServerStart(boundPort);
  },
);
