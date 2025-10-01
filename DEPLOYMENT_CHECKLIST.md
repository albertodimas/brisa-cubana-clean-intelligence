# Deployment Checklist - Brisa Cubana Clean Intelligence

✅ **Pre-flight checklist for staging deployment (W4 - Oct 2025)**

---

## ✅ Code Quality (All passing)

- [x] Build completes successfully (`pnpm build`)
- [x] All unit tests passing (66 tests - API)
- [x] Type checking passes (`pnpm typecheck`)
- [x] Linting passes (`pnpm lint`)
- [x] E2E tests created (12 tests - auth, dashboard, booking flow)

## 🗄️ Database Setup (Neon PostgreSQL)

- [ ] Neon project created: `brisa-cubana-staging`
- [ ] Connection string obtained and saved securely
- [ ] Migrations applied: `pnpm prisma migrate deploy`
- [ ] Seed data loaded: `pnpm run seed`
- [ ] Test connection: `psql $DATABASE_URL -c "SELECT version();"`

**Connection String Format:**

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

## 🚂 Railway API Setup

- [ ] Railway project created and connected to GitHub
- [ ] Root directory set to: `apps/api`
- [ ] Build command verified
- [ ] All environment variables configured (see below)
- [ ] Domain generated or custom domain configured
- [ ] Deployment successful
- [ ] Health check passing: `curl https://api-brisa-cubana-staging.up.railway.app/health`

**Required Railway Environment Variables:**

```bash
DATABASE_URL=postgresql://...              # From Neon
JWT_SECRET=                                # Generate: openssl rand -base64 64
NODE_ENV=staging
API_PORT=3001
WEB_APP_URL=https://brisa-cubana-staging.vercel.app
CORS_ORIGIN=https://brisa-cubana-staging.vercel.app

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Optional but recommended
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@brisacubanaclean.com
LOG_LEVEL=debug
ENABLE_RATE_LIMITING=true
```

## ▲ Vercel Web Setup

- [ ] Vercel project created: `brisa-cubana-staging`
- [ ] Project linked to repository
- [ ] Root directory set to: `apps/web`
- [ ] Framework preset: Next.js
- [ ] All environment variables configured (see below)
- [ ] Deployment successful
- [ ] Site accessible: `https://brisa-cubana-staging.vercel.app`

**Required Vercel Environment Variables:**

```bash
# NextAuth
NEXTAUTH_URL=https://brisa-cubana-staging.vercel.app
NEXTAUTH_SECRET=                           # Generate: openssl rand -base64 32
AUTH_SECRET=                               # Same as NEXTAUTH_SECRET

# API Connection
NEXT_PUBLIC_API_URL=https://api-brisa-cubana-staging.up.railway.app
NEXT_PUBLIC_APP_URL=https://brisa-cubana-staging.vercel.app
API_URL=https://api-brisa-cubana-staging.up.railway.app

# Optional
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🔐 GitHub Secrets Configuration

Configure in: `Settings → Secrets and variables → Actions`

### Staging Environment

- [ ] `RAILWAY_STAGING_TOKEN` - Railway API token for staging
- [ ] `VERCEL_TOKEN` - Vercel deployment token
- [ ] `VERCEL_ORG_ID` - Vercel organization ID
- [ ] `VERCEL_PROJECT_ID` - Vercel project ID (staging)

### Production Environment (REQUIRED)

⚠️ **These secrets are MANDATORY before running the production deployment workflow:**

- [ ] `RAILWAY_PRODUCTION_TOKEN` - Railway API token for production
- [ ] `VERCEL_TOKEN` - Vercel deployment token (same as staging)
- [ ] `VERCEL_ORG_ID` - Vercel organization ID (same as staging)
- [ ] `VERCEL_PROJECT_ID` - Vercel project ID for production project
- [ ] `SLACK_WEBHOOK_URL` - Slack webhook for deployment notifications (optional)

> **Note:** The `deploy-production` workflow will skip deployment jobs if required secrets are not configured. The workflow validates secrets before attempting deployment to prevent failures.

**How to obtain:**

```bash
# Railway token
railway login
railway whoami --token

# Vercel credentials
vercel login
cat .vercel/project.json  # After running 'vercel link'

# Slack webhook
# Go to: https://api.slack.com/messaging/webhooks
# Create incoming webhook for your channel
```

## 💳 External Services Configuration

### Stripe Webhook

- [ ] Stripe Dashboard → Developers → Webhooks → Add endpoint
- [ ] Endpoint URL: `https://api-brisa-cubana-staging.up.railway.app/api/payments/webhook`
- [ ] Events selected: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Signing secret copied to Railway: `STRIPE_WEBHOOK_SECRET`
- [ ] Test webhook: `stripe trigger checkout.session.completed`

### Resend Email (Optional)

