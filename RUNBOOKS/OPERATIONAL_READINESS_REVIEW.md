# ✅ OPERATIONAL READINESS REVIEW (ORR)

> **Pre-Production Gate for Major Releases**
> **Version:** 1.0
> **Last Updated:** October 2, 2025

---

## 🎯 Purpose

The Operational Readiness Review (ORR) is a **mandatory gate** before any production deployment that:

- Introduces new critical features
- Changes infrastructure
- Modifies database schema (expand/contract migrations)
- Touches payment processing or security

**DO NOT deploy to production without completing this checklist.**

---

## 📋 ORR Checklist

### 1. Code Quality ✅

- [ ] **All CI checks passing** (lint, typecheck, unit tests, E2E tests)
- [ ] **Code coverage ≥ 75%** (lines), ≥ 70% (functions/branches)
- [ ] **No critical security vulnerabilities** (Snyk, Trivy, CodeQL clean)
- [ ] **No secrets in code** (TruffleHog scan passed)
- [ ] **Peer review completed** (at least 2 approvals for production changes)
- [ ] **CHANGELOG.md updated** with release notes

### 2. Testing ✅

- [ ] **Unit tests passing** (171 tests, ~7s)
- [ ] **Integration tests passing** (API contracts, database interactions)
- [ ] **E2E tests passing** (15 tests, 100% success rate)
- [ ] **Load tests completed** on staging (target: 1000 req/min sustained 30 min)
- [ ] **Soak tests completed** (24h run at 50% peak load, no memory leaks)
- [ ] **Smoke tests documented** (critical user flows: login, booking, payment)

### 3. Infrastructure & Build ✅

- [ ] **Terraform IaC reviewed** (infrastructure matches documented state)
- [ ] **Docker images built** with multi-stage, non-root user, distroless base
- [ ] **SBOM generated** (Syft output attached)
- [ ] **Image signed** (Cosign/Sigstore attestation)
- [ ] **Health checks implemented** (liveness, readiness, startup)
- [ ] **Resource limits configured** (CPU, memory requests/limits)

### 4. Database ✅

- [ ] **Migrations tested** on staging (expand/contract pattern verified)
- [ ] **Backfill scripts reviewed** (idempotent, reversible)
- [ ] **Backup verified** (restore test completed within 7 days)
- [ ] **Index performance validated** (no full table scans on large tables)
- [ ] **Connection pooling configured** (max connections, timeouts)
- [ ] **Rollback plan documented** (can revert schema if needed)

### 5. Observability ✅

- [ ] **Structured logging enabled** (JSON format, correlation IDs)
- [ ] **Metrics instrumented** (Prometheus/OpenTelemetry)
  - Request rate, error rate, duration (RED metrics)
  - CPU, memory, disk, network (USE metrics)
- [ ] **Distributed tracing configured** (Jaeger/Zipkin/Honeycomb)
- [ ] **Dashboards created** (Grafana/CloudWatch with SLOs)
- [ ] **Alerts configured** (error rate, latency, database, payment failures)
- [ ] **Alert routing tested** (PagerDuty, Slack notifications work)

### 6. Security ✅

- [ ] **HTTPS/TLS configured** (TLS 1.2+ with valid certs)
- [ ] **Security headers enabled** (CSP, HSTS, X-Frame-Options, etc.)
- [ ] **WAF enabled** (rate limiting, bot protection, IP blocking)
- [ ] **Secrets management** (KMS/Vault, no hardcoded secrets)
- [ ] **Secret rotation plan** (90-day rotation documented)
- [ ] **SAST/DAST scans completed** (no critical findings)
- [ ] **Dependency scanning** (Snyk/Dependabot, no critical CVEs)
- [ ] **SBOM published** (supply chain transparency)

### 7. Deployment Strategy ✅

- [ ] **Blue/Green or Canary configured** (not just rolling restart)
- [ ] **Deployment automation tested** (CI/CD pipeline end-to-end)
- [ ] **Canary analysis rules defined** (error rate, latency thresholds)
- [ ] **Feature flags ready** (defaults to safe values, gradual rollout plan)
- [ ] **Rollback plan documented** (see `ROLLBACK.md`)
- [ ] **Deployment window scheduled** (Tuesday/Wednesday 10 AM – 12 PM EDT)

### 8. Runbooks & Documentation ✅

- [ ] **Go-Live runbook updated** (see `GO_LIVE.md`)
- [ ] **Rollback runbook updated** (see `ROLLBACK.md`)
- [ ] **Incident response plan reviewed** (see `INCIDENT_RESPONSE.md`)
- [ ] **Architecture diagrams current** (system, data flow, deployment)
- [ ] **API documentation updated** (OpenAPI/Swagger, examples)
- [ ] **Disaster recovery plan** (RTO/RPO defined, tested)

### 9. Operational Preparedness ✅

- [ ] **On-call schedule confirmed** (primary + secondary engineers)
- [ ] **PagerDuty/Slack tested** (escalation policies work)
- [ ] **Status page configured** (status.brisacubana.com, API integrated)
- [ ] **Communication plan ready** (customer email templates, Twitter drafts)
- [ ] **Support team trained** (new features, known issues, troubleshooting)
- [ ] **Hypercare plan defined** (72h monitoring, escalation triggers)

