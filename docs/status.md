# Estado del Proyecto – Brisa Cubana Clean Intelligence

**Última revisión:** 8 de octubre de 2025

---

## 1. Resumen ejecutivo

- Plataforma verificada con frontend Next.js 15 + Auth.js y API Hono 4 + Prisma 6.
- Login operativo en producción (`/api/authentication/login`) con roles y JWT en cookie HttpOnly.
- Panel operativo funcional: creación/edición de servicios, propiedades y reservas; filtros y mensajes de feedback.
- Proxy serverless en Next reexpone `/api/*` hacia la API Hono usando `INTERNAL_API_URL` sin exponer secretos.
- Base de datos sembrada (Neon en producción) con usuarios, servicios, propiedad y reservas demo.
- Build en Vercel sin advertencias; variables de entorno configuradas en Development/Preview/Production.

[Ver Quickstart local](./quickstart.md) para puesta en marcha.

---

## 2. Arquitectura y componentes

- **Frontend (apps/web)**
  - Next.js 15.5.4 + React 19.
  - Autenticación con Auth.js (NextAuth v5) y session strategy `jwt`.
  - Server actions (`app/actions.ts`) para CRUD y revalidaciones.
  - Proxy en `app/api/[...route]/route.ts` → todas las llamadas `/api/*` se enrutan al backend (`INTERNAL_API_URL`), limpiando cabeceras sensibles y preservando querystring.
  - Diseño declarativo en `app/page.tsx` + componente `AdminPanel`.

- **API (apps/api)**
  - Hono 4.9.10 corriendo en Vercel Node 22.
  - Rutas modulares:
    - `routes/auth.ts` (`/api/authentication/*`): login/logout/me/verify + rate limiting.
    - `routes/services.ts`, `properties.ts`, `customers.ts`, `bookings.ts`: CRUD con autorización por rol.
  - Middleware `authenticate` y `requireRoles` (JWT/`API_TOKEN`).
  - Prisma Client 6.12.0 (PostgreSQL 16). Seed (`prisma/seed.ts`) crea datos funcionales.