- [ ] Resend API key created
- [ ] Domain verified (if using custom domain)
- [ ] API key added to Railway: `RESEND_API_KEY`
- [ ] Test email sent

## 🚀 CI/CD GitHub Actions

- [ ] Workflow file exists: `.github/workflows/deploy-staging.yml`
- [ ] Workflow triggers on `develop` branch push
- [ ] All jobs passing:
  - [ ] `lint-and-test`
  - [ ] `deploy-api` (Railway)
  - [ ] `deploy-web` (Vercel)

**Test the workflow:**

```bash
git checkout develop
git merge main
git push origin develop

# Watch: https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions
```

## ✅ Post-Deployment Validation

### API Health Checks

- [ ] Root endpoint: `curl https://api-brisa-cubana-staging.up.railway.app/`
- [ ] Health endpoint: `curl https://api-brisa-cubana-staging.up.railway.app/health`
- [ ] Services endpoint: `curl https://api-brisa-cubana-staging.up.railway.app/api/services`

Expected responses:

```json
// /health
{ "status": "ok", "timestamp": "2025-09-30T...", "version": "0.1.0" }
```

### Web App Checks

- [ ] Homepage loads: `https://brisa-cubana-staging.vercel.app`
- [ ] Sign in page accessible: `/auth/signin`
- [ ] Static assets loading (CSS, images)
- [ ] API connection working (check browser console)

### End-to-End User Journey

- [ ] **Sign Up Flow**
  1. Navigate to `/auth/signin`
  2. Create test account: `test+staging@example.com`
  3. Verify account created in database
  4. Login successful

- [ ] **Property Creation**
  1. Navigate to `/dashboard/properties/new`
  2. Create test property
  3. Property appears in list
  4. Property details page loads

- [ ] **Booking Flow**
  1. Navigate to `/dashboard/bookings/new`
  2. Select property and service
  3. Create booking
  4. Booking appears in dashboard
  5. (Optional) Complete Stripe checkout

- [ ] **Staff Access**
  1. Login as staff user: `staff@brisacubanaclean.com`
  2. Access `/staff` page
  3. View bookings list
  4. Update booking status

## 🎯 W4 Milestone - 10 Internal Bookings

Track progress: Create 10 test bookings using different flows

- [ ] Booking 1 - Residential cleaning
- [ ] Booking 2 - Vacation rental
- [ ] Booking 3 - Office cleaning
- [ ] Booking 4 - Hospitality
- [ ] Booking 5 - Deep cleaning
- [ ] Booking 6 - Move-in/out
- [ ] Booking 7 - Recurring service
- [ ] Booking 8 - Emergency booking
- [ ] Booking 9 - Multi-property booking
- [ ] Booking 10 - Staff completion flow

**Validation Criteria:**

- [ ] All bookings created without errors
- [ ] Payments processed (test mode)
- [ ] Email notifications sent
- [ ] Staff can view and manage bookings
- [ ] No critical bugs found (bugs críticos ≤2)

## 📊 Monitoring Setup (Optional but Recommended)

- [ ] Sentry error tracking configured
- [ ] Vercel Analytics enabled
- [ ] Railway logs monitored
- [ ] Uptime monitoring (e.g., UptimeRobot)

## 📝 Documentation

- [ ] Staging URLs documented
- [ ] Test credentials documented (in 1Password/secure location)
- [ ] Known issues logged
- [ ] Rollback procedure documented

## 🔄 Rollback Plan

If deployment fails:

1. **Immediate rollback:**

   ```bash
   # Railway
   railway rollback

   # Vercel
   vercel rollback [deployment-url]
   ```

2. **Investigate logs:**

   ```bash
   railway logs --tail
   vercel logs [deployment-url]
   ```

3. **Fix and redeploy:**
   ```bash
   git revert [commit-hash]
   git push origin develop
   ```

---

## ✨ Success Criteria

Deployment is considered successful when:

- ✅ All health checks passing
- ✅ 10 internal bookings completed
- ✅ Critical bugs ≤ 2
- ✅ NPS from internal testers ≥ 40
- ✅ CleanScore published on 100% of services
- ✅ Zero downtime during deployment
- ✅ Response times < 2 seconds (p95)

---

**Date:** **\*\***\_\_\_\_**\*\***
**Deployed by:** **\*\***\_\_\_\_**\*\***
**Deployment URL:** https://brisa-cubana-staging.vercel.app
**API URL:** https://api-brisa-cubana-staging.up.railway.app
**Notes:** **\*\***\*\***\*\***\*\***\*\***\*\***\*\***\_**\*\***\*\***\*\***\*\***\*\***\*\***\*\***

---

**Next Steps:** After successful staging validation → Deploy to production

See: [docs/for-developers/staging-setup.md](docs/for-developers/staging-setup.md)
