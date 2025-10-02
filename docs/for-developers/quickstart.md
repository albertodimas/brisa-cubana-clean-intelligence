# Quickstart - 5 Minutos ⚡

Guía express para levantar el proyecto en modo desarrollo en menos de 5 minutos.

## Prerrequisitos

```bash
node --version  # >= 24.9.0
pnpm --version  # >= 10.17.1
docker --version  # >= 28.x
```

## Paso 1: Clonar y configurar (1 min)

```bash
# Clonar repositorio
git clone git@github.com:albertodimas/brisa-cubana-clean-intelligence.git
cd brisa-cubana-clean-intelligence

# Instalar dependencias
pnpm install
```

## Paso 2: Variables de entorno (1 min)

```bash
# Copiar templates de variables de entorno
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

**Configurar claves críticas en `apps/api/.env`:**

```bash
# Generar JWT_SECRET (32+ caracteres)
JWT_SECRET="tu-clave-secreta-muy-segura-aqui-32-chars-min"

# PostgreSQL (Docker levanta el servicio en el puerto host 5433)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev"

# Stripe (usar claves de test de Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Paso 3: Base de datos (1.5 min)

```bash
# Levantar PostgreSQL + Redis + MailHog con Docker
docker compose up -d

# Aplicar migraciones de Prisma
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate

# Cargar datos de prueba (servicios, usuarios demo)
pnpm db:seed
cd ../..
```

## Paso 4: Iniciar servidores (30 seg)

```bash
# Desde la raíz del proyecto
pnpm dev
```

Esto levanta:

- ✅ **API Backend (Hono):** [http://localhost:3001](http://localhost:3001)
- ✅ **Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
- ✅ **Turborepo Watch:** Hot reload en ambos servicios

## Paso 5: Verificar (1 min)

### Backend API Health Check

```bash
curl http://localhost:3001/health
```

Respuesta esperada:

```json
{
  "service": "Brisa Cubana Clean Intelligence API",
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2024-09-30T..."
}
```

### Frontend

Abre [http://localhost:3000](http://localhost:3000)

- Verás la landing page de Brisa Cubana
- Click en **"Get Started"** → redirige a `/auth/signin`

### Credenciales de prueba (creadas por seed.ts)

**Usuario Admin:**

```
Email: admin@brisacubanaclean.com
Password: Admin123!
```

**Usuario Staff:**

```
Email: staff@brisacubanaclean.com
Password: Staff123!
```

**Usuario Cliente:**

```
Email: client@brisacubanaclean.com
Password: Client123!
```

## Siguiente paso

Ahora que tienes el proyecto corriendo:

1. **Explora el Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. **Revisa la documentación completa:** [SETUP.md](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/SETUP.md)
3. **Consulta arquitectura:** [ARCHITECTURE.md](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/ARCHITECTURE.md)
4. **Lee guía de contribución:** [CONTRIBUTING.md](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/CONTRIBUTING.md)

## Troubleshooting Rápido

### Error: "Port 5432 already in use"

Ya tienes PostgreSQL corriendo localmente. Usa el puerto host 5433 definido en `docker-compose.yml` o apunta la aplicación a tu propia instancia:

```bash
# Mantener la configuración por defecto
ports:
  - "5433:5432"

# Alternativa: usar tu PostgreSQL local
# Actualiza DATABASE_URL en apps/api/.env con tus credenciales
```

### Error: "Port 3001 or 3000 already in use"

```bash
# Liberar puertos
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Error: "Prisma Client not generated"

```bash
pnpm --filter=@brisa/api db:generate
pnpm dev
```

### Error: "JWT token verification failed"

Verifica que `JWT_SECRET` en `apps/api/.env` tenga al menos 32 caracteres.

### Error: "Stripe webhook signature verification failed"

En desarrollo local:

1. Instala Stripe CLI: `stripe login`
2. Inicia webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```
3. Copia el webhook secret que imprime y actualiza `STRIPE_WEBHOOK_SECRET`

## Scripts Útiles

```bash
# Limpiar todo y reiniciar
pnpm clean          # Limpia node_modules, .next, dist
pnpm install        # Reinstala dependencias

# Tests
pnpm test           # Vitest tests (backend)
pnpm test:e2e       # Playwright E2E tests

# Linting
pnpm lint           # ESLint + TypeScript checks
pnpm format         # Prettier format

# Base de datos
cd apps/api
pnpm prisma studio  # UI visual de la base de datos (http://localhost:5555)
pnpm prisma migrate dev --name nombre_migracion  # Nueva migración
```

## Recursos Adicionales

- **API Docs:** [API Reference](api-reference.md)
- **Testing Guide:** [Testing](testing.md)
- **Deployment:** [Deployment Guide](deployment.md)
- **Changelog:** [Registro de cambios](../changelog/index.md)

---

**¿Dudas?** Abre un [issue en GitHub](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/new/choose) usando el template de pregunta.
