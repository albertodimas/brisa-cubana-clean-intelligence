# Runbook de Incidentes

**Última actualización:** 20 de octubre de 2025

Este documento describe el flujo de respuesta ante incidentes en Brisa Cubana Clean Intelligence.

---

## 1. Roles y Responsabilidades

| Rol                | Responsable actual (Oct 2025) | Funciones principales                                         |
| ------------------ | ----------------------------- | ------------------------------------------------------------- |
| Incident Commander | Alberto Dimas                 | Coordina la respuesta, decide escalación, comunica al negocio |
| Comunicaciones     | N/A (asignar)                 | Comunicación con stakeholders y clientes                      |
| Soporte Técnico    | Equipo Plataforma             | Diagnóstico, mitigación y resolución técnica                  |
| Producto/Negocio   | N/A (asignar)                 | Análisis de impacto en clientes, decisiones comerciales       |

> **Pendiente**: asignar backups/guardias por rol y documentarlos en este cuadro.

---

## 2. Clasificación de Incidentes

| Severidad | Criterio                                                                  | Tiempo objetivo de respuesta |
| --------- | ------------------------------------------------------------------------- | ---------------------------- |
| SEV0      | Plataforma caída, pérdida de datos, incidentes legales o de seguridad     | Inmediato (< 5 min)          |
| SEV1      | API/Portal indisponibles, errores > 10% o impacto a facturación           | < 15 min                     |
| SEV2      | Errores aislados, degradación parcial, problemas en funcionalidades clave | < 1 hora                     |
| SEV3      | Bugs menores, issues reproducibles sin impacto mayor                      | < 4 horas                    |

---

## 3. Flujo de Respuesta

1. **Detección**
   - Sentry (correo / futuro Slack) → errores críticos o nuevos issues.
   - Monitoreo manual / reporte del equipo.

2. **Acknowledgement**
   - Primer respondedor confirma recepción en `#brisa-alerts` (o canal temporal `#incident-<fecha>`).

3. **Diagnóstico inicial**
   - Revisar dashboards: Sentry, PostHog, Vercel (deploys) y logs (`pnpm --filter @brisa/api dev` / `pino` outputs).
   - Consultar `docs/operations/observability-setup.md` para comandos de verificación.

4. **Mitigación**
   - Rollback de deploy (`vercel rollback`) si aplica.
   - Feature toggle / hotfix controlado.

5. **Comunicación**
   - Incident Commander notifica a stakeholders (correo o Slack #leadership).
   - Registrar notas en `docs/operations/backup-log.md` o en un documento temporal.

6. **Resolución y Postmortem**
   - Documentar causa raíz, acciones correctivas y estado final.
   - Actualizar `docs/operations/observability-setup.md` / `docs/tech-debt/legacy-chunk-885.md` si aplica.

---

## 4. Herramientas y Enlaces

- **Alertas**: Sentry (https://sentry.io/organizations/brisacubana/projects/)
- **Deploys**: Vercel Web/API (enlaces internos del equipo)
- **Analítica**: PostHog Dashboard (pendiente de publicación)
- **Logs**: Vercel / CLI / `logs/*.log`
- **Runbooks específicos**: `docs/operations/observability-setup.md`, `docs/operations/alerts.md`

---

## 5. Checklist Post-Incidente

- [ ] Alertar a todo el equipo sobre la resolución
- [ ] Registrar el incidente en `docs/operations/backup-log.md` o herramienta de seguimiento
- [ ] Crear/actualizar tareas de seguimiento (tech debt, mejoras de monitoreo)
- [ ] Revisar SLO/SLA y métricas afectadas
- [ ] Programar retrospectiva si fue SEV0/SEV1

---

## 6. Próximos pasos pendientes

- Configurar canales Slack dedicados (`#brisa-alerts`, `#brisa-critical`).
- Publicar el dashboard KPI en PostHog y enlazarlo en este runbook.
- Formalizar guardias/on-call y actualizar la tabla de roles.
