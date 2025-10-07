# Post-Deployment Monitoring Guide

**Version:** 1.0.0
**Last Updated:** 2025-10-07
**Purpose:** Track system health and performance after production deployment

---

## 🎯 Overview

This guide outlines what to monitor in the first 24-48 hours after deploying to production, and how to respond to common issues.

---

## 📊 Monitoring Dashboard Checklist

### Immediate (First 2 Hours)

#### 1. Application Health

**Where to Check:** Railway Dashboard / Vercel Dashboard

- [ ] **Service Status**
  - ✅ API service running
  - ✅ Web service running
  - ✅ No crash loops
  - ✅ Memory usage < 80%
  - ✅ CPU usage stable

- [ ] **Health Endpoint**

  ```bash
  # Check API health
  curl https://api.yourdomain.com/health
  # Expected: {"status":"ok","database":"connected","redis":"connected"}

  # Check with authentication
  curl https://api.yourdomain.com/health \
    -H "Authorization: Bearer <token>"
  ```

#### 2. Error Rates

**Where to Check:** Sentry Dashboard

- [ ] **Error Monitoring**
  - 🎯 Target: < 1% error rate
  - 🚨 Alert if: > 5% error rate
  - Check for:
    - Unhandled exceptions
    - Database connection errors
    - External API failures
    - Timeout errors

- [ ] **Common Issues to Watch**
  ```
  Top 5 Most Common Errors (Expected):
  1. Invalid authentication token (user error - OK)
  2. Rate limit exceeded (expected behavior - OK)
  3. 404 Not Found (user navigation - OK)
  4. Validation errors (user input - OK)
  5. N+A - Should NOT see production errors
  ```

#### 3. Authentication Flow

**Where to Check:** Application Logs + Sentry

- [ ] **Login Success Rate**
  - 🎯 Target: > 95%
  - 🚨 Alert if: < 90%
  - Test manually:
    ```bash
    # Login test
    curl -X POST https://api.yourdomain.com/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"demo@example.com","password":"Demo123!"}'
    ```

- [ ] **Cookie Configuration**
  - Check in browser DevTools:
    - `accessToken` cookie present
    - HttpOnly: ✅ true
    - Secure: ✅ true
    - SameSite: ✅ Strict
    - Domain: ✅ Correct

#### 4. Database Performance

**Where to Check:** Railway PostgreSQL Metrics

- [ ] **Connection Pool**
  - 🎯 Target: < 70% utilization
  - 🚨 Alert if: > 90% utilization
  - Check: Railway dashboard → Database → Metrics

- [ ] **Query Performance**
  - 🎯 Target: p95 < 100ms
  - 🚨 Alert if: p95 > 500ms
  - Monitor slow queries in logs

#### 5. API Response Times

**Where to Check:** Vercel Analytics / Custom Metrics

- [ ] **Endpoint Performance**
      | Endpoint | Target (p95) | Alert Threshold |
      |----------|--------------|-----------------|
      | GET /health | < 50ms | > 200ms |
      | POST /auth/login | < 200ms | > 1s |
      | GET /bookings | < 300ms | > 1s |
      | POST /bookings | < 500ms | > 2s |
      | GET /reports | < 1s | > 5s |

---

### First 24 Hours

#### 6. Security Monitoring

**Where to Check:** Browser Console + Logs

- [ ] **CSP Violations**

  ```javascript
  // Check browser console for:
  // "Refused to load script because it violates CSP"
  // "Refused to load image because it violates CSP"

  // Expected: 0 CSP violations
  // If violations found: Review CSP config in apps/web/src/server/security/csp.ts
  ```

- [ ] **CORS Blocks**

  ```bash
  # Check API logs for:
  grep "CORS blocked" /var/log/app.log

  # Expected: Only blocks from unauthorized origins
  # If legitimate blocks: Update ALLOWED_ORIGINS
  ```

