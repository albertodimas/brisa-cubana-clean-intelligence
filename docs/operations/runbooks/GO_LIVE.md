# Runbook de Go-Live

**Objetivo:** describir el procedimiento autorizado para ejecutar despliegues a producción de Brisa Cubana Clean Intelligence.  
**Versión:** 1.1  
**Última actualización:** 2 de octubre de 2025  
**Duración estimada:** 60-90 minutos

---

## 1. Lista previa (T-7 días)

- [ ] Operational Readiness Review completada y aprobada.
- [ ] CI/CD en verde (lint, typecheck, build, pruebas unitarias, pruebas E2E).
- [ ] Staging verificado (smoke tests, pruebas de carga, al menos 24 horas de observación).
- [ ] Backups restaurables validados en los últimos 7 días.
- [ ] Plan de rollback actualizado y probado.
- [ ] Guardia confirmada (PagerDuty, Slack, teléfono).
- [ ] Comunicación a stakeholders con ventana, impacto y responsables.
- [ ] Feature flags configurados con valores seguros.
- [ ] Paneles de observabilidad actualizados con SLO vigentes.
- [ ] Escaneos de seguridad sin vulnerabilidades críticas.

## 2. Equipo de despliegue

| Rol                    | Responsable | Contacto                        |
| ---------------------- | ----------- | ------------------------------- |
| Deployment Lead        | Designado   | Slack @deployment, Tel. +1-xxx  |
| SRE On-Call            | Designado   | PagerDuty Escalation-1          |
| Application Owner      | Designado   | Slack @app-owner                |
| Database Owner         | Designado   | Slack @dba                      |
| Security Lead          | Designado   | Slack @security                 |
| Communications Manager | Designado   | Slack #incidents / #deployments |

## 3. Ventana operativa

- Fecha sugerida: martes o miércoles.
- Horario: 10:00-12:00 EDT.
- Periodo de congelamiento: 1 hora antes y 2 horas después.
- Canales: `#deployments` (coordinación), `#incidents` (incidencias), status page externa.

## 4. Procedimiento

### 4.1 Preparación (T-30 minutos)

1. **Congelar cambios:** reforzar protección de ramas (`main`/`develop`) y anunciar freeze en Slack.
2. **Verificar salud actual:**
   ```bash
   curl -f https://api.brisacubana.com/healthz
   curl -f https://brisacubana.com
   railway status --service "@brisa/api"
   vercel ls brisa-cubana-clean-intelligence --token=$VERCEL_TOKEN
   ```
3. **Revisar base de datos:** confirmar versión, conexiones activas y punto de restauración (`pg_create_restore_point`).

### 4.2 Migración de base de datos (T+0)

1. Ejecutar `pnpm prisma migrate deploy` en `apps/api` con `DATABASE_URL` productiva.
2. Validar integridad (`pnpm prisma validate`).
3. Ejecutar scripts de backfill necesarios y documentar resultados.

### 4.3 Despliegue de aplicaciones (T+15)

1. Etiquetar release (`git tag vYYYY.MM.DD`).
2. Desplegar API en Railway (`railway up --service "@brisa/api" --detach`).
3. Comprobar `/healthz` del nuevo contenedor antes de transferir tráfico.
4. Desplegar web en Vercel (`vercel deploy --prod`).
5. Confirmar que `NEXT_PUBLIC_API_URL` apunta a la API recién desplegada.

### 4.4 Validaciones posteriores (T+30)

- Realizar smoke tests funcionales (login, booking, reportes).
- Revisar dashboards de errores y métricas.
- Confirmar que webhooks de Stripe funcionan (`pnpm stripe:trigger`).
- Comunicar en `#deployments` el éxito del despliegue.

### 4.5 Monitoreo intensivo (T+60 → T+72h)

- Vigilar métricas clave (latencia, tasa de errores, throughput).
- Revisar logs de Railway y Vercel cada hora durante las primeras 6 horas.
- Registrar incidentes o alertas derivadas del despliegue.

## 5. Rollback

Criterios de reversión inmediata:

- Tasa de errores > 5% (p95) durante más de 5 minutos.
- Incidente Sev1/Sev2 derivado del release.
- Fallo en pipelines críticos (pagos, autenticación, generación de reportes).

Procedimiento resumido:

1. Notificar en `#incidents` y activar runbook de [Rollback](ROLLBACK.md).
2. Railway: `railway rollback --service "@brisa/api"`.
3. Vercel: `vercel promote <deployment_anterior> --token=$VERCEL_TOKEN`.
4. Revertir migraciones solo si existen scripts `down` seguros; en su defecto, ejecutar plan de mitigación definido por DBA.
5. Comunicar finalización y abrir post-mortem en las 48 horas siguientes.

## 6. Comunicación

- **Inicio:** mensaje en `#deployments` indicando hora de arranque y cambios relevantes.
- **Estado intermedio:** actualizaciones cada 15 minutos o ante hitos importantes.
- **Cierre:** confirmar éxito o rollback, referencias a dashboards y responsabilidad del monitoreo intensivo.
- **Status page:** actualizar según matriz de impacto acordada.

## 7. Documentación posterior

- Completar `DEPLOYMENT_CHECKLIST.md` y adjuntar resultados de pruebas.
- Actualizar `PRODUCTION_DEPLOYMENT_GUIDE.md` con lecciones aprendidas.
- Registrar métricas (tiempo total, incidencias, uso de rollback).
- Archivar evidencias (logs, capturas, reportes de métricas) en el repositorio de compliance interno.

## 8. Referencias

- [Operational Readiness Review](OPERATIONAL_READINESS_REVIEW.md)
- [Rollback](ROLLBACK.md)
- [Incident Response](INCIDENT_RESPONSE.md)
- [DEPLOYMENT_SETUP.md](../production/DEPLOYMENT_SETUP.md)

## 9. Historial de cambios

| Fecha      | Versión | Cambios principales                         | Responsable |
| ---------- | ------- | ------------------------------------------- | ----------- |
| 2025-10-02 | 1.1     | Ajustes de tono y aclaraciones sobre freeze | Plataforma  |
| 2025-08-12 | 1.0     | Creación inicial del runbook                | Plataforma  |
