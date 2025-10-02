# 🚀 GO-LIVE RUNBOOK

> **Production Deployment Procedure for Brisa Cubana Clean Intelligence**
> **Version:** 1.0
> **Last Updated:** October 2, 2025
> **Estimated Duration:** 60–90 minutes

---

## 📋 Pre-Flight Checklist (1 week before)

- [ ] **Operational Readiness Review (ORR) completed** (see `OPERATIONAL_READINESS_REVIEW.md`)
- [ ] **All CI/CD checks passing** (lint, typecheck, tests, build)
- [ ] **Staging environment verified** (smoke tests, load tests, 24h soak)
- [ ] **Database backups verified** (restore test completed within 7 days)
- [ ] **Rollback plan documented** (see `ROLLBACK.md`)
- [ ] **On-call schedule confirmed** (PagerDuty, Slack channels)
- [ ] **Stakeholder communication sent** (deployment window, expected impact)
- [ ] **Feature flags configured** (defaults to safe values)
- [ ] **Monitoring dashboards updated** (SLOs, error budgets)
- [ ] **SBOM and security scans clean** (no critical vulnerabilities)

---

## 👥 Deployment Team

| Role                  | Name | Contact                     |
| --------------------- | ---- | --------------------------- |
| **Deployment Lead**   | TBD  | Slack: @lead, Phone: +1-xxx |
| **SRE On-Call**       | TBD  | PagerDuty: escalation-1     |
| **Application Owner** | TBD  | Slack: @app-owner           |
| **Database Owner**    | TBD  | Slack: @dba                 |
| **Security Lead**     | TBD  | Slack: @security            |
| **Communications**    | TBD  | Slack: #incidents           |

---

## 🕐 Deployment Window

- **Date:** YYYY-MM-DD (Tuesday or Wednesday preferred)
- **Time:** 10:00 AM – 12:00 PM EDT
- **Timezone:** US/Eastern (UTC-4/UTC-5)
- **Freeze Period:** 1 hour before → 2 hours after
- **Communication Channels:**
  - **Primary:** Slack `#deployments`
  - **Incidents:** Slack `#incidents`
  - **External:** Status page (status.brisacubana.com)

---

## 🔧 Deployment Procedure

### Phase 1: Pre-Deployment (T-30 min)

**1.1. Freeze Non-Critical Changes**

```bash
# Update GitHub branch protections
gh api repos/albertodimas/brisa-cubana-clean-intelligence/branches/main/protection \
  -X PUT \
  -f required_status_checks='{"strict":true}' \
  -f enforce_admins=true

# Announce freeze in Slack
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text":"🚨 Deployment freeze active. No merges to main until 12:00 PM EDT."}'
```

**1.2. Verify Current State**

```bash
# Check production health
curl -f https://api.brisacubana.com/healthz || echo "⚠️ API unhealthy"
curl -f https://brisacubana.com || echo "⚠️ Web unhealthy"

# Check Railway service status
export RAILWAY_TOKEN="your_token"
railway status --service "@brisa/api"

# Check Vercel deployment
export VERCEL_TOKEN="your_token"
vercel ls brisa-cubana-clean-intelligence --token=$VERCEL_TOKEN

# Verify database backups
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('brisa_cubana_prod'));"
```

**1.3. Database Pre-Checks**

```bash
# Connect to production database (read-only mode)
psql $DATABASE_URL -c "SELECT version();"

# Check table sizes
psql $DATABASE_URL -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Create backup snapshot
psql $DATABASE_URL -c "SELECT pg_create_restore_point('pre_deployment_$(date +%Y%m%d_%H%M%S)');"
```

---

### Phase 2: Database Migration (T+0)

**2.1. Expand Phase (Additive Changes Only)**

```bash
# Run migrations in expand mode (non-breaking)
cd apps/api
export DATABASE_URL="your_production_db_url"

# Dry run first
pnpm prisma migrate deploy --preview-feature

# Apply migrations
pnpm prisma migrate deploy

# Verify schema integrity
pnpm prisma validate
```

