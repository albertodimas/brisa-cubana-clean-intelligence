# ⏪ ROLLBACK RUNBOOK

> **Emergency Rollback Procedure**
> **Version:** 1.0
> **Last Updated:** October 2, 2025
> **Estimated Duration:** 10–20 minutes (FAST!)

---

## 🚨 When to Rollback

Initiate rollback **immediately** if:

- ❌ **Error rate** > baseline + 2% sustained for 5 minutes
- ❌ **Latency p95** > SLO × 2 sustained for 5 minutes
- ❌ **Database** connection pool exhausted or deadlocks
- ❌ **Payment processing** failure rate > 5%
- ❌ **Sev1 incident** declared (site down, data loss, security breach)
- ❌ **Business metrics** crash (bookings, payments, conversions)
- ❌ **Deployment lead decision** (trust your gut!)

**DO NOT WAIT for perfect data. Act fast.**

---

## 👥 Rollback Team

| Role                   | Responsibility                              |
| ---------------------- | ------------------------------------------- |
| **Incident Commander** | Declares rollback, coordinates team         |
| **SRE On-Call**        | Executes rollback commands                  |
| **DBA**                | Monitors database, reverts schema if needed |
| **Communications**     | Updates status page, notifies stakeholders  |

---

## 📋 Rollback Checklist

- [ ] **Incident declared** (Slack `#incidents`, PagerDuty)
- [ ] **Rollback initiated** (timestamp: ****\_****)
- [ ] **Application reverted** (Railway + Vercel)
- [ ] **Database schema checked** (safe to keep or revert?)
- [ ] **Feature flags disabled** (to safe defaults)
- [ ] **Health checks passing** (all services green)
- [ ] **Metrics stabilized** (error rate, latency normal)
- [ ] **Post-mortem scheduled** (within 48 hours)

---

## 🔧 Rollback Procedure

### Phase 1: Declare Incident (T+0)

**1.1. Announce Rollback**

```bash
# Post to Slack #incidents
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{
    "text": "🚨 ROLLBACK INITIATED",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Incident:* Production deployment rollback\n*Reason:* [ERROR_RATE_SPIKE | LATENCY_SPIKE | DATABASE_FAILURE | SEV1]\n*Initiated by:* @incident-commander\n*ETA:* 15 minutes"
      }
    }]
  }'

# Update status page
curl -X POST https://api.statuspage.io/v1/pages/$PAGE_ID/incidents \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "name": "Service Degradation - Rollback in Progress",
      "status": "investigating",
      "impact_override": "major",
      "body": "We are experiencing elevated error rates and are rolling back the recent deployment. ETA: 15 minutes."
    }
  }'
```

---

### Phase 2: Revert Application (T+2 min)

**2.1. Rollback Railway API**

```bash
# Option A: Railway rollback to previous deployment
export RAILWAY_TOKEN="your_production_token"
railway rollback --service "@brisa/api" --environment production

# Option B: Redeploy specific version (if rollback command unavailable)
git checkout <previous_commit_sha>
railway up --service "@brisa/api" --detach

# Wait for health check
sleep 30
curl -f https://api.brisacubana.com/healthz || echo "⚠️ API still unhealthy"
```

**2.2. Rollback Vercel Web**

```bash
# List recent deployments
vercel ls brisa-cubana-clean-intelligence --token=$VERCEL_TOKEN

# Promote previous deployment to production
vercel promote <previous_deployment_url> --token=$VERCEL_TOKEN --yes

# Verify
curl -f https://brisacubana.com || echo "⚠️ Web still unhealthy"
```

---

### Phase 3: Revert Feature Flags (T+5 min)

**3.1. Disable New Features**

```bash
# Connect to production database
psql $DATABASE_URL -c "
UPDATE feature_flags
SET enabled = false
WHERE name IN ('ai_concierge_v2', 'cleanscore_v3', 'new_payment_flow')
  AND created_at > NOW() - INTERVAL '7 days';
"

# Verify flags disabled
psql $DATABASE_URL -c "SELECT name, enabled FROM feature_flags WHERE enabled = true;"
```

---

### Phase 4: Database Schema Check (T+7 min)

**4.1. Assess Database State**

⚠️ **Critical Decision:** Can we keep the new schema or must we revert?

**Keep schema if:**

- Only expand phase completed (additive changes)
- No contract phase executed (no columns dropped)
- Old code compatible with new schema

**Revert schema if:**

- Contract phase executed (columns/tables dropped)
- Old code breaks with new schema
- Data corruption detected

**4.2. Schema Revert (if required)**

```bash
# Restore to pre-deployment snapshot (DANGER: potential data loss)
psql $DATABASE_URL -c "
SELECT pg_restore_point('pre_deployment_20251002_1000');
"

# OR apply inverse migration
cd apps/api
pnpm prisma migrate resolve --rolled-back <migration_name>

# Verify schema
pnpm prisma validate
```

**4.3. Backfill Cleanup (if backfill ran)**

```bash
# If backfill added data incompatible with old schema, delete it
psql $DATABASE_URL -c "
DELETE FROM cleanscore_report
WHERE version = 2 AND created_at > '2025-10-02 10:00:00';
"
```

---

### Phase 5: Verify Rollback (T+10 min)

**5.1. Health Checks**

```bash
# API health
curl https://api.brisacubana.com/healthz | jq '.status' # Should be "ok"

# Web health
curl -I https://brisacubana.com | grep "200 OK"

# Database health
psql $DATABASE_URL -c "SELECT 1;" # Should return 1
```

**5.2. Critical User Flows**

```bash
# Run smoke tests against production (use test accounts!)
pnpm test:e2e --grep "smoke|critical" --reporter=list

# Manual checks:
# 1. Login works
# 2. Can create booking
# 3. Can view dashboard
# 4. Payment processing works
```

