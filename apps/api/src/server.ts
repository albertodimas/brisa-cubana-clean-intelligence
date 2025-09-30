import { serve } from '@hono/node-server';
import { app } from './app';

const port = Number.parseInt(process.env.PORT ?? '3333', 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(
    `API ready on http://localhost:${info.port} (pid ${process.pid}, env ${process.env.NODE_ENV ?? 'development'})`
  );
});
