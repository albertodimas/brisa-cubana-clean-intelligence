# Disaster Recovery (DR)

Procedimientos completos de recuperación ante desastres con RTO < 1 hora y RPO < 15 minutos.

## 🎯 Objetivos de Recuperación

| Métrica                            | Target   | Actual            |
| ---------------------------------- | -------- | ----------------- |
| **RTO** (Recovery Time Objective)  | < 1 hora | 30-45 min         |
| **RPO** (Recovery Point Objective) | < 15 min | < 15 min (WAL)    |
| **Availability**                   | 99.9%    | 99.95% (estimado) |

## 📚 Documentación Disponible

### [DR_QUICK_REFERENCE.md](DR_QUICK_REFERENCE.md) ⭐

**Tarjeta de referencia rápida (IMPRIMIR Y TENER A MANO)**

**Contenido:**

- Contactos de emergencia
- Comandos críticos
- Decision tree
- Checklist de recuperación

**Audiencia:** On-call engineers (TODOS)

### [DR_EXECUTIVE_SUMMARY.md](DR_EXECUTIVE_SUMMARY.md)

Resumen ejecutivo

**Contenido:**

- Overview del plan DR
- RTO/RPO objetivos
- Roles y responsabilidades
- Inversión y recursos

**Audiencia:** Management, Stakeholders

### [DR_IMPLEMENTATION_SUMMARY.md](DR_IMPLEMENTATION_SUMMARY.md)

Resumen de implementación

**Contenido:**

- Arquitectura de backups
- PostgreSQL WAL archiving
- Procedimientos automatizados
- Testing y validación

**Audiencia:** DevOps, Tech Leads

## 📖 Runbooks Detallados

### [../runbooks/DR_DRILL_PROCEDURE.md](../runbooks/DR_DRILL_PROCEDURE.md)

5 escenarios de simulacro (21KB)

**Escenarios cubiertos:**

1. **Complete Database Failure** - Restore full DB (30-45 min)
2. **Data Corruption** - Point-in-time recovery (20-30 min)
3. **API Service Outage** - Deploy rollback (10-15 min)
4. **Web Application Failure** - Vercel rollback (5-10 min)
5. **Complete Infrastructure Loss** - Full rebuild (2-4 hours)

**Para cada escenario:**

- Simulation steps
- Success criteria
- Rollback procedures
- Validation commands

**Audiencia:** DevOps, SRE

### [../runbooks/BACKUP_RESTORE_GUIDE.md](../runbooks/BACKUP_RESTORE_GUIDE.md)

Guía completa de backup/restore (30KB)

**Contenido:**

- PostgreSQL backup strategy
- WAL archiving configuration
- Full database restore (30-45 min)
- Point-in-time recovery (PITR)
- Schema integrity verification
- Data consistency checks

**Audiencia:** Database Admins, DevOps

## 🔄 Estrategia de Backups

### PostgreSQL Database

**Método:** Continuous WAL archiving + Daily snapshots

| Tipo               | Frecuencia           | Retención  | Automatizado |
| ------------------ | -------------------- | ---------- | ------------ |
| **WAL Archives**   | Continuo (real-time) | 30 días    | ✅ Railway   |
| **Full Snapshots** | Diario 3 AM UTC      | 90 días    | ✅ Railway   |
| **Manual Backups** | On-demand            | Indefinido | ⚙️ Manual    |

**Ubicación:**

- Primary: Railway managed backups
- Secondary: S3 (futuro)

### Application State

| Componente      | Backup                     | Restauración       |
| --------------- | -------------------------- | ------------------ |
| **API Code**    | Git + Railway              | Deploy from commit |
| **Web Code**    | Git + Vercel               | Deploy from commit |
| **Secrets**     | Railway/Vercel + 1Password | Manual restore     |
| **Environment** | .env.example + docs        | Manual configure   |

## 🚀 Procedimientos de Recuperación

### 1. Database Recovery

#### Full Database Restore (30-45 min)

