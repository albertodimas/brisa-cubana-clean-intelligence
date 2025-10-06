/**
 * k6 Load Test
 *
 * Objetivo: Validar rendimiento bajo carga normal esperada
 * VUs: 10 → 50 (ramping)
 * Duración: 5 minutos
 *
 * Uso:
 *   k6 run tests/load/load.test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_duration');

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const TEST_CLIENT_EMAIL = __ENV.TEST_CLIENT_EMAIL || 'client@brisacubanaclean.com';
const TEST_CLIENT_PASSWORD = __ENV.TEST_CLIENT_PASSWORD || 'Client123!';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '2m', target: 30 },  // Ramp up to 30 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<800', 'p(99)<1500'],
    'http_req_failed': ['rate<0.05'], // < 5% errors (más tolerante que smoke)
    'errors': ['rate<0.05'],
    'booking_duration': ['p(95)<2000'], // Crear booking < 2s en p95
  },
};

export function setup() {
  // Autenticación
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

  // Obtener property y service IDs para crear bookings
  const token = loginRes.json('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const propertiesRes = http.get(`${API_BASE_URL}/properties`, { headers });
  const servicesRes = http.get(`${API_BASE_URL}/services`, { headers });

  return {
    token,
    propertyId: propertiesRes.json('data.0.id'),
    serviceId: servicesRes.json('0.id'),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Simular flujo de usuario típico

  // 1. Ver servicios disponibles (70% del tráfico)
  if (Math.random() < 0.7) {
    const servicesRes = http.get(`${API_BASE_URL}/services`, { headers });
    check(servicesRes, {
      'services loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // 2. Ver mis propiedades (50% del tráfico)
  if (Math.random() < 0.5) {
    const propertiesRes = http.get(`${API_BASE_URL}/properties`, { headers });
    check(propertiesRes, {
      'properties loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // 3. Ver mis bookings (60% del tráfico)
  if (Math.random() < 0.6) {
    const bookingsRes = http.get(`${API_BASE_URL}/bookings`, { headers });
    check(bookingsRes, {
      'bookings loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(2);

  // 4. Crear un booking (20% del tráfico - acción más pesada)
  if (Math.random() < 0.2 && data.propertyId && data.serviceId) {
    const startTime = new Date().getTime();

    const scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // +7 días

    const createRes = http.post(
      `${API_BASE_URL}/bookings`,
      JSON.stringify({
        propertyId: data.propertyId,
        serviceId: data.serviceId,
        scheduledFor,
        notes: `Load test booking - ${__VU}-${__ITER}`,
      }),
      { headers }
    );

    const duration = new Date().getTime() - startTime;
    bookingDuration.add(duration);

    check(createRes, {
      'booking created': (r) => r.status === 201,
      'booking has id': (r) => r.json('id') !== undefined,
    }) || errorRate.add(1);
  }

  sleep(3);
}

export function teardown(data) {
  console.log('Load test completed');
}
