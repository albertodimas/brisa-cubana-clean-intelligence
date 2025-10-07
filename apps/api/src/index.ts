import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    name: "Brisa Cubana API",
    version: "0.1.0",
    status: "ok",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Export for Vercel Functions
export default app;

// Development server
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT) || 3001;
  console.log(`🚀 Server running at http://localhost:${port}`);

  // @ts-ignore - Bun/Node serve
  Bun?.serve?.({
    fetch: app.fetch,
    port,
  }) ?? await import("@hono/node-server").then(({ serve }) =>
    serve({ fetch: app.fetch, port })
  );
}
