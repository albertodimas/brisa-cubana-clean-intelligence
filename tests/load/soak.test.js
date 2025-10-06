/**
 * k6 Soak Test (Endurance Test)
 *
 * Objetivo: Detectar memory leaks, degradación y problemas de estabilidad a largo plazo
 * VUs: 20 (constante)
 * Duración: 30 minutos
 *
 * Qué buscar:
 * - Incremento gradual en tiempos de respuesta
 * - Memory leaks (monitorear con herramientas externas)
 * - Conexiones de DB sin cerrar
 * - File descriptors abiertos
 * - Degradación de throughput
 *
 * Uso:
 *   k6 run tests/load/soak.test.js
 *
 * Nota: Ejecutar con monitoreo externo (htop, docker stats, prometheus)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time_trend');
const memoryWarnings = new Counter('memory_warnings');
const timeoutCount = new Counter('timeouts');

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const TEST_CLIENT_EMAIL = __ENV.TEST_CLIENT_EMAIL || 'client@brisacubanaclean.com';
const TEST_CLIENT_PASSWORD = __ENV.TEST_CLIENT_PASSWORD || 'Client123!';

const SOAK_DURATION = __ENV.SOAK_DURATION || '30m';
const SOAK_VUS = parseInt(__ENV.SOAK_VUS || '20', 10);

export const options = {
  stages: [
    { duration: '2m', target: SOAK_VUS },   // Ramp up
    { duration: SOAK_DURATION, target: SOAK_VUS }, // Soak
    { duration: '2m', target: 0 },          // Ramp down
  ],
  thresholds: {
    'http_req_duration': [
      'p(95)<1000', // p95 debe mantenerse < 1s durante todo el test
      'p(99)<2000', // p99 debe mantenerse < 2s
    ],
    'http_req_failed': ['rate<0.05'], // < 5% errors
    'errors': ['rate<0.05'],
    'response_time_trend': ['p(95)<1200'], // Vigilar degradación
  },
};

let baselineResponseTime = null;

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

  // Establecer baseline de performance
  const token = loginRes.json('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const baselineStart = Date.now();
  const baselineRes = http.get(`${API_BASE_URL}/health`, { headers });
  baselineResponseTime = Date.now() - baselineStart;

  console.log(`Baseline response time: ${baselineResponseTime}ms`);

  return {
    token,
    baselineResponseTime,
    startTime: Date.now(),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  const elapsedMinutes = (Date.now() - data.startTime) / 1000 / 60;

  // Flujo de usuario realista (mix de operaciones)
  const scenarios = [
    // Escenario 1: Consultar servicios y crear booking (40%)
    () => {
      const servicesRes = http.get(`${API_BASE_URL}/services`, { headers });
      check(servicesRes, { 'services OK': (r) => r.status === 200 }) || errorRate.add(1);
      sleep(1);

      const bookingRes = http.post(
        `${API_BASE_URL}/bookings`,
        JSON.stringify({
          propertyId: 'property-1',
          serviceId: 'basic-clean-1',
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: `Soak test - ${elapsedMinutes.toFixed(0)}min - VU${__VU}`,
        }),
        { headers }
      );
      check(bookingRes, { 'booking created': (r) => r.status === 201 || r.status === 200 }) || errorRate.add(1);
    },

    // Escenario 2: Consultar bookings y properties (30%)
    () => {
      const bookingsRes = http.get(`${API_BASE_URL}/bookings?page=1&limit=10`, { headers });
      check(bookingsRes, { 'bookings OK': (r) => r.status === 200 }) || errorRate.add(1);
      sleep(1);

      const propertiesRes = http.get(`${API_BASE_URL}/properties`, { headers });
      check(propertiesRes, { 'properties OK': (r) => r.status === 200 }) || errorRate.add(1);
    },

    // Escenario 3: Health check y monitoring (20%)
    () => {
      const healthRes = http.get(`${API_BASE_URL}/health`, { headers });
      const responseTime = healthRes.timings.duration;

      check(healthRes, { 'health OK': (r) => r.status === 200 }) || errorRate.add(1);

      // Detectar degradación de performance
      if (responseTime > data.baselineResponseTime * 2) {
        memoryWarnings.add(1);
        console.warn(`⚠️  Response time degraded: ${responseTime.toFixed(0)}ms (baseline: ${data.baselineResponseTime}ms) at ${elapsedMinutes.toFixed(0)}min`);
      }

      responseTrend.add(responseTime);
    },

    // Escenario 4: Operaciones de lectura pesadas (10%)
    () => {
      const res = http.get(`${API_BASE_URL}/bookings?page=1&limit=50`, { headers });
      check(res, { 'large query OK': (r) => r.status === 200 }) || errorRate.add(1);
    },
  ];

  // Seleccionar escenario basado en probabilidades
  const rand = Math.random();
  if (rand < 0.4) scenarios[0]();
  else if (rand < 0.7) scenarios[1]();
  else if (rand < 0.9) scenarios[2]();
  else scenarios[3]();

  // Sleep variable para simular think time real
  sleep(Math.random() * 2 + 1); // 1-3 segundos
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const p99 = data.metrics.http_req_duration.values['p(99)'];
  const errorRate = data.metrics.errors?.values.rate || 0;
  const memWarnings = data.metrics.memory_warnings?.values.count || 0;
  const timeouts = data.metrics.timeouts?.values.count || 0;

  let verdict = 'PASS';
  const issues = [];
  const warnings = [];

  // Criterios de falla
  if (p95 > 1000) {
    verdict = 'FAIL';
    issues.push(`p95 exceeded threshold: ${p95.toFixed(0)}ms > 1000ms`);
  }

  if (errorRate > 0.05) {
    verdict = 'FAIL';
    issues.push(`Error rate too high: ${(errorRate * 100).toFixed(2)}%`);
  }

  if (memWarnings > 10) {
    verdict = 'WARN';
    warnings.push(`Performance degradation detected ${memWarnings} times - possible memory leak`);
  }

  if (timeouts > 0) {
    verdict = 'WARN';
    warnings.push(`${timeouts} timeouts detected - investigate connection pool`);
  }

  return {
    'stdout': JSON.stringify({
      test: 'Soak Test (Endurance)',
      duration: SOAK_DURATION,
      verdict,
      issues: issues.length > 0 ? issues : ['No critical issues'],
      warnings: warnings.length > 0 ? warnings : ['No warnings'],
      metrics: {
        'p95_response_time_ms': p95.toFixed(0),
        'p99_response_time_ms': p99.toFixed(0),
        'error_rate_percent': (errorRate * 100).toFixed(2),
        'degradation_warnings': memWarnings,
        'timeout_count': timeouts,
      },
      recommendations: [
        memWarnings > 5 ? '⚠️  Monitor memory usage - potential leak detected' : '✓ Stable memory usage',
        p95 > 800 ? '⚠️  Consider performance optimization' : '✓ Good performance stability',
        errorRate < 0.01 ? '✓ Excellent reliability' : '⚠️  Review error logs',
      ],
    }, null, 2),
  };
}

export function teardown(data) {
  const durationMinutes = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`Soak test completed after ${durationMinutes.toFixed(1)} minutes`);
}
