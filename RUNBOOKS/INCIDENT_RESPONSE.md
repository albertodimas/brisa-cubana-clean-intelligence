# 🚨 INCIDENT RESPONSE RUNBOOK

> **Emergency Response Procedures**
> **Version:** 1.0
> **Last Updated:** October 2, 2025

---

## 📋 Incident Severity Levels

| Severity | Impact                               | Response Time         | Examples                                                       |
| -------- | ------------------------------------ | --------------------- | -------------------------------------------------------------- |
| **Sev1** | Critical - service down or data loss | **5 minutes**         | Site unreachable, database compromised, payment system down    |
| **Sev2** | Major - degraded performance         | **15 minutes**        | Elevated error rate (>5%), slow response times, partial outage |
| **Sev3** | Minor - limited impact               | **1 hour**            | Non-critical feature broken, cosmetic issues                   |
| **Sev4** | Informational                        | **Next business day** | Questions, feature requests, documentation                     |

---

## 👥 Incident Roles

### Incident Commander (IC)

- **Responsibilities:**
  - Declare incident and severity
  - Coordinate response team
  - Make critical decisions (rollback, escalation)
  - Communicate with stakeholders
  - Close incident when resolved

### Scribe

- **Responsibilities:**
  - Document timeline in incident channel
  - Record decisions and actions taken
  - Capture evidence (logs, screenshots, metrics)
  - Draft initial post-mortem

### Communications Lead

- **Responsibilities:**
  - Update status page
  - Notify customers via email/Twitter
  - Respond to support tickets
  - Coordinate with PR team if needed

### Subject Matter Experts (SMEs)

- **Responsibilities:**
  - Database Owner (DBA): Database issues
  - SRE: Infrastructure, deployment
  - Backend Engineer: API, business logic
  - Frontend Engineer: Web app, UI
  - Security Engineer: Security incidents

---

## 🔔 Incident Detection

### Automated Alerts

| Alert                | Trigger                       | Action                             |
| -------------------- | ----------------------------- | ---------------------------------- |
| **High Error Rate**  | >2% for 5 min                 | Page on-call → Investigate         |
| **High Latency**     | p95 >500ms for 5 min          | Page on-call → Investigate         |
| **Database Down**    | Connection failures           | Page DBA + IC → Emergency          |
| **Payment Failures** | Stripe webhook errors >10/min | Page on-call → Check Stripe status |
| **Security Alert**   | Suspicious activity           | Page security → Lockdown           |

### Manual Detection

- Customer complaints in support tickets
- Social media mentions
- Team member reports
- Monitoring dashboard anomalies

---

## 🚀 Incident Response Workflow

### Phase 1: Detection & Triage (0-5 min)

**1.1. Alert Triggered or Issue Reported**

```bash
# Auto-page via PagerDuty
# or manual page:
curl -X POST https://api.pagerduty.com/incidents \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -d '{
    "incident": {
      "type": "incident",
      "title": "High error rate detected",
      "service": {"id": "PXXXXXX", "type": "service_reference"},
      "urgency": "high",
      "body": {"type": "incident_body", "details": "Error rate 5% for 5 minutes"}
    }
  }'
```

**1.2. On-Call Engineer Responds**

- Acknowledge alert in PagerDuty (< 5 min for Sev1)
- Check monitoring dashboards (Grafana, CloudWatch)
- Determine severity (Sev1, Sev2, Sev3, Sev4)

**1.3. Declare Incident (if Sev1 or Sev2)**

```bash
# Create incident channel
curl -X POST https://slack.com/api/conversations.create \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -d "name=incident-$(date +%Y%m%d-%H%M)&is_private=false"

# Post incident declaration
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{
    "text": "🚨 SEV1 INCIDENT DECLARED",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Severity:* Sev1\n*Summary:* API unreachable - 502 errors\n*Incident Commander:* @on-call-engineer\n*Channel:* #incident-20251002-1030"
      }
    }]
  }'
```

---

### Phase 2: Assemble Response Team (5-10 min)

**2.1. Assign Roles**

- **Incident Commander:** On-call engineer (or escalate to senior)
- **Scribe:** First available engineer
- **Communications:** Community manager or IC
- **SMEs:** Page relevant experts based on symptoms

**2.2. Create War Room**

- Slack channel: `#incident-YYYYMMDD-HHMM`
- Video call (optional): Google Meet or Zoom link

**2.3. Initial Status Update**

