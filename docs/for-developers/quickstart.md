# Quickstart: Entorno de Desarrollo

## Resumen

Guía paso a paso para que un desarrollador configure y ejecute Brisa Cubana Clean Intelligence en un entorno local. Sigue la plantilla de tutorial del Good Docs Project: objetivo claro, pasos numerados y validaciones al final.

## Audiencia

- Ingenieros backend/frontend que se incorporan al proyecto.
- Personal de SRE que necesita reproducir el stack para pruebas.
- Colaboradores externos que requieren visibilidad del sistema.

## Duración estimada

20 minutos con conexión estable y acceso a dependencias.

## Prerrequisitos

| Componente | Versión mínima | Notas                                                       |
| ---------- | -------------- | ----------------------------------------------------------- |
| Node.js    | 24.9.0         | Usa `nvm use` para activar la versión definida en `.nvmrc`. |
| pnpm       | 10.17.1        | Habilita Corepack (`corepack enable`).                      |
| Docker     | 28+            | Necesario para PostgreSQL, Redis y MailHog.                 |
| Git        | 2.40+          | Se recomienda acceso SSH configurado.                       |

Antes de comenzar ejecuta:

```bash
node --version
pnpm --version
docker --version
git --version
```

## Procedimiento

### 1. Clonar el repositorio

```bash
git clone git@github.com:albertodimas/brisa-cubana-clean-intelligence.git
cd brisa-cubana-clean-intelligence
```

Activa la versión de Node definida:

```bash
nvm use
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Completa los valores obligatorios:

- `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev"`
- `JWT_SECRET="$(openssl rand -hex 64)"`
- `NEXTAUTH_SECRET="$(openssl rand -base64 32)"`
- `NEXT_PUBLIC_API_URL="http://localhost:3001"`
- Claves de Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) si probarás pagos.

### 4. Levantar servicios locales

```bash
docker compose up -d
```

Verifica los contenedores:

```bash
docker compose ps
```

Debes ver PostgreSQL en `5433`, Redis en `6380` y MailHog en `8026`.

### 5. Preparar base de datos

```bash
pnpm --filter=@brisa/api db:generate
pnpm --filter=@brisa/api db:push
pnpm --filter=@brisa/api db:seed
```

Usuarios sembrados:

- `admin@brisacubanaclean.com` / `Admin123!`
- `staff@brisacubanaclean.com` / `Staff123!`
- `client@brisacubanaclean.com` / `Client123!`

### 6. Ejecutar el stack

```bash
pnpm dev
```

Servicios disponibles:

- Web: <http://localhost:3000>
- API: <http://localhost:3001>
- MailHog: <http://localhost:8026>

### 7. Preparar documentación (opcional)

Si necesitas consultar la documentación localmente, crea/actualiza el entorno de MkDocs:

```bash
./scripts/setup_env.sh
source .venv/bin/activate
mkdocs serve
```

La documentación estará en <http://localhost:8000>.

## Validación

1. Ejecuta `curl http://localhost:3001/health` y confirma respuesta `status: ok`.
2. Inicia sesión en <http://localhost:3000> con el usuario admin.
3. Corre las validaciones locales:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

## Resolución de problemas

| Síntoma                                     | Causa común                     | Solución                                                              |
| ------------------------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| `Port 5432 already in use`                  | PostgreSQL local en ejecución   | Cambia a puerto `5433` o detén instancia local.                       |
| `Cannot connect to database`                | Docker no levantó servicios     | `docker compose down && docker compose up -d` y re-intenta `db:push`. |
| `Prisma Client not generated`               | Omitiste paso de `db:generate`  | Ejecuta `pnpm --filter=@brisa/api db:generate`.                       |
| `npm command not found` al ejecutar scripts | PATH sin pnpm con Corepack      | Ejecuta `corepack enable` y reinstala dependencias.                   |
| `mkdocs: command not found`                 | Entorno `.venv` no inicializado | Corre `./scripts/setup_env.sh` y activa `. .venv/bin/activate`.       |

## Próximos pasos

- Leer `docs/development/local-testing-workflow.md` para conocer el pipeline pre-push.
- Revisar `docs/operations/runbooks/GO_LIVE.md` si necesitas participar en despliegues.
- Consultar `docs/operations/production/PRODUCTION_READINESS_REPORT.md` para entender el estado actual del proyecto.

## Registro de cambios

| Fecha      | Responsable      | Cambio                                                  |
| ---------- | ---------------- | ------------------------------------------------------- |
| 2025-10-03 | Plataforma & Eng | Reestructuración siguiendo templates Good Docs Project. |
