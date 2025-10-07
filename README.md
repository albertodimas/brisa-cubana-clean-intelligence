# Brisa Cubana Clean Intelligence

Monorepo reiniciado para convertir el proyecto en una plataforma real y comprobable. El stack actual contiene:

- **Frontend:** Next.js 15.5.4 + React 19.2.0 (`apps/web`)
- **API:** Hono 4.9.10 desplegable en Vercel Functions o Railway (`apps/api`)
- **Persistencia:** Prisma ORM 6.12.0 sobre PostgreSQL 16 (Docker Compose local / Railway gestionado)
- **Herramientas base:** pnpm 10.18, Turborepo 2.5, TypeScript estricto

## Estado al 7 de octubre de 2025

| Área          | Estado | Detalle                                                                 |
| ------------- | ------ | ----------------------------------------------------------------------- |
| Frontend web  | 🟡     | Landing mínimo sin autenticación ni datos en vivo.                      |
| API           | 🟡     | Servicios REST con Prisma y validaciones; falta autenticación real.     |
| Tests         | 🟢     | Vitest `run` en API y web (9 pruebas) pasan sin modo watch.             |
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

## Próximos hitos

1. Implementar autenticación (JWT/cookies) y control RBAC.
2. Ampliar CRUD de reservas/propiedades con permisos y filtros reales.
3. Configurar CI/CD (GitHub Actions) con matrices Node 22/24 y despliegue Vercel/Railway.
4. Redactar documentación honesta basada en funcionalidades verificadas.

---

Cualquier contribución debe mantener la regla de oro: **solo documentamos lo que existe y ha sido probado.**