```bash
# Update status page to "Investigating"
curl -X POST https://api.statuspage.io/v1/pages/$PAGE_ID/incidents \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "name": "Service Disruption",
      "status": "investigating",
      "impact_override": "critical",
      "body": "We are investigating reports of service unavailability. Updates every 10 minutes."
    }
  }'
```

---

### Phase 3: Mitigate (10-30 min)

**3.1. Stop the Bleeding (First Priority)**

**Common Mitigations:**

| Symptom                | Mitigation                                                 |
| ---------------------- | ---------------------------------------------------------- |
| **High error rate**    | Rollback recent deployment (see `ROLLBACK.md`)             |
| **Database overload**  | Scale up instance, kill long queries, enable read replicas |
| **DDoS attack**        | Enable WAF strict mode, block IPs, contact Cloudflare      |
| **Third-party outage** | Enable circuit breaker, fallback to degraded mode          |
| **Memory leak**        | Restart service, scale horizontally                        |

**Example: Rollback Deployment**

```bash
# See ROLLBACK.md for full procedure
railway rollback --service "@brisa/api"
vercel promote <previous_deployment_url> --token=$VERCEL_TOKEN
```

**Example: Kill Long-Running Queries**

```bash
psql $DATABASE_URL -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '5 minutes';
"
```

**3.2. Protect Customer Data**

- If security incident: **Rotate all secrets immediately**
- If data corruption: **Stop writes, enable read-only mode**
- If suspected breach: **Lockdown, isolate affected systems**

---

### Phase 4: Investigate Root Cause (Parallel with Mitigation)

**4.1. Gather Evidence**

```bash
# Export logs from last 1 hour
railway logs --service "@brisa/api" --since "1 hour ago" > incident_logs.txt

# Database slow queries
psql $DATABASE_URL -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
" > db_slow_queries.txt

# Error stack traces
grep -A 10 "ERROR\|FATAL\|Exception" incident_logs.txt > error_traces.txt
```

**4.2. Check Recent Changes**

```bash
# Recent deployments
git log --oneline --since="6 hours ago"

# Recent config changes
psql $DATABASE_URL -c "SELECT * FROM config_audit WHERE changed_at > NOW() - INTERVAL '6 hours';"

# Recent migrations
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

**4.3. Correlate with External Events**

- Check Stripe status page
- Check OpenAI API status
- Check Vercel/Railway status
- Check DNS provider (Cloudflare)

---

### Phase 5: Communication (Every 10-15 min)

**5.1. Internal Updates (Slack)**

```
[10:45 AM] IC: Error rate reduced from 8% to 2% after rollback. DB connections stable. Investigating root cause.
[10:50 AM] DBA: Found deadlock in bookings table. Applying index optimization.
[10:55 AM] IC: Error rate now 0.3% (normal). Monitoring for 10 more minutes before declaring resolved.
```

**5.2. External Updates (Status Page)**

```bash
# Update status page every 15 min
curl -X PATCH https://api.statuspage.io/v1/pages/$PAGE_ID/incidents/<incident_id> \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "status": "identified",
      "body": "We have identified the issue as a database performance bottleneck and are applying optimizations. Services are partially restored."
    }
  }'
```

---

### Phase 6: Resolution (30-60 min)

**6.1. Verify Services Healthy**

```bash
# All health checks green
curl https://api.brisacubana.com/healthz | jq '.status' # "ok"
curl https://brisacubana.com # 200 OK

# Metrics back to baseline
# - Error rate < 0.5%
# - Latency p95 < 300ms
# - Database connections stable
```

**6.2. Run Smoke Tests**

```bash
pnpm test:e2e --grep "smoke|critical" --reporter=list
```

**6.3. Declare Resolved**

```bash
# Update status page
curl -X PATCH https://api.statuspage.io/v1/pages/$PAGE_ID/incidents/<incident_id> \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "status": "resolved",
      "body": "This incident has been resolved. All services are operating normally. A post-mortem will be published within 48 hours at https://blog.brisacubana.com/postmortems/"
    }
  }'