```bash
# 1. Stop API service
railway service stop api

# 2. Download latest backup
railway backups download --service postgres --output backup.dump

# 3. Restore database
railway run --service postgres pg_restore \
  --dbname=brisa_production \
  --clean \
  --if-exists \
  backup.dump

# 4. Verify restoration
./scripts/verify-backup.sh --mode=integrity

# 5. Start API service
railway service start api

# 6. Verify health
curl https://api.brisacubanaclean.com/api/health
```

**Ver:** [../runbooks/BACKUP_RESTORE_GUIDE.md](../runbooks/BACKUP_RESTORE_GUIDE.md) para procedimiento completo

#### Point-in-Time Recovery (20-30 min)

```bash
# Restore to specific timestamp
railway run --service postgres pg_restore \
  --target-time="2025-10-06 14:30:00"

# Verify data
./scripts/verify-backup.sh --mode=consistency --timestamp="2025-10-06 14:30:00"
```

### 2. API Service Recovery

#### Rollback Deployment (10-15 min)

```bash
# 1. List recent deployments
railway deployments list --service api

# 2. Rollback to previous
railway rollback --service api --deployment <deployment-id>

# 3. Verify
curl https://api.brisacubanaclean.com/api/health
```

**Ver:** [../runbooks/ROLLBACK.md](../runbooks/ROLLBACK.md)

### 3. Web Application Recovery

#### Vercel Rollback (5-10 min)

```bash
# 1. List deployments
vercel ls brisa-web --prod

# 2. Promote previous deployment
vercel promote <deployment-url> --prod

# 3. Verify
curl https://brisacubanaclean.com
```

### 4. Infrastructure Rebuild (2-4 hours)

En caso de pérdida completa:

1. **Railway Setup (30 min)**
   - Crear nuevo proyecto
   - Configurar PostgreSQL
   - Configurar Redis
   - Restore database from S3

2. **API Deployment (30 min)**
   - Conectar GitHub repo
   - Configurar environment variables
   - Deploy latest stable commit

3. **Vercel Setup (15 min)**
   - Conectar GitHub repo
   - Configurar environment variables
   - Deploy production

4. **DNS Update (5 min + propagation)**
   - Actualizar Railway/Vercel domains
   - Verificar SSL certificates

5. **Verification (30 min)**
   - Run health checks
   - Test critical flows
   - Monitor errors

**Ver:** [DR_DRILL_PROCEDURE.md escenario 5](../runbooks/DR_DRILL_PROCEDURE.md)

## 🧪 DR Drills - Simulacros

### Frecuencia Recomendada

| Escenario           | Frecuencia | Duración | Responsable      |
| ------------------- | ---------- | -------- | ---------------- |
| Database Restore    | Mensual    | 45 min   | DevOps + DBA     |
| API Rollback        | Mensual    | 15 min   | DevOps           |
| Web Rollback        | Mensual    | 10 min   | DevOps           |
| Full Infrastructure | Trimestral | 4 horas  | Todo el equipo   |
| Tabletop Exercise   | Mensual    | 1 hora   | On-call rotation |

### Ejecutar Drill

```bash
# 1. Anunciar en Slack
# "🚨 DR DRILL INICIADO - Escenario: Database Failure"

# 2. Seguir procedimiento en DR_DRILL_PROCEDURE.md
# Ver: docs/operations/runbooks/DR_DRILL_PROCEDURE.md

# 3. Documentar resultados
# Usar template: docs/operations/templates/incident-report-template.md

# 4. Review y mejoras
# Actualizar procedimientos según learnings
```

## 🔍 Verificación de Backups

### Script Automatizado

**Script:** [`scripts/verify-backup.sh`](../../../scripts/verify-backup.sh)

```bash
# Verificación completa
./scripts/verify-backup.sh

# Solo conectividad
./scripts/verify-backup.sh --mode=connectivity

# Solo integridad de schema
./scripts/verify-backup.sh --mode=integrity

# Consistencia de datos
./scripts/verify-backup.sh --mode=consistency
```

**Checks realizados:**

1. Database connectivity
2. Schema integrity (todas las tablas existen)
3. Foreign keys valid
4. Data recency (< 24 horas)
5. Row counts reasonable
6. Index health
7. Constraint validation

