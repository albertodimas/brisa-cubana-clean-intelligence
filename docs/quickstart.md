# Quickstart: Desarrollo local

Guía verificada para levantar Brisa Cubana Clean Intelligence en un entorno local.

## Prerrequisitos

| Herramienta | Versión recomendada | Notas |
| ----------- | ------------------- | ----- |
| Node.js     | 22.x (LTS)          | Usa `nvm install 22 && nvm use` |
| pnpm        | 10.18               | `corepack enable` lo instala automáticamente |
| Docker      | 24+                 | Necesario para PostgreSQL |
| Git         | 2.40+               | Requiere acceso a GitHub |

## Configuración

1. **Clonar el repositorio**
   ```bash
   git clone git@github.com:albertodimas/brisa-cubana-clean-intelligence.git
   cd brisa-cubana-clean-intelligence
   ```
2. **Instalar dependencias**
   ```bash
   pnpm install
   ```
3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   ```
   Completa al menos:
   - `DATABASE_URL`
   - `API_TOKEN`
   - `JWT_SECRET`
4. **Levantar PostgreSQL (local)**
   ```bash
   docker compose up -d
   ```
5. **Sincronizar y sembrar base de datos**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
6. **Ejecutar el stack**
   ```bash
   pnpm dev -- --parallel
   ```
   - Web: <http://localhost:3000>
   - API: <http://localhost:3001>

## Credenciales sembradas

| Rol          | Usuario                          | Contraseña |
| ------------ | -------------------------------- | ---------- |
| Admin        | `admin@brisacubanaclean.com`     | `Brisa123!`|
| Coordinador  | `ops@brisacubanaclean.com`       | `Brisa123!`|
| Cliente demo | `client@brisacubanaclean.com`    | `Brisa123!`|

## Scripts de calidad

```bash
pnpm lint        # ESLint en API y Web
pnpm typecheck   # Validación TypeScript
pnpm test        # Vitest (API + Web)
pnpm build       # Compila Next.js y API
```

## Autenticación en la UI

1. Accede a <http://localhost:3000/login> y autentícate con un usuario `ADMIN` o `COORDINATOR`.
2. El panel operativo permitirá crear servicios, propiedades y reservas usando las APIs reales.

## Problemas comunes

| Síntoma | Causa | Solución |
| ------- | ----- | -------- |
| `API_TOKEN is not configured` | No configuraste variables en `.env` | Define `API_TOKEN` (puedes usar `local-dev-token`) |
| `DATABASE_URL` inválido | Puerto 5433 en uso | Ajusta `docker-compose.yml` o usa `DATABASE_URL` con otro puerto |
| Error al crear reserva | Cliente/propiedad no seleccionados | Asegúrate de escoger valores en los desplegables |

## Limpieza

```bash
pnpm db:push --force-reset
docker compose down
```
