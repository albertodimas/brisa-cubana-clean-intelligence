# Quickstart (5 minutos)

Guía paso a paso para preparar el entorno local de Brisa Cubana Clean Intelligence en menos de cinco minutos.

## 1. Prerrequisitos

| Herramienta | Versión mínima | Comando sugerido                                                 |
| ----------- | -------------- | ---------------------------------------------------------------- |
| Node.js     | 24.9.0         | `nvm install 24 && nvm use`                                      |
| pnpm        | 10.17.1        | `corepack enable`                                                |
| Docker      | 28             | [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| Git         | 2.40           | Incluido en la mayoría de sistemas                               |

Verifica versiones:

```bash
node --version
pnpm --version
docker --version
git --version
```

## 2. Clonar e instalar

```bash
# Clona el repositorio
git clone git@github.com:albertodimas/brisa-cubana-clean-intelligence.git
cd brisa-cubana-clean-intelligence

# Instala dependencias
pnpm install
```

## 3. Variables de entorno

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Completa los valores obligatorios:

- `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev`
- `JWT_SECRET`: genera con `openssl rand -hex 64`
- `NEXTAUTH_SECRET`: genera con `openssl rand -base64 32`
- `NEXT_PUBLIC_API_URL`: `http://localhost:3001`
- Claves de Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) si deseas probar pagos.

## 4. Levantar infraestructura local

```bash
# PostgreSQL 17, Redis 8 y MailHog
docker compose up -d

docker compose ps
```

Confirma que los contenedores se exponen en los puertos `5433`, `6380` y `8026`.

## 5. Preparar base de datos

```bash
pnpm --filter=@brisa/api db:generate   # Prisma Client
pnpm --filter=@brisa/api db:push       # Sincroniza esquema
pnpm --filter=@brisa/api db:seed       # Carga datos de ejemplo
```

Usuarios sembrados:

- Admin: `admin@brisacubanaclean.com` / `Admin123!`
- Staff: `staff@brisacubanaclean.com` / `Staff123!`
- Cliente: `client@brisacubanaclean.com` / `Client123!`

## 6. Ejecutar el entorno de desarrollo

```bash
pnpm dev
```

Servicios disponibles:

- Web: http://localhost:3000
- API: http://localhost:3001
- MailHog: http://localhost:8026

## 7. Verificaciones básicas

```bash
# Salud de la API
curl http://localhost:3001/health

# Login de prueba
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"Admin123!"}'
```

Revisa http://localhost:3000 y accede con las credenciales de administrador para validar el dashboard.

## 8. Comandos útiles

```bash
pnpm dev:web          # Next.js únicamente
pnpm dev:api          # API Hono únicamente
pnpm db:reset         # Fuerza recreación + seed
pnpm db:studio        # Prisma Studio en navegador
pnpm docs:serve       # Documentación (MkDocs) en :8000
pnpm test             # Vitest completo
pnpm test:e2e         # Escenarios Playwright
pnpm stripe:listen    # Escucha webhooks de Stripe
```

## 9. Problemas frecuentes

### Puerto 5432/3000/3001 en uso

```bash
lsof -i :5432
lsof -i :3000
lsof -i :3001
kill -9 <PID>
```

### Prisma Client no generado

```bash
pnpm --filter=@brisa/api db:generate
```

### Dependencias corruptas

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 10. Próximos pasos

1. Revisa `architecture.md` para entender los componentes clave.
2. Lee `CONTRIBUTING.md` antes de abrir tu primer PR.
3. Explora la documentación completa en `docs/index.md` o ejecuta `make serve`.
