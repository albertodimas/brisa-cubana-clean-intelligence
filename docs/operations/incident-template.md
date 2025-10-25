# Plantilla de Incidente Operativo

**Última actualización:** 23 de octubre de 2025  
**Uso:** Copia este archivo en `docs/operations/incident-YYYY-MM-DD-<slug>.md` (o en la herramienta de seguimiento elegida) cada vez que se abra un nuevo incidente SEV0–SEV3.

---

## 1. Metadatos

- **Estado:** _Abierto / Mitigado / Resuelto / Cerrado_
- **Severidad:** _SEV0 / SEV1 / SEV2 / SEV3_
- **Fecha detección (UTC):** `YYYY-MM-DD HH:MM`
- **Fecha cierre (UTC):** `YYYY-MM-DD HH:MM` _(completar al final)_
- **Fuente detección:** _Sentry / PostHog / Monitor externo / Reporte manual_
- **Incident Commander:** _Nombre + Slack handle_
- **Equipo(s) involucrado(s):** _Plataforma / Producto / Operaciones / Marketing / etc._

---

## 2. Resumen ejecutivo

> Breve descripción (2–3 frases) del impacto y la mitigación aplicada.

---

## 3. Impacto

- **Usuarios afectados:** _Número o porcentaje estimado_
- **Servicios afectados:** _API, portal cliente, landing, checkout, etc._
- **Duración:** _En minutos_
- **Métricas clave:** _Error rate, pérdida de ingresos estimada, leads sin atender, etc._

---

## 4. Línea de tiempo (UTC)

| Hora             | Evento                                                                   | Fuente / Evidencia |
| ---------------- | ------------------------------------------------------------------------ | ------------------ |
| 2025-10-23 13:45 | Ej. Alerta `checkout.payment.failed` ≥3/15 min en `#alerts-operaciones`. | Sentry / Slack     |
| 2025-10-23 13:48 | Ej. Incident Commander asignado (`@oncall-platform`).                    | Slack              |
| 2025-10-23 13:55 | Ej. Identificado deploy `dpl_xxx` como desencadenante.                   | Vercel             |
| 2025-10-23 14:10 | Ej. Rollback aplicado, métricas estabilizadas.                           | Vercel / PostHog   |
| ...              | ...                                                                      | ...                |

> Añade filas suficientes para cubrir detección, diagnóstico, mitigación, verificación y cierre.

---

## 5. Causa raíz

- **Trigger:** _¿Qué cambio o evento provocó el incidente?_
- **Clasificación:** _Regresión de código / infraestructura / dependencia externa / proceso / humano_
- **Detalles técnicos:** _Logs, excepciones, métricas relevantes._

---

## 6. Acciones tomadas

- [_] Acción 1 – _Descripción breve (incluye comandos o enlaces a PRs/commits)._
- [_] Acción 2 – _…_
- [_] Acción 3 – _…_

> Marca con ✅ cuando cada acción se complete. Adjunta enlaces a PRs, tickets o documentación actualizada.

---

## 7. Plan de seguimiento

| ID  | Acción preventiva / correctiva                              | Responsable | Due date   | Estado |
| --- | ----------------------------------------------------------- | ----------- | ---------- | ------ |
| 1   | Ej. Añadir prueba e2e para flujo checkout con error Stripe. | Producto    | 2025-10-30 | ☐      |
| 2   | Ej. Automatizar alerta PostHog adicional.                   | Plataforma  | 2025-11-05 | ☐      |
| 3   | Ej. Actualizar sop `lead-followup`.                         | Operaciones | 2025-10-28 | ☐      |

Registrar cada acción en el backlog correspondiente (Linear/Jira/GitHub Issues) y añadir el enlace en la columna **Estado**.

---

## 8. Comunicación externa

- **Clientes impactados:** _¿Se notificó? ¿Cómo?_
- **Stakeholders internos:** _Resumen enviado a dirección / marketing / operaciones._
- **Notas adicionales:** _Correos, mensajes o documentos compartidos._

---

## 9. Anexos

- Capturas de Sentry/PostHog
- Enlaces a dashboards o reportes
- Logs relevantes (`vercel logs`, `pnpm sentry:test-event`, etc.)
- Cualquier script ejecutado o archivo generado durante el incidente

---

> **Retroalimentación:** Si la plantilla necesita mejoras, abrir un PR modificando este archivo y notificar en `#alerts-operaciones`.
