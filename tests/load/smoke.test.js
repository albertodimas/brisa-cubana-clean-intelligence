/**
 * k6 Smoke Test
 *
 * Objetivo: Verificar que el sistema funciona bajo carga mínima (1 VU)
 * Duración: 1 minuto
 *
 * Uso:
 *   k6 run tests/load/smoke.test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');

// Configuración
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const TEST_ADMIN_EMAIL = __ENV.TEST_ADMIN_EMAIL || 'admin@brisacubanaclean.com';
const TEST_ADMIN_PASSWORD = __ENV.TEST_ADMIN_PASSWORD || 'Admin123!';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    'http_req_failed': ['rate<0.01'], // < 1% errors
    'errors': ['rate<0.01'],
  },
};

// Token global (compartido entre iteraciones)
let authToken = null;

export function setup() {
  // Autenticación inicial
  const loginRes = http.post(
    `${API_BASE_URL}/auth/login`,
    JSON.stringify({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('accessToken') !== undefined,
  });

  return {
    token: loginRes.json('accessToken'),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // 1. Health Check
  const healthRes = http.get(`${API_BASE_URL}/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health has status field': (r) => r.json('status') !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Get Services
  const servicesRes = http.get(`${API_BASE_URL}/services`, { headers });
  check(servicesRes, {
    'services status 200': (r) => r.status === 200,
    'services is array': (r) => Array.isArray(r.json()),
  }) || errorRate.add(1);

  sleep(1);

  // 3. Get Properties
  const propertiesRes = http.get(`${API_BASE_URL}/properties`, { headers });
  check(propertiesRes, {
    'properties status 200': (r) => r.status === 200,
    'properties has data': (r) => r.json('data') !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // 4. Get Bookings
  const bookingsRes = http.get(`${API_BASE_URL}/bookings`, { headers });
  check(bookingsRes, {
    'bookings status 200': (r) => r.status === 200,
    'bookings has data': (r) => r.json('data') !== undefined,
  }) || errorRate.add(1);

  sleep(2);
}

export function teardown(data) {
  // Logout (opcional - tokens expiran automáticamente)
  if (data.token) {
    http.post(
      `${API_BASE_URL}/auth/logout`,
      null,
      {
        headers: { 'Authorization': `Bearer ${data.token}` },
      }
    );
  }
}
