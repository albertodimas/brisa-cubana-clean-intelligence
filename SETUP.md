# Setup Guide - Brisa Cubana Clean Intelligence

Guía completa para configurar el entorno de desarrollo local.

> **🚀 ¿Tienes prisa?** Ve directo a [QUICKSTART.md](QUICKSTART.md) para una guía de **5 minutos** en inglés.

## Prerrequisitos

- **Node.js**: 24.9.0 (usar nvm: `nvm use`)
- **pnpm**: 10.17.1 (vía Corepack)
- **Docker**: Para servicios locales (Postgres, Redis)
- **Git**: Con configuración SSH/GPG

## Instalación rápida

```bash
# 1. Clonar repositorio
git clone git@github.com:albertodimas/brisa-cubana-clean-intelligence.git
cd brisa-cubana-clean-intelligence

# 2. Usar versión correcta de Node
nvm use

# 3. Habilitar Corepack y preparar pnpm
corepack enable
corepack prepare pnpm@10.17.1 --activate

# 4. Instalar dependencias
pnpm install

# 5. Copiar archivos de entorno
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# IMPORTANTE: Estrategia de variables de entorno
# - .env (raíz): Variables para todo el monorepo (DB, Redis, features globales)
# - apps/web/.env.local: Variables específicas del frontend (NEXT_PUBLIC_*, NEXTAUTH_*)
# - apps/api/.env: Variables específicas del backend (API_PORT, WEB_APP_URL, JWT_SECRET)
# - WEB_APP_URL: Usada por el API para redirecciones (reemplaza NEXT_PUBLIC_APP_URL)

# 6. Generar secretos criptográficos
# En .env y apps/web/.env.local reemplazar:
# NEXTAUTH_SECRET=$(openssl rand -base64 32)
# JWT_SECRET=$(openssl rand -hex 64)
# Configura `ALERTS_SLACK_WEBHOOK` si quieres recibir notificaciones en un canal específico.

# 7. Levantar servicios locales
docker compose up -d

# 8. Esperar a que Postgres esté listo
docker compose ps

# 9. Generar Prisma client
pnpm --filter=@brisa/api db:generate

# 10. Ejecutar migraciones
pnpm --filter=@brisa/api db:push

# 11. Poblar base de datos con datos iniciales
pnpm --filter=@brisa/api db:seed

# 12. Instalar navegadores Playwright (opcional smoke tests E2E)
pnpm exec playwright install

# 13. Iniciar desarrollo
pnpm dev
```

## URLs locales

- **Frontend (Next.js)**: http://localhost:3000
- **API (Hono)**: http://localhost:3001
- **Prisma Studio**: `pnpm --filter=@brisa/api db:studio` → http://localhost:5555
- **MailHog (Email testing)**: http://localhost:8025
- **Documentación (MkDocs)**: `make serve` → http://localhost:8000

## Servicios Docker

El `docker-compose.yml` incluye:

- **PostgreSQL 17**: Base de datos principal (puerto 5432)
- **Redis 8**: Cache y sesiones (puerto 6379)
- **MailHog**: Capturar emails en desarrollo (puertos 1025 SMTP, 8025 Web)

```bash
# Comandos útiles
docker compose up -d          # Iniciar servicios
docker compose down           # Detener servicios
docker compose logs -f        # Ver logs en tiempo real
docker compose ps             # Estado de contenedores
docker compose down -v        # Detener y eliminar volúmenes (⚠️ borra datos)
```

## Scripts disponibles

### Desarrollo

```bash
pnpm dev              # Todos los servicios (web + api)
pnpm dev:web          # Solo Next.js
pnpm dev:api          # Solo API Hono
```

### Build

```bash
pnpm build            # Build de todo el monorepo
pnpm turbo run build  # Equivalente con Turborepo directo
```

### Testing

```bash
pnpm test                          # Ejecutar tests de todos los packages
pnpm test -- --coverage            # Con coverage
pnpm --filter=@brisa/api test      # Solo tests de API
pnpm --filter=@brisa/ui test       # Solo tests del design system
pnpm test:e2e                      # Playwright (servidor local en http://localhost:3000)
```

### Linting y formato

```bash
pnpm lint             # Lint completo (TS + Markdown + Spelling)
pnpm lint:md          # Solo Markdown
pnpm lint:spelling    # Solo spelling
pnpm format           # Formatear código con Prettier
pnpm format:check     # Verificar formato sin cambios
```

### Base de datos

```bash
# Prisma
pnpm --filter=@brisa/api db:generate  # Generar Prisma Client
pnpm --filter=@brisa/api db:push      # Sincronizar schema sin migrations
pnpm --filter=@brisa/api db:migrate   # Crear y aplicar migration
pnpm --filter=@brisa/api db:studio    # Abrir Prisma Studio
pnpm --filter=@brisa/api db:seed      # Poblar con datos iniciales
```

### Documentación

