# Guía de Corrección para Railway

**Objetivo:** documentar la remediación aplicada cuando el despliegue en Railway se completaba sin errores de build pero la aplicación no iniciaba correctamente debido a parámetros de ejecución incorrectos.

## 1. Diagnóstico

- El pipeline de Railway completaba la construcción en ~41 segundos y publicaba la imagen generada por el Dockerfile.
- El contenedor se quedaba en estado `starting` porque el servicio estaba configurado para ejecutar `pnpm --filter @brisa/api dev`, lo que forzaba el modo de desarrollo y evitaba el arranque del servidor productivo.
- La variable `NODE_ENV` estaba establecida en `staging`, lo que alteraba la configuración de la API (por ejemplo, reglas de CORS y logging).

## 2. Correcciones Requeridas

1. **Comando de inicio**
   - Recomendado: dejar vacío el campo **Start Command** en Railway para que se utilice el `CMD` definido en el Dockerfile (`npx tsx apps/api/src/server.ts`).
   - Alternativa: establecer el comando en `pnpm --filter @brisa/api start`, que invoca la misma instrucción configurada en `package.json`.

2. **Variables de entorno esenciales**
   - `NODE_ENV=production`
   - `API_PORT=3001`
   - `DATABASE_URL` apuntando a la base de datos correspondiente al entorno.
   - `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ALERTS_SLACK_WEBHOOK` y cualquier otra credencial requerida por la API.

3. **Política de reinicio y healthcheck**
   - Revisar que `railway.toml` mantenga la política de reinicio y la verificación de salud (`/healthz`) ya definidas en el repositorio.

## 3. Procedimiento Paso a Paso

1. Acceder al dashboard de Railway (`https://railway.app/project/<project-id>/service/@brisa/api`).
2. Ir a **Settings → Deploy → Start Command** y aplicar una de las acciones descritas en el punto 2.1.
3. Abrir **Settings → Variables** y actualizar `NODE_ENV` junto con el resto de secretos.
4. Guardar los cambios y seleccionar **Deploy → Redeploy** para lanzar una nueva versión.
5. Alternativamente, realizar un `git push` a `main` para que el workflow de GitHub Actions dispare la publicación.

## 4. Validación

Ejecutar los siguientes comandos tras la actualización:

```bash
curl https://api.brisacubana.com/healthz
curl https://brisaapi-production-up-railw-ae5ab70u.up.railway.app/healthz
```

La respuesta esperada es un objeto JSON con estado `ok`. Revisar los logs en Railway y confirmar el mensaje `API ready on http://localhost:3001 (env production)`.

## 5. Comandos Útiles

```bash
# Listar últimos despliegues de producción
gh run list --workflow=deploy-production.yml --limit 5

# Consultar estado del servicio
auth=$(railway status --service "@brisa/api")

# Ver logs en tiempo real
railway status --service "@brisa/api"
railway logs --service "@brisa/api"
```

## 6. Estado del Código Fuente

- `Dockerfile` multi-stage actualizado para ejecutar `npx tsx apps/api/src/server.ts` en la imagen de runtime.
- Script `start` agregado en `package.json` de la API.
- `railway.toml` define healthcheck y política de reinicio.

### Pendientes Operativos

- Confirmar que el dashboard de Railway no vuelva a introducir el comando de desarrollo.
- Mantener `NODE_ENV` sincronizado con el entorno objetivo.

## 7. Historial

- **Última actualización:** 2025-10-01
- **Responsable:** Equipo de Plataforma

Mantener esta guía en sincronía con los incidentes y cambios aplicados en Railway para garantizar reproducibilidad en futuras correcciones.
