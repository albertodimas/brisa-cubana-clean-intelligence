# Load Testing con k6

Suite de pruebas de carga para validar el rendimiento y escalabilidad de Brisa Cubana Clean Intelligence.

## Instalación de k6

```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6

# Verificar instalación
k6 version
```

## Escenarios de Load Testing

### 1. Smoke Test (`smoke.test.js`)

**Objetivo**: Verificar que el sistema funciona bajo carga mínima

- VUs: 1
- Duración: 1 minuto
- Endpoints: health, auth, bookings básicos

```bash
k6 run tests/load/smoke.test.js
```

### 2. Load Test (`load.test.js`)

**Objetivo**: Validar rendimiento bajo carga normal esperada

- VUs: 10-50 (ramping)
- Duración: 5 minutos
- Todos los endpoints principales

```bash
k6 run tests/load/load.test.js
```

### 3. Stress Test (`stress.test.js`)

**Objetivo**: Encontrar el punto de quiebre del sistema

- VUs: 50-200 (ramping)
- Duración: 10 minutos
- Incremento gradual hasta falla

```bash
k6 run tests/load/stress.test.js
```

### 4. Spike Test (`spike.test.js`)

**Objetivo**: Validar comportamiento ante picos repentinos de tráfico

- VUs: 10 → 200 → 10 (spike súbito)
- Duración: 3 minutos
- Simula Black Friday/promociones

```bash
k6 run tests/load/spike.test.js
```

### 5. Soak Test (`soak.test.js`)

**Objetivo**: Detectar memory leaks y degradación en tiempo prolongado

- VUs: 20 (constante)
- Duración: 30 minutos
- Monitorear memoria, CPU, conexiones DB

```bash
k6 run tests/load/soak.test.js
```

## Configuración

Edita `.env.load` para configurar:

```bash
API_BASE_URL=http://localhost:3001
TEST_USER_EMAIL=admin@brisacubanaclean.com
TEST_USER_PASSWORD=Admin123!
```

## Métricas Objetivo (SLA)

| Métrica              | Objetivo    | Crítico    |
| -------------------- | ----------- | ---------- |
| p95 Response Time    | < 500ms     | < 1s       |
| p99 Response Time    | < 1s        | < 2s       |
| Error Rate           | < 0.1%      | < 1%       |
| Throughput           | > 100 req/s | > 50 req/s |
| Database Connections | < 80% pool  | < 95% pool |

## Ejecución en CI/CD

```yaml
# .github/workflows/load-test.yml
- name: Run Load Tests
  run: |
    k6 run --out json=results.json tests/load/smoke.test.js
    k6 run --out json=results.json tests/load/load.test.js
```

## Interpretación de Resultados

### Métricas k6

- **http_req_duration**: Tiempo de respuesta total
- **http_req_waiting**: Tiempo esperando la respuesta (TTFB)
- **http_req_failed**: Tasa de error (objetivo: 0%)
- **vus**: Virtual users activos
- **iterations**: Iteraciones completadas
- **data_received/data_sent**: Throughput de red

### Thresholds

Cada test define thresholds para validación automática:

```javascript
export const options = {
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"], // < 1% errors
  },
};
```

## Análisis de Bottlenecks

1. **Alto http_req_waiting**: Problema en API/database
2. **Alto http_req_receiving**: Problema de red/payload
3. **Incremento gradual de tiempos**: Memory leak o conexiones no cerradas
4. **Errores 429**: Rate limiting (esperado en stress test)
5. **Errores 500**: Problemas de lógica/database bajo carga

## Referencias

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/introduction/)
- [k6 Metrics Reference](https://k6.io/docs/using-k6/metrics/)
