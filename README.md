# Brisa Cubana Clean Intelligence

Plataforma integral de limpieza inteligente para Miami-Dade, diseñada con IA, automatización y experiencia premium, honrando raíces cubanas.

## Visión

Ser el sistema operativo inteligente que conecta clientes, cuadrillas y aliados para ofrecer servicios de limpieza personalizados, sostenibles y de calidad verificada en todo Miami.

## Estado actual (30 de septiembre de 2025)

- [x] Investigación de mercado, regulación y stack tecnológico completos
- [x] Documentación profesional completa (MkDocs + Material + 76 archivos MD)
- [x] Infraestructura MVP completa: API REST, Prisma ORM, Docker Compose, CI/CD
- [x] Testing configurado: Vitest + coverage, Playwright E2E, Husky hooks
- [x] Autenticación JWT + NextAuth v5 + Dashboard operativo
- [x] Sistema de pagos Stripe completo con webhooks y reconciliación
- [x] Alertas y monitoreo (Slack integration + Sentry ready)
- [x] Documentación técnica nueva: API Reference, Testing Guide, Deployment Guide, Quickstart
- [ ] Validación con clientes objetivo (entrevistas planificadas)
- [ ] Despliegue a producción (Vercel + Railway/Fly.io)

## Stack final recomendado 2025

- **Frontend**: Next.js 15.5.4 (App Router) + React 19.1.1 + Tailwind CSS 4.
- **Auth**: Auth.js v5 (patrón DAL con cookies HttpOnly) — en integración.
- **Backend**: Hono 4.9.9 + Zod para validación centralizada.
- **Base de datos**: Prisma 6.16.2 + PostgreSQL 17 (estrategia join).
- **Cache**: Redis 8 (roadmap; sin cliente en código aún).
- **Testing**: Vitest 3.2.4, Testing Library y Playwright 1.55 para E2E.
- **Monorepo**: pnpm 10.17.1 + Turborepo 2.5.8 (preparado para caché remoto).
- **CI/CD**: GitHub Actions (pnpm cache) + despliegues Vercel.
- **Contenedores**: Docker Compose con health checks listos para prod.
- **Monitoring**: Sentry (errores) + Vercel Analytics / Web Vitals.
- **Payments**: Stripe Checkout + webhook con reconciliación de estados.

## 🚀 Inicio rápido (5 minutos)

**Guía completa**: Ver [docs/getting-started/quickstart.md](docs/getting-started/quickstart.md)

```bash
# 1. Requisitos: Node 24.9.0+, pnpm 10.17.1+, Docker 28+
nvm use
pnpm install

# 2. Variables de entorno
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Editar apps/api/.env con JWT_SECRET, DATABASE_URL, STRIPE_SECRET_KEY

# 3. Base de datos
docker-compose up -d
cd apps/api && pnpm prisma migrate deploy && pnpm run seed && cd ../..

# 4. Iniciar desarrollo
pnpm dev
# Frontend: http://localhost:3000
# API: http://localhost:4000
```

**Credenciales demo:**

- Admin: `admin@brisacubana.com` / `Admin123!`
- Cliente: `cliente@example.com` / `Cliente123!`

## 📚 Documentación

Este repositorio usa **MkDocs + Material** para documentación profesional.

**Levantar docs localmente:**

```bash
make setup     # Crear venv Python e instalar mkdocs
make serve     # http://localhost:8000
```

**Documentación técnica clave:**

- [Quickstart (5 min)](docs/getting-started/quickstart.md)
- [API Reference](docs/api/endpoints.md) - 23 endpoints documentados
- [Testing Guide](docs/development/testing.md) - Vitest + Playwright
- [Deployment Guide](docs/deployment/environments.md) - Vercel/Railway/Fly.io
- [Architecture](ARCHITECTURE.md) - Diagramas C4 y decisiones técnicas
- [Contributing](CONTRIBUTING.md) - Guía de contribución completa
- [Changelog](CHANGELOG.md) - Historial de cambios

**Generar artefactos de documentación:**

```bash
pnpm docs:build:artifacts  # TypeDoc, Storybook, Diagramas Mermaid
```

## Estructura

```
.
├── apps/
│   ├── api/                   # API Hono (TS) lista para Bun/Node
│   └── web/                   # Next.js 15 (App Router + Turbopack)
├── packages/
│   └── ui/                    # Design system compartido (tsup + Vitest)
├── docs/                      # Base de conocimiento MkDocs + Material
├── scripts/
│   ├── setup_env.sh
│   ├── mkdocs_serve.sh
│   └── stripe_*.sh
├── .github/workflows/
│   ├── ci.yml
│   ├── documentation.yml
│   └── payments-reconcile.yml
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── package.json
├── pnpm-lock.yaml
├── README.md
├── LICENSE
├── SECURITY.md
├── Makefile
├── mkdocs.yml
├── requirements.txt
└── ...
```

