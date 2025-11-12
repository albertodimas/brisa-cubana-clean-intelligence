# Integración con Slack – Brisa OS (Brisa Cubana Clean Intelligence)

**Última actualización:** 23 de octubre de 2025  
**Estado:** ✅ Webhooks configurados en producción (`#alerts-operaciones`) · ✅ Taxonomía de canales aprobada · ✅ Verificación más reciente 23-oct-2025 13:45 UTC

---

## 1. Panorama general

Slack es el canal oficial para notificaciones operativas, incidencias y leads. Todos los sistemas que emiten alertas (Sentry, PostHog, scripts de monitoreo y formularios web) deben apuntar al mismo webhook gestionado en Vercel (`SLACK_WEBHOOK_URL`).

- Responsables: Plataforma (propietario técnico), Operaciones (triage), Marketing (seguimiento de leads).
- Ubicación del webhook: 1Password → “Slack · Brisa Cubana · Webhook Operativo”.

---

## 2. Taxonomía de canales

| Canal                 | Propósito principal                                 | Propietario | Observaciones                                                                                                                       |
| --------------------- | --------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `#alerts-operaciones` | Canal primario de alertas (Sentry, PostHog, health) | Plataforma  | Mensajes automáticos + reacciones manuales (`:eyes:` para ACK).                                                                     |
| `#alerts-criticos`    | Escalaciones SEV0/SEV1 y paging                     | Plataforma  | Solo incidentes confirmados o fails recurrentes.                                                                                    |
| `#alerts-performance` | Métricas de rendimiento (Lighthouse, p95 API)       | Producto    | Usar para degradaciones sostenidas, no para spikes aislados.                                                                        |
| `#alerts-deployments` | Notificaciones de CI/CD y verificación post-deploy  | Operaciones | GitHub Actions + integraciones Vercel; fijar [`manual-vercel-deploy`](manual-vercel-deploy.md) y [`repo-hygiene`](repo-hygiene.md). |
| `#leads-operaciones`  | Leads entrantes desde landing, campañas y redes     | Marketing   | El coordinador comercial asigna ownership con reacciones.                                                                           |

> Si se crean canales adicionales, documentarlos aquí y en `docs/operations/domain-map.md`.

---

## 3. Aplicación y webhooks

- **App Slack:** `Brisa Cubana Notifications` (App ID `A09MF1LE9UK`).
- **Creación:** 21 de octubre de 2025.
- **Webhook activo:** asociado a `#alerts-operaciones`.
- **Permisos:** `incoming-webhook`, `chat:write`.
- **Rotación:** regenerar desde https://api.slack.com/apps/A09MF1LE9UK/incoming-webhooks cuando cambien los canales o se sospeche exposición.

### 3.1 Configuración en Vercel

```bash
# Proyectos web y API (ejecutar desde la raíz del repo)
vercel link --project brisa-cubana-clean-intelligence
vercel env add SLACK_WEBHOOK_URL production
vercel env add SLACK_WEBHOOK_URL preview
vercel env add SLACK_WEBHOOK_URL development

vercel link --project brisa-cubana-clean-intelligence-api
vercel env add SLACK_WEBHOOK_URL production
vercel env add SLACK_WEBHOOK_URL preview
vercel env add SLACK_WEBHOOK_URL development
```

> Introduce manualmente el valor del webhook cuando lo solicite el CLI. Nunca lo pegues en la shell si hay historial compartido.

### 3.2 Variables locales

Para pruebas locales o scripts:

```bash
echo "SLACK_WEBHOOK_URL=<url_webhook>" >> .env.local
```

Recuerda eliminar `.env.local` tras las pruebas si contiene credenciales reales.

---

## 4. Procedimiento de prueba y validación

1. **Descargar variables (producción, solo desde máquina segura):**
   ```bash
   vercel env pull .env.vercel-prod --environment production --scope brisa-cubana
   source .env.vercel-prod
   ```
