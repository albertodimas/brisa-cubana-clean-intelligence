# Load Testing con k6

Suite completa de load testing con 5 escenarios de prueba.

## 📚 Documentación Disponible

### [LOAD_TESTING_GUIDE.md](LOAD_TESTING_GUIDE.md)

Guía completa (890 líneas)

**Contenido:**

- Instalación de k6
- 5 escenarios detallados
- Interpretación de métricas
- SLA targets
- Troubleshooting

**Audiencia:** QA, Performance Engineers, DevOps

### [LOAD_TESTING_QUICKSTART.md](LOAD_TESTING_QUICKSTART.md)

Inicio rápido

**Contenido:**

- Comandos básicos
- Ejecutar primer test
- Ver resultados

**Audiencia:** Developers

### [LOAD_TESTING_SETUP.md](LOAD_TESTING_SETUP.md)

Resumen de implementación

**Contenido:**

- Estructura del proyecto
- Archivos creados
- CI/CD integration

**Audiencia:** Tech Leads, DevOps

### [LOAD_TESTING_SECRETS.md](LOAD_TESTING_SECRETS.md)

Configuración de GitHub Secrets

**Contenido:**

- Variables necesarias
- Comandos gh CLI
- Verificación

**Audiencia:** DevOps

## 🎯 5 Escenarios de Testing

| Escenario  | VUs       | Duración | Propósito             | SLA Target                 |
| ---------- | --------- | -------- | --------------------- | -------------------------- |
| **Smoke**  | 1         | 1 min    | Validación básica     | p95 < 500ms                |
| **Load**   | 10→50     | 5 min    | Carga normal          | p95 < 1s                   |
| **Stress** | 50→200    | 10 min   | Encontrar límite      | Identificar breaking point |
| **Spike**  | 10→200→10 | 3 min    | Manejo de picos       | Recovery < 2min            |
| **Soak**   | 20        | 30 min   | Detectar memory leaks | Sin degradación            |

## 🚀 Quick Start

```bash
# Instalar k6
brew install k6  # macOS
# o ver LOAD_TESTING_GUIDE.md para Linux

# Ejecutar smoke test
pnpm test:load:smoke

# Ejecutar todos los escenarios
pnpm test:load:all

# Ejecutar escenario específico
k6 run tests/load/stress.test.js
```

## 📊 Estructura de Tests

```
tests/load/
├── smoke.test.js      # Validación básica (1 VU, 1min)
├── load.test.js       # Carga normal (10-50 VUs, 5min)
├── stress.test.js     # Breaking point (50-200 VUs, 10min)
├── spike.test.js      # Picos de tráfico (10-200-10 VUs, 3min)
├── soak.test.js       # Memory leaks (20 VUs, 30min)
├── .env.load.example  # Variables de entorno
└── results/           # Resultados de ejecuciones
    ├── README.md
    └── .gitkeep
```

## 🤖 Automatización CI/CD

### GitHub Actions

**Workflow:** [`.github/workflows/load-test.yml`](../../../.github/workflows/load-test.yml)

**Triggers:**

- Manual (workflow_dispatch) - Seleccionar escenario
- Pull Request a main - Smoke test automático
- Schedule - Lunes 2 AM UTC

**Configuración de Secrets:**

```bash
# Ver LOAD_TESTING_SECRETS.md para comandos completos
gh secret set STAGING_API_URL
gh secret set TEST_ADMIN_PASSWORD
# ... etc
```

### Script Automatizado

**Script:** [`scripts/run-load-tests.sh`](../../../scripts/run-load-tests.sh)

**Features:**

- Auto-instala k6
- Ejecuta todos los escenarios
- Genera reportes JSON
- Cooldown entre tests

```bash
# Ejecutar script
./scripts/run-load-tests.sh
```

## 📈 Interpretación de Métricas

### Métricas Clave

| Métrica             | Descripción          | SLA Producción     |
| ------------------- | -------------------- | ------------------ |
| `http_req_duration` | Tiempo de respuesta  | p95 < 1s, p99 < 2s |
| `http_req_failed`   | Tasa de error        | < 1%               |
| `http_reqs`         | Requests por segundo | Baseline: 50 rps   |
| `vus`               | Usuarios virtuales   | Max: 200           |

### Thresholds Configurados

Todos los tests incluyen thresholds automáticos:

```javascript
thresholds: {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed: ['rate<0.01'],
  http_reqs: ['rate>10'],
}
```

## 🔧 Configuración Local

1. **Crear archivo de entorno:**

   ```bash
   cp tests/load/.env.load.example tests/load/.env.load
   ```

2. **Editar credenciales:**

   ```bash
   # tests/load/.env.load
   API_BASE_URL=http://localhost:3001
   TEST_ADMIN_EMAIL=admin@test.com
   TEST_ADMIN_PASSWORD=your-password
   ```

3. **Levantar API local:**

   ```bash
   cd apps/api
   pnpm dev
   ```

4. **Ejecutar tests:**
   ```bash
   pnpm test:load:smoke
   ```

## 📊 Análisis de Resultados

Los resultados se guardan en `tests/load/results/`:

```bash
# Ver último smoke test
cat tests/load/results/smoke-summary.json

# Ver todas las ejecuciones
ls -lh tests/load/results/
```

**Formato JSON:**

- `smoke-YYYYMMDD-HHMMSS.json` - Datos completos
- `smoke-summary.json` - Resumen último run

## 🐛 Troubleshooting

### Error: "Connection refused"

```bash
# Verificar que API está corriendo
curl http://localhost:3001/api/health
```

### Error: "Authentication failed"

```bash
# Verificar credenciales en .env.load
cat tests/load/.env.load

# Crear usuario de prueba
pnpm seed  # Desde apps/api/
```

### Error: "Too many requests"

```bash
# Rate limiting activado, reducir VUs o aumentar cooldown
# Ver LOAD_TESTING_GUIDE.md sección "Optimización"
```

## 📝 Best Practices

1. **Siempre ejecutar smoke test primero**
2. **Usar staging environment para tests agresivos**
3. **Cooldown de 30s entre escenarios**
4. **Archivar resultados importantes**
5. **Documentar cambios en SLA targets**

## 🔗 Enlaces

- [k6 Documentation](https://k6.io/docs/)
- [k6 Cloud](https://k6.io/cloud/)
- [Grafana k6 Integration](https://grafana.com/docs/k6/latest/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/load-testing-best-practices/)

## 📞 Soporte

- **Configuración:** Ver LOAD_TESTING_GUIDE.md
- **CI/CD:** Ver LOAD_TESTING_SECRETS.md
- **Problemas:** Ver LOAD_TESTING_GUIDE.md sección Troubleshooting