- [ ] **Rate Limiting**
  - Check that rate limits are working:
    ```bash
    # Spam endpoint to trigger rate limit
    for i in {1..100}; do
      curl https://api.yourdomain.com/auth/login
    done
    # Expected: 429 Too Many Requests after ~10 attempts
    ```

#### 7. Business Metrics

**Where to Check:** Database Queries / Admin Dashboard

- [ ] **User Activity**

  ```sql
  -- Active users in last 24h
  SELECT COUNT(DISTINCT user_id)
  FROM bookings
  WHERE created_at > NOW() - INTERVAL '24 hours';

  -- New signups
  SELECT COUNT(*)
  FROM users
  WHERE created_at > NOW() - INTERVAL '24 hours';
  ```

- [ ] **Booking Creation**
  - 🎯 Target: > 0 bookings created
  - 🚨 Alert if: 0 bookings in 6 hours
  - Check conversion funnel

#### 8. External Integrations

**Where to Check:** Integration Logs + Partner Dashboards

- [ ] **Stripe Payments**
  - Test payment flow end-to-end
  - Verify webhooks are received
  - Check Stripe dashboard for events
  - **Test:** Create test booking with payment

- [ ] **Email (Resend)**
  - Send test booking confirmation
  - Verify delivery in Resend dashboard
  - Check bounce/spam rates
  - 🎯 Target: > 98% delivery rate

- [ ] **SMS (Twilio)** (If enabled)
  - Send test notification
  - Check delivery status
  - Monitor costs

#### 9. Frontend Performance

**Where to Check:** Vercel Analytics / Lighthouse

- [ ] **Core Web Vitals**
      | Metric | Good | Needs Improvement | Poor |
      |--------|------|-------------------|------|
      | LCP | < 2.5s | 2.5-4s | > 4s |
      | FID | < 100ms | 100-300ms | > 300ms |
      | CLS | < 0.1 | 0.1-0.25 | > 0.25 |

  **Where to Check:** Vercel Analytics → Web Vitals tab

- [ ] **Lighthouse Score**

  ```bash
  # Run Lighthouse audit
  lighthouse https://yourdomain.com --view

  # Target scores:
  # Performance: > 90
  # Accessibility: > 90
  # Best Practices: > 90
  # SEO: > 80
  ```

---

### First 48 Hours

#### 10. Data Integrity

- [ ] **Booking Data**

  ```sql
  -- Check for data anomalies
  SELECT
    COUNT(*) as total_bookings,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(total_price) as avg_price
  FROM bookings
  WHERE created_at > NOW() - INTERVAL '48 hours';

  -- Expected: Reasonable values, no NULLs in required fields
  ```

- [ ] **Audit Logs**
  - Review audit trail for suspicious activity
  - Check for failed auth attempts
  - Look for data deletion events

#### 11. Cost Monitoring

**Where to Check:** Railway/Vercel Billing Dashboard

- [ ] **Infrastructure Costs**
  - Database usage within budget
  - API compute hours tracking
  - Bandwidth usage normal
  - No unexpected spikes

- [ ] **External Services**
  - Stripe transaction fees
  - Resend email credits
  - Twilio SMS usage
  - S3 storage (if enabled)

---

## 🚨 Alert Thresholds

### Critical (Immediate Response Required)

| Metric        | Threshold | Response Time |
| ------------- | --------- | ------------- |
| Service Down  | > 1 min   | < 5 min       |
| Error Rate    | > 10%     | < 10 min      |
| Database Down | Any       | < 5 min       |
| CPU Usage     | > 95%     | < 15 min      |
| Memory Usage  | > 95%     | < 15 min      |

### High (Response Within 1 Hour)

| Metric          | Threshold | Response Time |
| --------------- | --------- | ------------- |
| Error Rate      | > 5%      | < 1 hour      |
| Response Time   | p95 > 2s  | < 1 hour      |
| Failed Payments | > 10%     | < 1 hour      |
| Email Delivery  | < 90%     | < 1 hour      |

### Medium (Response Within 4 Hours)