2. **Enviar mensaje de prueba:**
   ```bash
   SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL" \
     bash scripts/test-slack-webhook.sh "🛰️ Monitoreo automático: webhook activo $(date -u '+%Y-%m-%d %H:%M UTC')"
   ```
3. **Verificar en Slack** (`#alerts-operaciones`) y registrar la fecha en la tabla de verificaciones.
4. **Limpiar archivos temporales:**
   ```bash
   rm .env.vercel-prod
   ```

### 4.1 Prueba rápida con `curl`

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"🛠️ Prueba manual de webhook (Brisa Cubana)"}' \
  "$SLACK_WEBHOOK_URL"
```

La respuesta esperada es `ok`.

### 4.2 Validación post-deploy

- `pnpm sentry:test-event "Webhook verification"` → mensaje en `#alerts-operaciones`.
- `POSTHOG_API_KEY=... SLACK_WEBHOOK_URL=... pnpm posthog:test-event checkout_payment_failed` → mensaje enriquecido con payload de PostHog.

---

## 5. Rotación y mejores prácticas

1. **Rotar el webhook** al menos cada 90 días o tras incidentes de seguridad.
2. **Actualizar** variables en Vercel y GitHub (`SLACK_WEBHOOK_URL`) inmediatamente después de generar el nuevo URL.
3. **Anunciar** en `#alerts-operaciones` la rotación con fecha y responsable.
4. **Registrar** el cambio en `docs/operations/backup-log.md` (sección de evidencias operativas) y en la bóveda de 1Password.
5. **Monitorizar uso** con `vercel logs --prod --scope brisa-cubana --since=24h` en busca de errores derivados de una rotación incompleta.

---

## 6. Registro de verificaciones

| Fecha (UTC)          | Responsable | Resultado | Notas                                                              |
| -------------------- | ----------- | --------- | ------------------------------------------------------------------ |
| 2025-10-21 06:12 UTC | Plataforma  | ✅        | Mensaje base tras alta del webhook.                                |
| 2025-10-21 13:59 UTC | Producto    | ✅        | Alerta `posthog:monitor` recibida.                                 |
| 2025-10-23 13:45 UTC | Operaciones | ✅        | Verificación manual posterior a refactor.                          |
| 2025-10-23 14:20 UTC | Plataforma  | ✅        | Workflow `posthog-monitor.yml` Run #1 confirmó mensaje de control. |

Añade una nueva fila cada vez que se ejecute el procedimiento del apartado 4.

---

## 7. Resolución de problemas

| Síntoma                          | Causa probable                          | Acción correctiva                                                    |
| -------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `channel_not_found`              | Canal renombrado o eliminado            | Actualizar webhook apuntando al nombre nuevo.                        |
| `invalid_payload`                | JSON malformado                         | Validar payload, usar `jq` o herramientas similares.                 |
| Mensaje duplicado                | Reintento automático del emisor         | Confirmar idempotencia del script y añadir `retry_after`.            |
| Sin mensajes recientes           | Webhook rotado sin actualizar variables | Revisar Vercel/GitHub y reconfigurar `SLACK_WEBHOOK_URL`.            |
| Demora > 1 min en recibir alerta | Saturación del canal o rate limit       | Revisar logs Vercel, aplicar backoff y limitar mensajes decorativos. |

---

## 8. Documentos relacionados

- `docs/operations/observability-setup.md` – Configuración detallada de Sentry/PostHog.
- `docs/operations/alerts.md` – Reglas de alertado y severidades.
- `docs/operations/runbook-daily-monitoring.md` – Checklist diario/semanal.
- `docs/marketing/responses-pack.md` – Plantillas para responder leads en `#leads-operaciones`.

---

**Propietario:** Equipo Plataforma  
**Contacto on-call:** `@oncall-platform` (Slack)  
**Última verificación:** 23 de octubre de 2025 (`pnpm sentry:test-event`)
