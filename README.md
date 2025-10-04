# Brisa Cubana Clean Intelligence

**Sistema operativo para operaciones de limpieza premium en Miami-Dade.**

[![CI Status](https://github.com/albertodimas/brisa-cubana-clean-intelligence/workflows/CI/badge.svg)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions)
[![Docs](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/docs-deploy.yml/badge.svg)](https://albertodimas.github.io/brisa-cubana-clean-intelligence/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4.9.9-orange)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub last commit](https://img.shields.io/github/last-commit/albertodimas/brisa-cubana-clean-intelligence)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/albertodimas/brisa-cubana-clean-intelligence)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues)
[![GitHub stars](https://img.shields.io/github/stars/albertodimas/brisa-cubana-clean-intelligence?style=social)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/stargazers)

Brisa Cubana Clean Intelligence centraliza la experiencia del cliente, las operaciones en campo, la facturación y el control de calidad en un único monorepo. La solución combina un frontend moderno en Next.js, una API REST con Hono y un data layer Prisma/PostgreSQL, con capacidades de automatización e IA en evolución.

## Contenido

- [Huella de Solución](#huella-de-solución)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Inicio Rápido](#inicio-rápido)
- [Servicios Locales](#servicios-locales)
- [Flujo de Desarrollo](#flujo-de-desarrollo)
- [Documentación](#documentación)
- [Estado del Proyecto](#estado-del-proyecto)
- [Roadmap](#roadmap)
- [Licencia y Soporte](#licencia-y-soporte)

## Huella de Solución

### Experiencia del Cliente

- Flujos de reserva con disponibilidad en tiempo real y pricing transparente.
- Paquetes de evidencia CleanScore (fotos, notas, inspecciones) por servicio.
- Portal de autoservicio para agendas, facturas y retroalimentación.

### Operaciones y Crecimiento

- Panel analítico para demanda, utilización de cuadrillas y seguimiento SLA.
- Programación y enrutamiento asistidos por IA (en desarrollo).
- Integraciones con PMS (Hostaway, Guesty, Mews) y facturación vía Stripe.
- Reportes ESG y de riesgo para cumplir con regulaciones locales.

## Arquitectura del Sistema

- `apps/web`: Next.js 15.5.4 (App Router), React 19, Tailwind CSS 4.1.13, Auth.js v5.
- `apps/api`: Hono 4.9.9 sobre Node.js 24.9.0, Prisma 6.16.2 y validaciones Zod.
- `packages/ui`: Design system compartido utilizado por la web.
- `docs`: Base de conocimiento en MkDocs con 120 documentos.
- Tooling: pnpm 10.17.1, Turborepo 2.5.8, Vitest 3.2.4, Playwright 1.55.1, GitHub Actions.

La arquitectura detallada, principios de diseño y diagramas están disponibles en `docs/for-developers/architecture.md` y `docs/for-developers/diagrams/`.

## Inicio Rápido

```bash
# 1. Requisitos (Node 24.9.0+, pnpm 10.17.1+, Docker 28+)
nvm use
pnpm install

# 2. Plantillas de entorno
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 3. Configura secretos (edita los archivos copiados)
#    - DATABASE_URL (PostgreSQL en 5433)
#    - JWT_SECRET y NEXTAUTH_SECRET (usa `openssl rand`)
#    - Claves de Stripe si probarás pagos

# 4. Infraestructura local
docker compose up -d

# 5. Base de datos
pnpm db:setup

# 6. Ejecuta el stack
pnpm dev
```

Credenciales de demostración generadas por el seed:

- Admin: `admin@brisacubanaclean.com` / `Admin123!`
- Staff: `staff@brisacubanaclean.com` / `Staff123!`
- Cliente: `client@brisacubanaclean.com` / `Client123!`

## Servicios Locales

| Servicio      | URL                   |
| ------------- | --------------------- |
| Web (Next.js) | http://localhost:3000 |
| API (Hono)    | http://localhost:3001 |
| PostgreSQL    | localhost:5433        |
| Redis         | localhost:6380        |
| MailHog       | http://localhost:8026 |
| Documentación | http://localhost:8000 |

Ejecuta `make serve` para levantar la documentación (MkDocs) en local.

## Flujo de Desarrollo

### Guardias de calidad

```bash
pnpm lint         # ESLint + markdownlint + cspell
pnpm typecheck    # Validación global de TypeScript
pnpm format       # Formato con Prettier
```

### Pruebas

```bash
pnpm test            # Vitest (API + packages UI)
pnpm test:coverage   # Vitest con reporte de cobertura
pnpm test:e2e        # Playwright (construye la web antes de ejecutar)
```

### Scripts útiles

```bash
pnpm dev:web       # Ejecuta solo la web
pnpm dev:api       # Ejecuta solo la API
pnpm db:reset      # Recrea esquema y seed de datos
pnpm db:studio     # Prisma Studio
pnpm docs:serve    # Vista previa MkDocs en :8000
pnpm stripe:listen # Forward de webhooks de Stripe
```

Las guías de contribución, estrategia de ramas y gobierno de releases están documentadas en `CONTRIBUTING.md` y `docs/development/delivery-plan.md`.

## Documentación

- Onboarding técnico: `docs/for-developers/quickstart.md`
- Referencia de API: `docs/for-developers/api-reference.md`
- Estrategia de pruebas: `docs/for-developers/testing.md`
- Playbooks de despliegue: `docs/for-developers/deployment.md`
- Negocio y operaciones: `docs/for-business/`
- Runbooks operativos: `docs/operations/runbooks/`

La base completa se publica con MkDocs (`mkdocs.yml`).

## Estado del Proyecto

| Componente               | Estado      | Comentarios                                                                  |
| ------------------------ | ----------- | ---------------------------------------------------------------------------- |
| Backend API              | Operativo   | Servicios, reservas, usuarios, pagos y alertas implementados.                |
| Frontend Web             | Beta        | Dashboard y flujo de reservas listos; workspace de concierge en curso.       |
| Autenticación            | Operativo   | Auth.js v5 + JWT con roles RBAC.                                             |
| Pagos                    | En progreso | Endpoints Stripe y webhooks listos; requieren claves reales end-to-end.      |
| Testing                  | Operativo   | 171 pruebas Vitest y 15 escenarios Playwright pasan en ejecución local.      |
| CI/CD                    | En progreso | Siete workflows en GitHub Actions; falta publicar cobertura automática.      |
| Documentación            | Completa    | Sitio MkDocs, Typedoc y Storybook generados localmente.                      |
| Artefactos de despliegue | En progreso | Plantillas Railway y Vercel disponibles; endurecimiento continuo.            |
| CleanScore AI            | Planeado    | Modelos de datos y plantillas listas; visión computacional en investigación. |
| Concierge AI             | Prototipo   | Endpoint `/api/concierge` opera en modo mock y soporta OpenAI/Anthropic.     |

## Roadmap

1. **Fase 1 — MVP (completa):** Booking, facturación y dashboard centrales.
2. **Fase 2 — Expansión (vigente):** Operaciones asistidas por IA, integraciones PMS, automatización de marketing.
3. **Fase 3 — Innovación (planificada):** Captura 3D, interfaz por voz, automatización ESG y colaboración robótica.

El detalle se mantiene en `docs/for-business/roadmap.md`.

## Licencia y Soporte

- Licencia: `MIT` (ver `LICENSE`).
- Política de seguridad: `SECURITY.md` (responsible disclosure).
- Código de conducta: `CODE_OF_CONDUCT.md`.
- Contacto: [GitHub Issues](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues) o `albertodimasmorazaldivar@gmail.com`.

Construido con orgullo en Miami, honrando la herencia cubana.
