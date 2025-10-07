# Brisa Cubana Clean Intelligence

Monorepo reiniciado para convertir el proyecto en una plataforma real y comprobable. El stack actual contiene:

- **Frontend:** Next.js 15.5.4 + React 19.2.0 (`apps/web`) con sesión gestionada por Auth.js (NextAuth v5) y panel operativo para alta/edición de servicios, propiedades y reservas con filtros dinámicos
- **API:** Hono 4.9.10 (`apps/api`) con autenticación JWT, middlewares RBAC, rate limiting en `/api/auth/login` y CRUD completo para servicios, propiedades, clientes y reservas (incluye filtros por fecha/estado)
- **Persistencia:** Prisma ORM 6.12.0 sobre PostgreSQL 16 (Docker Compose local)
- **Herramientas base:** pnpm 10.18, Turborepo 2.5, TypeScript estricto y CI en GitHub Actions

## Estado al 7 de octubre de 2025

| Área          | Estado | Detalle                                                                           |
| ------------- | ------ | --------------------------------------------------------------------------------- |
| Frontend web  | 🟢     | Auth.js (cookies HttpOnly) + panel operativo con edición y filtros en vivo.       |
| API           | 🟢     | CRUD completo (servicios, propiedades, reservas, clientes) con filtros y pruebas. |
| Tests         | 🟡     | Vitest (`pnpm test`) y suites Playwright iniciales (`pnpm test:e2e`).             |
| Documentación | 🟢     | README + quickstart verificados con setup local.                                  |
| Deploy        | 🔴     | Solo desarrollo local. Deploy no configurado.                                     |

## Requisitos

- Node.js 22.x (se migrará a 24 LTS cuando esté disponible)
- pnpm 10.18 (`corepack enable`)

## Puesta en marcha

1. Instala dependencias:
   ```bash
   pnpm install
   ```
2. Define variables de entorno (archivo `.env` en la raíz o exportadas en tu shell):
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brisa"
   export JWT_SECRET="local-jwt-secret"
   export AUTH_SECRET="local-auth-secret"
   export NEXT_PUBLIC_API_URL="http://localhost:3001"
   # Opcional: token de servicio si necesitas integraciones
   export API_TOKEN="local-service-token"
   # Opcional: personaliza el rate limiting de login (intentos / ventana en ms)
   export LOGIN_RATE_LIMIT="5"
   export LOGIN_RATE_LIMIT_WINDOW_MS="60000"
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

## Documentación

- [`docs/quickstart.md`](docs/quickstart.md): onboarding local paso a paso (verificado).

## Autenticación y RBAC

- Login API: `POST http://localhost:3001/api/auth/login` con `email` y `password`.
  - Credenciales sembradas: `admin@brisacubanaclean.com / Brisa123!` y `ops@brisacubanaclean.com / Brisa123!`.
- La web usa Auth.js (NextAuth v5) para guardar el JWT en cookies HttpOnly (`AUTH_SECRET`) y obtener el bearer token en cada server action.
- El login aplica rate limiting configurable (`LOGIN_RATE_LIMIT`, `LOGIN_RATE_LIMIT_WINDOW_MS`) y endurece cookies (`SameSite=Strict`, `Secure`) cuando la aplicación se sirve vía HTTPS.
- Endpoints protegidos (`POST /api/services`, `PATCH /api/services/:id`, `POST/PATCH /api/bookings`, `GET /api/customers`) requieren rol `ADMIN` o `COORDINATOR`.
- El `API_TOKEN` queda reservado para integraciones servidor-servidor; la UI ya no depende de él y exige sesión real.

## Desarrollo activo

El proyecto está en fase de desarrollo local activo. Solo se documenta funcionalidad verificada y probada.

---

Cualquier contribución debe mantener la regla de oro: **solo documentamos lo que existe y ha sido probado.**
