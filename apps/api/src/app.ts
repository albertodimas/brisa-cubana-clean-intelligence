import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import services from './routes/services';
import bookings from './routes/bookings';
import users from './routes/users';

export const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Health check
app.get('/', (c) =>
  c.json({
    service: 'Brisa Cubana Clean Intelligence API',
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  })
);

app.get('/healthz', (c) =>
  c.json({
    ok: true
  })
);

// API routes
app.route('/api/services', services);
app.route('/api/bookings', bookings);
app.route('/api/users', users);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});
