# Estado del Proyecto – Brisa Cubana Clean Intelligence

**Última revisión:** 12 de octubre de 2025 (Refactorización completada: 450+ líneas eliminadas)

---

## 1. Resumen ejecutivo

- Plataforma verificada con frontend Next.js 15 + Auth.js y API Hono 4 + Prisma 6.
- Login operativo en producción (`/api/authentication/login`) con roles y JWT en cookie HttpOnly.
- Panel operativo funcional: creación/edición de servicios, propiedades y reservas; filtros y mensajes de feedback.
- Gestión de usuarios desde la UI (rol ADMIN) para cambio de roles y rotación de contraseñas.
- Proxy serverless en Next reexpone `/api/*` hacia la API Hono usando `INTERNAL_API_URL` sin exponer secretos.
- Base de datos sembrada (Neon en producción) con usuarios, servicios, propiedad y reservas demo.
- Build en Vercel sin advertencias; variables de entorno configuradas en Development/Preview/Production.
- Deploy web operativo en Vercel (Next.js 15) sincronizado con la API.

[Ver Quickstart local](../guides/quickstart.md) para puesta en marcha.

---

## 2. Arquitectura y componentes

- **Frontend (apps/web)**
  - Next.js 15.5.4 + React 19.
  - Autenticación con Auth.js (NextAuth v5) y session strategy `jwt`.
  - Server actions (`app/actions.ts`) para CRUD y revalidaciones.
  - Proxy en `app/api/[...route]/route.ts` → todas las llamadas `/api/*` se enrutan al backend (`INTERNAL_API_URL`), limpiando cabeceras sensibles y preservando querystring.
  - Diseño declarativo en `app/page.tsx` + componente `AdminPanel`.
  - **Shared utilities**:
    - `lib/types.ts`: Tipos TypeScript compartidos (PaginatedResult, User, Service, etc.)
    - `lib/api-client.ts`: Cliente HTTP reutilizable con manejo de errores
    - `hooks/use-update-handler.ts`: Hook personalizado para manejar actualizaciones con debounce
    - `hooks/use-paginated-resource.ts`: Hook para paginación cursor-based

- **API (apps/api)**
  - Hono 4.9.10 corriendo en Vercel Node 22.
  - Rutas modulares:
    - `routes/auth.ts` (`/api/authentication/*`): login/logout/me + rate limiting.
    - `routes/services.ts`, `properties.ts`, `customers.ts`, `bookings.ts`, `users.ts`: CRUD con autorización por rol.
  - Middleware `authenticate` y `requireRoles` (JWT/`API_TOKEN`).
  - Prisma Client 6.12.0 (PostgreSQL 17). Seed (`prisma/seed.ts`) crea datos funcionales.
  - **Shared utilities**:
    - `lib/pagination.ts`: Lógica de paginación cursor-based reutilizable
    - `lib/validation.ts`: Esquemas de validación Zod compartidos
    - `lib/bcrypt-helpers.ts`: Helpers para hashing de contraseñas
  - **Repository pattern** registrado en `container.ts` (`ServiceRepository`, `BookingRepository`, `PropertyRepository`, `UserRepository`, `CustomerRepository`) para desacoplar rutas de Prisma y facilitar tests; rutas `services`, `bookings`, `properties`, `customers`, `users` y `auth` ahora resuelven los repositories vía el contenedor y los tests de integración verifican esa delegación.