- **Datos y persistencia**
  - Tablas principales:
    - `User`: ADMIN / COORDINATOR / STAFF / CLIENT.
    - `Service`: oferta de limpieza (`basePrice`, `durationMin`, `active`).
    - `Property`: datos de inmuebles.
    - `Booking`: reservas con estado (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
    - `RefreshToken`: reservado (no utilizado actualmente).
  - Semilla genera:
    - Usuarios demo: Admin, Coordinador, Cliente (`Brisa123!`).
    - Servicios “Deep Clean Residencial”, “Turnover Vacation Rental”.
    - Propiedad “Brickell Loft”.
    - Reservas BRISA-0001, BRISA-0002.

---

## 3. Alcance funcional actualmente disponible

### Web (Next.js)

- Landing con estado del proyecto y reportes en vivo (servicios, reservas, propiedades, clientes).
- Login con credenciales sembradas; sesión señalada en panel (“Sesión activa: … · Rol …”).
- Panel operativo (sólo roles ADMIN / COORDINATOR):
  - Crear servicios / propiedades / reservas (formularios server action).
  - Actualizar servicios/properties/reservas.
  - Cambiar estado `active` de servicios.
  - Filtrar reservas por estado y rango de fechas.
  - Cerrar sesión.
- Proxy `/api/*` funciona para GET/POST/PATCH (sin CORS en el browser).
- Favicon `.ico` y `.png` servidos desde `public/`.

### API (Hono + Prisma)

- Autenticación: login (rate limited), logout, me, verify.
- Servicios: listar (público), crear/actualizar (roles ADMIN/COORDINATOR).
- Propiedades: listar (público), crear/actualizar (roles ADMIN/COORDINATOR).
- Clientes: listar (roles ADMIN/COORDINATOR).
- Reservas: listar con filtros (público), crear/actualizar (roles ADMIN/COORDINATOR). Genera códigos BRISA-xxxx y copia precio/duración.
- Middleware soporta Bearer `JWT` o `API_TOKEN` para integraciones.

---

## 4. Variables de entorno

| Variable                            | Web | API | Descripción                                 |
| ----------------------------------- | --- | --- | ------------------------------------------- |
| `NEXT_PUBLIC_API_URL`               | ✅  | –   | Endpoint público (fallback).                |
| `INTERNAL_API_URL`                  | ✅  | –   | URL privada de la API usada por el proxy.   |
| `AUTH_SECRET`                       | ✅  | –   | Requerido por Auth.js.                      |
| `DATABASE_URL` / `_UNPOOLED`        | –   | ✅  | Conexión PostgreSQL (prod/local).           |
| `JWT_SECRET`                        | ✅  | ✅  | Firma/verificación JWT.                     |
| `API_TOKEN`                         | ✅  | ✅  | Token para integraciones servidor-servidor. |
| `ALLOWED_ORIGINS`                   | ✅  | ✅  | CORS para Hono/WS.                          |
| `LOGIN_RATE_LIMIT` (+ `_WINDOW_MS`) | ✅  | ✅  | Configura rate limiting del login.          |

En Vercel: proyecto web sólo ejecuta `pnpm turbo run build --filter=@brisa/web`, por lo que ya no se listan variables “faltantes” del backend.

---

## 5. Endpoints de la API (producción)

| Método | Ruta                         | Auth                         | Descripción                                                              |
| ------ | ---------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| POST   | `/api/authentication/login`  | Pública (rate limited)       | Devuelve `{ data: user, token }` y cookie HttpOnly.                      |
| POST   | `/api/authentication/logout` | Cookie/JWT                   | Borra cookie `auth_token`.                                               |
| GET    | `/api/authentication/me`     | Cookie/JWT                   | Retorna usuario autenticado.                                             |
| POST   | `/api/authentication/verify` | Pública                      | Verifica token JWT.                                                      |
| GET    | `/api/services`              | Pública                      | Lista servicios ordenados.                                               |
| POST   | `/api/services`              | Roles `ADMIN`, `COORDINATOR` | Crea servicio.                                                           |
| PATCH  | `/api/services/:id`          | Roles `ADMIN`, `COORDINATOR` | Actualiza servicio.                                                      |
| GET    | `/api/properties`            | Pública                      | Lista propiedades con dueño.                                             |
| POST   | `/api/properties`            | Roles `ADMIN`, `COORDINATOR` | Crea propiedad.                                                          |
| PATCH  | `/api/properties/:id`        | Roles `ADMIN`, `COORDINATOR` | Actualiza propiedad.                                                     |
| GET    | `/api/customers`             | Roles `ADMIN`, `COORDINATOR` | Lista clientes (`id`, `email`, `fullName`).                              |
| GET    | `/api/bookings`              | Pública                      | Filtros `from`, `to`, `status`, `propertyId`, `serviceId`, `customerId`. |
| POST   | `/api/bookings`              | Roles `ADMIN`, `COORDINATOR` | Crea reserva (auto código, precio, duración).                            |
| PATCH  | `/api/bookings/:id`          | Roles `ADMIN`, `COORDINATOR` | Actualiza reserva.                                                       |

> **Credenciales demo:**
>
> - Admin: `admin@brisacubanaclean.com` / `Brisa123!`
> - Coordinador: `ops@brisacubanaclean.com` / `Brisa123!`
> - Cliente: `client@brisacubanaclean.com` / `Brisa123!`

---

## 6. Flujo de despliegue y operaciones

- **Repositorio**: GitHub `albertodimas/brisa-cubana-clean-intelligence`.
- **CI local**: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- **Vercel web**: build `pnpm turbo run build --filter=@brisa/web`.
- **Vercel API**: build `pnpm build` (Prisma + TypeScript).
- **Logs**:
  - `/favicon.ico` 404 → resueltos tras subir assets a `public/`.
  - `prisma:error … Closed` → ocurrieron antes del fix JWT/bcrypt; no presentes en despliegues vigentes.
- **Rate limiting login**: límite 5 intentos / 60 segundos (configurable vía `LOGIN_RATE_LIMIT` y `LOGIN_RATE_LIMIT_WINDOW_MS`).
- **Proxy**: limpia `content-length`/`content-encoding` para evitar inconsistencias con respuestas comprimidas.

---

## 7. Calidad y pruebas

### 7.1 Tests Unitarios

- **`apps/api`**: 17 pruebas Vitest
- **`apps/web`**: 1 prueba Vitest
- **Total**: 18 pruebas passing

### 7.2 Tests E2E - Estrategia Piramidal

| Suite    | Tests | Duración | Comando                  |
| -------- | ----- | -------- | ------------------------ |
| Smoke    | 2     | ~7s      | `pnpm test:e2e:smoke`    |
| Critical | 7     | ~8s      | `pnpm test:e2e:critical` |
| Full     | 13    | ~8s      | `pnpm test:e2e:full`     |

**Documentación:** [E2E_STRATEGY.md](./E2E_STRATEGY.md)

### 7.3 CI/CD Workflows

- **PR Checks**: Smoke suite en pull requests (~7s)
- **Main CI**: Critical suite en push a main (~8s)
- **Nightly**: Full suite diario 2AM UTC (~8s)

**Estado**: ✅ Workflows activos en GitHub Actions

### 7.4 Calidad de Código

- **TypeScript**: `pnpm typecheck` ✅
- **Lint**: `pnpm lint` ✅
- **Deuda técnica**: 0 TODOs/FIXME

---

## 8. Limitaciones conocidas

1. El proxy sólo cubre rutas `/api/*`. Nuevos prefijos requieren actualizar `buildTargetUrl`.
2. No existe UI para gestionar usuarios (alta/baja); sólo seeds o llamados directos a la API.
3. Falta OpenAPI/Postman para describir el contrato REST.
4. `RefreshToken` no se utiliza aún (reserva para futuras mejoras).
5. Estilos UI definidos inline; pendiente migrar a sistema de diseño reutilizable.
6. Seeds pensados para demo; ambientes preview deben reseedear manualmente (`pnpm --filter @brisa/api db:seed`).

---

## 9. Seguridad y Operaciones

### 9.1 Protección de Credenciales

**Scripts automatizados:**

- `scripts/verify-no-secrets.sh`: Verifica que no se commiteen archivos `.env` con credenciales
- Ejecutado en: Pre-commit hook (husky) y CI workflow
- Detecta patrones: URLs de Neon, AWS keys, tokens de OpenAI

**Pre-commit hooks (husky):**

```bash
# .husky/pre-commit
bash scripts/verify-no-secrets.sh
pnpm exec lint-staged  # Prettier + ESLint automático
```

**CI verification:**

- GitHub Actions ejecuta `verify-no-secrets.sh` antes de tests
- Falla el build si detecta `.env` files o patrones de producción

**Política de .env files:**

- `.env.local` → desarrollo local (nunca commiteado)
- `.env.example` → template sin credenciales reales (commiteado)
- `.env` → solo en Vercel (nunca commiteado)

### 9.2 Backups y Recuperación

**Point-in-Time Recovery (PITR):**

- Retención: 7 días en Neon (configurable hasta 30)
- RPO: < 1 minuto
- RTO: < 5 minutos

**Backups pg_dump (planeado):**

- GitHub Actions workflow diario
- Retención: 7 diarios, 4 semanales, 12 mensuales
- Storage: GitHub Artifacts o S3

**Documentación:** Ver [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)

**Script de verificación:**

```bash
bash scripts/verify-backup.sh "$DATABASE_URL"
```

### 9.3 Logging Estructurado

**Stack de logging:**

- **Pino** para logging estructurado en API
- Formato JSON en producción, pretty en desarrollo
- Redacción automática de campos sensibles

**Logs automáticos:**

- HTTP requests/responses con status y duración
- Errores con stack traces
- Operaciones de autenticación
- Rate limiting hits

**Componentes especializados:**

```typescript
import { logger, authLogger, dbLogger } from "./lib/logger.js";
```

**Middleware HTTP:**

- `loggingMiddleware`: Loguea todas las requests automáticamente
- Incluye: method, path, status, durationMs, userId (si auth)

**Documentación:** Ver [OBSERVABILITY.md](./OBSERVABILITY.md)

### 9.4 Tests de Seguridad

**Tests E2E expandidos:**

- Escenarios negativos: credenciales inválidas, email mal formateado
- Rate limiting: 6+ intentos fallidos de login
- Permisos por rol: CLIENT no puede crear servicios
- Validación de datos: precios negativos, campos vacíos
- Sesión persistente: logout correcto, cookies HttpOnly

**Archivo:** `tests/e2e/security.spec.ts` (10+ tests)

**Checklist de regresión:**

- 100+ verificaciones antes de cada deployment
- Categorías: Auth, API, Frontend, Database, Security, Performance
- Documentación: [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

---

## 10. Próximos pasos prioritarios

### Implementado ✅

1. ✅ Backups automatizados: Documentación completa de PITR y pg_dump
2. ✅ Guardas de entorno: Pre-commit hooks y CI checks para .env files
3. ✅ Cobertura fortalecida: Tests de seguridad con escenarios negativos
4. ✅ Logging estructurado: Pino integrado con redacción automática

### Pendiente 🔄

1. **Pruebas de API contractuales:**
   - Implementar OpenAPI/Swagger spec
   - Tests automatizados con Postman/Newman o Vitest API tests
   - Validación de schemas en CI

2. **Observabilidad avanzada:**
   - Integrar Sentry para tracking de errores
   - Alertas en Slack/Email para errores críticos
   - Dashboard de métricas de negocio (Grafana)

3. **Roadmap funcional:**
   - UI de gestión de usuarios (CRUD completo)
   - Paginación en `/api/bookings` y `/api/services`
   - Sistema de estilos compartido (Tailwind o Vanilla Extract)
   - Notificaciones push para coordinadores

---

## 11. Referencias

- Repositorio: <https://github.com/albertodimas/brisa-cubana-clean-intelligence>
- Despliegue web: <https://brisa-cubana-clean-intelligence.vercel.app>
- Despliegue API: <https://brisa-cubana-clean-intelligence-api.vercel.app>
- Documentación pública: <https://albertodimas.github.io/brisa-cubana-clean-intelligence/>