## Entorno tecnológico

- `nvm` 0.40.3 (ver `.nvmrc` → Node 24.9.0).
- `pnpm` 10.17.1 vía Corepack + Turborepo 2.5.8 (caché local; preparado para remoto).
- `bun` 1.2.23 (servicios event-driven y pruebas cross-runtime).
- `python` 3.13.3 + `.venv` local con `mkdocs` 1.6.1 y `mkdocs-material` 9.6.20.
- `@playwright/test` 1.55.1 para smoke tests E2E.
- Sentry listo para instrumentación (variables en `.env.example`).

## 🎯 Próximos pasos

1. **Validación de mercado**: Ejecutar entrevistas con clientes objetivo
2. **Registro de marca**: Dominio `brisacubana.com` + redes sociales
3. **Sprint 0**: Configurar ambientes staging/producción
4. **Go-live MVP**: Despliegue en Vercel + Railway con monitoreo 24/7

---

> Nota: todo el contenido se mantiene actualizado con las versiones más recientes de las dependencias (Bun 1.2.23, Next.js 15.5.4, React 19.1.1, Hono 4.9.9, Temporal 1.28.1, Redpanda 25.2.5, Redis 8.2.1, LangChain 0.3.35, MkDocs 1.6.1, etc.) y el contexto de Miami-Dade a septiembre de 2025.

## Automatización

Disponibles utilidades para ahorrar tiempo:

- `pnpm dev` / `pnpm build` / `pnpm lint`: ejecutan pipelines con Turborepo 2.5.8.
- `turbo.json`: define dependencias y caché incremental entre apps/paquetes.
- `scripts/setup_env.sh`: crea `.venv` e instala dependencias de documentación.
- `scripts/mkdocs_serve.sh`: levanta MkDocs en modo desarrollo.
- `Makefile`: wrappers para `pnpm dev`, setup de docs y limpieza.
- `.github/workflows/documentation.yml`: usa Node 24 + pnpm para lint + build de la doc.
- `apps/web`: landing Next.js 15 con componentes `@brisa/ui`, framer-motion y lucide-react.
- `packages/ui`: tokens de diseño compartidos (botones, badges, cards, métricas, secciones).
- Playwright configurado en `playwright.config.ts` (`pnpm test:e2e`).
- Stripe Checkout disponible en la API (`/api/bookings`, `/api/payments/checkout-session`) con webhook para actualizar reservas.
- Script helper `pnpm stripe:listen` para escuchar eventos de Stripe en local y `pnpm stripe:trigger <evento>` para simularlos.
- Dashboard staff con filtros por estado/pago, alertas y registro de notas de conciliación vinculadas a Stripe Dashboard.
- Canal de alertas configurable vía `ALERTS_SLACK_WEBHOOK`; la API guarda alertas en `payment_alerts` para evitar duplicados.
- `pnpm --filter=@brisa/api payments:reconcile` permite reintentar conciliaciones con Stripe (útil para cron horario).
- Página `/dashboard/auditoria` ofrece un panel de seguimiento con las últimas alertas y notas resueltas.
- Workflow programado `.github/workflows/payments-reconcile.yml` ejecuta el script de conciliación cada hora (configura `STRIPE_SECRET_KEY` y `DATABASE_URL` en GitHub Secrets).
- Storybook 8 para `@brisa/ui` y carpeta `docs/design-system/` se publicarán desde CI (`ENG-150`).
- Ruta `docs/copilot/` documentará políticas de IA responsable y prompts validados (ticket `ENG-151`).

Ejemplo:

```bash
make setup
make serve
```

## Calidad documental

Antes de abrir un PR, ejecuta los linters para evitar sorpresas en CI:

```bash
pnpm install
pnpm lint          # Turbo (apps + paquetes) + markdownlint + cspell
# Opcional: smoke E2E
pnpm test:e2e      # Requiere `pnpm exec playwright install` y servidor web levantado
# o
make lint
```

## 📂 Recursos adicionales

- **Plantillas**: Entrevistas, minutas, ADR, evaluación IA → `docs/resources/templates/`
- **Datos de mercado**: Turismo Miami 2024, salarios, competencia → `docs/resources/market/`
- **Insights**: Investigación centralizada → `docs/insights/`
- **SOPs**: Operaciones, emergencias, inventario → `docs/operations/sops/`

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para:

- Setup del entorno de desarrollo
- Workflow de Git (branches, commits, PRs)
- Estándares de código TypeScript/React
- Testing guidelines
- Code review process

**Issues & PRs**: Usa los templates en [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/)

## 📜 Licencia y Seguridad

- **Licencia**: Ver [LICENSE](LICENSE)
- **Seguridad**: Ver [SECURITY.md](SECURITY.md) para reportar vulnerabilidades
- **Código de conducta**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
