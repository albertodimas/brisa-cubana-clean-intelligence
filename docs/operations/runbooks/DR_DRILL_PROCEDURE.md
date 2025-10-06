# Disaster Recovery Drill Procedure

**Purpose:** Execute controlled disaster recovery drills to validate RTO/RPO targets and team readiness.
**Version:** 1.0
**Last Updated:** 6 de octubre de 2025

---

## Executive Summary

This document defines the complete procedure for conducting Disaster Recovery (DR) drills for Brisa Cubana Clean Intelligence. Regular DR drills ensure:

- **RTO (Recovery Time Objective):** < 1 hour
- **RPO (Recovery Point Objective):** < 15 minutes
- **Team Readiness:** On-call engineers can execute recovery procedures
- **Documentation Accuracy:** Runbooks are current and complete

**Drill Frequency:** Quarterly (minimum) + after major infrastructure changes

---

## 1. Objectives and Success Criteria

### Primary Objectives

1. **Validate Recovery Time Objective (RTO)**
   - Complete system recovery in < 1 hour from disaster declaration
   - All critical services operational within target

2. **Validate Recovery Point Objective (RPO)**
   - Data loss < 15 minutes from point of failure
   - All transactions logged and recoverable

3. **Team Readiness**
   - Engineers can execute runbooks without assistance
   - Communication protocols are clear and followed
   - Escalation paths are understood

4. **Documentation Validation**
   - All runbooks are accurate and complete
   - Access credentials and tools are functional
   - Contact information is current

### Success Criteria

| Criterion          | Target                     | Measurement                                          |
| ------------------ | -------------------------- | ---------------------------------------------------- |
| Recovery Time      | < 60 minutes               | From disaster declaration to full system operational |
| Data Loss          | < 15 minutes               | Maximum age of last successful backup                |
| API Availability   | 100% post-recovery         | All health checks passing                            |
| Database Integrity | 100%                       | All integrity checks passing                         |
| Team Coordination  | All roles assigned < 5 min | Incident command structure established               |
| Runbook Accuracy   | 100%                       | No steps missing or incorrect                        |

---

## 2. Pre-Requisites and Preparation

### 2.1 Scheduling

**Minimum 2 weeks advance notice:**

- [ ] Schedule drill date/time (off-peak hours recommended)
- [ ] Notify all stakeholders (engineering, product, support)
- [ ] Reserve calendar blocks for all participants
- [ ] Coordinate with platform providers (Railway, Vercel) if needed
- [ ] Notify customers if drill impacts production (usually none)

### 2.2 Required Access

**Verify all team members have access to:**

- [ ] **Railway Dashboard**: Production database access
- [ ] **Vercel Dashboard**: Web app deployment controls
- [ ] **GitHub Repository**: Code access and deployment triggers
- [ ] **Secrets Management**: Railway/Vercel environment variables
- [ ] **Monitoring Tools**: Logs, metrics, alerts
- [ ] **Communication Channels**: Slack #incident-dr-drill, video call
- [ ] **Documentation**: This runbook and related docs

### 2.3 Baseline Health Check

**Before drill starts, verify system is healthy:**

```bash
# Run comprehensive health check
./scripts/check-status.sh

# Verify database connectivity
railway run --service postgres psql -c "SELECT version();"

# Verify API health
curl https://api.brisacubana.com/health

# Verify web app
curl -I https://app.brisacubana.com

# Check latest backup timestamp
railway run --service postgres psql -c "SELECT pg_last_wal_receive_lsn();"
```

### 2.4 Pre-Drill Checklist

- [ ] All participants confirmed attendance
- [ ] System baseline health documented
- [ ] Recent backup verified (< 1 hour old)
- [ ] Monitoring dashboards accessible
- [ ] Communication channels tested
- [ ] Roles assigned (IC, Scribe, Comms, SMEs)
- [ ] Timer/stopwatch ready for metrics
- [ ] Screen recording started for documentation

---

## 3. Disaster Scenarios

### Scenario 1: Complete Database Failure (Sev1)

**Simulation:**

- PostgreSQL instance becomes completely unavailable
- All database connections fail
- Data corruption detected

**Impact:**

- API returns 500 errors for all authenticated requests
- Users cannot login or access data
- Booking system down

**Recovery Path:**

1. Restore from latest point-in-time backup
2. Verify data integrity
3. Reconnect application services
4. Validate all critical flows

**Estimated RTO:** 30-45 minutes

---

### Scenario 2: API Service Complete Outage (Sev1)

**Simulation:**

