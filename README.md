<div align="center">

# 🧹 Brisa Cubana Clean Intelligence

**El sistema operativo inteligente para la limpieza premium de Miami-Dade**

[![CI Status](https://github.com/albertodimas/brisa-cubana-clean-intelligence/workflows/CI/badge.svg)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4.9.9-orange)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Plataforma integral que combina **IA**, **automatización** y **experiencia premium** para revolucionar los servicios de limpieza, honrando raíces cubanas.

[🚀 Quick Start](#-quickstart-5-minutos) · [📚 Docs](https://docs.brisacubana.com) · [🐛 Report Bug](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues) · [💡 Request Feature](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues)

</div>

---

## ✨ Características Principales

<table>
<tr>
<td width="50%">

### 🎯 Para Clientes

- **Booking instantáneo** - Reserva en segundos
- **CleanScore™** - Calidad verificada con evidencias
- **Transparencia total** - Fotos, videos, reportes en tiempo real
- **Pricing dinámico** - Precios justos basados en demanda

</td>
<td width="50%">

### 👨‍💼 Para Operaciones

- **Dashboard analítico** - Métricas en vivo
- **IA predictiva** - Optimización de rutas y scheduling
- **Integraciones PMS** - Hostaway, Guesty, Mews
- **ESG automático** - Reportes de sostenibilidad

</td>
</tr>
</table>

---

## 🚀 Quickstart (5 minutos)

```bash
# 1️⃣ Prerequisitos: Node 24.9.0+, pnpm 10.17.1+, Docker
nvm use
pnpm install

# 2️⃣ Configurar entorno
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# Editar .env files con tus valores (JWT_SECRET, DATABASE_URL, etc.)

# 3️⃣ Levantar base de datos
docker compose up -d

# 4️⃣ Setup inicial
pnpm db:setup

# 5️⃣ Iniciar desarrollo
pnpm dev
```

**URLs:**

- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:4000
- 📊 **Docs**: http://localhost:8000 (ejecutar `make serve`)

**Credenciales demo:**

- 👤 Admin: `admin@brisacubana.com` / `Admin123!`
- 👥 Cliente: `cliente@example.com` / `Cliente123!`

📖 **Guía detallada**: [docs/for-developers/quickstart.md](docs/for-developers/quickstart.md)

---

## 🏗️ Stack Tecnológico

### Frontend

- **Next.js 15.5.4** - App Router + Turbopack ⚡
- **React 19.1.1** - Server Components first
- **Tailwind CSS 4.1.13** - Utility-first styling
- **Auth.js v5** - NextAuth con DAL pattern
- **Framer Motion** - Animaciones fluidas

### Backend

- **Hono 4.9.9** - Ultraligero, edge-ready
- **Node.js 24.9.0** - Runtime moderno
- **Prisma 6.16.2** - ORM type-safe
- **PostgreSQL 17** - Base de datos relacional
- **Zod 3.23.8** - Validación de schemas

### DevOps & Testing

- **pnpm 10.17.1 + Turborepo 2.5.8** - Monorepo optimizado
- **Vitest 3.2.4** - Testing unitario (171 tests ✅)
- **Playwright 1.55.1** - E2E testing
- **Docker Compose** - Desarrollo local
- **GitHub Actions** - CI/CD automático

---

## 📊 Estado del Proyecto

| Componente          | Estado           | Descripción                                                                                       |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| **Backend API**     | ✅ Implementado  | Hono + Prisma con módulos para servicios, bookings, usuarios, pagos y alertas.                    |
| **Frontend Web**    | 🟡 MVP funcional | Next.js App Router con dashboard y flujo de reservas; concierge/staff en progreso.                |
| **Auth System**     | ✅ Disponible    | NextAuth v5 (App Router) + JWT emitidos por la API con roles RBAC básicos.                        |
| **Payments**        | 🟡 Integración   | Endpoints Stripe Checkout y webhooks listos; requiere claves reales para validar end-to-end.      |
| **Testing**         | ✅ En marcha     | 171 pruebas Vitest + 15 escenarios Playwright; cobertura automática pendiente.                    |
| **CI/CD**           | 🟡 Configurada   | 7 workflows en `.github/workflows/`; paso de Codecov deshabilitado hasta definir secreto.         |
| **Documentación**   | ✅ Extensa       | 120+ archivos Markdown, MkDocs + Typedoc + Storybook (artefactos locales).                        |
| **Deployment**      | 🟡 Plantillas    | Configuración de Railway/Vercel en `infra/` y workflows GH para despliegues.                      |
| **CleanScore™ AI** | 🔜 Investigación | Plantillas HTML/PDF y modelos de datos listos; falta modelo de visión.                            |
| **Concierge AI**    | 🔜 Prototipo     | Endpoint `/api/concierge` opera en modo `mock`; soporta OpenAI/Anthropic si se configuran claves. |

---

## 📁 Estructura del Proyecto

```
brisa-cubana-clean-intelligence/
├── apps/
│   ├── api/                    # Hono backend (Node.js 24)
│   │   ├── src/routes/        # REST endpoints para servicios, bookings, pagos, alertas
│   │   ├── prisma/            # Database schema & migrations
│   │   └── tests/             # 171 tests unitarios/integración ✅
│   └── web/                   # Next.js 15 frontend
│       ├── src/app/           # App Router pages
│       ├── src/components/    # React components
│       └── e2e/               # Playwright tests
├── packages/
│   └── ui/                    # Shared design system (@brisa/ui)
├── docs/                      # Documentation (120+ MD files)
│   ├── for-developers/        # Technical docs
│   ├── for-business/          # Business & operations
│   ├── guides/                # Tutorials
│   └── reference/             # Templates & specs
├── scripts/                   # Automation scripts
├── .github/workflows/         # CI/CD (7 workflows)
└── docker-compose.yml         # Local development
```

---

## 🎯 Casos de Uso

### 🏠 Residencial Premium

Propietarios en Brickell, Coral Gables, Miami Beach que valoran **seguridad**, **confiabilidad** y **evidencias inmediatas**.

### 🏨 Hospitality & Vacation Rentals

Property managers de Airbnb/Vrbo que necesitan **turnos express**, **reporting automático** e **integraciones PMS**.

### 🏢 Oficinas Boutique

Empresas con **SLAs estrictos**, **compliance ESG** y **trazabilidad verificable**.

---

## 📚 Documentación

### Para Developers

- **[Quickstart (5 min)](docs/for-developers/quickstart.md)** - Setup completo
- **[API Reference](docs/for-developers/api-reference.md)** - Endpoints documentados (servicios, bookings, pagos, alertas)
- **[Testing Guide](docs/for-developers/testing.md)** - Vitest + Playwright
- **[Deployment Guide](docs/for-developers/deployment.md)** - Vercel/Railway/Fly.io

### Para Business

- **[Vision & Strategy](docs/for-business/vision-strategy.md)** - Misión, OKRs, roadmap
- **[Market Analysis](docs/for-business/market-compliance.md)** - Miami-Dade 2025
- **[AI & Automation](docs/for-business/ai-automation.md)** - Estrategia de IA
- **[SOPs](docs/for-business/operations/sops/)** - Procedimientos operativos

### Arquitectura

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Overview técnico de alto nivel
- **[Diagrams](docs/for-developers/diagrams/)** - C4, flowcharts, sequences

**📖 Documentación completa**: http://localhost:8000 (`make serve`)

---

## 🧪 Testing

```bash
# Unit tests (Vitest)
pnpm test                    # Todos los tests
pnpm test:coverage           # Con coverage

# E2E tests (Playwright)
pnpm test:e2e                # Smoke tests
pnpm playwright test --ui    # UI mode (debugging)

# Linting
pnpm lint                    # ESLint + markdownlint + cspell
pnpm typecheck               # TypeScript
pnpm format                  # Prettier
```

**Estado actual**: 171/171 pruebas Vitest y 15/15 escenarios Playwright pasando (ejecución local `2025-10-03`).

**Linting**: `pnpm lint` sin advertencias (`2025-10-03`).

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend (Railway/Fly.io)

```bash
# Railway
railway up

# Fly.io
fly deploy
```

**Guía completa**: [docs/for-developers/deployment.md](docs/for-developers/deployment.md)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development workflow
- Git conventions (Conventional Commits)
- Testing guidelines
- Code review process

**Quick steps:**

```bash
# 1. Fork & clone
git clone git@github.com:YOUR_USERNAME/brisa-cubana-clean-intelligence.git

# 2. Create branch
git checkout -b feature/amazing-feature

# 3. Make changes & test
pnpm lint
pnpm test
pnpm typecheck

# 4. Commit & push
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature

# 5. Open PR
gh pr create --fill
```

---

## 📜 License & Security

- **License**: [MIT](LICENSE)
- **Security**: [SECURITY.md](SECURITY.md) - Report vulnerabilities
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

## 🌟 Roadmap

### ✅ Phase 1: MVP (Complete)

- [x] Backend API (endpoints principales)
- [x] Frontend dashboard
- [x] Auth system (JWT + NextAuth)
- [x] Stripe payments
- [x] Testing suite
- [x] Documentation (120+ MD files)

### 🔄 Phase 2: Expansion (In Progress)

- [ ] CleanScore™ AI (computer vision)
- [ ] Concierge IA (GPT-4.1 + Realtime API)
- [ ] PMS integrations (Hostaway, Guesty, Mews)
- [ ] Marketing autopilot
- [ ] Dynamic pricing engine

### 🔜 Phase 3: Innovation (Roadmap)

- [ ] 3D tours / WebXR
- [ ] Voice-first staff interface
- [ ] Digital twin (operational + financial)
- [ ] Robotic collaboration
- [ ] ESG reporting automation

Full roadmap: [docs/for-business/roadmap.md](docs/for-business/roadmap.md)

---

## 📞 Contact & Links

- **GitHub**: [@albertodimas](https://github.com/albertodimas)
- **Email**: albertodimasmorazaldivar@gmail.com
- **Docs**: https://docs.brisacubana.com
- **Issues**: [GitHub Issues](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues)

---

<div align="center">

**Built with ❤️ in Miami, honoring Cuban heritage**

⭐ Star us on GitHub if you like this project!

</div>
