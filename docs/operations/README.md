# Documentación Operacional - Brisa Cubana Clean Intelligence

Documentación completa para operaciones de producción, monitoreo, seguridad y recuperación ante desastres.

## 📂 Estructura de Documentación

### 🔍 Monitoreo y Observabilidad

**Ubicación:** [`monitoring/`](monitoring/)

- [**SENTRY_SETUP.md**](monitoring/SENTRY_SETUP.md) - Guía completa de configuración de Sentry (3000+ palabras)
- [**SENTRY_QUICKSTART.md**](monitoring/SENTRY_QUICKSTART.md) - Guía rápida de activación (5 minutos)
- [**SENTRY_MIGRATION.md**](monitoring/SENTRY_MIGRATION.md) - Pasos de migración y troubleshooting

**Estado:** ✅ Configurado, pendiente activación con DSN

### ⚡ Load Testing

**Ubicación:** [`load-testing/`](load-testing/)

- [**LOAD_TESTING_GUIDE.md**](load-testing/LOAD_TESTING_GUIDE.md) - Guía completa de k6 (890 líneas)
- [**LOAD_TESTING_QUICKSTART.md**](load-testing/LOAD_TESTING_QUICKSTART.md) - Inicio rápido
- [**LOAD_TESTING_SETUP.md**](load-testing/LOAD_TESTING_SETUP.md) - Resumen de implementación
- [**LOAD_TESTING_SECRETS.md**](load-testing/LOAD_TESTING_SECRETS.md) - Configuración de secrets en GitHub

**Scripts:** [`../../scripts/run-load-tests.sh`](../../scripts/run-load-tests.sh)
**Tests:** [`../../tests/load/`](../../tests/load/)
**Workflow:** [`../../.github/workflows/load-test.yml`](../../.github/workflows/load-test.yml)

**Estado:** ✅ 5 escenarios completos (smoke, load, stress, spike, soak)

### 🛡️ Seguridad

**Ubicación:** [`security/`](security/)

- [**SECURITY_AUDIT_CHECKLIST.md**](security/SECURITY_AUDIT_CHECKLIST.md) - Checklist completo OWASP Top 10 2021
- [**SECURITY_SUMMARY.md**](security/SECURITY_SUMMARY.md) - Resumen ejecutivo (10.0/10 score)
- [**PENETRATION_TESTING_GUIDE.md**](security/PENETRATION_TESTING_GUIDE.md) - Guía de pen testing (1061 líneas)
- [**SECURITY_ACCEPTED_RISKS.md**](security/SECURITY_ACCEPTED_RISKS.md) - Riesgos aceptados documentados

**Scripts:** [`../../scripts/security-scan.sh`](../../scripts/security-scan.sh)
**Workflow:** [`../../.github/workflows/security-scan.yml`](../../.github/workflows/security-scan.yml)

**Estado:** ✅ 10/10 OWASP compliance, 47 security tests

### 🚨 Disaster Recovery

**Ubicación:** [`disaster-recovery/`](disaster-recovery/)

- [**DR_QUICK_REFERENCE.md**](disaster-recovery/DR_QUICK_REFERENCE.md) - Tarjeta de referencia rápida (IMPRIMIR)
- [**DR_EXECUTIVE_SUMMARY.md**](disaster-recovery/DR_EXECUTIVE_SUMMARY.md) - Resumen ejecutivo
- [**DR_IMPLEMENTATION_SUMMARY.md**](disaster-recovery/DR_IMPLEMENTATION_SUMMARY.md) - Resumen de implementación

**Runbooks detallados:** [`runbooks/`](runbooks/)

- [**DR_DRILL_PROCEDURE.md**](runbooks/DR_DRILL_PROCEDURE.md) - 5 escenarios de simulacro (21KB)
- [**BACKUP_RESTORE_GUIDE.md**](runbooks/BACKUP_RESTORE_GUIDE.md) - Guía de backup/restore (30KB)

**Scripts:** [`../../scripts/verify-backup.sh`](../../scripts/verify-backup.sh)