- API deployment fails and cannot start
- All health checks failing
- Web app cannot communicate with backend

**Impact:**

- Website loads but all features non-functional
- Users see "Service Unavailable" errors
- No new bookings possible

**Recovery Path:**

1. Execute immediate rollback to last known good version
2. If rollback fails, redeploy from stable branch
3. Verify health endpoints
4. Run smoke tests

**Estimated RTO:** 15-30 minutes

---

### Scenario 3: Data Corruption - Partial Tables (Sev2)

**Simulation:**

- Booking or Payment table corruption detected
- Some records unreadable or missing foreign key relationships
- Application throwing database constraint errors

**Impact:**

- Specific user bookings inaccessible
- Payment processing degraded
- Admin dashboard showing errors

**Recovery Path:**

1. Identify affected tables and time range
2. Restore specific tables from point-in-time backup
3. Reconcile restored data with current state
4. Verify data consistency

**Estimated RTO:** 45-60 minutes

---

### Scenario 4: Security Incident - Compromised Credentials (Sev1)

**Simulation:**

- Database credentials or JWT secrets leaked
- Potential unauthorized access detected
- Immediate security lockdown required

**Impact:**

- All authentication must be invalidated
- Users forced to re-login
- Services restarted with new credentials

**Recovery Path:**

1. Rotate all database credentials
2. Rotate JWT secrets and invalidate all tokens
3. Update Railway/Vercel environment variables
4. Redeploy all services
5. Force password reset for affected users (if any)

**Estimated RTO:** 30-60 minutes

---

### Scenario 5: Multi-Region Failure - Provider Outage (Sev1)

**Simulation:**

- Railway platform experiencing regional outage
- Database in primary region unavailable
- Need to failover to backup/replica

**Impact:**

- Complete system unavailable in primary region
- Requires failover to different infrastructure

**Recovery Path:**

1. Assess provider status and ETA
2. If > 30min, initiate failover procedure
3. Point DNS to failover infrastructure
4. Restore latest backup to failover database
5. Deploy applications to failover environment
6. Verify complete system functionality

**Estimated RTO:** 45-90 minutes (extended for cold failover)

---

## 4. Drill Execution Procedure

### 4.1 Initialization (T-0: Start)

**Incident Commander Actions:**

