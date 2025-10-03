# Security Policy

> **Brisa Cubana Clean Intelligence** - Production-Grade Security Framework
> **Last Updated:** October 2, 2025
> **Version:** 2.0

---

## 🔒 Vulnerability Reporting

### Responsible Disclosure Process

If you discover a security vulnerability in Brisa Cubana Clean Intelligence:

1. **DO NOT** publish the vulnerability publicly
2. **Email:** security@brisacubanaclean.com (PGP key available on request)
3. **Include:**
   - Detailed description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if known)
4. **Response Time:** Security team responds within **1 business day**
5. **Coordinated Disclosure:** We will work with you to establish a disclosure timeline

### Bug Bounty Program

We recognize security researchers who responsibly disclose vulnerabilities:

- **Critical:** $500 - $2,000
- **High:** $200 - $500
- **Medium:** $50 - $200
- **Low:** Public recognition

**Eligibility:** First to report, responsible disclosure, actionable findings.

---

## 🛡️ Security Policies

### Data Protection

- **Zero Tolerance** for personal data leaks (GDPR, CCPA compliance)
- **Encryption at Rest:** AES-256 for sensitive data
- **Encryption in Transit:** TLS 1.2+ (HSTS enforced)
- **Data Retention:** 90 days for logs, 7 years for financial records
- **Access Control:** Role-based (CLIENT, STAFF, ADMIN) with least privilege

### Authentication & Authorization

- **Password Storage:** bcrypt with 12 rounds (cost factor)
- **Session Management:** JWT tokens with 8-hour expiration
- **Secret Rotation:** Automated 90-day rotation for API keys
- **MFA:** Optional for users, mandatory for ADMIN role
- **OAuth 2.0:** NextAuth v5 with secure session handling

### Patch Management

- **Critical Vulnerabilities:** Patched and deployed within **72 hours**
- **High Severity:** Patched within **7 days**
- **Medium/Low:** Included in next scheduled release
- **Zero-Day:** Emergency rollout process (see `docs/operations/runbooks/INCIDENT_RESPONSE.md`)

### Security Audits

- **Quarterly:** Internal security audit by Platform Engineering
- **Annual:** Third-party penetration testing
- **Continuous:** Automated security scanning in CI/CD
  - Dependency scanning (Snyk)
  - Container scanning (Trivy)
  - SAST (CodeQL)
  - Secret detection (TruffleHog)

### Chaos Testing & Resilience

- **Monthly:** Chaos engineering exercises (Chaos Monkey)
- **Disaster Recovery:** Tested quarterly (RTO: 4h, RPO: 15 min)
- **Incident Response:** 24/7 on-call rotation (PagerDuty)

---

## 🔐 Supply Chain Security

### Software Bill of Materials (SBOM)

We publish SBOMs for all container images:

- **Format:** SPDX 2.3 and CycloneDX 1.6
- **Generation:** Syft (Anchore) in CI/CD pipeline
- **Location:** GitHub Releases and Container Registry
- **Verification:** SBOM integrity validated with SHA256 checksums

**Download SBOMs:**

```bash
# Download latest SBOM
curl -L https://github.com/albertodimas/brisa-cubana-clean-intelligence/releases/latest/download/api-sbom.spdx.json
curl -L https://github.com/albertodimas/brisa-cubana-clean-intelligence/releases/latest/download/web-sbom.spdx.json
```

### Image Signing & Verification

All production images are signed with **Sigstore Cosign** (keyless signing):

- **Signing Certificate:** Ephemeral keys via GitHub OIDC
- **Transparency Log:** Public Rekor ledger
- **Verification:** Required before deployment

**Verify Image Signature:**