**5.3. Metrics Verification**

Check dashboards (Grafana/CloudWatch):

- ✅ Error rate back to baseline
- ✅ Latency p95 within SLO
- ✅ Database connections stable
- ✅ Payment success rate normal

---

### Phase 6: Stabilization (T+15 min)

**6.1. Monitor for 30 Minutes**

```bash
# Watch logs for errors
railway logs --service "@brisa/api" --follow | grep -i "error|exception|fatal"

# Monitor database
psql $DATABASE_URL -c "
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;
"

# Check error budget consumption
# (Calculate: errors_after_rollback vs errors_before_deployment)
```

**6.2. Update Status Page**

```bash
# Once stable, update status
curl -X PATCH https://api.statuspage.io/v1/pages/$PAGE_ID/incidents/<incident_id> \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "status": "resolved",
      "body": "Rollback completed successfully. All services operating normally. We are investigating the root cause and will publish a post-mortem within 48 hours."
    }
  }'
```

---

### Phase 7: Post-Rollback (T+30 min)

**7.1. Capture Evidence**

```bash
# Export logs from failed deployment
railway logs --service "@brisa/api" --since "1 hour ago" > rollback_logs_$(date +%Y%m%d_%H%M%S).txt

# Export metrics
# Screenshot Grafana dashboards showing error spike

# Database query logs (if applicable)
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20;" > db_slow_queries.txt
```

**7.2. Root Cause Analysis Kickoff**

```bash
# Create incident post-mortem document
cat > POSTMORTEM_$(date +%Y%m%d).md <<'EOF'
# Post-Mortem: Production Rollback (YYYY-MM-DD)

## Incident Summary
- **Date/Time:** YYYY-MM-DD HH:MM EDT
- **Duration:** XX minutes
- **Impact:** [HIGH|MEDIUM|LOW]
- **Root Cause:** TBD

## Timeline
- HH:MM - Deployment started
- HH:MM - Error rate spike detected
- HH:MM - Rollback initiated
- HH:MM - Services restored

## What Went Wrong
TBD

## What Went Right
TBD

## Action Items
- [ ] Fix root cause
- [ ] Add test coverage
- [ ] Improve monitoring/alerts
- [ ] Update runbook

## Lessons Learned
TBD
EOF
```

**7.3. Slack Summary**

```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{
    "text": "✅ Rollback completed successfully. All services restored. Post-mortem in progress.",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Status:* ✅ Resolved\n*Duration:* 15 minutes\n*Impact:* Elevated error rate 2.5% → 0.1%\n*Next Steps:* Root cause analysis, post-mortem scheduled for Friday 2 PM"
      }
    }]
  }'
```

---

## 🔍 Common Rollback Scenarios

### Scenario 1: Database Migration Failed Mid-Deploy

**Symptoms:** Migration stuck, connection pool exhausted

**Action:**

1. Kill long-running queries: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query LIKE 'ALTER TABLE%';`
2. Rollback migration: `pnpm prisma migrate resolve --rolled-back`
3. Restore from backup if data corrupted

### Scenario 2: API Deployment Healthy, Web Deployment Failing

**Symptoms:** API 200 OK, Web 502/504

**Action:**

1. Rollback Web only: `vercel promote <previous_url>`
2. Keep API on new version (if compatible)
3. Investigate Web build logs

### Scenario 3: Feature Flag Caused Regression

**Symptoms:** Error spike correlates with flag activation

**Action:**

1. Disable flag immediately: `UPDATE feature_flags SET enabled = false WHERE name = 'problematic_feature';`
2. No need to rollback deployment
3. Fix feature, re-enable with 1% rollout

### Scenario 4: Third-Party Service Outage (Stripe, OpenAI)

**Symptoms:** External API errors

**Action:**

1. **NOT a rollback scenario!**
2. Enable circuit breaker: `UPDATE config SET circuit_breaker_open = true WHERE service = 'stripe';`
3. Fallback to degraded mode (manual processing)

---

## 📊 Rollback Metrics

Track these for post-mortem:

- **Time to Detect (TTD):** Deployment start → issue detected
- **Time to Rollback (TTR):** Issue detected → rollback initiated
- **Time to Recovery (TTRec):** Rollback initiated → services healthy
- **Customer Impact:** Affected users, failed transactions, support tickets

**Target SLAs:**

- TTD: < 5 minutes
- TTR: < 2 minutes (decision made)
- TTRec: < 15 minutes (full recovery)

---

## ⚠️ NEVER Do This During Rollback

- ❌ **Migrate database forward** (only backward or keep as-is)
- ❌ **Deploy new code** (only revert to known good)
- ❌ **Make config changes** (except reverting feature flags)
- ❌ **Manually edit database** (except emergency fixes)
- ❌ **Ignore incident process** (always declare, document, post-mortem)

---

## 📞 Escalation

If rollback fails or metrics don't stabilize within **20 minutes**:

1. **Escalate to CTO** (PagerDuty)
2. **Engage vendor support** (Railway, Vercel, Neon DB)
3. **Consider full maintenance mode** (show static page)
4. **Restore from backup** (last resort, potential data loss)

---

## 📚 References

- **Go-Live Procedure:** `GO_LIVE.md`
- **Incident Response:** `INCIDENT_RESPONSE.md`
- **Database Backup/Restore:** `docs/for-developers/database-operations.md`
- **Monitoring Dashboards:** Grafana (grafana.brisacubana.com)

---

**Incident Commander:** **********\_********** **Date:** ****\_\_****

**Time Initiated:** ****\_\_**** **Time Resolved:** ****\_\_**** **Duration:** ****\_\_****