1. **Declare Drill Start** (announce in Slack #incident-dr-drill)

   ```
   🚨 DR DRILL STARTED 🚨
   Scenario: [SCENARIO_NAME]
   Time: [TIMESTAMP]
   IC: [NAME]
   Scribe: [NAME]
   Expected RTO: [TIME]

   This is a DRILL - no customer impact expected.
   ```

2. **Assign Roles:**
   - Incident Commander (IC): Overall coordination
   - Scribe: Timeline documentation
   - Communications Lead: Stakeholder updates
   - Database SME: Database recovery
   - Application SME: Service restoration
   - QA Engineer: Validation testing

3. **Trigger Scenario:**
   - Execute scenario simulation (details per scenario)
   - Confirm system is in "failed" state
   - Start recovery timer

### 4.2 Detection and Assessment (T+0 to T+5)

**Expected Actions:**

1. **Monitoring Detection:**
   - Alerts should fire automatically
   - Team acknowledges alerts
   - On-call engineer responds

2. **Initial Assessment:**

   ```bash
   # Check API health
   curl https://api.brisacubana.com/health

   # Check database connectivity
   railway logs --service postgres | tail -50

   # Check recent deployments
   railway status --service api
   vercel ls --scope brisa-cubana
   ```

3. **Severity Classification:**
   - IC determines Sev1/Sev2 based on impact
   - Documents decision rationale

**Success Criteria:**

- Alert detected < 2 minutes
- Team assembled < 5 minutes
- Severity classified correctly

### 4.3 Mitigation and Recovery (T+5 to T+60)

**Database Recovery (Scenario 1, 3):**

```bash
# 1. Identify latest backup point
railway run --service postgres psql -c \
  "SELECT * FROM pg_stat_archiver ORDER BY archived_time DESC LIMIT 1;"

# 2. Restore from point-in-time (Railway specific)
# Note: Use Railway dashboard or CLI for PITR
railway run --service postgres -- pg_restore \
  --dbname=brisa_production \
  --clean \
  --if-exists \
  /path/to/backup.dump

# 3. Verify restoration
railway run --service postgres psql -c "
  SELECT
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM bookings) as booking_count,
    (SELECT COUNT(*) FROM payments) as payment_count,
    (SELECT MAX(created_at) FROM bookings) as latest_booking;
"

# 4. Run integrity checks
./scripts/verify-backup.sh --mode integrity
```

**API Rollback (Scenario 2):**

```bash
# 1. Identify last healthy deployment
railway deployments --service api | head -5

# 2. Execute rollback
railway rollback --service api --to [DEPLOYMENT_ID]

# 3. Monitor rollback progress
railway logs --service api --follow

# 4. Verify health
curl https://api.brisacubana.com/health
curl https://api.brisacubana.com/auth/health
```

**Security Incident Response (Scenario 4):**

```bash
# 1. Generate new secrets
./scripts/generate-secrets.sh --production

# 2. Update Railway environment
railway variables set DATABASE_URL=[NEW_URL] --service api
railway variables set JWT_SECRET=[NEW_SECRET] --service api

# 3. Update Vercel environment
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_API_URL production

# 4. Redeploy with new secrets
railway up --service api --detach
vercel deploy --prod

# 5. Invalidate all sessions
railway run --service postgres psql -c \
  "UPDATE refresh_tokens SET is_revoked = true WHERE is_revoked = false;"
```

**Multi-Region Failover (Scenario 5):**

```bash
# 1. Provision backup database (if not exists)
# Note: This should be pre-provisioned

# 2. Restore latest backup to failover DB
pg_restore -h [FAILOVER_HOST] \
  -U [USER] -d [DB] /backups/latest.dump

# 3. Update DNS records
# Example: Update Cloudflare or Railway custom domain

# 4. Deploy to failover environment
railway link [FAILOVER_PROJECT_ID]
railway up --service api
railway up --service web

# 5. Monitor failover deployment
railway logs --service api --follow
```

### 4.4 Validation and Testing (T+45 to T+60)

**Critical Path Testing:**

```bash
# 1. API Health Checks
curl -f https://api.brisacubana.com/health || echo "HEALTH CHECK FAILED"

# 2. Authentication Flow
curl -X POST https://api.brisacubana.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 3. Database Queries
railway run --service postgres psql -c "
  SELECT
    table_name,
    (xpath('/row/cnt/text()',
      query_to_xml(format('select count(*) as cnt from %I', table_name),
      false, true, '')))[1]::text::int as row_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  ORDER BY table_name;
"

# 4. End-to-End Flow Test
pnpm --filter @brisa/web test:e2e:smoke

# 5. Data Integrity Validation
./scripts/verify-backup.sh --mode full
```

**Manual QA Checklist:**

- [ ] Login with test user account
- [ ] Create new booking
- [ ] View existing bookings
- [ ] Process test payment
- [ ] Generate CleanScore report
- [ ] Check admin dashboard
- [ ] Verify real-time features (if any)
- [ ] Test mobile responsiveness

**Database Integrity Checks:**

```sql
-- Check for orphaned records
SELECT 'bookings_without_users' as issue, COUNT(*)
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
WHERE u.id IS NULL;

SELECT 'bookings_without_properties' as issue, COUNT(*)
FROM bookings b
LEFT JOIN properties p ON b.property_id = p.id
WHERE p.id IS NULL;

-- Check data consistency
SELECT
  (SELECT COUNT(*) FROM bookings WHERE status = 'COMPLETED' AND completed_at IS NULL) as completed_without_timestamp,
  (SELECT COUNT(*) FROM bookings WHERE payment_status = 'PAID' AND payment_intent_id IS NULL) as paid_without_intent;

-- Verify latest data present
SELECT
  MAX(created_at) as latest_booking,
  NOW() - MAX(created_at) as age
FROM bookings;
```

### 4.5 Drill Completion and Debrief (T+60)

**Incident Commander Actions:**

1. **Declare Drill Complete:**

   ```
   ✅ DR DRILL COMPLETED ✅
   Scenario: [SCENARIO_NAME]
   Start Time: [START_TIMESTAMP]
   End Time: [END_TIMESTAMP]
   Total Duration: [DURATION]
   RTO Target: < 60 min
   Actual RTO: [ACTUAL_TIME]
   Status: [SUCCESS/PARTIAL/FAILED]
   ```

2. **Immediate Debrief (15 minutes):**
   - What went well?
   - What went wrong?
   - Blockers encountered?
   - Documentation gaps?

3. **Metrics Collection:**
   - Actual RTO achieved
   - Actual RPO (data loss window)
   - Number of errors/retry attempts
   - Team response times
   - Runbook accuracy score

---

## 5. Post-Drill Activities

### 5.1 Cleanup

**Revert any changes made during drill:**

```bash
# 1. Restore production state if drill impacted staging
railway rollback --service api --to [PRE_DRILL_DEPLOYMENT]

# 2. Clean up test data created during drill
railway run --service postgres psql -c \
  "DELETE FROM bookings WHERE created_at > '[DRILL_START_TIME]'
   AND notes LIKE '%DR_DRILL%';"

# 3. Reset any modified configurations
git checkout main
git pull origin main

# 4. Verify production is stable
./scripts/check-status.sh
```

### 5.2 Documentation Update

**Immediately update based on drill findings:**

- [ ] Update runbooks with corrections
- [ ] Document new issues discovered
- [ ] Update contact information if outdated
- [ ] Revise time estimates based on actuals
- [ ] Add missing steps to procedures

### 5.3 Drill Report Template

**Create report within 24 hours:**

```markdown
# DR Drill Report - [DATE]

## Executive Summary

- **Scenario Tested:** [Scenario Name]
- **Start Time:** [Timestamp]
- **End Time:** [Timestamp]
- **Total Duration:** [Duration]
- **Overall Result:** [SUCCESS/PARTIAL/FAILED]

## Objectives Met

| Objective      | Target   | Actual   | Status |
| -------------- | -------- | -------- | ------ |
| RTO            | < 60 min | [XX] min | ✅/❌  |
| RPO            | < 15 min | [XX] min | ✅/❌  |
| Team Response  | < 5 min  | [XX] min | ✅/❌  |
| Data Integrity | 100%     | [XX]%    | ✅/❌  |

## Timeline

| Time | Event             | Duration | Notes                      |
| ---- | ----------------- | -------- | -------------------------- |
| T+0  | Drill started     | -        | Scenario: [Name]           |
| T+2  | Alert detected    | 2 min    | Monitoring fired correctly |
| T+5  | Team assembled    | 3 min    | All roles assigned         |
| ...  | ...               | ...      | ...                        |
| T+XX | Recovery complete | XX min   | All systems operational    |

## What Went Well

- [List successes]
- [Team coordination]
- [Technical execution]

## Issues Encountered

- [List problems]
- [Documentation gaps]
- [Technical challenges]

## Action Items

| Action     | Owner  | Due Date | Priority |
| ---------- | ------ | -------- | -------- |
| [Action 1] | [Name] | [Date]   | High     |
| [Action 2] | [Name] | [Date]   | Medium   |

## Lessons Learned

- [Key takeaway 1]
- [Key takeaway 2]
- [Recommended improvements]

## Next Steps

- [ ] Update runbooks (Due: [Date])
- [ ] Fix identified issues (Due: [Date])
- [ ] Schedule follow-up drill (Due: [Date])
- [ ] Share report with leadership

**Report Author:** [Name]
**Date:** [Date]
```

### 5.4 Follow-up Actions

**Within 1 week:**

- [ ] Fix all critical issues discovered
- [ ] Update documentation with corrections
- [ ] Train team on new procedures
- [ ] Improve monitoring/alerting based on findings

**Within 1 month:**

- [ ] Re-test any failed scenarios
- [ ] Implement automation opportunities
- [ ] Update DR strategy if needed
- [ ] Schedule next quarterly drill

---

## 6. Validation Checklist

### Pre-Drill Validation

- [ ] **All participants confirmed** (IC, Scribe, Comms, SMEs, QA)
- [ ] **Access verified** (Railway, Vercel, GitHub, monitoring)
- [ ] **Baseline documented** (system health, metrics, backup timestamp)
- [ ] **Communication channels ready** (Slack, video call, status page)
- [ ] **Scenario selected** (appropriate complexity for team skill level)
- [ ] **Success criteria defined** (RTO, RPO, team response targets)
- [ ] **Monitoring configured** (alerts enabled, dashboards accessible)
- [ ] **Backup verified** (< 1 hour old, integrity checked)

### During-Drill Validation

- [ ] **Alert detection** (< 2 minutes from incident)
- [ ] **Team assembly** (< 5 minutes, all roles assigned)
- [ ] **Severity classified** (correct Sev level, documented rationale)
- [ ] **Communication clear** (regular updates, no confusion)
- [ ] **Runbooks followed** (step-by-step, no improvisation)
- [ ] **Timeline documented** (Scribe recording all events)
- [ ] **Recovery executed** (procedures followed correctly)
- [ ] **Validation completed** (all health checks passing)

### Post-Drill Validation

- [ ] **RTO achieved** (< 60 minutes total recovery time)
- [ ] **RPO achieved** (< 15 minutes data loss)
- [ ] **System operational** (all services healthy)
- [ ] **Data integrity** (100% consistency checks passed)
- [ ] **Cleanup complete** (drill artifacts removed)
- [ ] **Report generated** (within 24 hours)
- [ ] **Action items created** (owners and due dates assigned)
- [ ] **Documentation updated** (runbooks corrected)
- [ ] **Leadership notified** (summary report shared)
- [ ] **Next drill scheduled** (within 3 months)

---

## 7. Metrics and KPIs

### Drill Performance Metrics

| Metric                              | Target   | Measurement Method                   |
| ----------------------------------- | -------- | ------------------------------------ |
| **Mean Time to Detect (MTTD)**      | < 2 min  | From incident to first alert         |
| **Mean Time to Acknowledge (MTTA)** | < 5 min  | From alert to team assembled         |
| **Mean Time to Recover (MTTR)**     | < 60 min | From incident to full recovery       |
| **Data Loss Window**                | < 15 min | Timestamp of last backup vs incident |
| **Runbook Accuracy**                | 100%     | Steps executed without modification  |
| **Team Readiness**                  | 100%     | All roles filled within target time  |

### Trend Analysis

**Track across drills to measure improvement:**

```bash
# Example metrics dashboard
Drill #1 (Q1 2025): RTO 45min ✅ | RPO 10min ✅ | Runbook 95% ✅
Drill #2 (Q2 2025): RTO 38min ✅ | RPO 8min ✅  | Runbook 98% ✅
Drill #3 (Q3 2025): RTO 30min ✅ | RPO 5min ✅  | Runbook 100% ✅
```

---

## 8. Continuous Improvement

### After Each Drill

1. **Identify Automation Opportunities**
   - Which manual steps can be automated?
   - Can we improve monitoring/alerting?
   - Should we create new tools/scripts?

2. **Update Training Materials**
   - Create videos of successful procedures
   - Document common pitfalls
   - Build team muscle memory

3. **Enhance Resilience**
   - Add redundancy where failures occurred
   - Improve failover mechanisms
   - Strengthen monitoring coverage

### Quarterly Review

- **Analyze drill trends** (improving or degrading?)
- **Update RTO/RPO targets** (based on business needs)
- **Revise scenarios** (increase complexity as team improves)
- **Benchmark industry standards** (are we competitive?)

---

## 9. Resources and References

### Related Documentation

- [Backup & Restore Guide](./BACKUP_RESTORE_GUIDE.md)
- [Incident Response Runbook](./INCIDENT_RESPONSE.md)
- [Rollback Procedure](./ROLLBACK.md)
- [Production Readiness Checklist](../PRODUCTION_READINESS_CHECKLIST.md)

### Tools and Access

- **Railway Dashboard**: https://railway.app/project/[PROJECT_ID]
- **Vercel Dashboard**: https://vercel.com/brisa-cubana
- **GitHub Repository**: https://github.com/albertodimas/brisa-cubana-clean-intelligence
- **Monitoring**: Railway logs, Vercel analytics
- **Documentation**: https://albertodimas.github.io/brisa-cubana-clean-intelligence/

### Support Contacts

- **Platform Support (Railway)**: support@railway.app
- **Platform Support (Vercel)**: support@vercel.com
- **Database Expert**: [Name] - [Contact]
- **Security Team**: [Name] - [Contact]
- **On-Call Rotation**: [PagerDuty/OpsGenie Link]

---

## 10. Appendix: Quick Reference

### Emergency Commands

```bash
# System Health Check
./scripts/check-status.sh

# Database Restore
railway run --service postgres pg_restore --clean /backup/latest.dump

# API Rollback
railway rollback --service api --to [DEPLOYMENT_ID]

# Verify Recovery
./scripts/verify-backup.sh --mode full

# Check Data Loss Window
railway run --service postgres psql -c \
  "SELECT MAX(created_at) FROM bookings;"
```

### Critical Decision Tree

```
Incident Detected
│
├─ Database Unavailable?
│  ├─ YES → Restore from PITR (Section 4.3)
│  └─ NO → Continue
│
├─ API Unavailable?
│  ├─ YES → Rollback deployment (Section 4.3)
│  └─ NO → Continue
│
├─ Data Corruption?
│  ├─ YES → Restore affected tables (Section 4.3)
│  └─ NO → Continue
│
└─ Security Incident?
   ├─ YES → Rotate credentials (Section 4.3)
   └─ NO → Escalate to IC
```

---

**Document Owner:** Platform Engineering Team
**Review Frequency:** Quarterly
**Last Drill Executed:** [Date] - [Result]
**Next Drill Scheduled:** [Date]