### 10. Business Continuity ✅

- [ ] **SLOs defined** (availability, latency, error rate targets)
- [ ] **Error budget calculated** (monthly allowance, current consumption)
- [ ] **Cost estimate reviewed** (FinOps projection vs budget)
- [ ] **Capacity planning done** (traffic projections, scaling triggers)
- [ ] **Legal/compliance approved** (GDPR, CCPA, PCI-DSS if applicable)
- [ ] **Stakeholder signoff** (product, engineering, exec team)

---

## 📊 ORR Scoring

| Category       | Weight   | Score (0-10) | Weighted       |
| -------------- | -------- | ------------ | -------------- |
| Code Quality   | 15%      | \_\_\_       | \_\_\_         |
| Testing        | 15%      | \_\_\_       | \_\_\_         |
| Infrastructure | 10%      | \_\_\_       | \_\_\_         |
| Database       | 10%      | \_\_\_       | \_\_\_         |
| Observability  | 15%      | \_\_\_       | \_\_\_         |
| Security       | 15%      | \_\_\_       | \_\_\_         |
| Deployment     | 10%      | \_\_\_       | \_\_\_         |
| Documentation  | 5%       | \_\_\_       | \_\_\_         |
| Operations     | 5%       | \_\_\_       | \_\_\_         |
| Business       | 5%       | \_\_\_       | \_\_\_         |
| **TOTAL**      | **100%** | **\_\_\_**   | **\_\_\_/100** |

**Minimum Score to Proceed:** 80/100

**Score Interpretation:**

- **90-100:** Excellent - proceed with confidence
- **80-89:** Good - minor gaps, proceed with caution
- **70-79:** Needs improvement - delay deployment, address gaps
- **<70:** Not ready - significant work required

---

## 🚦 Go/No-Go Decision

**Date:** ****\_\_****
**Reviewed By:** ****\_\_****

| Criteria                             | Status       | Notes             |
| ------------------------------------ | ------------ | ----------------- |
| **ORR Score ≥ 80**                   | ☐ GO ☐ NO-GO | Score: \_\_\_     |
| **No Sev1/Sev2 Incidents (Last 7d)** | ☐ GO ☐ NO-GO | Incidents: \_\_\_ |
| **Error Budget Available**           | ☐ GO ☐ NO-GO | Budget: \_\_\_%   |
| **Deployment Window Confirmed**      | ☐ GO ☐ NO-GO | Date/Time: \_\_\_ |
| **Rollback Plan Approved**           | ☐ GO ☐ NO-GO | Reviewer: \_\_\_  |
| **Stakeholder Signoff**              | ☐ GO ☐ NO-GO | Approvals: \_\_\_ |

**Final Decision:**

☐ **GO** - Approved for production deployment

☐ **NO-GO** - Deployment blocked (reason: ********\_\_********)

---

## 📝 Sign-Off

| Role                   | Name | Signature      | Date     |
| ---------------------- | ---- | -------------- | -------- |
| **Engineering Lead**   | TBD  | ****\_\_\_**** | \_\_\_\_ |
| **SRE Lead**           | TBD  | ****\_\_\_**** | \_\_\_\_ |
| **Security Lead**      | TBD  | ****\_\_\_**** | \_\_\_\_ |
| **Product Owner**      | TBD  | ****\_\_\_**** | \_\_\_\_ |
| **CTO/VP Engineering** | TBD  | ****\_\_\_**** | \_\_\_\_ |

---

## 🔍 Common Gaps & Remediation

### Gap: Load tests not run

**Risk:** Unknown performance under production traffic
**Remediation:** Run k6/Gatling against staging (1000 req/min, 30 min)
**Timeline:** 1 day

### Gap: Rollback plan incomplete

**Risk:** Prolonged incident recovery time
**Remediation:** Document step-by-step rollback in `ROLLBACK.md`
**Timeline:** 2 hours

### Gap: No canary deployment configured

**Risk:** Full traffic exposure to bugs
**Remediation:** Configure 10% canary with automated analysis
**Timeline:** 1 day

### Gap: Missing database backup

**Risk:** Data loss if migration fails
**Remediation:** Trigger manual backup, verify restore
**Timeline:** 1 hour

### Gap: Security scan has critical CVE

**Risk:** Exploitable vulnerability in production
**Remediation:** Upgrade dependency, re-scan
**Timeline:** 4 hours

---

## 📚 References

- **Go-Live Runbook:** `GO_LIVE.md`
- **Rollback Runbook:** `ROLLBACK.md`
- **Incident Response:** `INCIDENT_RESPONSE.md`
- **Load Testing Guide:** `docs/for-developers/load-testing.md`
- **Security Standards:** `SECURITY.md`

---

**ORR Conducted By:** **********\_********** **Date:** ****\_\_****

**Next ORR Scheduled:** **********\_********** (for next major release)
