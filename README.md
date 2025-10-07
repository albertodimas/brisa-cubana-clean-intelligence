# Brisa Cubana Clean Intelligence

Monorepo reiniciado para convertir el proyecto en una plataforma real y comprobable. El stack actual contiene:

- **Frontend:** Next.js 15.5.4 + React 19.2.0 (`apps/web`)
- **API:** Hono 4.9.10 desplegable en Vercel Functions o Railway (`apps/api`)
- **Herramientas base:** pnpm 10.18, Turborepo 2.5, TypeScript estricto

## Estado al 7 de octubre de 2025

| Área          | Estado | Detalle                                                                 |
| ------------- | ------ | ----------------------------------------------------------------------- |
| Frontend web  | 🟡     | Landing mínimo sin autenticación ni datos en vivo.                      |
| API           | 🟡     | Endpoints `/` y `/health` operativos; pendiente integrar PostgreSQL.    |
| Tests         | 🟡     | Vitest configurado; cobertura inicial con pruebas de humo.              |
| Documentación | 🔴     | Solo README. Se reescribirá en paralelo a las funcionalidades reales.   |
| Deploy        | 🔴     | Sin pipelines. Pendiente conectar con Vercel (web) y Railway (API/DB).  |

## Requisitos

- Node.js 22.x (se migrará a 24 LTS cuando esté disponible)
- pnpm 10.18 (`corepack enable`)

## Puesta en marcha

```bash
pnpm install
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
| `pnpm test`      | Ejecuta Vitest con Turborepo          |
| `pnpm typecheck` | Verifica TypeScript en cada paquete   |

## Próximos hitos

1. Añadir Prisma 6.12, migraciones y PostgreSQL gestionado.
2. Implementar autenticación y CRUD de reservas reales.
3. Configurar CI/CD (GitHub Actions) con matrices Node 22/24.
4. Redactar documentación honesta basada en funcionalidades verificadas.

---

Cualquier contribución debe mantener la regla de oro: **solo documentamos lo que existe y ha sido probado.**
