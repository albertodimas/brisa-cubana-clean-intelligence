# Runbook de Rollback de Producción

**Objetivo:** establecer el procedimiento para revertir un despliegue de Brisa Cubana Clean Intelligence cuando se detecten impactos severos en disponibilidad, rendimiento o integridad de datos.  
**Versión:** 1.1  
**Última actualización:** 2 de octubre de 2025  
**Duración estimada:** 10-20 minutos

---

## 1. Criterios de activación

Iniciar el rollback de forma inmediata si se cumple cualquiera de las siguientes condiciones durante o después del despliegue:

- Incremento sostenido (>5 minutos) del ratio de errores por encima del SLO + 2%.
- Latencia p95 superior al doble del objetivo definido en SLO durante más de 5 minutos.
- Saturación del pool de conexiones o aparición de bloqueos en la base de datos.
- Fallos en procesamiento de pagos superiores al 5% de las transacciones.
- Declaración de incidente Sev1/Sev2 (falta de disponibilidad, pérdida de datos, incidente de seguridad).
- Determinación del Deployment Lead ante señales de riesgo elevadas.

No se requiere confirmación adicional para actuar: la prioridad es restablecer el servicio.

## 2. Roles durante el rollback

| Rol                | Responsabilidades principales                           |
| ------------------ | ------------------------------------------------------- |
| Incident Commander | Declara el rollback, coordina acciones y comunicaciones |
| SRE On-Call        | Ejecuta comandos en Railway/Vercel y valida resultados  |
| DBA                | Evalúa impacto en base de datos y gestiona esquemas     |
| Comunicaciones     | Actualiza status page, informa a stakeholders           |

## 3. Lista de control

- [ ] Incidente declarado (`#incidents`, PagerDuty).
- [ ] Hora de inicio de rollback registrada.
- [ ] API revertida en Railway.
- [ ] Frontend revertido en Vercel.
- [ ] Feature flags críticos deshabilitados.
- [ ] Salud de servicios confirmada.
- [ ] Métricas estabilizadas.
- [ ] Post-mortem agendado dentro de las 48 horas siguientes.

## 4. Procedimiento operativo

### 4.1 Declaración del incidente

1. Registrar en `#incidents` la activación del rollback con motivo y ETA.
2. Actualizar la página de estado según el impacto percibido.
3. Confirmar en PagerDuty que los responsables clave están involucrados.

### 4.2 Revertir aplicaciones

**API (Railway)**

```bash
export RAILWAY_TOKEN="<token_producción>"
railway rollback --service "@brisa/api" --environment production

# Validación posterior
curl -f https://api.brisacubana.com/healthz
```

Si la opción `rollback` no está disponible, volver a desplegar el commit anterior (`railway up --service "@brisa/api" --detach`).

**Frontend (Vercel)**

```bash
vercel ls brisa-cubana-clean-intelligence --token=$VERCEL_TOKEN
vercel promote <deployment_anterior> --token=$VERCEL_TOKEN --yes
curl -f https://brisacubana.com
```

### 4.3 Ajustar feature flags

Desactivar cualquier funcionalidad introducida en el despliegue:

```bash
psql $DATABASE_URL -c "
UPDATE feature_flags
SET enabled = false
WHERE name IN ('ai_concierge_v2', 'cleanscore_v3', 'new_payment_flow')
  AND updated_at > NOW() - INTERVAL '7 days';
"
```

Verificar el estado de los flags restantes.

### 4.4 Esquema de base de datos

1. Revisar si la migración aplicada es compatible con el código anterior (solo fase expand).
2. Si se ejecutó una fase contract o se detecta corrupción, aplicar plan de reversión:
   - Restaurar el punto de recuperación creado antes del despliegue (`pg_restore_point`).
   - O marcar la migración como revertida mediante `pnpm prisma migrate resolve --rolled-back <migration>` y aplicar scripts compensatorios.
3. Documentar cualquier eliminación de datos necesaria (por ejemplo, registros backfill incompatibles).

### 4.5 Validación de servicio

```bash
curl https://api.brisacubana.com/healthz | jq '.status'
curl -I https://brisacubana.com | head -n 1
psql $DATABASE_URL -c "SELECT 1;"
```

Realizar smoke tests manuales: inicio de sesión, creación de reserva, procesamiento de pago de prueba (modo sandbox) y generación de reportes.

## 5. Comunicación y cierre

- Informar el resultado del rollback en `#deployments` y actualizar la página de estado.
- Registrar métricas clave (inicio/fin, duración, impacto).
- Coordinar post-mortem con los equipos involucrados y asegurar captura de aprendizajes.
- Levantar el freeze una vez estabilizado el servicio y autorizada la reanudación de despliegues.

## 6. Referencias

- [Runbook de Go-Live](GO_LIVE.md)
- [Incident Response](INCIDENT_RESPONSE.md)
- [DEPLOYMENT_CHECKLIST.md](../production/DEPLOYMENT_CHECKLIST.md)

## 7. Historial

| Fecha      | Versión | Descripción                          | Responsable |
| ---------- | ------- | ------------------------------------ | ----------- |
| 2025-10-02 | 1.1     | Actualización en español profesional | Plataforma  |
| 2025-08-12 | 1.0     | Publicación inicial                  | Plataforma  |
