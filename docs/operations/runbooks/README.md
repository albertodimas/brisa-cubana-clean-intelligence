# Runbooks Operativos

**Propósito:** centralizar los procedimientos necesarios para operar Brisa Cubana Clean Intelligence en producción. Todo ingeniero de guardia debe conocer el contenido de estos documentos.

- **Equipo responsable:** Plataforma e Ingeniería de Fiabilidad
- **Última revisión:** 2 de octubre de 2025
- **Próxima revisión:** 2 de enero de 2026 (ciclo trimestral)

## Runbooks disponibles

| Runbook                                                         | Uso previsto                                   | Duración estimada |
| --------------------------------------------------------------- | ---------------------------------------------- | ----------------- |
| [Operational Readiness Review](OPERATIONAL_READINESS_REVIEW.md) | Puerta obligatoria antes de cada release mayor | 2-4 horas         |
| [Go-Live](GO_LIVE.md)                                           | Procedimiento de despliegue a producción       | 60-90 minutos     |
| [Rollback](ROLLBACK.md)                                         | Reversión inmediata ante un despliegue fallido | 10-20 minutos     |
| [Incident Response](INCIDENT_RESPONSE.md)                       | Gestión de incidentes Sev1/Sev2/Sev3           | Variable          |

## Referencias rápidas

### Incidente crítico (Sev1)

1. Reconocer la alerta de PagerDuty (≤5 minutos).
2. Declarar incidente en Slack `#incidents`.
3. Seguir el runbook de [Incident Response](INCIDENT_RESPONSE.md).
4. Si el incidente coincide con un despliegue reciente, ejecutar [Rollback](ROLLBACK.md).
5. Actualizar la página de estado según procedimiento definido.

### Degradación de rendimiento (Sev2)

1. Consultar paneles de observabilidad (Grafana, CloudWatch).
2. Determinar el componente afectado (API, web, base de datos).
3. Seguir [Incident Response](INCIDENT_RESPONSE.md) y valorar rollback.

### Ventana de despliegue programada

1. Completar la [Operational Readiness Review](OPERATIONAL_READINESS_REVIEW.md).
2. Coordinar la ventana en `#deployments` (martes o miércoles, 10:00 AM EDT).
3. Ejecutar el runbook de [Go-Live](GO_LIVE.md).
4. Mantener monitoreo intensivo durante 72 horas posteriores.

### Necesidad de rollback

1. Anunciar la reversión en `#incidents`.
2. Seguir [Rollback](ROLLBACK.md).
3. Confirmar la salud de los servicios tras la reversión.
4. Coordinar post-mortem dentro de las 48 horas siguientes.

## Escalamiento y contactos

- **Ruta de escalamiento:** primaria on-call → secundaria on-call (5 min) → manager de ingeniería (15 min) → CTO (solo Sev1).
- **Slack:** `#incidents`, `#deployments`, `#on-call`.
- **Servicios externos:**
  - PagerDuty: https://brisacubana.pagerduty.com
  - Status Page: https://status.brisacubana.com
  - Grafana: https://grafana.brisacubana.com

## Comandos de referencia

```bash
# Comprobar salud de producción
curl https://api.brisacubana.com/healthz
curl https://brisacubana.com

# Logs en Railway (última hora)
railway logs --service "@brisa/api" --since "1 hour ago"

# Logs en Vercel (tiempo real)
vercel logs --follow --token=$VERCEL_TOKEN

# Conexiones activas en PostgreSQL
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Rollback Railway
railway rollback --service "@brisa/api"

# Rollback Vercel
vercel promote <deployment_url> --token=$VERCEL_TOKEN
```

## Mantenimiento de runbooks

- **Mensual:** validar contactos de escalamiento.
- **Trimestral:** revisión integral con el equipo on-call.
- **Tras incidentes:** incorporar lecciones aprendidas y acciones preventivas.

### Proceso de actualización

1. Abrir Pull Request con la propuesta de cambio.
2. Obtener al menos dos aprobaciones del equipo SRE.
3. Validar el procedimiento en staging cuando aplique.
4. Fusionar, comunicar en `#deployments` y actualizar la fecha de revisión.

## Métricas de efectividad

| Indicador                        | Objetivo          | Observación actual |
| -------------------------------- | ----------------- | ------------------ |
| Uso de runbooks sev1/sev2        | 100%              | _Completar_        |
| Tiempo hasta primera acción      | < 2 minutos       | _Completar_        |
| Tiempo resolución Sev1           | < 30 minutos      | _Completar_        |
| Frecuencia de actualización      | ≥ 1 por trimestre | _Completar_        |
| Acciones post-mortem completadas | 90% en 30 días    | _Completar_        |

## Acceso requerido

- Repositorio GitHub (permisos de escritura para rollback).
- Entorno de producción en Railway y Vercel.
- Acceso read-only a PostgreSQL.
- PagerDuty, Slack, Grafana/CloudWatch y consola de la página de estado.

Solicitar accesos mediante Slack `#platform-team` o correo `platform@brisacubana.com`.

## Recursos complementarios

- [Arquitectura](../../for-developers/architecture.md)
- [Guía de infraestructura](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/infra/README.md)
- [Referencia de API](../../for-developers/api-reference.md)
- [Guía de testing](../../for-developers/testing.md)

## Contribuciones

1. Crear rama (`git checkout -b runbook/<cambio>`).
2. Actualizar el runbook correspondiente.
3. Validar procedimientos en staging.
4. Abrir Pull Request y etiquetar a `#platform-team`.

---

**Responsable de mantenimiento:** Plataforma e Ingeniería de Fiabilidad.
