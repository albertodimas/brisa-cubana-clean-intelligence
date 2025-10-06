/**
 * k6 Spike Test
 *
 * Objetivo: Validar comportamiento ante picos repentinos de tráfico
 * Patrón: 10 → 200 (spike) → 10 (recuperación)
 * Duración: 3 minutos
 *
 * Escenarios reales: Black Friday, lanzamiento de promoción, viral en redes
 *
 * Uso:
 *   k6 run tests/load/spike.test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const recoveryTime = new Trend('recovery_time');

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const TEST_CLIENT_EMAIL = __ENV.TEST_CLIENT_EMAIL || 'client@brisacubanaclean.com';
const TEST_CLIENT_PASSWORD = __ENV.TEST_CLIENT_PASSWORD || 'Client123!';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Tráfico normal
    { duration: '10s', target: 200 }, // SPIKE repentino (20x en 10s)
    { duration: '30s', target: 200 }, // Mantener spike
    { duration: '10s', target: 10 },  // Caída rápida
    { duration: '1m', target: 10 },   // Recuperación y estabilización
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // Más tolerante durante spike
    'http_req_failed': ['rate<0.15'], // Toleramos 15% de errores durante spike
    'errors': ['rate<0.15'],
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
    spikeStartTime: null,
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  const currentVUs = __VU;

  // Detectar inicio del spike (cuando VUs > 150)
  if (currentVUs > 150 && !data.spikeStartTime) {
    data.spikeStartTime = Date.now();
  }

  // Simular comportamiento de usuario durante spike (más orientado a READ)
  const endpoints = [
    { path: '/services', weight: 0.4 },
    { path: '/properties', weight: 0.3 },
    { path: '/bookings', weight: 0.2 },
    { path: '/health', weight: 0.1 },
  ];

  const rand = Math.random();
  let cumulative = 0;
  let selectedEndpoint = '/health';

  for (const ep of endpoints) {
    cumulative += ep.weight;
    if (rand < cumulative) {
      selectedEndpoint = ep.path;
      break;
    }
  }

  const startTime = Date.now();
  const res = http.get(`${API_BASE_URL}${selectedEndpoint}`, { headers });
  const duration = Date.now() - startTime;

  const success = check(res, {
    'request successful': (r) => r.status === 200 || r.status === 201,
    'no timeout': (r) => r.status !== 0,
    'no server crash': (r) => r.status !== 502 && r.status !== 503,
  });

  if (!success) {
    errorRate.add(1);
  }

  // Medir tiempo de recuperación después del spike
  if (data.spikeStartTime && currentVUs < 50) {
    const timeSinceSpike = Date.now() - data.spikeStartTime;
    recoveryTime.add(timeSinceSpike);
  }

  // Durante spike, menor sleep (mayor presión)
  if (currentVUs > 100) {
    sleep(0.2);
  } else {
    sleep(1);
  }
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const p99 = data.metrics.http_req_duration.values['p(99)'];
  const errorRate = data.metrics.errors?.values.rate || 0;
  const failedRate = data.metrics.http_req_failed.values.rate;

  let verdict = 'PASS';
  const issues = [];

  if (p95 > 3000) {
    verdict = 'FAIL';
    issues.push(`p95 response time too high: ${p95.toFixed(0)}ms`);
  }

  if (failedRate > 0.20) {
    verdict = 'FAIL';
    issues.push(`Error rate too high: ${(failedRate * 100).toFixed(1)}%`);
  }

  return {
    'stdout': JSON.stringify({
      test: 'Spike Test',
      verdict,
      issues: issues.length > 0 ? issues : ['No critical issues'],
      metrics: {
        'p95_response_time_ms': p95.toFixed(0),
        'p99_response_time_ms': p99.toFixed(0),
        'error_rate_percent': (errorRate * 100).toFixed(2),
        'failed_requests_percent': (failedRate * 100).toFixed(2),
      },
      recommendation: issues.length > 0
        ? 'System struggled during spike - consider: autoscaling, rate limiting, caching'
        : 'System handled spike well - ready for production traffic spikes',
    }, null, 2),
  };
}