**2.2. Backfill Data (if needed)**

```bash
# Run backfill scripts (ensure idempotent)
psql $DATABASE_URL -f scripts/backfill_cleanscore_v2.sql

# Verify backfill
psql $DATABASE_URL -c "SELECT count(*) FROM cleanscore_report WHERE version = 2;"
```

---

### Phase 3: Application Deployment (T+15 min)

**3.1. Deploy API to Railway (Blue/Green)**

```bash
# Tag release
git tag -a v$(date +%Y.%m.%d) -m "Production release $(date)"
git push origin v$(date +%Y.%m.%d)

# Trigger Railway deployment
railway up --service "@brisa/api" --detach

# Wait for deployment (Railway auto-switches traffic)
sleep 60

# Health check new deployment
curl -f https://api.brisacubana.com/healthz || {
  echo "❌ API health check failed! Initiating rollback..."
  railway rollback --service "@brisa/api"
  exit 1
}
```

**3.2. Deploy Web to Vercel (Canary 10%)**

```bash
# Build and deploy
cd apps/web
vercel deploy --prod --token=$VERCEL_TOKEN

# Vercel automatically creates new deployment
# Traffic is gradually shifted (0% → 10% → 50% → 100%)

# Monitor canary deployment
vercel inspect --token=$VERCEL_TOKEN | grep "State: READY"
```

---

### Phase 4: Smoke Tests (T+20 min)

**4.1. Critical User Flows**

```bash
# Run automated smoke tests
pnpm test:e2e --grep "smoke" --reporter=list

# Manual checks:
# 1. Login as admin: admin@brisacubanaclean.com
# 2. Create test booking
# 3. Submit CleanScore report with photo
# 4. Process Stripe test payment
# 5. Verify AI Concierge (WhatsApp test message)
```

**4.2. API Health Endpoints**

```bash
# Health checks
curl https://api.brisacubana.com/healthz | jq .
curl https://api.brisacubana.com/health/ready | jq .
curl https://api.brisacubana.com/health/live | jq .

# Metrics endpoint
curl https://api.brisacubana.com/metrics | grep http_requests_total
```

---

### Phase 5: Traffic Monitoring (T+30 min)

**5.1. Observe Key Metrics**

```bash
# Railway logs
railway logs --service "@brisa/api" --follow

# Vercel logs
vercel logs --follow --token=$VERCEL_TOKEN

# Database connection pool
psql $DATABASE_URL -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"
```

**5.2. SLO Verification**

Check Grafana/CloudWatch dashboards:

- **Error Rate:** ≤ 1% (target: 0.1%)
- **Latency p95:** ≤ 500ms (target: 200ms)
- **Latency p99:** ≤ 1000ms (target: 500ms)
- **Availability:** ≥ 99.9%

**5.3. Business Metrics**

- **Booking creation rate:** baseline ± 10%
- **Payment success rate:** ≥ 98%
- **CleanScore submission rate:** baseline ± 15%

---

### Phase 6: Full Traffic Cutover (T+45 min)

**6.1. Canary Analysis**

```bash
# If canary metrics are healthy, promote to 100%
# Vercel automatically handles this after 30 min observation

# Verify traffic distribution
curl -I https://brisacubana.com | grep "x-vercel-id"
```

**6.2. Feature Flag Activation**

```bash
# Enable new features gradually
# Example: Enable AI Concierge for 10% of users
psql $DATABASE_URL -c "UPDATE feature_flags SET enabled = true, rollout_percentage = 10 WHERE name = 'ai_concierge_v2';"

# Monitor impact for 10 minutes
# If metrics stable, increase to 50%, then 100%
```

---

### Phase 7: Database Contract (T+60 min, only if safe)

**7.1. Contract Phase (Remove Old Schema)**

⚠️ **ONLY execute if:**

