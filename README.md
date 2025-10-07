# Brisa Cubana Clean Intelligence

Monorepo reiniciado para convertir el proyecto en una plataforma real y comprobable. El stack actual contiene:

- **Frontend:** Next.js 15.5.4 + React 19.2.0 (`apps/web`) con panel operativo para crear servicios y activarlos/desactivarlos
- **API:** Hono 4.9.10 con autenticación JWT vía cookies y RBAC, desplegable en Vercel Functions o Railway (`apps/api`)
- **Persistencia:** Prisma ORM 6.12.0 sobre PostgreSQL 16 (Docker Compose local / Railway gestionado)
- **Herramientas base:** pnpm 10.18, Turborepo 2.5, TypeScript estricto y CI en GitHub Actions

## Estado al 7 de octubre de 2025

| Área          | Estado | Detalle                                                                 |
| ------------- | ------ | ----------------------------------------------------------------------- |
| Frontend web  | 🟡     | Landing dinámico con datos reales + panel para crear/activar servicios. |
| API           | 🟢     | Endpoints JWT + RBAC (ADMIN/COORD) y ruta `/api/auth/login` operativa.   |
| Tests         | 🟢     | Vitest `run` en API y web (10 + 1) pasan sin modo watch.                |
| Documentación | 🔴     | Solo README. Se reescribirá en paralelo a las funcionalidades reales.   |
| Deploy        | 🔴     | Sin pipelines. Pendiente conectar con Vercel (web) y Railway (API/DB).  |

## Requisitos

- Node.js 22.x (se migrará a 24 LTS cuando esté disponible)
- pnpm 10.18 (`corepack enable`)

## Puesta en marcha

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
pnpm install
docker compose up -d
pnpm db:push
pnpm db:seed
pnpm dev -- --parallel
```

- `apps/api`: escucha en `http://localhost:3001`
- `apps/web`: escucha en `http://localhost:3000`

Para ejecutar los test básicos:

```bash
pnpm test
```

## Scripts útiles

| Comando          | Descripción                           |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Ejecuta los `dev` scripts en paralelo |
| `pnpm lint`      | Lanza ESLint en todos los paquetes    |
| `pnpm test`      | Ejecuta Vitest (`vitest run`) en cada paquete |
| `pnpm typecheck` | Verifica TypeScript en cada paquete   |
| `pnpm db:push`   | Sincroniza el esquema Prisma con PostgreSQL   |
| `pnpm db:seed`   | Carga datos base (usuarios, servicios, bookings) |
| `pnpm build`     | Genera artefactos de producción (Next + API) |

## Autenticación y RBAC

- Login: `POST http://localhost:3001/api/auth/login` con `email` y `password`.
  - Credenciales sembradas: `admin@brisacubanaclean.com / Brisa123!` y `ops@brisacubanaclean.com / Brisa123!`.
- El token JWT se envía vía cookie `auth_token` (HttpOnly) y puede usarse como header `Authorization: Bearer <token>`.
- Endpoints protegidos (`POST /api/services`, `PATCH /api/services/:id`, `POST /api/bookings`) requieren rol `ADMIN` u `COORDINATOR`.
- El panel operativo de la web usa server actions con el `API_TOKEN` interno; para pruebas de usuario se recomienda iniciar sesión con `curl` o un cliente HTTP y reutilizar el token.

## Próximos hitos

1. Extender CRUD de reservas/propiedades con permisos, filtros y formularios web.
2. Exponer flujos de login/logout en la interfaz pública (NextAuth/Auth.js).
3. Conectar CI/CD con despliegues automatizados (Vercel + Railway) y monitoreo.
4. Redactar documentación honesta basada en funcionalidades verificadas.

---

Cualquier contribución debe mantener la regla de oro: **solo documentamos lo que existe y ha sido probado.**
