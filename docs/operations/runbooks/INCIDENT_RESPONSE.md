# Runbook de Respuesta a Incidentes

**Propósito:** definir el proceso estándar para detectar, clasificar y resolver incidentes en producción.  
**Versión:** 1.1  
**Última actualización:** 2 de octubre de 2025

---

## 1. Clasificación de severidad

| Severidad | Impacto                               | Tiempo de respuesta | Ejemplos                                                   |
| --------- | ------------------------------------- | ------------------- | ---------------------------------------------------------- |
| Sev1      | Interrupción total o pérdida de datos | ≤ 5 minutos         | Sitio inaccesible, base comprometida, pagos detenidos      |
| Sev2      | Degradación mayor del servicio        | ≤ 15 minutos        | Error rate >5%, p95 elevado, caída parcial                 |
| Sev3      | Impacto limitado                      | ≤ 1 hora            | Función secundaria fuera de servicio, bug visual relevante |
| Sev4      | Informativo                           | Próximo día hábil   | Consultas, solicitudes de soporte, mejoras menores         |

---

## 2. Roles durante el incidente

### Incident Commander (IC)

- Declara el incidente y su severidad.
- Coordina al equipo de respuesta.
- Autoriza acciones críticas (rollback, escalamientos).
- Gestiona la comunicación interna y externa.
- Cierra el incidente cuando se restablece el servicio.

### Scribe

- Mantiene la línea de tiempo en el canal de incidente.
- Documenta decisiones y acciones.
- Reúne evidencias (logs, capturas, métricas).
- Elabora el borrador inicial del post-mortem.

### Communications Lead

- Actualiza la página de estado.
- Informa a clientes por los canales definidos.
- Gestiona tickets de soporte y redes sociales.
- Coordina con PR si es necesario.

### Subject Matter Experts (SMEs)

- DBA, SRE, backend, frontend, seguridad según la naturaleza del incidente.
- Brindan diagnóstico técnico y ejecutan mitigaciones.

---

## 3. Detección y triage (0-5 minutos)

1. **Recepción de alerta** (PagerDuty, monitoreo, reporte manual).
2. **Reconocimiento** por el on-call en ≤5 min (Sev1) o ≤15 min (Sev2).
3. **Revisión rápida** de dashboards (Grafana, CloudWatch, Sentry).
4. **Determinación de severidad** y declaración si corresponde.

### Acciones recomendadas

- Crear canal Slack `#incident-YYYYMMDD-HHMM`.
- Registrar mensaje inicial con resumen, severidad, IC asignado y enlaces relevantes.
- Notificar vía status page si el impacto afecta a clientes.

---

## 4. Organización del equipo (5-10 minutos)

1. Asignar oficialmente los roles (IC, Scribe, Communications, SMEs).
2. Abrir sala virtual si se requiere comunicación por voz.
3. Definir cadencia de actualizaciones (cada 10 minutos para Sev1, 15 minutos para Sev2).
4. Garantizar que todos los involucrados tienen acceso a sistemas críticos (Railway, Vercel, base de datos, métricas).

---

## 5. Mitigación (10-30 minutos)

Prioridad: detener el impacto lo antes posible.

| Síntoma                     | Acción inmediata                                                           |
| --------------------------- | -------------------------------------------------------------------------- |
| Aumento brusco de errores   | Ejecutar rollback (ver `ROLLBACK.md`).                                     |
| Sobrecarga de base de datos | Ajustar capacidad, finalizar consultas prolongadas, activar read replicas. |
| Degradación por tercero     | Activar circuit breaker o degradación controlada.                          |
| Ataque de tráfico           | Endurecer WAF, bloquear IPs, coordinar con proveedor de CDN.               |
| Incidente de seguridad      | Bloquear accesos comprometidos, rotar secretos, aislar sistemas.           |

Todas las acciones deben registrarse en el canal de incidente con hora y responsable.

---

## 6. Resolución y recuperación

1. Confirmar la recuperación del servicio mediante health checks y métricas clave.
2. Ejecutar smoke tests manuales para los flujos afectados.
3. Actualizar status page a “Recuperado” con breve descripción.
4. Registrar la hora de cierre y preparar la transición a post-mortem.

---

## 7. Post-mortem

- Programar reunión dentro de las 48 horas posteriores.
- Consolidar línea de tiempo, impacto, causa raíz y acciones correctivas/preventivas.
- Registrar responsables y fechas de seguimiento.
- Actualizar runbooks o configuraciones derivadas del incidente.

---

## 8. Recursos y herramientas

- PagerDuty: https://brisacubana.pagerduty.com
- Status Page: https://status.brisacubana.com
- Grafana: https://grafana.brisacubana.com
- Railway CLI: `railway status`, `railway logs --service "@brisa/api"`
- Vercel CLI: `vercel logs --follow --token=$VERCEL_TOKEN`

---

## 9. Mantenimiento del runbook

- Revisar mensualmente contactos y rutas de escalamiento.
- Revalidar flujos de comunicación cada trimestre.
- Actualizar inmediatamente tras cualquier incidente que evidencie nuevas necesidades.

---

**Responsable de mantenimiento:** Plataforma e Ingeniería de Fiabilidad.
