# Production Runbook

> **Last Updated**: 2025-10-02 | **Status**: Ready for Production
>
> Operational playbook for production deployment, monitoring, and incident response.

---

## Table of Contents

1. Pre-Deployment Checklist
2. Environment Configuration
3. Deployment Procedures
4. Health Checks and Monitoring
5. Incident Response
6. Rollback Procedures
7. Performance Optimization
8. Security Hardening

---

## 🚀 Pre-Deployment Checklist

### Code Quality Gates

- [ ] All tests passing: `pnpm test` (171 tests)
- [ ] E2E tests green: `pnpm test:e2e` (15 tests)
- [ ] Type checking clean: `pnpm typecheck`
- [ ] Linting clean: `pnpm lint`
- [ ] Code coverage ≥75%: `pnpm test:coverage`
- [ ] Build successful: `pnpm build`

### Security Review

- [ ] No secrets in code/commits (run: `git secrets --scan-history`)
- [ ] `.env.example` updated with all required variables
- [ ] Railway production secrets configured
- [ ] Vercel production secrets configured
- [ ] Database connection pooling optimized
- [ ] Rate limiting enabled (API endpoints)
- [ ] CORS allowlist configured (production domains only)
- [ ] Security headers active (CSP, HSTS, X-Frame-Options)

### Infrastructure

- [ ] PostgreSQL database provisioned (Railway)
- [ ] Redis instance provisioned (Railway, optional)
- [ ] Stripe webhooks configured with production endpoint
- [ ] Sentry DSN configured for error tracking
- [ ] Vercel Analytics enabled
- [ ] Domain DNS configured (A/CNAME records)
- [ ] SSL certificates valid (auto via Vercel/Railway)

### Compliance

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] GDPR consent flows implemented (if applicable)
- [ ] Backup strategy defined (see below)
- [ ] Incident response plan documented

---

## 🔐 Environment Configuration

### Railway (API Backend)

**Required Secrets**:

```bash
# Database (PostgreSQL with connection pooling)
DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=5&pool_timeout=10"

# Authentication
JWT_SECRET="64-char-hex-value"  # Generate: openssl rand -hex 64

# Stripe (Production Keys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_SUCCESS_URL="https://brisacubana.com/dashboard?payment=success"
STRIPE_CANCEL_URL="https://brisacubana.com/dashboard?payment=cancelled"

# Email (Resend Production)
RESEND_API_KEY="re_live_..."
EMAIL_FROM="noreply@brisacubana.com"

# AI Features (Optional)
OPENAI_API_KEY="sk-proj-..."

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."
LOG_LEVEL="info"  # Avoid "debug" in prod

# Alerting
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/services/..."

# Environment
NODE_ENV="production"
WEB_APP_URL="https://brisacubana.com"
```

**Set via Railway CLI**:

```bash
railway login
railway link
railway variables set JWT_SECRET="$(openssl rand -hex 64)"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
# ... repeat for all secrets
```

### Vercel (Web Frontend)

**Required Secrets**:

```bash
# API Connection
NEXT_PUBLIC_API_URL="https://api.brisacubana.com"
NEXT_PUBLIC_APP_URL="https://brisacubana.com"

# Authentication (NextAuth.js)
NEXTAUTH_URL="https://brisacubana.com"
NEXTAUTH_SECRET="base64-secret-32-chars"  # Generate: openssl rand -base64 32

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ENVIRONMENT="production"
VERCEL_ANALYTICS_ID="proj_..."

# Stripe (Public Key)
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Feature Flags (Optional)
ENABLE_AI_CONCIERGE="true"
ENABLE_CLEANSCORE="true"
```

**Set via Vercel CLI**:

```bash
vercel env add NEXTAUTH_SECRET production
# Enter value when prompted
```

**Or via GitHub Secrets** (CI/CD auto-deployment):

```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

---

## 🚢 Deployment Procedures

### Automated Deployment (Recommended)

**Main Branch → Production**:

```bash
git checkout main
git pull origin main
# Merge feature branch via PR
git push origin main
# GitHub Actions auto-deploys to Railway + Vercel
```

**Workflow**: `.github/workflows/deploy-production.yml`

- ✅ Lint, typecheck, test, build
- ✅ Deploy API to Railway (`@brisa/api` service)
- ✅ Deploy Web to Vercel (`apps/web`)
- ✅ Slack notification on success/failure

### Manual Deployment (Emergency)

**Railway API**:

```bash
railway login
railway link
cd apps/api
railway up --service @brisa/api
```

**Vercel Web**:

```bash
vercel login
cd apps/web
vercel --prod
```

### Database Migrations

**Production migrations** (Railway):

```bash
# Never use db:push in production! Use migrations.
export DATABASE_URL="postgresql://..."  # Get from Railway dashboard
cd apps/api

# Create migration (local)
pnpm db:migrate

