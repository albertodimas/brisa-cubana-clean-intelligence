# Soporte y Escalamiento – Brisa Cubana Clean Intelligence

> **Última actualización:** 9 de noviembre de 2025  
> **Alcance:** procedimientos para desk de operaciones, equipo NOC y coordinación legal durante la beta previa al GA.

## Canales oficiales

| Canal / Email                                  | Uso principal                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `operaciones@brisacubanacleanintelligence.com` | Coordinación de cuadrillas, aperturas tardías, incidencias en propiedades.      |
| `soporte@brisacubanacleanintelligence.com`     | Portal cliente, facturación, reportes descargables y altas/bajas de usuarios.   |
| WhatsApp Business `+1 786 436 7132`            | Contacto inmediato ES/EN para desbloqueos y asistencia en sitio (24/7).         |
| `seguridad@brisacubanacleanintelligence.com`   | Accesos no autorizados, vulnerabilidades, divulgación responsable.              |
| `noc@brisacubanacleanintelligence.com`         | Escalamiento de alertas PostHog/Stripe/Vercel, degradación de salud o downtime. |

Todos los canales deben registrarse en Linear (`PROD-SUPPORT` project) antes de cerrar la conversación con el cliente.

## SLA beta (Nov 2025 – Ene 2026)

- Incidencia crítica en turno: **TTR < 15 min / Resolución < 2 h.**
- Accesos al portal / autenticación: **Respuesta < 1 h / Resolución < 6 h.**
- Facturación, reportes y documentos: **Respuesta < 4 h hábiles / Resolución < 24 h.**
- Salud de servicios (API/Web): **Escalamiento inmediato a NOC y postmortem < 24 h.**

> Los SLA se publican semanalmente en la página `/soporte` del sitio web para mantener transparencia con clientes piloto.

## Flujo de escalamiento

1. **Nivel 1 – Desk Operaciones**  
   Monitorea 24/7, gestiona WhatsApp y desbloquea portal/agenda. Escala cuando un SLA corra riesgo o requiera acceso privilegiado.
2. **Nivel 2 – Coordinación & NOC**  
   Ajusta rutas, modifica integraciones (Guesty/Stripe) y coordina con proveedores. Emite plan de acción < 1 h.
3. **Nivel 3 – Dirección / Seguridad**  
   Para incidentes regulatorios, downtime > 2 h o filtraciones. Requiere comunicación ejecutiva y RCA firmado < 24 h.

## Documentación pública

- **Estado GA:** [`docs/overview/status.md`](../overview/status.md)
- **Plan GA completo:** [`docs/overview/ga-plan.md`](../overview/ga-plan.md)
- **Changelog:** [`CHANGELOG.md`](../../CHANGELOG.md)
- **Página de soporte (web):** `apps/web/app/soporte/page.tsx`

Mantén estas referencias sincronizadas al momento de publicar un comunicado o actualizar SLA.

## Formularios y telemetría

- `LeadCaptureForm` es bilingüe (ES/EN) y envía eventos `cta_request_proposal` / `lead_form_submitted` con metadata `originSection`, `planCode` y `utm_*`.
- El endpoint `/api/leads` reintenta webhooks externos hasta 3 veces con timeout de 5 s (ver `apps/api/src/routes/leads.ts`).
- Para incidentes de captura, ejecuta `pnpm scripts/test-lead-webhook` tras definir `LEAD_WEBHOOK_URL`.

## Checklist de turno

1. Crear ticket en Linear con categoría `Ops`, `Support` o `Security`.
2. Registrar canal de entrada y SLA comprometido.
3. Actualizar al cliente al cierre (correo o WhatsApp) y adjuntar evidencia (log, screenshot o reporte).
4. Si hubo impacto operacional, enlazar al documento correspondiente (`runbook` o `postmortem`).