**Frecuencia:** Diario automático 4 AM UTC

### Validación Manual

```bash
# 1. Verificar último backup
railway backups list --service postgres

# 2. Check WAL archiving
railway run --service postgres psql -c "SELECT pg_is_in_recovery(), pg_last_wal_replay_lsn();"

# 3. Verificar espacio
railway run --service postgres psql -c "SELECT pg_size_pretty(pg_database_size('brisa_production'));"

# 4. Check backup age
railway backups list --service postgres | head -1
```

## 📊 Monitoreo de Salud

### Dashboards Críticos

1. **Railway Dashboard**
   - https://railway.app/project/[project-id]
   - Uptime, CPU, Memory, Disk

2. **Vercel Dashboard**
   - https://vercel.com/[team]/[project]
   - Deployments, Analytics, Logs

3. **Sentry** (cuando activado)
   - Error tracking
   - Performance monitoring

### Alertas Configuradas

| Alerta            | Threshold             | Canal             | Acción            |
| ----------------- | --------------------- | ----------------- | ----------------- |
| Database down     | Inmediato             | Slack + PagerDuty | Ejecutar DR       |
| Backup failed     | 2 fallos consecutivos | Slack             | Investigar        |
| High error rate   | > 5% por 5 min        | Slack             | On-call review    |
| API response time | p95 > 2s por 10 min   | Slack             | Performance check |

## 📝 Checklist de Recuperación

### Pre-Disaster

- [ ] Backups automáticos activos
- [ ] Scripts de verificación corriendo
- [ ] DR drills programados
- [ ] Quick reference impreso y disponible
- [ ] Contactos actualizados
- [ ] Accesos verificados (Railway, Vercel, DNS)

### During Disaster

- [ ] Incident declarado en Slack
- [ ] On-call notified
- [ ] Quick reference consultado
- [ ] Procedimiento iniciado
- [ ] Stakeholders notificados (si aplica)
- [ ] Logs capturados

### Post-Recovery

- [ ] Services verified
- [ ] Monitoring confirmed
- [ ] Post-mortem scheduled
- [ ] Incident report created
- [ ] Procedures updated
- [ ] Lessons learned documented

## 🔐 Access Requirements

Para ejecutar procedimientos DR se requiere:

### Accesos Necesarios

- [ ] Railway account (Production project)
- [ ] Vercel account (Production project)
- [ ] GitHub repo access (Maintainer role)
- [ ] DNS provider (Cloudflare/Route53)
- [ ] 1Password (Secrets vault)
- [ ] Slack (Emergency channels)

### Comandos de Verificación

```bash
# Railway CLI
railway whoami

# Vercel CLI
vercel whoami

# GitHub CLI
gh auth status

# Database access
railway run --service postgres psql -c "SELECT version();"
```

## 📞 Contactos de Emergencia

Ver [DR_QUICK_REFERENCE.md](DR_QUICK_REFERENCE.md) para lista completa.

**Primary On-Call:**

- Rotation schedule: Ver [../ON_CALL_ROTATION.md](../ON_CALL_ROTATION.md)
- PagerDuty: (configurar)
- Slack: #on-call-alerts

**Escalation:**

- Tech Lead: Alberto Dimas
- Email: albertodimasmorazaldivar@gmail.com
- Phone: (configurar)

## 🔗 Enlaces Relacionados

- [Runbooks](../runbooks/)
- [On-Call Handbook](../runbooks/ON_CALL_HANDBOOK.md)
- [Incident Response](../runbooks/INCIDENT_RESPONSE.md)
- [Production Readiness](../PRODUCTION_READINESS_CHECKLIST.md)

## 📈 Mejoras Futuras

### Q1 2026

- [ ] S3 backup replication (secondary)
- [ ] Multi-region failover
- [ ] Automated DR testing
- [ ] Blue-green deployments

### Q2 2026

- [ ] Chaos engineering (simulate failures)
- [ ] Backup encryption at rest
- [ ] Compliance audit (SOC 2)
- [ ] DR as Code (Infrastructure as Code)