```bash
make setup            # Crear venv de Python e instalar MkDocs
make serve            # Levantar docs en http://localhost:8000
make build            # Generar sitio estático en /site
pnpm docs:serve       # Alternativa con pnpm
pnpm docs:build       # Alternativa con pnpm
pnpm docs:build:artifacts  # Generar TypeDoc, Storybook estático y diagramas (CI parity)
pnpm approve-builds puppeteer  # Autorizar descarga de Chromium para Mermaid CLI (una vez)
```

## Autenticación y acceso API

- El login usa contraseñas hasheadas con `bcryptjs` almacenadas en Prisma (`User.passwordHash`).
- El seed crea el usuario demo `demo@brisacubanaclean.com` con contraseña `demo123`.
- El endpoint `/api/auth/login` emite un JWT firmado con `JWT_SECRET`; las rutas sensibles (`/api/services`, `/api/bookings`, `/api/users`) requieren cabecera `Authorization: Bearer <token>`.
- NextAuth almacena el token en la sesión (`session.user.accessToken`) y lo reutiliza para las llamadas server-side.
- Para rotar secretos ejecuta: `openssl rand -hex 64` y actualiza `JWT_SECRET` en todos los entornos.
- Configura `ALERTS_SLACK_WEBHOOK` si quieres recibir notificaciones en un canal específico.

### Verificación del webhook de Stripe

1. Instala y autentica la CLI de Stripe: `brew install stripe/stripe-cli/stripe` o descarga desde https://stripe.com/docs/stripe-cli.
2. En la raíz del repo crea un archivo `.env.local` (si no existe) con `STRIPE_WEBHOOK_SECRET` copiado del dashboard o del comando CLI.
3. Ejecuta el forward del webhook (puedes usar el script helper):
   ```bash
   stripe login          # una sola vez
   pnpm stripe:listen    # wrapper → stripe listen --forward-to localhost:3001/api/payments/webhook
   ```
4. Lanza un evento de prueba:
   ```bash
   pnpm stripe:trigger checkout.session.completed
   ```
5. Observa los logs del API (`pnpm --filter=@brisa/api dev`) y confirma que el booking correspondiente se marca como `paymentStatus = PAID` y `status = CONFIRMED`.
6. Ajusta los mensajes de error o logging según la respuesta real que recibas en consola.

### Reconciliación programada con Stripe

- Ejecuta manualmente: `pnpm --filter=@brisa/api payments:reconcile`.
- Programa un cron (ej. cada hora) exportando tus variables (`STRIPE_SECRET_KEY`, `DATABASE_URL`) para que el script actualice estados en segundo plano.

## Estructura del proyecto

```
.
├── apps/
│   ├── api/              # Hono API (Node/Bun)
│   │   ├── prisma/       # Schema y migrations
│   │   └── src/
│   │       ├── routes/   # Endpoints REST
│   │       └── lib/      # Utilidades
│   └── web/              # Next.js 15 App Router
│       └── src/
│           └── app/      # Páginas y layouts
├── packages/
│   └── ui/               # Design system compartido
│       └── src/          # Componentes React
├── docs/                 # Documentación MkDocs
├── scripts/              # Scripts de automatización
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── docker-compose.yml    # Servicios locales
├── turbo.json            # Configuración Turborepo
├── pnpm-workspace.yaml   # Workspaces pnpm
└── .env.example          # Variables de entorno template
```

## Testing local completo

Antes de hacer push, ejecuta:

```bash
# 1. Linting
pnpm lint

# 2. Type checking
pnpm typecheck

# 3. Tests con coverage
pnpm test -- --coverage

# 4. Build
pnpm build
```

O usa el pre-commit hook (instalado automáticamente con Husky):

```bash
git commit -m "feat: nueva funcionalidad"
# → Ejecuta lint-staged automáticamente
```

## Resolución de problemas

### Error: "Cannot find module '@prisma/client'"

```bash
pnpm --filter=@brisa/api db:generate
```

### Error: "Connection refused" al conectar a Postgres

```bash
# Verificar que Docker esté corriendo
docker compose ps

# Reiniciar servicios
docker compose down && docker compose up -d

# Esperar 10 segundos y reintentar
```

### Error: "pnpm: command not found"

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
```

### Error: Node version incorrecta

```bash
nvm install 24.9.0
nvm use
```

### Limpiar cachés y reinstalar

```bash
# Limpiar todo
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf .turbo apps/*/.turbo packages/*/.turbo
rm -rf apps/api/src/generated
rm pnpm-lock.yaml

# Reinstalar
pnpm install

# Regenerar Prisma
pnpm --filter=@brisa/api db:generate
```

## Siguientes pasos

1. **Revisar documentación completa**: `make serve` → http://localhost:8000
2. **Explorar API**: http://localhost:3001/api/services
3. **Ver Prisma Studio**: `pnpm --filter=@brisa/api db:studio`
4. **Leer arquitectura**: [docs/04-arquitectura-y-stack.md](docs/04-arquitectura-y-stack.md)
5. **Revisar roadmap**: [docs/07-roadmap-y-operaciones.md](docs/07-roadmap-y-operaciones.md)

## Recursos adicionales

- [Documentación Hono](https://hono.dev/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Turborepo Handbook](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
