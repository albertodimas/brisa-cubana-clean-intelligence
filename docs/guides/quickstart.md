# Quickstart: Desarrollo local

Guía verificada para levantar Brisa Cubana Clean Intelligence en un entorno local.

## Prerrequisitos

| Herramienta | Versión recomendada | Notas                                        |
| ----------- | ------------------- | -------------------------------------------- |
| Node.js     | 22.13.0 (LTS)       | Usa `nvm install 22.13.0 && nvm use`         |
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

   ```bash
   # Copia el template con valores seguros para desarrollo local
   cp apps/api/.env.example apps/api/.env.local

   # El archivo .env.local ya contiene credenciales de desarrollo local seguras
   # Para más información sobre seguridad, ver docs/operations/security.md
   # Si quieres probar el flujo de pagos, asigna claves modo test de Stripe:
   # STRIPE_SECRET_KEY="sk_test_..."
   # STRIPE_PUBLISHABLE_KEY="pk_test_..."
   # STRIPE_WEBHOOK_SECRET="whsec_..."
   # MAGIC_LINK_TTL_MINUTES="15"  # Tiempo de vida de enlaces mágicos para el portal cliente
   # PORTAL_MAGIC_LINK_FROM="Brisa Cubana <no-reply@brisacubanacleanintelligence.com>"
   # PORTAL_MAGIC_LINK_SMTP_HOST="smtp.mailtrap.io"
   # PORTAL_MAGIC_LINK_SMTP_PORT="587"
   # PORTAL_MAGIC_LINK_SMTP_USER="smtp-user"
   # PORTAL_MAGIC_LINK_SMTP_PASSWORD="smtp-password"
   # PORTAL_MAGIC_LINK_BASE_URL="http://localhost:3000"
   # PORTAL_MAGIC_LINK_CONFIRMATION_PATH="/clientes/acceso/confirmar"
   # PORTAL_MAGIC_LINK_EXPOSE_DEBUG="true" # Usa "false" en producción para ocultar el token
   # ENABLE_TEST_UTILS="true" # Solo en local/CI; en Preview/Producción debe ser "false"
   ```

   > El contenedor de PostgreSQL expone el puerto **5433** en tu máquina (`postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev`).

4. **Levantar PostgreSQL (local)**
   ```bash
   docker compose up -d
   ```
5. **Sincronizar y sembrar base de datos**

   ```bash
   pnpm --filter @brisa/api db:push --force-reset
   pnpm --filter @brisa/api db:seed:operativo
   pnpm --filter @brisa/api db:seed:demo
   ```

   > Para escuchar webhooks de Stripe en desarrollo, ejecuta `pnpm stripe:listen` en otra terminal y usa `stripe trigger checkout.session.completed` para enviar eventos de prueba.

6. **Ejecutar el stack**

   ```bash
   pnpm dev -- --parallel
   ```

   - Web: <http://localhost:3000>
   - API: <http://localhost:3001>

## Credenciales sembradas

| Rol          | Usuario                                        | Contraseña  |
| ------------ | ---------------------------------------------- | ----------- |
| Admin        | `admin@brisacubanacleanintelligence.com`       | `Brisa123!` |
| Coordinador  | `operaciones@brisacubanacleanintelligence.com` | `Brisa123!` |
| Cliente demo | `cliente@brisacubanacleanintelligence.com`     | `Brisa123!` |

## Scripts de calidad

```bash
pnpm lint        # ESLint en API y Web
pnpm typecheck   # Validación TypeScript
pnpm test        # Vitest (API + Web)
pnpm test:e2e    # Playwright (requiere servidores locales activos)
pnpm build       # Compila Next.js y API
```

> Tip: instala los navegadores de Playwright la primera vez con `pnpm exec playwright install`.

### Higiene del repositorio

- Antes de abrir un PR, ejecuta `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm docs:verify`.
- Si has acumulado builds o caches, limpia el entorno con `pnpm clean:workspace` (envuelve `scripts/cleanup-local-env.sh`).
- Sigue el playbook operativo en [`docs/operations/repo-hygiene.md`](../operations/repo-hygiene.md) para mantener ramas y documentación bajo control.

### Despliegues de contingencia

- Los despliegues manuales a Vercel deben seguir el procedimiento documentado en [`docs/operations/manual-vercel-deploy.md`](../operations/manual-vercel-deploy.md).
- Cada vez que recurras a ese playbook, anuncia el inicio y fin del despliegue en Slack (`#alerts-deployments`) y documenta cualquier incidencia en el PR asociado.

## Autenticación en la UI

1. Accede a <http://localhost:3000/login> y autentícate con un usuario `ADMIN` o `COORDINATOR`.
2. El panel operativo permitirá crear servicios, propiedades y reservas usando las APIs reales.
3. Para el portal cliente, visita <http://localhost:3000/clientes/acceso>, solicita un enlace mágico con `cliente@brisacubanacleanintelligence.com` y usa el token de debug que se muestra (solo en beta) para confirmar el acceso en <http://localhost:3000/clientes/acceso/confirmar?token=...>.
4. Para validar pagos de prueba, visita <http://localhost:3000/checkout> con las claves modo test de Stripe y usa tarjetas demo (`4242 4242 4242 4242`) antes de activar modo live.

## Problemas comunes

| Síntoma                        | Causa                              | Solución                                                                        |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------- |
| `Authorization header missing` | La integración no envía JWT válido | Genera un token JWT desde `/api/authentication/login` e inclúyelo como `Bearer` |
| `Auth secret is required`      | Falta `AUTH_SECRET` para Auth.js   | Exporta `AUTH_SECRET` en tu `.env` o shell                                      |
| `DATABASE_URL` inválido        | Puerto 5433 en uso                 | Ajusta `docker-compose.yml` o usa `DATABASE_URL` con otro puerto                |
| Error al crear reserva         | Cliente/propiedad no seleccionados | Asegúrate de escoger valores en los desplegables                                |

## Limpieza

```bash
pnpm db:push --force-reset
docker compose down
```