**Estado:** ✅ RTO < 1 hora, RPO < 15 minutos

### 📞 On-Call y Guardias

**Ubicación:** Root de operations

- [**ON_CALL_ROTATION.md**](ON_CALL_ROTATION.md) - Plan de rotación 24/7/365 (828 líneas)

**Runbooks detallados:** [`runbooks/`](runbooks/)

- [**ON_CALL_HANDBOOK.md**](runbooks/ON_CALL_HANDBOOK.md) - Manual del guardia (1359 líneas)
- [**INCIDENT_RESPONSE.md**](runbooks/INCIDENT_RESPONSE.md) - Procedimiento de incidentes
- [**GO_LIVE.md**](runbooks/GO_LIVE.md) - Checklist de go-live
- [**ROLLBACK.md**](runbooks/ROLLBACK.md) - Procedimiento de rollback

**Templates:** [`templates/`](templates/)

- [**incident-report-template.md**](templates/incident-report-template.md) - Template de reporte post-mortem

**Estado:** ✅ SLAs definidos (Sev1: 5min/1hr, Sev2: 15min/4hr)

### 📊 Producción

**Ubicación:** [`production/`](production/)

- [**PRODUCTION_READINESS_CHECKLIST.md**](PRODUCTION_READINESS_CHECKLIST.md) - Checklist completo (95/100 score)
- [**OPERATIONAL_READINESS_REVIEW.md**](runbooks/OPERATIONAL_READINESS_REVIEW.md) - ORR completo
- **Status Reports:** [`reports/`](reports/)

## 🚀 Quick Actions

### Para Desarrolladores

```bash
# Ejecutar load tests localmente
pnpm test:load:smoke

# Ejecutar security scan
./scripts/security-scan.sh

# Verificar backups
./scripts/verify-backup.sh
```

### Para Ops/SRE

```bash
# Activar Sentry (una vez)
# 1. Obtener DSN de sentry.io
# 2. Configurar secrets en Railway/Vercel
# Ver: docs/operations/monitoring/SENTRY_QUICKSTART.md

# Simular drill de DR
# Ver: docs/operations/runbooks/DR_DRILL_PROCEDURE.md

# Consultar handbook de guardia
# Ver: docs/operations/runbooks/ON_CALL_HANDBOOK.md
```

### Para Management

- **Resumen de Seguridad:** [security/SECURITY_SUMMARY.md](security/SECURITY_SUMMARY.md)
- **Resumen de DR:** [disaster-recovery/DR_EXECUTIVE_SUMMARY.md](disaster-recovery/DR_EXECUTIVE_SUMMARY.md)
- **Production Readiness:** [PRODUCTION_READINESS_CHECKLIST.md](PRODUCTION_READINESS_CHECKLIST.md)

## 📈 Métricas de Calidad

| Área              | Métrica                               | Estado                |
| ----------------- | ------------------------------------- | --------------------- |
| **Tests**         | 825 tests (820 unit + 5 E2E + 5 load) | ✅ 100% passing       |
| **Security**      | OWASP Top 10 2021                     | ✅ 10.0/10 compliance |
| **Documentation** | 132 archivos + 9,000 líneas nuevas    | ✅ Complete           |
| **Monitoring**    | Sentry configurado                    | 🟡 Pending activation |
| **Production**    | Readiness score                       | ✅ 95/100             |

## 🔗 Enlaces Relacionados

- [Arquitectura](../for-developers/architecture.md)
- [API Reference](../for-developers/api-reference.md)
- [Deployment Guide](../for-developers/deployment.md)
- [Sprint 4 Implementation](../development/sprints/SPRINT_4_PRODUCTION_READINESS.md)

## 📝 Changelog

- **2025-10-06:** Creación de estructura organizacional
- **2025-10-06:** Sprint 4 Production Readiness completado
  - Sentry monitoring configurado
  - Load testing suite completo
  - Security audit 10/10 OWASP
  - DR procedures documentados
  - On-call rotation establecido
