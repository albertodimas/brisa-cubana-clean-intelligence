import { app } from './app';
import { test, expect } from 'vitest';

const handler = app.fetch;

test('GET / responds with service payload', async () => {
  const request = new Request('http://localhost/');
  const response = await handler(request);
  expect(response.status).toBe(200);
  const json = (await response.json()) as { service: string; status?: string };
  expect(json).toMatchObject({ service: 'Brisa Cubana Clean Intelligence API' });
});

test('GET /healthz returns ok', async () => {
  const request = new Request('http://localhost/healthz');
  const response = await handler(request);
  expect(response.status).toBe(200);
  const json = (await response.json()) as { ok: boolean };
  expect(json).toMatchObject({ ok: true });
});