```bash
export COSIGN_EXPERIMENTAL=1
cosign verify ghcr.io/albertodimas/brisa-cubana-clean-intelligence/api:latest \
  --certificate-identity-regexp="https://github.com/albertodimas/brisa-cubana-clean-intelligence" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

### Dependency Management

- **Automated Updates:** Dependabot daily scans
- **Pinned Versions:** All dependencies locked in `pnpm-lock.yaml`
- **Vulnerability Scanning:** Snyk + GitHub Security Advisories
- **Supply Chain Attacks:** Provenance attestations via SLSA framework (planned)

### Base Image Security

- **Distroless Images:** Minimal attack surface (no shell, no package manager)
- **Non-Root User:** All containers run as UID 65532 `nonroot`
- **Read-Only Filesystem:** Enforced by distroless + security context
- **Regular Updates:** Base images rebuilt weekly for security patches

---

## 🚨 Incident Response

### Severity Levels

| Severity | Impact                                 | Response Time  | Examples                                  |
| -------- | -------------------------------------- | -------------- | ----------------------------------------- |
| **Sev1** | Critical - service down or data breach | **5 minutes**  | Database compromised, payment system down |
| **Sev2** | Major - degraded service               | **15 minutes** | Elevated error rate, partial outage       |
| **Sev3** | Minor - limited impact                 | **1 hour**     | Non-critical feature broken               |

### Emergency Contact

- **Email:** security@brisacubanaclean.com
- **Phone:** +1 (786) 796-2201 (24/7 emergency hotline)
- **PagerDuty:** https://brisacubana.pagerduty.com
- **Slack:** `#security-incidents` (internal)

### Incident Process

1. **Detection:** Automated alerts or manual report
2. **Triage:** Security team assesses severity (< 15 min)
3. **Containment:** Isolate affected systems
4. **Eradication:** Remove threat, patch vulnerability
5. **Recovery:** Restore services, verify integrity
6. **Post-Mortem:** Root cause analysis within 48 hours

**Full Incident Response Runbook:** `docs/operations/runbooks/INCIDENT_RESPONSE.md`

---

## 🔍 Security Scanning (CI/CD)

Every code change triggers automated security checks:

### GitHub Actions Workflows

- **Secret Detection:** TruffleHog OSS (verified secrets only)
- **SAST:** CodeQL (security-and-quality query suite)
- **Dependency Scan:** Snyk (fails on critical/high vulnerabilities)
- **Container Scan:** Trivy (OS + app vulnerabilities)
- **Policy Checks:** OPA/Conftest (Dockerfile best practices)
- **SBOM Generation:** Syft (SPDX + CycloneDX)
- **Image Signing:** Cosign keyless signing

**Workflow:** `.github/workflows/security-scan.yml`

### Security Gates

Deployments are **blocked** if:

- ❌ Critical/High vulnerabilities detected
- ❌ Secrets found in code
- ❌ Policy violations (e.g., running as root)
- ❌ SBOM generation fails
- ❌ Image signature verification fails

---

## 📊 Security Metrics

We track and report:

| Metric                        | Target           | Actual (Last 30d) |
| ----------------------------- | ---------------- | ----------------- |
| **Mean Time to Patch (MTTP)** | < 72h (critical) | \_\_\_ h          |
| **Vulnerability Density**     | < 0.5 per 1K LoC | \_\_\_            |
| **Secret Leaks Detected**     | 0                | \_\_\_            |
| **Security Incidents**        | 0 (Sev1/Sev2)    | \_\_\_            |
| **SBOM Coverage**             | 100%             | \_\_\_%           |
| **Image Signing**             | 100%             | \_\_\_%           |

---

## 🏆 Compliance & Standards

- **OWASP Top 10:** Addressed in design and testing
- **CIS Docker Benchmark:** Dockerfiles comply with Level 1
- **NIST Cybersecurity Framework:** Aligned with Identify, Protect, Detect, Respond, Recover
- **SLSA Level 2:** Build provenance (in progress, target: Level 3)
- **GDPR/CCPA:** Personal data protection, right to deletion
- **PCI-DSS:** Payment card data handled by Stripe (PCI-compliant processor)

---

## 📚 Security Resources

- **Runbooks:** `docs/operations/runbooks/` (incident response, rollback, go-live)
- **Architecture:** `docs/for-developers/architecture.md` (security design decisions)
- **Infrastructure:** `infra/README.md` (IaC, secrets management)
- **API Security:** `apps/api/README.md` (authentication, rate limiting)
- **OWASP:** https://owasp.org/www-project-top-ten/

---

## 🔄 Policy Updates

This security policy is reviewed and updated:

- **Quarterly:** Routine review by Security Team
- **Post-Incident:** After any Sev1/Sev2 security incident
- **Regulatory Changes:** When new compliance requirements emerge

**Next Review:** January 2, 2026

---

## ✍️ Acknowledgments

We thank the following researchers for responsible disclosure:

- (No vulnerabilities reported yet - be the first!)

---

**Security Team Contact:** security@brisacubanaclean.com

**Maintained By:** Platform Engineering & Security Team

**Last Updated:** October 2, 2025