- All traffic is on new version
- Metrics are stable for 30+ minutes
- No errors in logs related to old schema

```bash
# Drop old columns/tables (if migration requires it)
psql $DATABASE_URL -c "ALTER TABLE bookings DROP COLUMN deprecated_field;"

# Verify no active queries use old schema
psql $DATABASE_URL -c "SELECT query FROM pg_stat_activity WHERE query LIKE '%deprecated_field%';"
```

---

### Phase 8: Post-Deployment (T+75 min)

**8.1. Update Monitoring Baselines**

```bash
# Update Grafana alerts to new baselines
# Update error budget calculations
# Snapshot current metrics for comparison
```

**8.2. Documentation Update**

```bash
# Update CHANGELOG.md
echo "## $(date +%Y-%m-%d) - Production Release v$(date +%Y.%m.%d)" >> CHANGELOG.md
echo "- Feature: AI Concierge v2 with GPT-4" >> CHANGELOG.md
echo "- Fix: CleanScore photo upload timeout" >> CHANGELOG.md

# Commit and push
git add CHANGELOG.md
git commit -m "docs: update changelog for v$(date +%Y.%m.%d) release"
git push origin main
```

**8.3. Lift Deployment Freeze**

```bash
# Remove branch protection freeze
gh api repos/albertodimas/brisa-cubana-clean-intelligence/branches/main/protection \
  -X PUT \
  -f required_status_checks='{"strict":false}' \
  -f enforce_admins=false

# Announce in Slack
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text":"✅ Deployment successful! Freeze lifted. Normal operations resumed."}'
```

---

## ✅ Success Criteria

Deployment is considered **successful** when:

1. ✅ All smoke tests pass
2. ✅ Error rate ≤ baseline + 0.5%
3. ✅ Latency p95 within SLO
4. ✅ No Sev1/Sev2 incidents triggered
5. ✅ Database performance stable (no lock timeouts)
6. ✅ Business metrics within expected range
7. ✅ Zero customer complaints in 1st hour

---

## ⏪ Rollback Triggers

Initiate **immediate rollback** if:

- ❌ Error rate > baseline + 2% sustained for 5 minutes
- ❌ Latency p95 > SLO sustained for 5 minutes
- ❌ Database connection pool exhausted
- ❌ Payment processing failure rate > 5%
- ❌ Sev1 incident declared
- ❌ Deployment lead decision (gut feeling counts!)

**Rollback Procedure:** See `ROLLBACK.md`

---

## 📊 Post-Deployment Hypercare

**Duration:** 72 hours

- **First 4 hours:** Dedicated on-call engineer monitoring dashboards
- **Next 24 hours:** Hourly metric reviews
- **24–72 hours:** Standard on-call rotation

**Hypercare Checklist:**

- [ ] Monitor error rates every 15 min (first 4h)
- [ ] Review logs for anomalies
- [ ] Check database slow query log
- [ ] Verify cost metrics (no unexpected spikes)
- [ ] Collect user feedback (support tickets, NPS)
- [ ] Schedule post-mortem (5 days after deployment)

---

## 📞 Escalation Contacts

| Severity             | Response Time | Contact         |
| -------------------- | ------------- | --------------- |
| **Sev1** (site down) | 5 min         | PagerDuty → CTO |
| **Sev2** (degraded)  | 15 min        | On-call SRE     |
| **Sev3** (minor)     | 1 hour        | Support ticket  |

---

## 📚 References

- **Rollback Procedure:** `ROLLBACK.md`
- **Incident Response:** `INCIDENT_RESPONSE.md`
- **Database Migrations:** `docs/for-developers/database-migrations.md`
- **Monitoring Dashboards:** Grafana (grafana.brisacubana.com)
- **Status Page:** status.brisacubana.com

---

**Deployment Lead Signature:** **********\_********** **Date:** ****\_\_****

**Approved By (CTO/VP Eng):** **********\_********** **Date:** ****\_\_****
