# Runbook: Incidente en la API (5xx)

Este runbook describe cómo responder cuando el endpoint `/api/*` comienza a responder códigos 5xx.

## 1. Detectar y confirmar
- CI/CD: revisa el workflow más reciente en GitHub Actions (`quality` job) para confirmar si la build pasó.
- Logs: en Railway, verifica los logs del servicio API buscando stack traces recientes.
- Healthcheck: ejecuta `curl https://<API_URL>/health` para validar si la base de datos responde.

## 2. Diagnóstico rápido
1. **Autenticación**
   - `curl -X POST https://<API_URL>/api/auth/login -d '{"email":"admin@brisacubanaclean.com","password":"Brisa123!"}' -H "Content-Type: application/json"`
   - Si responde 401, revisa `JWT_SECRET` y expiración de credenciales.
2. **Base de datos**
   - `pnpm --filter @brisa/api db:push --force-reset` (en ambiente de staging) para comprobar conectividad.
   - Confirma variables `DATABASE_URL` y permisos del usuario PostgreSQL.
3. **Servicios críticos**
   - `/api/services` y `/api/properties` deben responder 200.
   - `/api/bookings` debe devolver listado con relaciones `service` y `property`.

## 3. Mitigación
- Si el problema es de datos inconsistentes, ejecuta `pnpm --filter @brisa/api db:seed` en staging para restaurar fixtures mínimas.
- Si hay despliegue defectuoso, realizar **rollback** al último build estable en Vercel/Railway.
- Comunica al canal de operaciones el estado y ETA de recuperación.

## 4. Post-mortem mínimo
- Documenta el incidente (fecha, duración, impacto) en el repositorio (`/docs/runbooks/incidents.log` sugerido).
- Crea issue con acciones correctivas (tests adicionales, alertas, refuerzo de monitoreo).

## 5. Contactos
- Plataforma & Engineering: `albertodimasmorazaldivar@gmail.com`
- DevOps on-call: `ops@brisacubanaclean.com`
