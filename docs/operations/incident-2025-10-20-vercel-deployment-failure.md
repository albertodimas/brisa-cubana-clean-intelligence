# Incident Report · Vercel Deployment Failures (temporary_failure)

**Estado:** Abierto (última actualización 21-oct-2025 01:15 EDT)  
**Severidad sugerida:** SEV1 (degradación de despliegues, producción sirviendo build antigua)

## Resumen ejecutivo

- Desde las 14:55–15:05 EDT del 20-oct-2025, todos los despliegues automáticos y manuales en Vercel para los proyectos `brisa-cubana-clean-intelligence` (web) y `brisa-cubana-clean-intelligence-api` (API) terminan en `errorCode: temporary_failure` durante la fase `patchBuild`.
- Los entornos de producción siguen respondiendo con HTTP 200 (dominios custom) pero sirven la build previa (`ETag "qcs4eqpgk81eje"` del 20-oct ~14:30 EDT). No es posible promover commits posteriores.
- Vercel reportó un incidente mayor entre 17:12 y 20:04 EDT, marcado como resuelto, pero nuestro proyecto continúa afectado.
- CI interno (GitHub Actions) ya está estable: `CI (Main Branch)` pasó con commit `f14d575` y `Post-Deploy Seed` ejecutó con éxito.

## Evidencia para soporte de Vercel

| Deployment ID                      | Commit                         | Entorno    | Creado (UTC)           | Creado (EDT)           | Error                               |
| ---------------------------------- | ------------------------------ | ---------- | ---------------------- | ---------------------- | ----------------------------------- |
| `dpl_B4yVU2suVsE523hWcUSn2Y3SR3G8` | `8e6a011` (`main`)             | Production | 2025-10-20 19:01:37    | 2025-10-20 15:01:37    | `temporary_failure` en `patchBuild` |
| `dpl_1pFgm1aKYKQwWDFuX7g8QxG3ycVU` | `65b654a` (`main`)             | Production | 2025-10-20 18:56:38    | 2025-10-20 14:56:38    | `temporary_failure` en `patchBuild` |
| `dpl_7KgViV8HNfhUA45vEzChgnJPsKrV` | `dependabot/npm_and_yarn/vite` | Preview    | 2025-10-20 18:54:54    | 2025-10-20 14:54:54    | `temporary_failure` en `patchBuild` |
| `dpl_o77xhkv4f…` (API)             | `8e6a011`                      | Production | 2025-10-20 19:01 aprox | 2025-10-20 15:01 aprox | `temporary_failure` en `patchBuild` |
| `dpl_dtjj5ey29…` (API)             | `65b654a`                      | Production | 2025-10-20 18:56 aprox | 2025-10-20 14:56 aprox | `temporary_failure` en `patchBuild` |

> Para más IDs usar:  
> `vercel list brisa-cubana-clean-intelligence --status ERROR --scope team_GI7iQ5ivPN36nVRB1Y9IJ9UW --token $VERCEL_TOKEN`  
> `vercel list brisa-cubana-clean-intelligence-api --status ERROR …`

## Línea de tiempo

- **2025-10-20 14:54–15:02 EDT:** Primeros fallos consecutivos en despliegues Preview/Production tras merges en `main`.
- **2025-10-20 17:12 EDT:** Vercel declara “Major outage on API, Dashboard, and Builds” (status page).
- **2025-10-20 19:27 EDT:** Vercel indica que la generación de builds se estabiliza, pero APIs/Dashboard siguen degradados.
- **2025-10-20 20:04 EDT:** Vercel cierra el incidente global como resuelto.
- **2025-10-21 00:15 EDT:** Scripts locales confirman que producción sigue sirviendo build previa; nuevos despliegues continúan fallando con `temporary_failure`.
- **2025-10-21 01:12 EDT:** CI interno vuelve a verde (`CI (Main Branch)` + `Post-Deploy Seed`).

## Impacto

- **Usuario final:** Sitio y API siguen operativos pero sin los fixes recientes (ej. middleware async).
- **Equipo interno:** No es posible promover nuevos commits; rotaciones/actualizaciones quedan bloqueadas.
- **Observabilidad:** No se observan fallos en salud ni monitorización externa (solo bloqueo de build).

## Acciones recomendadas

1. Abrir ticket con soporte de Vercel, adjuntando la tabla de evidencia y los logs JSON (`curl https://api.vercel.com/v13/deployments/<id>…`).
2. Solicitar confirmación explícita de que el incidente general no cubrió todos los proyectos y pedir runbook temporal.
3. Evitar redeploy manual hasta recibir confirmación; monitorizar estado cada 30 min.
4. Tras resolución, redeploy manual (`vercel deploy --prod`) y validar endpoints (`curl` a dominios web y API).
5. Documentar cierre en `CHANGELOG.md` y `docs/operations/deployment.md`, actualizando también `docs/overview/status.md`.

## Datos de soporte adicionales

- Team: `Brisa Cubana (team_GI7iQ5ivPN36nVRB1Y9IJ9UW)`
- Proyectos afectados: `brisa-cubana-clean-intelligence`, `brisa-cubana-clean-intelligence-api`
- Región de build: `iad1` (según logs)
- Mensaje de error completo: `"An unexpected error happened when running this build. We have been notified of the problem. This may be a transient error. If the problem persists, please contact Vercel Support https://vercel.com/help"`
- Página de estado: `https://www.vercel-status.com` (incidente 1x2wqn9l3lwt, resuelto 20-oct-2025 20:04 EDT)

## Seguimiento

- Responsable actual: Plataforma (Codex)
- Próxima actualización: 21-oct-2025 09:00 EDT o antes si Vercel responde.
- Pendiente: ticket de soporte, redeploy confirmado, anotación final en changelog/runbooks.