# Apply to production (via Railway CLI)
railway run pnpm --filter=@brisa/api db:migrate deploy
```

**Alternative**: Add migration to CI/CD before deployment.

---

## 🩺 Health Checks and Monitoring

### Health Endpoints

| Endpoint       | Description                | Expected Response                                                 |
| -------------- | -------------------------- | ----------------------------------------------------------------- |
| `GET /health`  | Comprehensive health check | `{"status": "healthy", "uptime": 123, "db": "ok", "redis": "ok"}` |
| `GET /healthz` | Simple liveness probe      | `{"ok": true}`                                                    |
| `GET /metrics` | Prometheus metrics         | Plain text metrics                                                |
| `GET /`        | API info                   | `{"service": "Brisa Cubana...", "status": "ok"}`                  |

### Automated Monitoring

**Railway**: Built-in metrics (CPU, memory, network)

- Dashboard: https://railway.app/project/{id}/service/{id}/metrics

**Vercel**: Analytics + Real User Monitoring (RUM)

- Dashboard: https://vercel.com/{org}/{project}/analytics

**Sentry**: Error tracking and performance monitoring

- DSN configured in both API and Web
- Alerts for error spikes and performance degradation

### Manual Health Check Commands

```bash
# API health
curl https://api.brisacubana.com/health

# Web health (should return 200)
curl -I https://brisacubana.com

# Database connectivity (via Railway CLI)
railway run --service @brisa/api pnpm prisma db execute --stdin < /dev/null
```

### Key Performance Indicators (KPIs)

| Metric                             | Target  | Critical Threshold |
| ---------------------------------- | ------- | ------------------ |
| API Response Time (p95)            | < 300ms | > 1s               |
| Web FCP (First Contentful Paint)   | < 1.8s  | > 3s               |
| Web LCP (Largest Contentful Paint) | < 2.5s  | > 4s               |
| Error Rate                         | < 0.5%  | > 2%               |
| Database Connection Pool Usage     | < 80%   | > 95%              |
| Uptime (monthly)                   | > 99.5% | < 99%              |

---

## 🚨 Incident Response

### Severity Levels

| Level  | Description                               | Response Time        |
| ------ | ----------------------------------------- | -------------------- |
| **P0** | Complete service outage, data loss        | Immediate (< 15 min) |
| **P1** | Major feature broken, security breach     | < 1 hour             |
| **P2** | Minor feature degraded, performance issue | < 4 hours            |
| **P3** | Cosmetic bug, documentation issue         | < 24 hours           |

### On-Call Procedures

1. **Acknowledge**: Respond in Slack/PagerDuty within SLA
2. **Assess**: Check health endpoints, Sentry, Railway/Vercel dashboards
3. **Triage**: Determine severity (P0-P3)
4. **Mitigate**: Apply hotfix or rollback (see below)
5. **Communicate**: Update status page (if applicable) and stakeholders
6. **Post-Mortem**: Document root cause, timeline, and prevention (within 48h)

### Common Issues & Solutions

#### 1. API Returns 500 Errors

**Symptoms**: Sentry shows spikes in `INTERNAL_ERROR`

**Diagnosis**:

```bash
railway logs --service @brisa/api | tail -100
```

**Common Causes**:

- Database connection exhausted → Check pool usage
- JWT_SECRET misconfigured → Verify Railway secrets
- External API timeout (Stripe, OpenAI) → Check status pages

**Mitigation**:

- Increase connection pool: `DATABASE_URL=...?connection_limit=10`
- Restart API service: `railway restart --service @brisa/api`
- Rollback to last known good deployment

#### 2. Web App Shows "Failed to Fetch"

**Symptoms**: Next.js pages fail to load API data

**Diagnosis**:

```bash
# Check CORS
curl -H "Origin: https://brisacubana.com" -I https://api.brisacubana.com/health

# Check API health
curl https://api.brisacubana.com/health
```

**Common Causes**:

- CORS misconfigured → Check `app.ts` allowlist
- API domain unreachable → Check Railway deployment status
- Rate limiting too aggressive → Adjust limits

**Mitigation**:

- Update CORS allowlist in `apps/api/src/app.ts`
- Verify `NEXT_PUBLIC_API_URL` in Vercel env vars

#### 3. Database Connection Pool Exhausted

**Symptoms**: Logs show `Can't reach database server`

**Diagnosis**:

```bash
# Check active connections (PostgreSQL)
railway run --service @brisa/api pnpm prisma db execute --stdin <<< "SELECT count(*) FROM pg_stat_activity;"
```

**Mitigation**:

```bash
# Increase pool size (Railway)
railway variables set DATABASE_URL="...?connection_limit=10&pool_timeout=20"
railway restart --service @brisa/api
```

#### 4. Stripe Webhook Failures

**Symptoms**: Payments succeed but booking status not updated

**Diagnosis**:

- Check Stripe Dashboard → Developers → Webhooks → Events
- Look for `400` or `500` responses

**Common Causes**:

- `STRIPE_WEBHOOK_SECRET` mismatch
- API endpoint unreachable

**Mitigation**:

```bash
# Update webhook endpoint in Stripe Dashboard
# Production endpoint: https://api.brisacubana.com/api/payments/webhook

# Verify secret matches Railway env
railway variables get STRIPE_WEBHOOK_SECRET
```

---

## ⏮️ Rollback Procedures

### Quick Rollback (Railway)

```bash
railway login
railway link
railway status  # See deployment history
railway rollback --service @brisa/api
```

### Quick Rollback (Vercel)

```bash
vercel login
vercel list
vercel rollback {deployment-url}
```

### Git-Based Rollback

```bash
# Find last known good commit
git log --oneline -10

# Create revert commit
git revert <bad-commit-sha>
git push origin main
# CI/CD auto-deploys
```

### Database Rollback

**⚠️ DANGEROUS**: Only use if schema change caused issue.

```bash
# List migrations
railway run --service @brisa/api pnpm prisma migrate status

# Rollback last migration (NO OFFICIAL COMMAND - manual only)
# 1. Restore database from backup
# 2. Re-run migrations up to N-1
```

**Best Practice**: Test migrations on staging first, use backups.

---

## ⚡ Performance Optimization

### Database Optimization

**Connection Pooling** (already configured):

```bash
DATABASE_URL="...?connection_limit=5&pool_timeout=10"
```

**Index Monitoring**:

```sql
-- Check slow queries (Railway PostgreSQL)
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

-- Check missing indexes
SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0;
```

**Prisma Query Optimization**:

- Use `select` to limit fields returned
- Use `include` carefully (avoid N+1 queries)
- Add indexes for frequently queried fields

### API Response Time

**Current Middleware Stack** (optimized order):

1. Compression (gzip/deflate)
2. Logging (request ID tracking)
3. Metrics (Prometheus)
4. CORS (production allowlist)
5. Rate limiting (Redis-backed if `RATE_LIMIT_REDIS_URL` set)

**Caching Strategy** (future):

- Add Redis cache for expensive queries
- Implement HTTP cache headers (`Cache-Control`, `ETag`)

### Web Performance

**Next.js 15.5 Optimizations** (already enabled):

- Turbopack builds
- React 19 Server Components
- Automatic code splitting
- Image optimization (`next/image`)

**Vercel Edge Configuration**:

- Enable Edge Functions for API routes (if applicable)
- Configure ISR (Incremental Static Regeneration) for static pages

---

## 🔒 Security Hardening

### Production Security Checklist

- [x] **HTTPS Only**: Enforced via HSTS header (2 years)
- [x] **CSP**: Content Security Policy configured
- [x] **CORS**: Explicit allowlist (no wildcards)
- [x] **Rate Limiting**: 100 req/15min per IP (API)
- [x] **Secrets Management**: All secrets in Railway/Vercel env vars
- [x] **JWT Expiry**: 8 hours (configurable)
- [x] **Password Hashing**: bcrypt with 12 rounds
- [x] **SQL Injection**: Protected via Prisma (parameterized queries)
- [x] **XSS Protection**: React auto-escaping + CSP
- [ ] **WAF**: Consider Cloudflare WAF for DDoS protection (future)
- [ ] **2FA**: Implement for admin accounts (future)

### Security Headers (Next.js)

Already configured in [apps/web/next.config.ts](../../apps/web/next.config.ts):

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

**Reference**: [Next.js Security Checklist](https://blog.arcjet.com/next-js-security-checklist/)

### API Security (Hono)

Already configured in [apps/api/src/app.ts](../../apps/api/src/app.ts):

- **CORS**: Function-based origin validation
- **Rate Limiting**: Distributed (Redis) or in-memory
- **Authentication**: JWT-based with role-based access control (RBAC)
- **Input Validation**: Zod schemas on all endpoints

**Reference**: [Hono Best Practices](https://hono.dev/docs/guides/best-practices)

---

## 📞 Support Contacts

| Role                 | Contact             | Availability   |
| -------------------- | ------------------- | -------------- |
| **On-Call Engineer** | Slack: #engineering | 24/7           |
| **DevOps Lead**      | [email/slack]       | Business hours |
| **Security Lead**    | [email/slack]       | 24/7 for P0/P1 |
| **Business Owner**   | [email/phone]       | Business hours |

---

## 📚 Related Documentation

- [Deployment Guide](./deployment.md)
- [Environment Variables](./environment-variables.md)
- [GitHub Secrets Setup](./github-secrets.md)
- [Rollback Procedures](./rollback-procedures.md)
- [Testing Guide](./testing.md)

---

## 🔄 Changelog

| Date       | Author      | Changes                            |
| ---------- | ----------- | ---------------------------------- |
| 2025-10-02 | Claude (AI) | Initial production runbook created |

---

> 💡 **Tip**: Bookmark this page and keep it updated with real production incidents and resolutions.
