/**
 * k6 Stress Test
 *
 * Objetivo: Encontrar el punto de quiebre del sistema
 * VUs: 50 → 200 (ramping incremental)
 * Duración: 10 minutos
 *
 * Uso:
 *   k6 run tests/load/stress.test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const authErrors = new Counter('auth_errors');
const dbErrors = new Counter('db_errors');
const timeoutErrors = new Counter('timeout_errors');

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const TEST_CLIENT_EMAIL = __ENV.TEST_CLIENT_EMAIL || 'client@brisacubanaclean.com';
const TEST_CLIENT_PASSWORD = __ENV.TEST_CLIENT_PASSWORD || 'Client123!';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50
    { duration: '3m', target: 100 },  // Ramp up to 100
    { duration: '2m', target: 150 },  // Ramp up to 150
    { duration: '1m', target: 200 },  // Peak at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    // Thresholds más relajados - queremos ver cuándo falla
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.20'], // Toleramos hasta 20% de errores
    'errors': ['rate<0.20'],
  },
};

export function setup() {
  const loginRes = http.post(
    `${API_BASE_URL}/auth/login`,
    JSON.stringify({
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!check(loginRes, { 'login OK': (r) => r.status === 200 })) {
    throw new Error('Setup failed: login error');
  }

  return {
    token: loginRes.json('accessToken'),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Mix de operaciones para simular carga real diversa

  // READ operations (60%)
  if (Math.random() < 0.6) {
    const endpoint = Math.random() < 0.5 ? 'bookings' : 'properties';
    const res = http.get(`${API_BASE_URL}/${endpoint}`, { headers });

    const success = check(res, {
      'read success': (r) => r.status === 200,
    });

    if (!success) {
      errorRate.add(1);
      if (res.status === 401 || res.status === 403) authErrors.add(1);
      if (res.status === 500 || res.status === 503) dbErrors.add(1);
      if (res.status === 0) timeoutErrors.add(1);
    }
  }

  sleep(0.5); // Menor sleep = mayor presión

  // WRITE operations (30%)
  if (Math.random() < 0.3) {
    const scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = http.post(
      `${API_BASE_URL}/bookings`,
      JSON.stringify({
        propertyId: 'property-1', // Asumiendo seed data
        serviceId: 'basic-clean-1',
        scheduledFor,
        notes: `Stress test - VU${__VU}-ITER${__ITER}`,
      }),
      { headers }
    );

    const success = check(res, {
      'write success': (r) => r.status === 201 || r.status === 200,
      'no server error': (r) => r.status < 500,
    });

    if (!success) {
      errorRate.add(1);
      if (res.status >= 500) dbErrors.add(1);
    }
  }

  sleep(0.5);

  // Health check (10% - monitorear estado del sistema)
  if (Math.random() < 0.1) {
    const healthRes = http.get(`${API_BASE_URL}/health`);
    check(healthRes, {
      'system healthy': (r) => r.status === 200,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      metrics: {
        http_req_duration_p95: data.metrics.http_req_duration.values['p(95)'],
        http_req_duration_p99: data.metrics.http_req_duration.values['p(99)'],
        http_req_failed_rate: data.metrics.http_req_failed.values.rate,
        error_rate: data.metrics.errors?.values.rate || 0,
        auth_errors: data.metrics.auth_errors?.values.count || 0,
        db_errors: data.metrics.db_errors?.values.count || 0,
        timeout_errors: data.metrics.timeout_errors?.values.count || 0,
      },
      summary: 'Stress test completed - check for degradation patterns',
    }, null, 2),
  };
}
