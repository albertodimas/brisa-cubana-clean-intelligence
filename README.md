# Brisa Cubana Clean Intelligence

Monorepo reiniciado para convertir el proyecto en una plataforma real y comprobable. El stack actual contiene:

- **Frontend:** Next.js 15.5.4 + React 19.2.0 (`apps/web`) con sesión gestionada por Auth.js (NextAuth v5) y panel operativo para alta/edición de servicios, propiedades y reservas con filtros dinámicos
- **API:** Hono 4.9.10 (`apps/api`) con autenticación JWT, middlewares RBAC, rate limiting en `/api/auth/login` y CRUD completo para servicios, propiedades, clientes y reservas (incluye filtros por fecha/estado)
- **Persistencia:** Prisma ORM 6.12.0 sobre PostgreSQL 16 (Docker Compose local)
- **Herramientas base:** pnpm 10.18, Turborepo 2.5, TypeScript estricto y CI en GitHub Actions

## Estado al 7-8 de octubre de 2025

| Área          | Estado | Detalle                                                                              |
| ------------- | ------ | ------------------------------------------------------------------------------------ |
| Frontend web  | 🟢     | Auth.js (cookies HttpOnly) + panel operativo con edición y filtros en vivo.          |
| API           | 🟢     | CRUD completo (servicios, propiedades, reservas, clientes) con filtros y pruebas.    |
| Tests         | 🟡     | Vitest (`pnpm test`) y suites Playwright iniciales (`pnpm test:e2e`).                |
| Documentación | 🟢     | README + quickstart verificados con setup local.                                     |
| Deploy        | 🟢     | **API desplegada en Vercel**: https://brisa-cubana-clean-intelligence-api.vercel.app |

## Requisitos

- Node.js 22.11.0+ (compatible con Vercel, Node 24 LTS disponible en octubre 2025)
- pnpm 10.18.0+ (`corepack enable`)

## Puesta en marcha

1. Instala dependencias:
   ```bash
   pnpm install
   ```
2. Define variables de entorno:

   ```bash
   # Copia el template y edita con tus valores locales
   cp apps/api/.env.example apps/api/.env.local

   # El archivo .env.local ya contiene valores seguros por defecto para desarrollo local
   # Ver docs/SECURITY.md para más información sobre manejo de credenciales
   ```

3. Levanta PostgreSQL (Docker Compose):
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

   - API: <http://localhost:3001>
   - Web: <http://localhost:3000>

Para ejecutar los test básicos:

```bash
pnpm test
```

## Scripts útiles

| Comando          | Descripción                                        |
| ---------------- | -------------------------------------------------- |
| `pnpm dev`       | Ejecuta los `dev` scripts en paralelo              |
| `pnpm lint`      | Lanza ESLint en todos los paquetes                 |
| `pnpm test`      | Ejecuta Vitest (`vitest run`) en cada paquete      |
| `pnpm typecheck` | Verifica TypeScript en cada paquete                |
| `pnpm test:e2e`  | Ejecuta Playwright (requiere servidores en marcha) |
| `pnpm db:push`   | Sincroniza el esquema Prisma con PostgreSQL        |
| `pnpm db:seed`   | Carga datos base (usuarios, servicios, bookings)   |
| `pnpm build`     | Genera artefactos de producción (Next + API)       |

## Deploy en Producción

**API en Vercel:** https://brisa-cubana-clean-intelligence-api.vercel.app

Endpoints verificados funcionando:

- `GET /health` - Health check con estado de la base de datos
- `GET /` - Información de la API (nombre, versión, timestamp)
- `GET /api/services` - Listar servicios
- `GET /api/properties` - Listar propiedades
- `GET /api/bookings` - Listar reservas (acepta filtros `?from=` y `?to=`)

La base de datos de producción está conectada (PostgreSQL en Neon). Los endpoints POST/PATCH requieren autenticación JWT.

## Documentación

- [`docs/quickstart.md`](docs/quickstart.md): onboarding local paso a paso (verificado).

## Autenticación y RBAC

- Login API: `POST http://localhost:3001/api/authentication/login` con `email` y `password`.
  - Credenciales sembradas: `admin@brisacubanaclean.com / Brisa123!` y `ops@brisacubanaclean.com / Brisa123!`.
- La web usa Auth.js (NextAuth v5) para guardar el JWT en cookies HttpOnly (`AUTH_SECRET`) y obtener el bearer token en cada server action.
- El login aplica rate limiting configurable (`LOGIN_RATE_LIMIT`, `LOGIN_RATE_LIMIT_WINDOW_MS`) y endurece cookies (`SameSite=Strict`, `Secure`) cuando la aplicación se sirve vía HTTPS.
- Endpoints protegidos (`POST /api/services`, `PATCH /api/services/:id`, `POST/PATCH /api/bookings`, `GET /api/customers`) requieren rol `ADMIN` o `COORDINATOR`.
- El `API_TOKEN` queda reservado para integraciones servidor-servidor; la UI ya no depende de él y exige sesión real.

## Desarrollo activo

El proyecto está en fase de desarrollo local activo. Solo se documenta funcionalidad verificada y probada.

---

Cualquier contribución debe mantener la regla de oro: **solo documentamos lo que existe y ha sido probado.**
