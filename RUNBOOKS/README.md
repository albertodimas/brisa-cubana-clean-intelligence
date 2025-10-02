# 📚 RUNBOOKS

> **Operational Procedures for Production Systems**
> **Owner:** Platform Engineering Team
> **Last Updated:** October 2, 2025

---

## 🎯 Purpose

These runbooks provide step-by-step procedures for operating Brisa Cubana Clean Intelligence in production. Every engineer on-call should be familiar with these documents.

---

## 📖 Available Runbooks

| Runbook                                                             | When to Use                                 | Estimated Duration       |
| ------------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| **[Operational Readiness Review](OPERATIONAL_READINESS_REVIEW.md)** | Before every major release (mandatory gate) | 2-4 hours (review)       |
| **[Go-Live](GO_LIVE.md)**                                           | Production deployment procedure             | 60-90 minutes            |
| **[Rollback](ROLLBACK.md)**                                         | Emergency rollback when deployment fails    | 10-20 minutes            |
| **[Incident Response](INCIDENT_RESPONSE.md)**                       | Sev1/Sev2/Sev3 incident management          | Varies (5 min - 4 hours) |

---

## 🚨 Quick Reference: What to Do When

### 🔴 Site is Down (Sev1)

1. **Acknowledge PagerDuty** (< 5 min)
2. **Declare incident** in Slack `#incidents`
3. **Follow:** [Incident Response](INCIDENT_RESPONSE.md)
4. **If recent deployment:** [Rollback](ROLLBACK.md)
5. **Update status page** every 10 min

### 🟡 Performance Degraded (Sev2)

1. **Check monitoring dashboards** (Grafana, CloudWatch)
2. **Identify affected component** (API, Web, Database)
3. **Follow:** [Incident Response](INCIDENT_RESPONSE.md)
4. **Consider rollback** if deployment-related

### 🟢 Deploying to Production

1. **Complete:** [Operational Readiness Review](OPERATIONAL_READINESS_REVIEW.md)
2. **Schedule deployment window** (Tue/Wed 10 AM EDT)
3. **Follow:** [Go-Live](GO_LIVE.md)
4. **Monitor for 72h** (hypercare period)

### 🔵 Need to Rollback

1. **Declare rollback** in Slack `#incidents`
2. **Follow:** [Rollback](ROLLBACK.md)
3. **Verify services healthy** after rollback
4. **Schedule post-mortem** (within 48h)

---

## 📞 On-Call Resources

### Escalation Path

1. **Primary On-Call** (PagerDuty auto-page)
2. **Secondary On-Call** (if no response in 5 min)
3. **Engineering Manager** (if no response in 15 min)
4. **CTO** (Sev1 only, critical escalation)

### Key Contacts

- **Slack Channels:**
  - `#incidents` - Active incident coordination
  - `#deployments` - Deployment announcements
  - `#on-call` - On-call questions/handoffs

- **External Services:**
  - **PagerDuty:** https://brisacubana.pagerduty.com
  - **Status Page:** https://status.brisacubana.com
  - **Monitoring:** https://grafana.brisacubana.com

### Useful Commands

```bash
# Check production health
curl https://api.brisacubana.com/healthz
curl https://brisacubana.com

# Railway logs (last 1 hour)
railway logs --service "@brisa/api" --since "1 hour ago"

# Vercel logs (real-time)
vercel logs --follow --token=$VERCEL_TOKEN

# Database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Rollback Railway
railway rollback --service "@brisa/api"

# Rollback Vercel
vercel promote <previous_deployment_url> --token=$VERCEL_TOKEN
```

---

## 🔄 Runbook Maintenance

### Review Schedule

- **Monthly:** Review incident response contacts, escalation policies
- **Quarterly:** Full runbook review with on-call team
- **After Incidents:** Update runbooks with lessons learned

### Update Process

1. **Propose changes** via Pull Request
2. **Review with SRE team** (2 approvals required)
3. **Test procedures** in staging environment
4. **Merge and announce** in `#deployments`
5. **Update version number** and "Last Updated" date

---

## 📊 Runbook Effectiveness Metrics

Track these to improve runbooks:

| Metric                       | Target               | Actual (Last 30d) |
| ---------------------------- | -------------------- | ----------------- |
| **Runbook Usage Rate**       | 100% for Sev1/Sev2   | \_\_\_%           |
| **Time to First Action**     | < 2 min              | \_\_\_ min        |
| **Incident Resolution Time** | < 30 min (Sev1)      | \_\_\_ min        |
| **Runbook Update Frequency** | At least 1/quarter   | \_\_\_ updates    |
| **Post-Mortem Action Items** | 90% completed in 30d | \_\_\_%           |

---

## 🛠️ Tools & Access

### Required Tools

- **Railway CLI:** `npm install -g @railway/cli`
- **Vercel CLI:** `npm install -g vercel`
- **PostgreSQL Client:** `psql` (via `postgresql-client`)
- **kubectl:** `brew install kubectl` (for future K8s migration)
- **jq:** `brew install jq` (JSON parsing)

### Required Access

Ensure your account has access to:

- [ ] **GitHub Repository** (write access for rollbacks)
- [ ] **Railway Production Environment** (deploy/rollback permissions)
- [ ] **Vercel Production Project** (deploy/rollback permissions)
- [ ] **PostgreSQL Database** (read-only for troubleshooting)
- [ ] **PagerDuty** (incident management)
- [ ] **Slack** (`#incidents`, `#deployments`, `#on-call`)
- [ ] **Grafana/CloudWatch** (monitoring dashboards)
- [ ] **Status Page Admin** (customer communication)

**Request access:** Slack `#platform-team` or email `platform@brisacubana.com`

---

## 📚 Additional Resources

- **Architecture Docs:** [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Infrastructure as Code:** [infra/README.md](../infra/README.md)
- **API Documentation:** [apps/api/API_ENDPOINTS.md](../apps/api/API_ENDPOINTS.md)
- **Testing Guide:** [docs/for-developers/testing.md](../docs/for-developers/testing.md)
- **Observability:** [apps/api/OBSERVABILITY.md](../apps/api/OBSERVABILITY.md)

---

## ✍️ Contributing

Found a gap or improvement? Submit a PR!

1. Fork the repo
2. Create branch: `git checkout -b runbook/improve-rollback`
3. Make changes to runbook
4. Test procedure in staging
5. Submit PR with description of changes
6. Tag `#platform-team` for review

---

**Last Reviewed:** October 2, 2025

**Next Review:** January 2, 2026 (quarterly)

**Maintained By:** Platform Engineering Team
