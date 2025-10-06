# On-Call Handbook

**Project:** Brisa Cubana Clean Intelligence
**Version:** 1.0
**Last Updated:** 6 de octubre de 2025
**Owner:** Platform Engineering Team

---

## Purpose

This handbook provides on-call engineers with practical guidance, checklists, common debugging commands, emergency contacts, and procedures to effectively handle production incidents for Brisa Cubana Clean Intelligence.

**Quick Links:**

- [Start of Shift Checklist](#start-of-shift-checklist)
- [Common Issues & Solutions](#common-issues--solutions)
- [Debugging Commands](#debugging-commands)
- [Emergency Contacts](#emergency-contacts)
- [Post-Mortem Process](#post-mortem-process)

---

## Table of Contents

1. [Start of Shift Checklist](#start-of-shift-checklist)
2. [Required Tools & Access](#required-tools--access)
3. [Monitoring Dashboards](#monitoring-dashboards)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Debugging Commands](#debugging-commands)
6. [Emergency Contacts](#emergency-contacts)
7. [Incident Response Workflow](#incident-response-workflow)
8. [Communication Guidelines](#communication-guidelines)
9. [Post-Mortem Process](#post-mortem-process)
10. [End of Shift Checklist](#end-of-shift-checklist)

---

## Start of Shift Checklist

### Pre-Shift Preparation (1 Hour Before)

- [ ] **Review Handoff Document**
  - Read notes from outgoing engineer
  - Understand active incidents and known issues
  - Note any scheduled maintenance or deployments

- [ ] **Check Personal Readiness**
  - Laptop fully charged and with charger
  - Phone fully charged with backup power bank
  - Reliable internet connection (WiFi + mobile backup)
  - Quiet workspace available for incident calls
  - VPN client installed and tested

- [ ] **Verify Access & Tools**
  - PagerDuty notifications working (test alert)
  - Slack desktop and mobile apps active
  - VPN connection successful
  - All required tools accessible (see [Required Tools](#required-tools--access))

### Shift Start (First 30 Minutes)

- [ ] **Attend Handoff Meeting**
  - Join video call with outgoing engineer
  - Take notes on active issues
  - Ask clarifying questions
  - Confirm understanding of action items

- [ ] **System Health Check**
  - [ ] Review Service Health Dashboard
    - API status: ✅ Green (< 1% error rate)
    - Web status: ✅ Green (< 500ms p95)
    - Database: ✅ Green (< 100ms query time)

  - [ ] Check Recent Alerts (Past 24 Hours)
    - Any Sev1/Sev2 incidents?
    - Pattern of false positives?
    - Unusual alert volume?

  - [ ] Review Infrastructure
    - Railway: All services healthy
    - Vercel: Latest deployment successful
    - Database: No connection pool exhaustion
    - Redis: Memory usage < 80%

- [ ] **Check Scheduled Events**
  - [ ] Review deployment calendar for the week
  - [ ] Note any maintenance windows
  - [ ] Check for planned load tests or changes

- [ ] **Confirm On-Call Setup**
  - [ ] Post "On-call shift started" in #on-call-schedule
  - [ ] Update PagerDuty status to "On Duty"
  - [ ] Set Slack status: "🚨 On-Call"
  - [ ] Enable Do Not Disturb override for critical contacts

### First 2 Hours Deep Dive

- [ ] **Review Recent Incidents**
  - Read post-mortems from past 2 weeks
  - Note any recurring issues
  - Check status of follow-up action items

- [ ] **Familiarize with Current State**
  - Review recent code changes (GitHub)
  - Check for new features deployed
  - Understand any configuration changes

- [ ] **Test Emergency Procedures**
  - [ ] Verify rollback access (Vercel, Railway)
  - [ ] Test database connection (read-only)
  - [ ] Confirm access to emergency runbooks
  - [ ] Practice one common debugging flow

---

## Required Tools & Access

### Essential Tools

| Tool                  | Purpose             | Installation                                                                                                                   | Configuration                                                     |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **PagerDuty App**     | Alert notifications | [iOS](https://apps.apple.com/app/id594039512) / [Android](https://play.google.com/store/apps/details?id=com.pagerduty.android) | Enable push, SMS, and phone notifications                         |
| **Slack**             | Team communication  | [Desktop](https://slack.com/downloads) + Mobile                                                                                | Join channels: #incidents, #on-call-schedule, #engineering-alerts |
| **Railway CLI**       | Backend management  | `npm i -g @railway/cli`                                                                                                        | `railway login`                                                   |
| **Vercel CLI**        | Frontend management | `npm i -g vercel`                                                                                                              | `vercel login`                                                    |
| **PostgreSQL Client** | Database access     | `brew install postgresql`                                                                                                      | Connection string from 1Password                                  |
| **VPN Client**        | Secure access       | [OpenVPN](https://openvpn.net/download-open-vpn/)                                                                              | Config file from IT                                               |

### Required Access

**Verify you have access to:**

- [ ] **PagerDuty:** Admin role, can acknowledge/resolve incidents
- [ ] **Slack:** Member of all critical channels
- [ ] **Railway:** Admin access to production project
- [ ] **Vercel:** Owner/admin access to production project
- [ ] **Sentry:** Admin access to error tracking
- [ ] **GitHub:** Write access to repository
- [ ] **Database:** Read-only access for troubleshooting
- [ ] **Status Page:** Admin access to update customer status
- [ ] **1Password/Vault:** Access to all production credentials
- [ ] **Stripe Dashboard:** View-only access to payment logs
- [ ] **Documentation:** Access to internal wiki/Notion

**Request Missing Access:**

1. Notify engineering manager immediately
2. Create IT ticket: it-support@brisacubana.com
3. CC: oncall@brisacubana.com
4. Escalate if not resolved within 2 hours

---

## Monitoring Dashboards

### Primary Dashboards (Keep Open)

#### 1. Service Health Dashboard

**URL:** https://status.brisacubana.com/dashboard
**Refresh:** Every 30 seconds

**Key Metrics:**

- **Uptime:** Should be > 99.9% (green)
- **Error Rate:** Should be < 1% (green)
- **Response Time:** p95 < 500ms (green)
- **Active Incidents:** Zero is ideal

**Alert Thresholds:**

- 🟢 Green: All metrics normal
- 🟡 Yellow: Degraded (error rate 1-5%, response time 500ms-1s)
- 🔴 Red: Critical (error rate > 5%, response time > 1s, or down)

---

#### 2. Sentry Error Tracking

**URL:** https://sentry.io/organizations/brisa-cubana

**What to Monitor:**

- **Unhandled Errors:** New error types
- **Error Spikes:** Sudden increase in error frequency
- **User Impact:** Number of affected users
- **Performance Issues:** Slow transactions

**Daily Review Checklist:**

- [ ] Review new errors (last 24 hours)
- [ ] Triage unresolved errors
- [ ] Check for error trends/patterns
- [ ] Resolve false positives

---

#### 3. Infrastructure Monitoring

**Railway Dashboard**
**URL:** https://railway.app/project/[project-id]

**Monitor:**

- Service status (should be "Running")
- Memory usage (< 80% of limit)
- CPU usage (< 70% sustained)
- Recent deployments (successful?)
- Error logs (real-time)

**Vercel Dashboard**
**URL:** https://vercel.com/dashboard

**Monitor:**

- Deployment status (should be "Ready")
- Build times (< 2 minutes)
- Error rate (< 1%)
- Edge function invocations
- Bandwidth usage

---

#### 4. Database Metrics

**Railway PostgreSQL**
**URL:** https://railway.app/project/[project-id]/service/postgres

**Monitor:**

- Connection count (< 80% of max)
- Query performance (< 100ms average)
- Slow queries (> 1 second)
- Database size (not approaching limit)
- Replication lag (should be 0)

**Critical Thresholds:**

- Connection pool > 90%: Investigate immediately
- Slow queries > 5 per minute: Review and optimize
- Database size > 90%: Plan for scaling

---

### Secondary Dashboards (Check Periodically)

#### Business Metrics Dashboard

- Active bookings (hourly trend)
- Payment processing success rate (> 99%)
- CleanScore generation rate
- User registrations (daily trend)

#### Application Logs

- Railway logs: `railway logs --tail`
- Vercel logs: `vercel logs --follow`
- Centralized logging (if configured)

---

## Common Issues & Solutions

### Issue 1: API Health Check Failing

**Symptoms:**

- `/health` endpoint returning 503
- PagerDuty alert: "API Down"
- Dashboard shows red status

**Quick Diagnosis:**

```bash
# Check if API is responding
curl https://api.brisacubana.com/health

# Check Railway service status
railway status --service api
```

**Common Causes & Solutions:**

1. **Database Connection Lost**

   ```bash
   # Check database status
   railway status --service postgres

   # If database is down, restart it
   railway restart --service postgres

   # Wait 30 seconds, then restart API
   railway restart --service api
   ```

2. **Service Crashed (OOM or Error)**

   ```bash
   # Check logs for crash reason
   railway logs --service api | tail -100

   # If OOM (Out of Memory), scale up
   railway up --service api --memory 2GB

   # Otherwise, restart service
   railway restart --service api
   ```

3. **Deployment Failed**

   ```bash
   # Check recent deployments
   railway deployments --service api

   # Rollback to previous working version
   railway rollback --service api
   ```

**Escalation Trigger:**

- Issue persists after 15 minutes
- Database corruption suspected
- Multiple services affected

---

### Issue 2: Web Application Not Loading

**Symptoms:**

- Users report blank page or 500 error
- Vercel showing errors
- PagerDuty alert: "Web Down"

**Quick Diagnosis:**

```bash
# Check Vercel deployment status
vercel ls --scope brisa-cubana

# Check for build errors
vercel logs --follow
```

**Common Causes & Solutions:**

1. **Build Failed**

   ```bash
   # Check latest deployment
   vercel inspect [deployment-url]

   # If build failed, redeploy
   vercel --prod

   # Or rollback to previous
   vercel rollback
   ```

2. **API Connection Failed**

   ```bash
   # Verify API is healthy
   curl https://api.brisacubana.com/health

   # Check NEXT_PUBLIC_API_URL environment variable
   vercel env ls

   # If incorrect, update and redeploy
   vercel env add NEXT_PUBLIC_API_URL
   ```

3. **CDN/Edge Issue**

   ```bash
   # Purge Vercel cache
   vercel cache clear

   # Check edge function logs
   vercel logs --edge
   ```

**Escalation Trigger:**

- Rollback doesn't resolve issue
- CDN provider outage (external dependency)
- Authentication system affected

---

### Issue 3: Database Performance Degradation

**Symptoms:**

- Slow API responses (> 1 second)
- Database query timeouts
- Connection pool exhaustion

**Quick Diagnosis:**

```bash
# Connect to database
railway connect postgres

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Find slow queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC
LIMIT 10;
```

**Common Causes & Solutions:**

1. **Connection Pool Exhausted**

   ```bash
   # Check connection count
   SELECT count(*) FROM pg_stat_activity;

   # If > 80% of max, kill idle connections
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND now() - state_change > interval '10 minutes';
   ```

2. **Long-Running Query**

   ```bash
   # Find and kill long-running queries
   SELECT pg_cancel_backend(pid)
   FROM pg_stat_activity
   WHERE now() - query_start > interval '5 minutes';
   ```

3. **Missing Index or Bad Query**

   ```bash
   # Find missing indexes
   SELECT schemaname, tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'public';

   # Check query execution plan
   EXPLAIN ANALYZE [slow-query];
   ```

**Escalation Trigger:**

- Database requires index creation (DBA needed)
- Database scaling required
- Data corruption suspected

---

### Issue 4: Payment Processing Failures

**Symptoms:**

- Stripe webhooks failing
- Payment confirmations not updating
- Users report payment issues

**Quick Diagnosis:**

```bash
# Check Stripe webhook deliveries
# Visit: https://dashboard.stripe.com/webhooks

# Check API webhook endpoint logs
railway logs --service api | grep "webhook"

# Test webhook endpoint
curl -X POST https://api.brisacubana.com/api/payments/webhook \
  -H "stripe-signature: test" \
  -d '{}'
```

**Common Causes & Solutions:**

1. **Webhook Signature Verification Failed**

   ```bash
   # Verify STRIPE_WEBHOOK_SECRET is correct
   railway variables --service api | grep STRIPE

   # Get correct secret from Stripe dashboard
   # Update environment variable
   railway variables --service api --set STRIPE_WEBHOOK_SECRET=[secret]

   # Restart API
   railway restart --service api
   ```

2. **Database Not Updating Payment Status**

   ```bash
   # Check payment records
   railway connect postgres

   SELECT * FROM "Payment"
   WHERE "createdAt" > NOW() - INTERVAL '1 hour'
   ORDER BY "createdAt" DESC;

   # If stuck in PENDING, manually update (last resort)
   # UPDATE "Payment" SET status = 'COMPLETED' WHERE id = '[id]';
   ```

3. **Stripe API Rate Limited**

   ```bash
   # Check for 429 errors in logs
   railway logs --service api | grep "429"

   # Implement exponential backoff (code change required)
   # Escalate to backend team
   ```

**Escalation Trigger:**

- Payment data inconsistency detected
- Stripe API outage (check https://status.stripe.com)
- Financial discrepancy > $1000

---

### Issue 5: Authentication Failures

**Symptoms:**

- Users cannot log in
- JWT token validation errors
- Session expired errors

**Quick Diagnosis:**

```bash
# Test authentication endpoint
curl -X POST https://api.brisacubana.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Check for auth errors in logs
railway logs --service api | grep -i "auth\|jwt\|token"
```

**Common Causes & Solutions:**

1. **JWT Secret Mismatch**

   ```bash
   # Verify JWT_SECRET in API
   railway variables --service api | grep JWT_SECRET

   # Verify NEXTAUTH_SECRET in Web
   vercel env ls | grep NEXTAUTH_SECRET

   # If mismatched, update and redeploy
   ```

2. **Token Expiration Issue**

   ```bash
   # Check JWT_ACCESS_EXPIRATION setting
   railway variables --service api | grep EXPIRATION

   # Default should be: 15m (access), 7d (refresh)
   ```

3. **Database Session Store Issue**

   ```bash
   # Check Session table
   railway connect postgres

   SELECT COUNT(*) FROM "Session" WHERE "expiresAt" > NOW();

   # If sessions expired, users need to re-login (expected behavior)
   ```

**Escalation Trigger:**

- Security incident suspected (unauthorized access)
- Mass session invalidation required
- Auth provider (Auth.js) bug

---

### Issue 6: High Error Rate (> 5%)

**Symptoms:**

- Sentry showing spike in errors
- PagerDuty alert: "High Error Rate"
- Dashboard shows yellow/red status

**Quick Diagnosis:**

```bash
# Check error breakdown in Sentry
# Visit: https://sentry.io/organizations/brisa-cubana/issues/

# Check error logs
railway logs --service api | grep -i "error" | tail -50
```

**Common Causes & Solutions:**

1. **Recent Deployment Introduced Bug**

   ```bash
   # Check recent deployments
   railway deployments --service api

   # If error started after deployment, rollback
   railway rollback --service api
   ```

2. **External Service Outage**

   ```bash
   # Check third-party service status pages
   # - Stripe: https://status.stripe.com
   # - Twilio: https://status.twilio.com
   # - OpenAI: https://status.openai.com

   # If external service down, enable circuit breaker or degraded mode
   ```

3. **Increased Traffic (DDoS or Viral Event)**

   ```bash
   # Check request volume
   railway metrics --service api

   # If legitimate traffic spike, scale up
   railway up --service api --replicas 3

   # If DDoS, enable rate limiting or contact CDN provider
   ```

**Escalation Trigger:**

- Error rate > 10% for > 10 minutes
- Cannot identify root cause within 30 minutes
- Requires code fix (not config change)

---

## Debugging Commands

### Railway CLI Commands

```bash
# Service Status
railway status                           # All services
railway status --service api             # Specific service

# Logs
railway logs --tail                      # Follow all logs
railway logs --service api --tail        # Follow API logs
railway logs --since 1h                  # Last hour
railway logs | grep "ERROR"              # Filter errors

# Deployments
railway deployments --service api        # List deployments
railway rollback --service api           # Rollback to previous

# Service Management
railway restart --service api            # Restart service
railway up --service api                 # Redeploy service

# Environment Variables
railway variables --service api          # List variables
railway variables --service api --set KEY=VALUE  # Set variable

# Database Connection
railway connect postgres                 # Connect to PostgreSQL
railway run psql $DATABASE_URL           # Alternative connection

# Scaling
railway up --service api --memory 2GB    # Increase memory
railway up --service api --replicas 3    # Horizontal scaling
```

---

### Vercel CLI Commands

```bash
# Deployments
vercel ls                                # List deployments
vercel inspect [deployment-url]          # Inspect deployment
vercel rollback                          # Rollback to previous

# Logs
vercel logs --follow                     # Follow logs
vercel logs --since 1h                   # Last hour
vercel logs --edge                       # Edge function logs

# Environment Variables
vercel env ls                            # List env variables
vercel env add NEXT_PUBLIC_API_URL       # Add variable
vercel env rm NEXT_PUBLIC_API_URL        # Remove variable

# Build & Deploy
vercel build                             # Build locally
vercel --prod                            # Deploy to production
vercel --prebuilt                        # Deploy prebuilt

# Cache Management
vercel cache clear                       # Clear cache
```

---

### Database Debugging (PostgreSQL)

```bash
# Connect to database
railway connect postgres
# Or: psql $DATABASE_URL

# Active Connections
SELECT pid, usename, application_name, client_addr, state, query
FROM pg_stat_activity;

# Connection Count
SELECT count(*) FROM pg_stat_activity;

# Slow Queries (> 5 seconds)
SELECT pid, now() - query_start AS duration, state, query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

# Kill Long-Running Query
SELECT pg_cancel_backend([pid]);         # Graceful cancel
SELECT pg_terminate_backend([pid]);      # Force kill

# Database Size
SELECT pg_size_pretty(pg_database_size(current_database()));

# Table Sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Lock Information
SELECT pid, relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted;

# Index Usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

# Cache Hit Ratio (should be > 90%)
SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

---

### Application-Level Debugging

```bash
# API Health Check
curl https://api.brisacubana.com/health

# Test Authentication
curl -X POST https://api.brisacubana.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubana.com","password":"Admin123!"}'

# Test Protected Endpoint
curl https://api.brisacubana.com/api/bookings \
  -H "Authorization: Bearer [token]"

# Check API Response Time
curl -w "@curl-format.txt" -o /dev/null -s https://api.brisacubana.com/health

# curl-format.txt:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

---

### Network & DNS Debugging

```bash
# DNS Resolution
dig api.brisacubana.com                  # Check DNS records
nslookup api.brisacubana.com             # Alternative DNS check

# Trace Route
traceroute api.brisacubana.com           # Network path

# Port Connectivity
nc -zv api.brisacubana.com 443           # Test HTTPS port
telnet api.brisacubana.com 443           # Alternative

# SSL Certificate
openssl s_client -connect api.brisacubana.com:443 -servername api.brisacubana.com

# HTTP Headers
curl -I https://api.brisacubana.com      # Response headers
```

---

## Emergency Contacts

### Internal Escalation

| Role                        | Primary Contact | Secondary Contact | Phone           | Response SLA       |
| --------------------------- | --------------- | ----------------- | --------------- | ------------------ |
| **Engineering Manager**     | [Name]          | [Name]            | +1-XXX-XXX-XXXX | 30 min             |
| **Director of Engineering** | [Name]          | [Name]            | +1-XXX-XXX-XXXX | 1 hour             |
| **CTO**                     | [Name]          | [Name]            | +1-XXX-XXX-XXXX | 1 hour (Sev1 only) |
| **Database Administrator**  | [Name]          | [Name]            | +1-XXX-XXX-XXXX | 15 min             |
| **Security Officer**        | [Name]          | [Name]            | +1-XXX-XXX-XXXX | 10 min             |
| **Product Manager**         | [Name]          | [Name]            | +1-XXX-XXX-XXXX | 1 hour             |
| **Customer Support Lead**   | [Name]          | [Name]            | +1-XXX-XXX-XXXX | 30 min             |

### Subject Matter Experts

| Area                | Expert | Contact         | Slack Handle     |
| ------------------- | ------ | --------------- | ---------------- |
| **Backend/API**     | [Name] | +1-XXX-XXX-XXXX | @backend-lead    |
| **Frontend/Web**    | [Name] | +1-XXX-XXX-XXXX | @frontend-lead   |
| **Database/Prisma** | [Name] | +1-XXX-XXX-XXXX | @database-expert |
| **Infrastructure**  | [Name] | +1-XXX-XXX-XXXX | @platform-team   |
| **Payments/Stripe** | [Name] | +1-XXX-XXX-XXXX | @payments-owner  |
| **AI/ML**           | [Name] | +1-XXX-XXX-XXXX | @ai-team         |

### External Vendors

| Service     | Support Contact            | SLA                       | Status Page                |
| ----------- | -------------------------- | ------------------------- | -------------------------- |
| **Railway** | support@railway.app        | 1 hour (Enterprise)       | https://status.railway.app |
| **Vercel**  | support@vercel.com         | 4 hours (Pro)             | https://vercel-status.com  |
| **Stripe**  | https://support.stripe.com | 24/7 phone (in dashboard) | https://status.stripe.com  |
| **Sentry**  | support@sentry.io          | 8 hours (Business)        | https://status.sentry.io   |
| **Twilio**  | https://support.twilio.com | 24/7 phone                | https://status.twilio.com  |
| **OpenAI**  | https://help.openai.com    | Email only                | https://status.openai.com  |

### Emergency Slack Channels

- **#incidents** - Active incident coordination
- **#on-call-escalations** - Urgent escalations
- **#engineering-alerts** - Automated alerts
- **#customer-support** - Customer-facing issues

### PagerDuty Escalation

**Phone Number:** +1-XXX-XXX-XXXX (PagerDuty hotline)

**Auto-Escalation:**

- Primary on-call: 0 minutes
- Secondary on-call: 10 minutes (Sev1), 20 minutes (Sev2)
- Engineering Manager: 30 minutes
- Director of Engineering: 60 minutes

---

## Incident Response Workflow

### 1. Alert Received (0-5 minutes)

**Immediate Actions:**

- [ ] Acknowledge alert in PagerDuty (within SLA)
- [ ] Open monitoring dashboards
- [ ] Check service health status
- [ ] Determine severity using decision tree

**Severity Assessment:**

- **Sev1:** Complete outage, data loss, security breach
- **Sev2:** Major degradation, critical feature broken
- **Sev3:** Minor impact, limited feature broken
- **Sev4:** Informational, no immediate impact

### 2. Initial Assessment (5-10 minutes)

**Investigation Steps:**

- [ ] Review recent changes (deployments, config, DNS)
- [ ] Check error logs (Sentry, Railway, Vercel)
- [ ] Review metrics (error rate, latency, traffic)
- [ ] Identify scope of impact (users affected, revenue impact)

**Document Findings:**

```markdown
[TIME] Initial Assessment:

- Severity: [Sev1/2/3/4]
- Impact: [Description]
- Scope: [X users / Y services affected]
- Started: [Timestamp]
- Potential Cause: [Hypothesis]
```

### 3. Declare Incident (If Sev1 or Sev2)

**Incident Declaration:**

- [ ] Create Slack channel: `#incident-YYYYMMDD-HHMM`
- [ ] Post incident announcement (use template)
- [ ] Update status page: https://status.brisacubana.com
- [ ] Notify stakeholders (support, product, leadership)

**Incident Announcement Template:**

```
🚨 SEV [1/2] INCIDENT DECLARED 🚨

Summary: [Brief description]
Impact: [What's affected]
Started: [Timestamp]
Incident Commander: @[your-name]
Status Channel: #incident-[YYYYMMDD-HHMM]

Current Status: Investigating
ETA for Update: [15 minutes]

Status Page: [Updated/Pending]
Customer Notification: [Yes/No/Pending]
```

### 4. Mitigation (10-30 minutes)

**Priority: Stop the bleeding first**

**Common Mitigation Actions:**

- [ ] **Rollback deployment** (if recent change caused issue)

  ```bash
  railway rollback --service api
  vercel rollback
  ```

- [ ] **Scale resources** (if capacity issue)

  ```bash
  railway up --service api --replicas 3
  ```

- [ ] **Restart service** (if crash/hang)

  ```bash
  railway restart --service api
  ```

- [ ] **Kill problematic queries** (if database issue)

  ```sql
  SELECT pg_cancel_backend([pid]);
  ```

- [ ] **Enable degraded mode** (if third-party outage)
  - Disable non-critical features
  - Enable circuit breakers
  - Show maintenance message

**Document Actions:**

```markdown
[TIME] Mitigation Attempted:

- Action: [What you did]
- Result: [Success/Failed]
- Next Step: [What's next]
```

### 5. Communication (Throughout)

**Update Frequency:**

- **Sev1:** Every 15 minutes
- **Sev2:** Every 30 minutes
- **Sev3:** Every 2 hours

**Update Template:**

```
🔄 UPDATE [TIME]

Status: [Investigating/Mitigating/Monitoring/Resolved]
Actions Taken: [List]
Current Impact: [Description]
Next Update: [Time]
ETA for Resolution: [Estimate or "Unknown"]
```

**Status Page Updates:**

- Initial: "Investigating - We are aware of issues with [service]"
- Mitigation: "Identified - We have identified the issue and are working on a fix"
- Monitoring: "Monitoring - A fix has been applied and we are monitoring"
- Resolved: "Resolved - The issue has been resolved"

### 6. Resolution & Monitoring

**Confirm Resolution:**

- [ ] Health checks passing for 15 minutes
- [ ] Error rate back to normal (< 1%)
- [ ] Response time back to baseline
- [ ] No new related alerts

**Post-Resolution Actions:**

- [ ] Update status page to "Resolved"
- [ ] Post resolution message in incident channel
- [ ] Thank participants
- [ ] Close incident in PagerDuty
- [ ] Schedule post-mortem (within 48 hours)

**Resolution Template:**

```
✅ INCIDENT RESOLVED

Summary: [Brief description]
Duration: [Start] - [End] ([Duration])
Root Cause: [Brief explanation]
Impact: [What was affected]
Resolution: [What fixed it]

Post-Mortem: Scheduled for [Date/Time]
Follow-up Actions: [JIRA links]

Thank you to @[contributors] for the swift response!
```

### 7. Escalation (If Needed)

**When to Escalate:**

- Issue persists after 30 minutes (Sev1) or 2 hours (Sev2)
- Root cause unclear
- Requires expertise outside your domain
- Requires architectural/business decision
- Security incident

**How to Escalate:**

```bash
# Tag relevant SME in incident channel
@backend-lead Need help with API performance issue

# If no response in 5 minutes, call directly
# Use PagerDuty to auto-escalate
```

---

## Communication Guidelines

### Tone & Style

**DO:**

- Be calm and professional
- Use clear, concise language
- State facts, not assumptions
- Acknowledge uncertainty when present
- Thank team members for assistance

**DON'T:**

- Panic or create alarm
- Blame individuals
- Make promises you can't keep
- Use technical jargon in customer communications
- Speculate on root cause prematurely

### Internal Communication (Slack)

**Format:**

```markdown
[TIMESTAMP] [ACTION/UPDATE]
[Description]
[Next steps or questions]
```

**Example:**

```
[14:23] INVESTIGATING
API health check failing. Checking recent deployments.
Next: Review logs for errors.

[14:25] FOUND
Deployment from 14:15 introduced database connection issue.
Next: Rolling back deployment.

[14:27] MITIGATED
Rollback complete. Health check passing.
Next: Monitor for 15 minutes before closing incident.
```

### External Communication (Customers)

**Status Page Updates:**

- **First Update (Within 5 min):** "We are investigating reports of [issue]"
- **Diagnosis (Within 15 min):** "We have identified the issue affecting [service]"
- **Mitigation (Within 30 min):** "We have applied a fix and are monitoring"
- **Resolution:** "The issue has been resolved. Service is fully operational"

**Customer Email Template (If Required):**

```
Subject: [Resolved] Service Disruption on [Date]

Dear Brisa Cubana Customer,

We experienced a service disruption on [Date] from [Start Time] to [End Time] EST.

What happened:
[Brief, non-technical explanation]

Impact:
[What was affected, who was affected]

Resolution:
[What we did to fix it]

Next steps:
[Any action required from customers, if any]

We sincerely apologize for the inconvenience. We are implementing [preventive measures] to ensure this doesn't happen again.

If you have questions, please contact support@brisacubana.com.

Thank you for your patience and understanding.

The Brisa Cubana Team
```

### Leadership Communication

**When to Notify:**

- Sev1 incident declared
- Sev2 incident lasting > 1 hour
- Customer escalation
- Revenue impact > $5K
- Media/PR involvement

**Format (Slack/Email):**

```
INCIDENT SUMMARY - [Sev1/2] - [DATE]

Status: [Active/Resolved]
Duration: [Start] - [End or "Ongoing"]
Impact: [Users/Revenue affected]
Root Cause: [Brief explanation or "Under investigation"]
Actions Taken: [List]
ETA for Resolution: [Estimate or "Unknown"]

Incident Channel: #incident-[YYYYMMDD-HHMM]
Incident Commander: @[name]
```

---

## Post-Mortem Process

### When to Conduct Post-Mortem

**Required for:**

- All Sev1 incidents
- All Sev2 incidents
- Sev3 incidents with customer escalation
- Recurring issues (3+ times)

**Optional for:**

- Sev3 incidents (learning opportunity)
- Near-misses (almost became incident)

### Post-Mortem Timeline

**Within 24 Hours:**

- [ ] Schedule post-mortem meeting (60-90 minutes)
- [ ] Invite all incident participants
- [ ] Share incident timeline and data

**Within 48 Hours:**

- [ ] Conduct post-mortem meeting
- [ ] Complete post-mortem document
- [ ] Identify action items with owners

**Within 1 Week:**

- [ ] Share post-mortem with broader team
- [ ] Create JIRA tickets for action items
- [ ] Update runbooks based on learnings

### Post-Mortem Meeting Agenda

**1. Introduction (5 min)**

- Set blameless tone
- Review meeting objectives

**2. Timeline Review (15 min)**

- Walk through incident timeline
- Clarify any gaps or questions

**3. Root Cause Analysis (20 min)**

- Use "5 Whys" technique
- Identify contributing factors
- Map out causal chain

**4. What Went Well (10 min)**

- Effective actions
- Good decisions
- Positive behaviors

**5. What Went Wrong (15 min)**

- Missed opportunities
- Process gaps
- Tool limitations

**6. Action Items (15 min)**

- Preventive measures
- Monitoring improvements
- Process changes
- Assign owners and due dates

**7. Lessons Learned (10 min)**

- Key takeaways
- Knowledge sharing
- Training needs

### Post-Mortem Document Template

**Use:** [incident-report-template.md](../templates/incident-report-template.md)

**Required Sections:**

1. Incident Summary
2. Impact Assessment
3. Timeline of Events
4. Root Cause Analysis
5. Resolution & Recovery
6. What Went Well
7. What Went Wrong
8. Action Items
9. Lessons Learned

### Action Items Follow-Up

**Tracking:**

- Create JIRA tickets for each action item
- Assign owner and due date
- Link to post-mortem document
- Tag with "incident-followup"

**Review:**

- Check action item progress weekly
- Include in sprint planning
- Report on completion in team meetings

**Closure:**

- Verify action item effectiveness
- Update documentation
- Close JIRA ticket

---

## End of Shift Checklist

### 1 Hour Before Shift End

- [ ] **Review Shift Activity**
  - Document all incidents and alerts
  - Note any ongoing issues
  - Identify patterns or trends

- [ ] **Prepare Handoff Document**
  - List active incidents
  - Note known issues and workarounds
  - Document any scheduled events
  - Include action items for next on-call

- [ ] **System Health Check**
  - Review all dashboards
  - Confirm no degraded services
  - Check for any unusual patterns

### Shift End (30 Minutes)

- [ ] **Handoff Meeting**
  - Join video call with incoming engineer
  - Walk through handoff document
  - Answer questions
  - Transfer knowledge

- [ ] **Update Systems**
  - Update PagerDuty status to "Off Duty"
  - Remove "On-Call" Slack status
  - Post handoff confirmation in #on-call-schedule

### Post-Shift (Optional)

- [ ] **Decompression**
  - Take a break
  - Reflect on learnings
  - Note any personal action items

- [ ] **Feedback**
  - Share improvements in #on-call-feedback
  - Update runbooks if gaps found
  - Thank team members who assisted

---

## Appendix

### A. Common Error Codes

| Error Code       | Service    | Meaning               | Action                        |
| ---------------- | ---------- | --------------------- | ----------------------------- |
| **503**          | API        | Service Unavailable   | Check if service is running   |
| **500**          | API        | Internal Server Error | Check logs for exception      |
| **429**          | API/Stripe | Too Many Requests     | Check rate limits             |
| **401**          | API        | Unauthorized          | Check JWT token               |
| **504**          | Web        | Gateway Timeout       | Check API response time       |
| **ECONNREFUSED** | API        | Connection Refused    | Check database/service status |
| **ETIMEDOUT**    | API        | Connection Timeout    | Check network/firewall        |

### B. Quick Reference Cards

**Sev1 Response Card:**

```
1. Acknowledge alert (< 5 min)
2. Create #incident-YYYYMMDD-HHMM
3. Update status page
4. Investigate (check logs, metrics, recent changes)
5. Mitigate (rollback, restart, scale)
6. Update every 15 minutes
7. Escalate if > 30 min
8. Resolve and schedule post-mortem
```

**Database Emergency Card:**

```
# Connect
railway connect postgres

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Kill slow query
SELECT pg_terminate_backend([pid]);

# Check locks
SELECT * FROM pg_locks WHERE NOT granted;
```

**Rollback Card:**

```
# API (Railway)
railway rollback --service api

# Web (Vercel)
vercel rollback

# Database (manual migration)
# See: ROLLBACK.md
```

### C. Useful Resources

**Internal Documentation:**

- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [ROLLBACK.md](./ROLLBACK.md)
- [Architecture Docs](../../for-developers/architecture.md)
- [API Reference](../../for-developers/api-reference.md)

**External Resources:**

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- Stripe API: https://stripe.com/docs/api

**Training Materials:**

- On-call simulation recordings
- Previous incident post-mortems
- Debugging workshops

---

## Document Maintenance

**Review Schedule:**

- **Monthly:** Update contacts and access instructions
- **Quarterly:** Review and update common issues
- **After Each Incident:** Update based on learnings

**Feedback:**
Share suggestions in #on-call-feedback or create PR

**Version History:**

| Version | Date       | Author        | Changes          |
| ------- | ---------- | ------------- | ---------------- |
| 1.0     | 2025-10-06 | Platform Team | Initial handbook |

**Next Review:** January 6, 2026

---

**Related Documents:**

- [ON_CALL_ROTATION.md](../ON_CALL_ROTATION.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [Incident Report Template](../templates/incident-report-template.md)
