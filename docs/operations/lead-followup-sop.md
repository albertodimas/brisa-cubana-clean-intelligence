# SOP · Gestión de Leads Marketing → Operaciones

**Última actualización:** 23 de octubre de 2025

## Objetivo

Garantizar que cada lead captado desde campañas digitales reciba seguimiento en <2 horas hábiles y que el estado quede registrado hasta su cierre (ganado/perdido).

## Roles

- **Marketing Ops (MKT OPS):** publica contenidos, monitorea métricas y carga datos en el dashboard.
- **Coordinador Comercial (CO):** responde mensajes, agenda diagnósticos, actualiza estado del lead.
- **Operaciones (OPS):** ejecuta diagnóstico, prepara propuesta y coordina onboarding.

## Flujo resumido

1. Lead envía formulario / DM → webhook envía datos a Slack `#leads-operaciones` y a Google Sheet `Leads`.
2. CO asigna lead (reacciona en Slack con emoji 👋 y escribe su nombre en la columna `follow_up_owner`).
3. CO contacta al lead (respuesta inicial plantilla).
4. Una vez agendado el diagnóstico, CO actualiza `status = Scheduled` y registra fecha/hora en `notes`.
5. Tras el diagnóstico, OPS actualiza `status` a `Proposal Sent` o `Won/Lost`.
6. MKT OPS revisa semanalmente métricas de conversión y tiempos de respuesta.

## Detalle paso a paso

### 1. Recepción y asignación

- Slack mensaje incluye: nombre, email, teléfono, servicio, utm_source/medium/campaign/content.
- CO debe reaccionar dentro de 30 minutos hábiles.
- En la Sheet (`Results`):
  - Registrar `timestamp`, `content_id` (de utm_content), `platform` y `follow_up_owner`.

### 2. Primer contacto

- Usar plantilla “Respuesta inicial” (ver `docs/marketing/responses-pack.md`).
- Si el lead responde dentro de 24 h → agendar llamada/diagnóstico usando Calendly/Zoom.
- Si no responde → activar recordatorio 24 h / 7 días.

### 3. Diagnóstico

- OPS prepara agenda y checklist (amenity inventory, SLA deseado, número de propiedades).
- Tras la llamada, actualizar `status` y `notes`:
  - `Won`: iniciar onboarding.
  - `Lost`: registrar motivo (precio, timing, competencia, etc.).

### 4. Reporting semanal (viernes)

- MKT OPS ejecuta: `=QUERY(Results!A:H, ...)` según `metrics-dashboard-sheet.md`.
- Revisa KPIs:
  - Conversion Rate (Clicks → Leads) mínimo 8 %.
  - Tiempo promedio de respuesta < 120 min.
  - % leads por servicio (Turnover, Deep Clean, Amenity Refresh).
- Compartir resultados en `#leads-operaciones` y en reunión semanal.

### 5. Checklist rápido

- [ ] Lead registrado en Slack + Sheet.
- [ ] Owner asignado.
- [ ] Respuesta inicial enviada (< 30 min).
- [ ] Diagnóstico agendado o seguimiento en 24 h.
- [ ] Estado final actualizado (Won/Lost) + motivo.

### 6. Escalaciones

- Si un lead crítico/nocturno requiere acción 24/7, escalar a `operaciones@` y usar la lista de guardia.
- Si un lead proviene de campaña pagada con SLA especial, etiquetar `utm_campaign` con sufijo `_paid` y notificar a dirección.

> Mantén este SOP actualizado; revisa trimestralmente tiempos y plantillas.