- **Datos y persistencia**
  - Tablas principales:
    - `User`: ADMIN / COORDINATOR / STAFF / CLIENT.
    - `Service`: oferta de limpieza (`basePrice`, `durationMin`, `active`).
    - `Property`: datos de inmuebles.
    - `Booking`: reservas con estado (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
  - Soft delete habilitado en todos los modelos (`deletedAt` + índice) usando `softDeleteExtension`.
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
  - Filtrar reservas por estado y rango de fechas con paginación remota y carga incremental.
  - UI reestilizada con tokens (`ui-field`, `ui-input`, `ui-panel-surface`) para formularios y acciones.
  - Cerrar sesión.
- Proxy `/api/*` funciona para GET/POST/PATCH (sin CORS en el browser).
- Favicon `.ico` y `.png` servidos desde `public/`.

### API (Hono + Prisma)

- Autenticación: login (rate limited), logout, me.
- Servicios: listar (público), crear/actualizar (roles ADMIN/COORDINATOR).
- Propiedades: listar (público), crear/actualizar (roles ADMIN/COORDINATOR).
- Clientes: listar (roles ADMIN/COORDINATOR).
- Reservas: listar con filtros (público), crear/actualizar (roles ADMIN/COORDINATOR). Genera códigos BRISA-xxxx y copia precio/duración.
- Usuarios: listar (rol ADMIN) y actualizar rol/contraseña desde `/api/users`.
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

| Método | Ruta                         | Auth                         | Descripción                                                                                        |
| ------ | ---------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| POST   | `/api/authentication/login`  | Pública (rate limited)       | Devuelve `{ data: user, token }` y cookie HttpOnly.                                                |
| POST   | `/api/authentication/logout` | Cookie/JWT                   | Borra cookie `auth_token`.                                                                         |
| GET    | `/api/authentication/me`     | Cookie/JWT                   | Retorna usuario autenticado.                                                                       |
| GET    | `/api/services`              | Pública                      | Lista servicios ordenados. Paginado (limit, cursor).                                               |
| POST   | `/api/services`              | Roles `ADMIN`, `COORDINATOR` | Crea servicio.                                                                                     |
| PATCH  | `/api/services/:id`          | Roles `ADMIN`, `COORDINATOR` | Actualiza servicio.                                                                                |
| DELETE | `/api/services/:id`          | Rol `ADMIN`                  | Soft delete: marca `deletedAt` y excluye el servicio de futuras consultas.                         |
| GET    | `/api/properties`            | Pública                      | Lista propiedades con dueño. Paginado (limit, cursor).                                             |
| POST   | `/api/properties`            | Roles `ADMIN`, `COORDINATOR` | Crea propiedad.                                                                                    |
| PATCH  | `/api/properties/:id`        | Roles `ADMIN`, `COORDINATOR` | Actualiza propiedad.                                                                               |
| GET    | `/api/customers`             | Roles `ADMIN`, `COORDINATOR` | Lista clientes (`id`, `email`, `fullName`). Paginado (limit 50, cursor).                           |
| GET    | `/api/users`                 | Rol `ADMIN`                  | Lista usuarios con roles. Paginado (limit 50, cursor).                                             |
| GET    | `/api/bookings`              | Pública                      | Filtros `from`, `to`, `status`, `propertyId`, `serviceId`, `customerId`. Paginado (limit, cursor). |
| POST   | `/api/bookings`              | Roles `ADMIN`, `COORDINATOR` | Crea reserva (auto código, precio, duración).                                                      |
| PATCH  | `/api/bookings/:id`          | Roles `ADMIN`, `COORDINATOR` | Actualiza reserva.                                                                                 |

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
- **URLs producción**:
  - Web: https://brisa-cubana-clean-intelligence.vercel.app
  - API: https://brisa-cubana-clean-intelligence-api.vercel.app
- **Logs**:
  - `/favicon.ico` 404 → resueltos tras subir assets a `public/`.
  - `prisma:error … Closed` → ocurrieron antes del fix JWT/bcrypt; no presentes en despliegues vigentes.
- **Rate limiting login**: límite 5 intentos / 60 segundos (configurable vía `LOGIN_RATE_LIMIT` y `LOGIN_RATE_LIMIT_WINDOW_MS`).
- **Proxy**: limpia `content-length`/`content-encoding` para evitar inconsistencias con respuestas comprimidas.

---

## 7. Calidad y pruebas

### 7.1 Tests Unitarios

- **`apps/api`**: 31 pruebas unitarias Vitest (coverage thresholds: 85% lines, 65% functions, 50% branches)
- **`apps/api`**: 60 pruebas de integración (incluyen validación de contratos OpenAPI)
- **`apps/web`**: 42 pruebas Vitest (hooks, server actions y componentes UI) con threshold 70%
- **Total**: 133 pruebas unitarias/integración passing
- **Coverage**: Configurado con V8 provider, thresholds automáticos

### 7.2 Tests E2E - Estrategia Piramidal

| Suite    | Tests | Duración | Comando                  |
| -------- | ----- | -------- | ------------------------ |
| Smoke    | 2     | ~7s      | `pnpm test:e2e:smoke`    |
| Critical | 7     | ~8s      | `pnpm test:e2e:critical` |
| Full     | 13    | ~8s      | `pnpm test:e2e:full`     |

**Documentación:** [`qa/e2e-strategy.md`](../qa/e2e-strategy.md)

### 7.3 CI/CD Workflows

- **Reusable pipeline (`project-pipeline.yml`)**: centraliza checkout, instalación, Prisma, lint, typecheck, tests, build y suites Playwright; evita duplicar comandos y variables en los workflows públicos.
- **PR Checks** (`pr-checks.yml`): invoca la pipeline con suite `smoke`, escaneo de secretos y artefactos sólo al fallar.
- **Main CI** (`ci.yml`): usa la pipeline con suite `critical`, escaneo de secretos y artefactos bajo demanda; dura ~8 min.
- **Nightly** (`nightly.yml`): suite `full` diaria 02:00 UTC con retención de reportes de 14 días.
- **CodeQL** (`codeql.yml`): escaneo estático para JavaScript/TypeScript en push, PR y weekly schedule.
- **Dependency Review** (`dependency-review.yml`): obliga revisión de dependencias externas en cada PR.
- **Post-Deploy Seed** (`post-deploy-seed.yml`): tras un merge exitoso en `main`, sincroniza el esquema y ejecuta el seed contra la base de datos de producción usando los secretos `PRODUCTION_DATABASE_URL` y `PRODUCTION_DATABASE_URL_UNPOOLED`.

**Estado**: ✅ Workflows activos y deduplicados en GitHub Actions

### 7.4 Calidad de Código

- **TypeScript**: `pnpm typecheck` ✅
- **Lint**: `pnpm lint` ✅
- **Deuda técnica**: 0 TODOs/FIXME

---

## 8. Limitaciones conocidas

1. El proxy sólo cubre rutas `/api/*`. Nuevos prefijos requieren actualizar `buildTargetUrl`.
2. Estilos heredados mezclan inline styles y tokens.
3. Seeds pensados para demo; ambientes preview deben reseedear manualmente (`pnpm --filter @brisa/api db:seed`).

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

**Documentación:** Ver [`operations/backup-recovery.md`](../operations/backup-recovery.md) para estrategia completa

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

**Documentación:** Ver [`operations/observability.md`](../operations/observability.md)

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
- Documentación: [`qa/regression-checklist.md`](../qa/regression-checklist.md)

---

## 10. Próximos pasos prioritarios

### Implementado ✅

1. ✅ Backups automatizados: Documentación completa de PITR y pg_dump
2. ✅ Guardas de entorno: Pre-commit hooks y CI checks para .env files
3. ✅ Cobertura fortalecida: Tests de seguridad con escenarios negativos
4. ✅ Logging estructurado: Pino integrado con redacción automática
5. ✅ OpenAPI/Swagger: Documentación automática con Scalar UI en `/docs`
6. ✅ Observabilidad: Sentry integrado en web y API con error tracking
7. ✅ UI de gestión de usuarios: Panel completo para ADMIN (roles, contraseñas, activación)
8. ✅ E2E Testing: 13 tests con estrategia piramidal (smoke/critical/full)
9. ✅ CI/CD optimizado: Workflows en GitHub Actions (PR checks, CI main, Nightly)
10. ✅ Paginación cursor-based: `/api/bookings`, `/api/services`, `/api/properties`, `/api/users`, `/api/customers`
11. ✅ Code Coverage: Configurado con V8 provider y thresholds automáticos (API: 85%, Web: 70%)
12. ✅ Interfaces TypeScript: Tipos e interfaces para SOLID (auth, user, booking, service, property)
13. ✅ Refactorización masiva: 450+ líneas de código duplicado eliminadas (6 bibliotecas compartidas, 60% reducción)

### Pendiente 🔄

1. **Observabilidad avanzada:**
   - Configurar alertas Sentry en Slack/Email
   - Dashboard de métricas de negocio (Grafana)
   - Performance budgets y thresholds

2. **Roadmap funcional:**
   - Sistema de estilos compartido (Tailwind o Vanilla Extract)
   - Notificaciones push para coordinadores
   - UI de paginación en frontend (infinite scroll / load more)

3. **Arquitectura (Sprint 2-3):**
   - Implementar dependency injection con interfaces creadas
   - Separar tests de integración de tests unitarios
   - Repositorios concretos implementando interfaces

4. **DevOps:**
   - Postdeploy hook automático para seed inicial
   - Documentar proceso de deployment en `DEPLOYMENT.md`

---

## 11. Refactorización y Mejoras de Código

### 11.1 Eliminación de Código Duplicado (12 octubre 2025)

**Commit:** `71641c4` - refactor: eliminate 450+ lines of duplicate code across the project

**Impacto:**

- ✅ 450+ líneas de código duplicado eliminadas
- ✅ 60% de reducción en duplicación de código
- ✅ Single source of truth implementado
- ✅ 58/58 tests pasando post-refactorización
- ✅ 0 errores de lint y typecheck

**Bibliotecas compartidas creadas:**

**Web (`apps/web`):**

1. `lib/types.ts`: Tipos TypeScript centralizados
   - `PaginatedResult<T>`, `PaginationInfo`
   - `User`, `Service`, `Property`, `Booking`, `Customer`
   - Tipos de respuesta de API

2. `lib/api-client.ts`: Cliente HTTP reutilizable
   - Manejo consistente de errores HTTP
   - Abstracción de fetch con credenciales
   - Parsing de respuestas JSON

3. `hooks/use-update-handler.ts`: Hook de actualización
   - Lógica de debounce compartida
   - Gestión de estado de actualización
   - Manejo de errores con toast notifications

**API (`apps/api`):**

1. `lib/pagination.ts`: Lógica de paginación cursor-based
   - Función `buildPaginatedResponse<T>`
   - Serialización/deserialización de cursores
   - Cálculo de nextCursor automático

2. `lib/validation.ts`: Esquemas Zod compartidos
   - Validaciones de paginación (limit, cursor)
   - Validaciones de campos comunes
   - Helpers de validación reutilizables

3. `lib/bcrypt-helpers.ts`: Utilidades de hashing
   - `hashPassword()` y `comparePassword()`
   - Manejo consistente de bcryptjs namespace

4. `lib/prisma-error-handler.ts`: Manejo centralizado de errores Prisma
   - Función `handlePrismaError()` para errores P2002, P2025, P2003
   - Mensajes de error configurables por contexto
   - Logging de errores inesperados

5. `lib/serializers.ts`: Serialización de tipos Prisma a JSON
   - `serializeService()` para conversión de Decimal a number
   - `serializeBooking()` con soporte para relaciones anidadas
   - Type-safe con generics TypeScript
6. `lib/soft-delete-extension.ts`: Extensión Prisma que filtra `deletedAt` y transforma los `delete*` en soft delete

**E2E (`tests/e2e`):**

1. `support/auth.ts`: Helpers de autenticación para E2E
   - `loginAsAdmin()` con retry logic y manejo de IPs únicas
   - `ipForTest()` para evitar rate limiting cruzado
   - Configuración centralizada de credenciales

**Archivos refactorizados:**

- `apps/web/app/actions.ts`: Extraída lógica de API client y tipos
- `apps/api/src/routes/services.ts`: Usa el contenedor DI y delega en `ServiceRepository`
- `apps/api/src/routes/properties.ts`: Usa `PropertyRepository` + paginación compartida
- `apps/api/src/routes/bookings.ts`: Delegación a `BookingRepository` con serializers
- `apps/api/src/routes/users.ts`: Delegación a `UserRepository` + bcrypt-helpers
- `apps/web/components/services-manager.tsx`: Usa use-update-handler
- `apps/web/components/properties-manager.tsx`: Usa use-update-handler
- `apps/web/components/bookings-manager.tsx`: Usa use-update-handler
- `apps/web/components/customers-manager.tsx`: Usa types compartidos
- `tests/e2e/auth.spec.ts`, `operations.spec.ts`, `security.spec.ts`: Usan support/auth.ts

**Beneficios medibles:**

- Mantenibilidad: Un solo lugar para actualizar lógica de paginación
- Testabilidad: Funciones compartidas más fáciles de testear
- Consistencia: Misma lógica en todos los endpoints
- Performance: Reducción de bundle size por eliminación de duplicados

---

## 12. Incidentes Resueltos

### 2025-10-09: Producción rota por dependencia no actualizada en seed

**Problema:**

- Después de eliminar código muerto (`assignedStaffId` del modelo `Booking` en commit `28010d4`), el login de producción comenzó a fallar con error 500
- CI/CD estaba fallando silenciosamente
- Base de datos de producción quedó vacía

**Causa raíz:**

1. Al eliminar `assignedStaffId` del schema Prisma, no se actualizó `apps/api/prisma/seed.ts` que aún lo referenciaba
2. El seed fallaba con `PrismaClientValidationError: Invalid prisma.booking.upsert() invocation`
3. Producción nunca ejecuta seed automáticamente (no hay hook postdeploy)
4. El schema de producción tampoco estaba actualizado (faltaba campo `isActive` agregado en feature de activación de usuarios)

**Lección aprendida:**

> **Cuando se elimina "código muerto", verificar TODAS las dependencias, no solo referencias en TypeScript. Incluir: seeds, migrations, tests, documentación.**

**Resolución:**

1. **Fix inmediato** (commit `747a428`): Eliminado `assignedStaffId` de seed.ts
2. **Optimización CI** (commit `b03808c`): Cambiado Playwright install de "todos los browsers" a solo `chromium` → CI de 13+ min a 3m18s
3. **Schema de producción**: Ejecutado manualmente `prisma db push --accept-data-loss` contra Neon production
4. **Seed de producción**: Ejecutado `tsx prisma/seed.ts` con credenciales de producción
5. **Verificación**: Login y panel operativo funcionando en producción con todos los datos

**Estado final:**
✅ Producción operativa con datos completos
✅ CI pasando en 3m18s (antes: 13+ min)
✅ UI de activación de usuarios verificada en producción
✅ Base de datos con schema actualizado (PostgreSQL 17 + campo `isActive`)

**Mejora recomendada:**

- Considerar agregar `postdeploy` script en `package.json` para ejecutar seed automáticamente en deployments iniciales
- O documentar proceso manual de seed en [`operations/deployment.md`](../operations/deployment.md)

---

## 13. Referencias

- Repositorio: <https://github.com/albertodimas/brisa-cubana-clean-intelligence>
- Despliegue web: <https://brisa-cubana-clean-intelligence.vercel.app>
- Despliegue API: <https://brisa-cubana-clean-intelligence-api.vercel.app>