# Announce in Slack
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text":"✅ INCIDENT RESOLVED - All services healthy. Duration: 45 minutes. Post-mortem scheduled."}'
```

---

### Phase 7: Post-Incident (Within 48 hours)

**7.1. Schedule Post-Mortem Meeting**

- **When:** Within 5 business days
- **Who:** All incident responders + stakeholders
- **Duration:** 60 minutes
- **Goal:** Learn, not blame

**7.2. Write Post-Mortem Document**

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Authors:** IC, Scribe, SMEs
**Status:** Draft | Final

## Executive Summary

One-paragraph summary of what happened and impact.

## Impact

- **Customers Affected:** X users (Y% of total)
- **Duration:** XX minutes
- **Revenue Impact:** $X,XXX (estimated)
- **Support Tickets:** XX new tickets

## Timeline (All times EDT)

- 10:30 AM - Alert triggered (high error rate)
- 10:32 AM - On-call acknowledged, incident declared
- 10:35 AM - War room created, roles assigned
- 10:40 AM - Rollback initiated
- 10:50 AM - Services partially restored
- 11:15 AM - Incident resolved

## Root Cause

Database index missing on `bookings.created_at` caused full table scans
when new feature queried recent bookings. Traffic spike overwhelmed DB.

## What Went Wrong

1. Missing index not caught in staging (low traffic)
2. Load test did not simulate production traffic patterns
3. Monitoring alert triggered late (5 min delay)

## What Went Right

1. Rollback procedure worked smoothly (15 min)
2. Communication updates were timely and clear
3. No data loss or security impact

## Action Items

- [ ] Add index on bookings.created_at (Priority: P0, Owner: DBA, ETA: Oct 3)
- [ ] Improve load test to match production traffic (Priority: P1, Owner: SRE, ETA: Oct 10)
- [ ] Reduce monitoring alert latency to 2 min (Priority: P1, Owner: SRE, ETA: Oct 5)
- [ ] Add database query performance tests to CI (Priority: P2, Owner: Backend, ETA: Oct 15)

## Lessons Learned

- Staging environment must mirror production scale
- Always test migrations with production-like data volume
- Faster detection = faster resolution (invest in observability)
```

**7.3. Share Publicly (Optional)**

- Publish sanitized post-mortem on engineering blog
- Share on Twitter/LinkedIn (transparency builds trust)
- Present learnings at company all-hands

---

## 📊 Incident Metrics

Track these for continuous improvement:

| Metric                              | Target             | Actual (Last 30d) |
| ----------------------------------- | ------------------ | ----------------- |
| **MTTD** (Mean Time to Detect)      | < 5 min            | X min             |
| **MTTA** (Mean Time to Acknowledge) | < 2 min            | X min             |
| **MTTR** (Mean Time to Resolve)     | < 30 min           | X min             |
| **Incident Count (Sev1)**           | < 1/month          | X                 |
| **Incident Count (Sev2)**           | < 3/month          | X                 |
| **Post-Mortem Completion**          | 100% within 7 days | X%                |

---

## 🔐 Security Incident Addendum

**If incident is security-related (data breach, intrusion, DDoS):**

### Immediate Actions

1. **Isolate compromised systems** (disable network access)
2. **Rotate all secrets** (API keys, database passwords, JWT secrets)
3. **Enable forensic logging** (capture all activity)
4. **Notify legal/compliance team** (GDPR, CCPA requirements)
5. **Preserve evidence** (disk snapshots, memory dumps)

### Escalation

- **Security Engineer:** Immediate page
- **CTO/CISO:** Within 15 min
- **Legal Counsel:** Within 1 hour
- **Law Enforcement:** If required by regulation

### Communication

- **DO NOT** announce publicly until investigation complete
- **DO** notify affected customers (email, status page)
- **DO** file breach reports if required (72h for GDPR)

---

## 📞 Contact List

| Role                  | Name | PagerDuty  | Slack      | Phone  |
| --------------------- | ---- | ---------- | ---------- | ------ |
| **Primary On-Call**   | TBD  | @primary   | @engineer1 | +1-XXX |
| **Secondary On-Call** | TBD  | @secondary | @engineer2 | +1-XXX |
| **DBA**               | TBD  | N/A        | @dba       | +1-XXX |
| **Security Lead**     | TBD  | @security  | @security  | +1-XXX |
| **CTO**               | TBD  | @cto       | @cto       | +1-XXX |

---

## 📚 References

- **Rollback Procedure:** `ROLLBACK.md`
- **Go-Live Procedure:** `GO_LIVE.md`
- **Monitoring Dashboards:** https://grafana.brisacubana.com
- **Status Page Admin:** https://manage.statuspage.io
- **PagerDuty:** https://brisacubana.pagerduty.com

---

**Incident Response Plan Last Reviewed:** October 2, 2025

**Next Review Date:** January 2, 2026 (quarterly)