| Metric         | Threshold | Response Time |
| -------------- | --------- | ------------- |
| Error Rate     | > 2%      | < 4 hours     |
| Slow Queries   | p95 > 1s  | < 4 hours     |
| CSP Violations | > 10/hour | < 4 hours     |

---

## 📞 Incident Response

### When Alerts Fire

1. **Acknowledge Alert**
   - Mark alert as acknowledged in monitoring system
   - Notify team via Slack/email

2. **Assess Impact**

   ```bash
   # Quick health check
   curl https://api.yourdomain.com/health

   # Check recent errors in Sentry
   # Check Railway/Vercel logs

   # Check database
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Immediate Actions**
   - If service is down → Check deployment status
   - If high error rate → Review recent code changes
   - If database issues → Check connection pool
   - If external service failing → Check status page

4. **Rollback If Necessary**

   ```bash
   # See: docs/operations/runbooks/ROLLBACK.md
   gh deployment rollback
   ```

5. **Document Incident**
   - Create incident report
   - Document root cause
   - Create follow-up tasks
   - **Template:** [incident-report-template.md](../templates/incident-report-template.md)

---

## 🔍 Useful Commands

### Check Deployment Status

```bash
# Vercel
vercel inspect <deployment-url>

# Railway
railway status

# Check latest deployment
gh deployment list
```

### View Logs

```bash
# Railway
railway logs --tail 100

# Vercel (Web)
vercel logs <deployment-url> --follow

# Docker (local testing)
docker logs brisa-api --tail 100 -f
```

### Database Queries

```bash
# Connect to production database (USE WITH CAUTION)
psql $DATABASE_URL

# Common queries
# Active connections
SELECT COUNT(*) FROM pg_stat_activity;

# Slow queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

# Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📈 Success Metrics

### First 24 Hours - Expected Performance

| Metric                  | Expected Value |
| ----------------------- | -------------- |
| Uptime                  | > 99.5%        |
| Error Rate              | < 1%           |
| API Response Time (p95) | < 500ms        |
| Database Queries (p95)  | < 100ms        |
| Successful Logins       | > 95%          |
| Payment Success Rate    | > 95%          |
| Email Delivery Rate     | > 98%          |

### If Metrics Are Not Met

1. **< 99.5% Uptime**
   - Review crash logs
   - Check resource utilization
   - Consider scaling up

2. **> 1% Error Rate**
   - Investigate top errors in Sentry
   - Check for configuration issues
   - Review recent code changes

3. **Slow API Response**
   - Enable database query logging
   - Check for N+1 queries
   - Review connection pool config
   - Consider adding Redis caching

---

## 🎓 Post-Mortem Checklist

After First Week, Review:

- [ ] All alerts were actionable
- [ ] No false positives in monitoring
- [ ] Response times met SLAs
- [ ] Error budgets not exceeded
- [ ] Costs within projections
- [ ] Team comfortable with runbooks
- [ ] Incident response process validated

**Schedule:** Post-Mortem Meeting within 7 days of launch

---

## 🔗 Related Documentation

- [Incident Response Runbook](../runbooks/INCIDENT_RESPONSE.md)
- [Rollback Procedures](../runbooks/ROLLBACK.md)
- [On-Call Handbook](../runbooks/ON_CALL_HANDBOOK.md)
- [Sentry Setup](SENTRY_SETUP.md)
- [Performance Optimization](../../for-developers/phase4-enterprise-grade.md)

---

## 📱 Notification Channels

### Slack Alerts

```yaml
# Critical: #incidents (tag @here)
# High: #alerts
# Medium: #monitoring
# Info: #deployments
```

### Email Alerts

- Critical → On-call engineer + team lead
- High → On-call engineer
- Medium → Team distribution list

### SMS/Phone (PagerDuty)

- Only for CRITICAL incidents
- Service down > 5 minutes
- Error rate > 15%
- Database unavailable

---

**Remember:** The first 48 hours are critical. Stay vigilant but don't panic. Most issues are configuration-related and easily fixed.

🚀 **Happy Monitoring!**

---

_Last updated: 2025-10-07 by Claude Code_
