# Disaster Recovery - Quick Reference Card

**Brisa Cubana Clean Intelligence**
**Version:** 1.0 | **Last Updated:** 6 de octubre de 2025

---

## Emergency Contacts

| Role                 | Name      | Contact       | Backup      |
| -------------------- | --------- | ------------- | ----------- |
| **On-Call Engineer** | [Primary] | [Phone/Slack] | [Secondary] |
| **Database Expert**  | [Name]    | [Phone/Slack] | [Backup]    |
| **Platform Lead**    | [Name]    | [Phone/Slack] | [Backup]    |
| **CTO (Escalation)** | [Name]    | [Phone]       | N/A         |

**Incident Channel:** `#incident-dr` (Slack)

---

## Recovery Objectives

| Metric                           | Target       | Critical Threshold |
| -------------------------------- | ------------ | ------------------ |
| **RTO** (Recovery Time)          | < 60 minutes | < 90 minutes       |
| **RPO** (Data Loss)              | < 15 minutes | < 30 minutes       |
| **MTTR** (Mean Time to Recovery) | < 45 minutes | < 60 minutes       |

---

## Quick Diagnosis

### Is the database down?

```bash
railway run --service postgres psql -c "SELECT version();"
```

- **Success:** Database is up → Check application
- **Failure:** Database is down → Execute [Database Recovery](#database-recovery)

### Is the API down?

```bash
curl https://api.brisacubana.com/health
```

- **Success (200 OK):** API is up → Check web app
- **Failure (5xx, timeout):** API is down → Execute [API Recovery](#api-recovery)

### Is the web app down?

```bash
curl -I https://app.brisacubana.com
```

- **Success (200 OK):** Web is up → Check specific features
- **Failure:** Web is down → Execute [Web Recovery](#web-recovery)

---

## Recovery Procedures

### Database Recovery

**Scenario:** PostgreSQL unavailable or corrupted

**Step 1: Verify backup availability**

```bash
railway run --service postgres psql -c "SELECT pg_last_wal_receive_lsn();"
```

**Step 2: Restore from latest backup**

```bash
# Option A: Railway PITR (contact support with timestamp)
# support@railway.app with target recovery time

# Option B: Manual restore from backup
railway run --service postgres pg_restore \
  --dbname=brisa_production \
  --clean \
  --if-exists \
  backups/latest.dump
```

**Step 3: Verify restoration**

```bash
./scripts/verify-backup.sh --mode=full
```

**Step 4: Reconnect services**

```bash
railway up --service api --detach
curl https://api.brisacubana.com/health
```

**Estimated Time:** 30-45 minutes

---

### API Recovery

**Scenario:** API service failing or unresponsive

**Step 1: Check recent deployments**

```bash
railway deployments --service api | head -5
```

**Step 2: Execute rollback**

```bash
railway rollback --service api --to [PREVIOUS_DEPLOYMENT_ID]
```

**Step 3: Monitor rollback**

```bash
railway logs --service api --follow
```

**Step 4: Verify health**

```bash
curl https://api.brisacubana.com/health
pnpm --filter @brisa/web test:e2e:smoke
```

**Estimated Time:** 10-20 minutes

---

### Web Recovery

**Scenario:** Web application deployment failed

**Step 1: Check Vercel deployments**

```bash
vercel ls --scope brisa-cubana
```

**Step 2: Promote previous deployment**

```bash
vercel promote [PREVIOUS_DEPLOYMENT_URL] --yes
```

**Step 3: Verify deployment**

```bash
curl -I https://app.brisacubana.com
```

**Estimated Time:** 5-15 minutes

---

### Complete Infrastructure Failure

**Scenario:** Multi-service outage (regional failure, provider down)

**Step 1: Assess scope**

```bash
# Check Railway status
curl https://status.railway.app

# Check Vercel status
curl https://status.vercel.com
```

**Step 2: Provision failover infrastructure**

- Create new Railway project
- Create new Vercel project
- Update DNS records

**Step 3: Restore database to failover**

```bash
pg_restore \
  --host=[FAILOVER_DB_HOST] \
  --dbname=brisa_production \
  --clean \
  backups/external-latest.dump
```

**Step 4: Deploy applications**

```bash
# Deploy API
railway link [FAILOVER_PROJECT]
railway up --service api

# Deploy Web
vercel deploy --prod
```

**Step 5: Update DNS**

```bash
# Update DNS to point to new infrastructure
# api.brisacubana.com → [NEW_RAILWAY_URL]
# app.brisacubana.com → [NEW_VERCEL_URL]
```

**Estimated Time:** 60-90 minutes

---

## Critical Commands

### Health Checks

```bash
# API health
curl https://api.brisacubana.com/health

# Database health
railway run --service postgres psql -c "SELECT COUNT(*) FROM users;"

# Verify backup age
railway run --service postgres psql -c "SELECT pg_last_wal_receive_lsn();"
```

### Backup Operations

```bash
# Manual backup
railway run --service postgres pg_dump \
  --format=custom \
  --compress=9 \
  --file=backup-$(date +%Y%m%d-%H%M%S).dump \
  brisa_production

# Verify backup
./scripts/verify-backup.sh --mode=full

# List backups
ls -lh backups/
```

### Restore Operations

```bash
# Full database restore
railway run --service postgres pg_restore \
  --dbname=brisa_production \
  --clean \
  backup-20251006.dump

# Table-specific restore
pg_restore \
  --table=bookings \
  --dbname=brisa_production \
  backup-20251006.dump

# Verify restoration
./scripts/verify-backup.sh --mode=integrity
```

### Monitoring

```bash
# Railway logs
railway logs --service api --since "1 hour ago"

# Database connections
railway run --service postgres psql -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check deployment status
railway status --service api
vercel ls --scope brisa-cubana
```

---

## Data Integrity Checks

### Quick Validation

```bash
./scripts/verify-backup.sh --mode=smoke
```

### Full Validation

```bash
./scripts/verify-backup.sh --mode=full
```

### Manual Checks

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
WHERE u.id IS NULL;

-- Verify data recency (should be < 15 minutes for RPO)
SELECT
  MAX(created_at) as latest_booking,
  NOW() - MAX(created_at) as data_age
FROM bookings;

-- Check table counts
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM bookings) as bookings,
  (SELECT COUNT(*) FROM properties) as properties;
```

---

## Communication Template

### Incident Declaration

```
🚨 DISASTER RECOVERY INCIDENT 🚨

Incident ID: DR-[YYYYMMDD-HHMM]
Severity: Sev1
Start Time: [TIMESTAMP]
Affected Services: [DATABASE/API/WEB/ALL]

Symptoms:
- [Describe what's broken]
- [Impact on users]

IC: [NAME]
Scribe: [NAME]

Recovery in progress - updates every 10 minutes
Next update: [TIME]
```

### Recovery Complete

```
✅ RECOVERY COMPLETE ✅

Incident ID: DR-[YYYYMMDD-HHMM]
End Time: [TIMESTAMP]
Total Duration: [XX] minutes

Actual RTO: [XX] minutes (target: < 60 min)
Actual RPO: [XX] minutes (target: < 15 min)

Services Restored:
✓ Database
✓ API
✓ Web Application

Validation Complete:
✓ Health checks passing
✓ Data integrity verified
✓ User flows tested

Post-mortem scheduled: [DATE/TIME]
```

---

## Escalation Path

1. **Incident Detected** → On-Call Engineer acknowledges (< 5 min)
2. **Assessment** → Classify severity and impact (< 5 min)
3. **Recovery Initiated** → Follow runbook procedures (< 10 min)
4. **If no progress in 15 min** → Escalate to Database Expert
5. **If no progress in 30 min** → Escalate to Platform Lead
6. **If Sev1 and no progress in 45 min** → Escalate to CTO

**Critical:** Never hesitate to escalate early

---

## Post-Recovery Checklist

- [ ] All services health checks passing
- [ ] Data integrity verified (`./scripts/verify-backup.sh --mode=full`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] User flows manually tested
- [ ] Monitoring dashboards reviewed
- [ ] Incident timeline documented
- [ ] Stakeholders notified (customers, team, leadership)
- [ ] Post-mortem scheduled (within 48 hours)
- [ ] Action items created and assigned

---

## Reference Documentation

**Full Procedures:**

- [DR Drill Procedure](./runbooks/DR_DRILL_PROCEDURE.md) - Complete drill guide
- [Backup & Restore Guide](./runbooks/BACKUP_RESTORE_GUIDE.md) - Detailed backup procedures
- [Incident Response](./runbooks/INCIDENT_RESPONSE.md) - Incident management
- [Rollback Procedure](./runbooks/ROLLBACK.md) - Deployment rollback

**Infrastructure:**

- Railway Dashboard: https://railway.app/project/[PROJECT_ID]
- Vercel Dashboard: https://vercel.com/brisa-cubana
- GitHub Repository: https://github.com/albertodimas/brisa-cubana-clean-intelligence

**Support:**

- Railway Support: support@railway.app
- Vercel Support: support@vercel.com
- Internal Slack: `#platform-team`

---

## Print This Card

**Keep a printed copy accessible to all on-call engineers**

**Last Drill:** [Date] - [Result]
**Next Drill:** [Date]
**Document Owner:** Platform Engineering Team
