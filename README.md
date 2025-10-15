# Brisa Cubana Clean Intelligence

Monorepo reiniciado para convertir el proyecto en una plataforma operativa y verificable.  
Actualizado al **15 de octubre de 2025** con **180 pruebas automatizadas** (161 unit/integration + 19 E2E) pasando en CI; release etiquetado como **v0.3.0** tras completar la Fase 2 con búsquedas y filtros visibles en la UI.

## Stack actualizado

- **Frontend:** Next.js 15.5.5 + React 19.2.0 (`apps/web`) con Auth.js (NextAuth v5), server actions y proxy interno `/api/*` hacia la API Hono (`INTERNAL_API_URL`).
- **API:** Hono 4.9.12 (`apps/api`) sobre Node.js 22, autenticación JWT, RBAC por middleware, rate limiting configurable y repositorios Prisma desacoplados.
- **Persistencia:** Prisma ORM 6.17.1 sobre PostgreSQL 16 (Docker local) / PostgreSQL 17 (Neon en producción) con soft delete (`deletedAt`) en todos los modelos.
- **Estilos:** Tailwind CSS 3.4.18 (migración a Tailwind v4 planificada para Q1 2026 en el Issue #40 siguiendo el ADR `docs/decisions/tailwind-v4-deferral.md`).
- **Observabilidad:** Logging con Pino, métricas básicas en `/health`, captura de errores con Sentry y Web Vitals a través de Speed Insights + métricas personalizadas.citeturn2search1turn3search7
- **Tooling base:** pnpm 10.18, Turborepo 2.5.8, TypeScript 5.9, Vitest 3.2, Playwright 1.56, Husky + lint-staged, CI en GitHub Actions.

## Estado al 15 de octubre de 2025

| Área          | Estado | Detalle                                                                                                                                            |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend web  | 🟢     | Panel operativo con búsqueda debounced, chips de filtros activos, gestión de usuarios (roles), formularios server action y proxy interno `/api/*`. |
| API           | 🟢     | CRUD completo (servicios, propiedades, reservas, clientes, usuarios) con repositorios, búsqueda paginada, soft delete y rate limiting en login.    |
| Tests         | 🟢     | 161 pruebas unitarias/integración + 19 E2E (smoke/critical/full); `pnpm test`, `pnpm test:e2e:*`.                                                  |
| Documentación | 🟢     | README, `docs/guides/quickstart.md`, `docs/overview/status.md` y OpenAPI (`docs/reference/openapi.yaml`) sincronizados.                            |
| Deploy        | 🟢     | Web (Next.js) y API (Hono) corriendo en Vercel, conectados a PostgreSQL Neon; pipelines CI/CD verdes.                                              |

## Requisitos

- Node.js 22.x (LTS, compatible con Vercel).
- pnpm 10.18 (`corepack enable` lo instala).
- Docker 24+ (para PostgreSQL local).
- Git 2.40+.

## Puesta en marcha

1. Instala dependencias:
   ```bash
   pnpm install
   ```
2. Copia variables de entorno:
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   ```
3. Levanta PostgreSQL local:
   ```bash
   docker compose up -d
   ```
4. Sincroniza y siembra la base:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
5. Ejecuta el stack (Next.js + API):

   ```bash
   pnpm dev -- --parallel
   ```

   - Web: <http://localhost:3000>
   - API: <http://localhost:3001>

Para los tests de humo:

```bash
pnpm test           # Vitest en todos los paquetes
pnpm test:e2e:smoke # Playwright (recomendado instalar navegadores la primera vez)
```

## Scripts útiles

| Comando                         | Descripción                                        |
| ------------------------------- | -------------------------------------------------- |
| `pnpm dev`                      | Ejecuta los `dev` scripts en paralelo (web + api). |
| `pnpm lint`                     | ESLint sobre todos los paquetes.                   |
| `pnpm typecheck`                | Verifica TypeScript de forma estricta.             |
| `pnpm test`                     | Ejecuta Vitest (unit + integration).               |
| `pnpm test:e2e:*`               | Ejecuta Playwright (`smoke`, `critical`, `full`).  |
| `pnpm docs:verify`              | Valida la estructura mínima de documentación.      |
| `pnpm db:push` / `pnpm db:seed` | Sincroniza y popula la base de datos local.        |
| `pnpm build`                    | Compila Next.js y genera `dist` de la API.         |
| `pnpm format`                   | Ejecuta Prettier en código y markdown.             |

## Infraestructura y despliegue

- **Producción Vercel:**
  - Web: https://brisa-cubana-clean-intelligence.vercel.app
  - API: https://brisa-cubana-clean-intelligence-api.vercel.app
- **Base de datos:** PostgreSQL Neon (17) con seed de usuarios, servicios, propiedades y reservas demo.
- **Proxy interno:** La web reexpone `/api/*` hacia la API Hono vía `INTERNAL_API_URL`, evitando exponer secretos en el navegador.
- **Observabilidad:** `GET /health` reporta estado de DB; Sentry captura excepciones (web + API) y Web Vitals se envían a Sentry + Speed Insights para monitoreo continuo.citeturn2search1turn3search7

## Autenticación y RBAC

- Login API (`POST /api/authentication/login`) con rate limiting configurable (`LOGIN_RATE_LIMIT`, `LOGIN_RATE_LIMIT_WINDOW_MS`).
- Credenciales sembradas: `admin@brisacubanaclean.com / Brisa123!`, `ops@brisacubanaclean.com / Brisa123!`, `client@brisacubanaclean.com / Brisa123!`.
- Cookies HttpOnly gestionadas por Auth.js; el panel muestra la sesión activa y permite cerrar sesión con seguridad.
- Endpoints protegidos (`/api/services`, `/api/properties`, `/api/bookings`, `/api/users`, `/api/customers`) exigen roles `ADMIN` o `COORDINATOR`.
- `API_TOKEN` reservado para integraciones servidor-servidor (la UI no depende de él).
- Rotación de contraseñas y actualización de roles disponibles para usuarios `ADMIN` desde la UI y la API.

## Documentación verificada

- Índice maestro: `docs/README.md` (estructura por dominios y reglas de mantenimiento).
- Estado y métricas: `docs/overview/status.md`.
- Quickstart de desarrollo local: `docs/guides/quickstart.md`.
- Referencia API: `docs/reference/api-reference.md` + `docs/reference/openapi.yaml`.
- Decisiones técnicas: `docs/decisions/dependency-updates.md`, `docs/decisions/tailwind-v4-deferral.md` y `docs/decisions/tailwind-v4-plan.md` (Issue #40).

## Desarrollo activo

El proyecto continúa en desarrollo controlado. Siguiente hito: **Fase 5 – migración a Tailwind v4 (Issue #40, Q1 2026)** con investigación previa documentada en el ADR correspondiente.  
Se aceptan contribuciones que mantengan la regla de oro: **solo documentamos y desplegamos lo que existe, está probado y pasa en CI.** Usa `pnpm docs:verify` antes de abrir un PR y mantén Playwright/Vitest verdes.
