# Quickstart: Desarrollo local

Guía verificada para levantar Brisa Cubana Clean Intelligence en un entorno local.

## Prerrequisitos

| Herramienta | Versión recomendada | Notas                                        |
| ----------- | ------------------- | -------------------------------------------- |
| Node.js     | 22.x (LTS)          | Usa `nvm install 22 && nvm use`              |
| pnpm        | 10.18               | `corepack enable` lo instala automáticamente |
| Docker      | 24+                 | Necesario para PostgreSQL                    |
| Git         | 2.40+               | Requiere acceso a GitHub                     |

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
   Crea un archivo `.env` en la raíz (o exporta variables en tu terminal) con al menos:
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brisa"
   export JWT_SECRET="local-jwt-secret"
   export AUTH_SECRET="local-auth-secret"
   export NEXT_PUBLIC_API_URL="http://localhost:3001"
   # Opcional para integraciones: export API_TOKEN="local-service-token"
   # Opcionales: controlar el rate limiting de login
    export LOGIN_RATE_LIMIT="5"
    export LOGIN_RATE_LIMIT_WINDOW_MS="60000"
   ```
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

| Rol          | Usuario                       | Contraseña  |
| ------------ | ----------------------------- | ----------- |
| Admin        | `admin@brisacubanaclean.com`  | `Brisa123!` |
| Coordinador  | `ops@brisacubanaclean.com`    | `Brisa123!` |
| Cliente demo | `client@brisacubanaclean.com` | `Brisa123!` |

## Scripts de calidad

```bash
pnpm lint        # ESLint en API y Web
pnpm typecheck   # Validación TypeScript
pnpm test        # Vitest (API + Web)
pnpm test:e2e    # Playwright (requiere servidores locales activos)
pnpm build       # Compila Next.js y API
```

> Tip: instala los navegadores de Playwright la primera vez con `pnpm exec playwright install`.

## Autenticación en la UI

1. Accede a <http://localhost:3000/login> y autentícate con un usuario `ADMIN` o `COORDINATOR`.
2. El panel operativo permitirá crear servicios, propiedades y reservas usando las APIs reales.

## Problemas comunes

| Síntoma                       | Causa                                        | Solución                                                             |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `API_TOKEN is not configured` | Estás usando integraciones sin definir token | Define `API_TOKEN` si realmente lo necesitas o elimina la referencia |
| `Auth secret is required`     | Falta `AUTH_SECRET` para Auth.js             | Exporta `AUTH_SECRET` en tu `.env` o shell                           |
| `DATABASE_URL` inválido       | Puerto 5433 en uso                           | Ajusta `docker-compose.yml` o usa `DATABASE_URL` con otro puerto     |
| Error al crear reserva        | Cliente/propiedad no seleccionados           | Asegúrate de escoger valores en los desplegables                     |

## Limpieza

```bash
pnpm db:push --force-reset
docker compose down
```
