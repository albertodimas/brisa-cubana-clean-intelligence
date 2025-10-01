# Environment Variables Configuration

This document lists all required environment variables for production deployment.

## API Environment Variables (Railway)

### Core Configuration

```bash
# Node Environment
NODE_ENV=production
PORT=3001  # Set by Railway automatically

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Authentication
JWT_SECRET=<strong-random-secret-min-32-chars>

# CORS Configuration
CORS_ORIGIN=https://brisacubana.com
```

### External Services

```bash
# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # CRITICAL: Required for webhook signature verification

# Twilio SMS/Voice
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@brisacubana.com
```

### Monitoring & Observability

```bash
# Sentry Error Tracking
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=brisa-cubana
SENTRY_PROJECT=api
SENTRY_AUTH_TOKEN=...  # For source maps upload

# OpenTelemetry (Optional)
OTEL_EXPORTER_OTLP_ENDPOINT=https://...
OTEL_SERVICE_NAME=brisa-cubana-api
```

### AI Services (Optional)

```bash
# OpenAI for Concierge
OPENAI_API_KEY=sk-...
```

## Web Environment Variables (Vercel)

```bash
# Node Environment
NODE_ENV=production

# API Connection
NEXT_PUBLIC_API_URL=https://api.brisacubana.com
NEXT_PUBLIC_APP_URL=https://brisacubana.com

# Stripe (Public Key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Sentry (Frontend)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Analytics (Optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

## GitHub Secrets

Required secrets for GitHub Actions CI/CD:

```bash
# Railway Deployment
RAILWAY_PRODUCTION_TOKEN=...

# Vercel Deployment
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# Optional: Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Security Notes

### Critical Variables

These variables MUST be set for production security:

- `JWT_SECRET`: Minimum 32 characters, cryptographically random
- `STRIPE_WEBHOOK_SECRET`: Required for webhook signature verification
- `DATABASE_URL`: Must use SSL mode (`?sslmode=require`)
- `CORS_ORIGIN`: Must be explicit production domain (no wildcards)

### Generating Secrets

```bash
# Generate strong JWT secret (32 bytes = 256 bits)
openssl rand -base64 32

# Generate strong random string (64 chars)
openssl rand -hex 32
```

## Environment-Specific Configuration

### Development (.env.local)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev
JWT_SECRET=dev-secret-key-not-for-production
CORS_ORIGIN=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_test_...
```

### Staging

Use same structure as production but with staging credentials and `-staging` suffix services.

### Production

All variables must be set in Railway (API) and Vercel (Web) project settings.

## Verification Checklist

Before deploying to production:

- [ ] All **Core Configuration** variables set
- [ ] `STRIPE_WEBHOOK_SECRET` configured in Railway
- [ ] `JWT_SECRET` is strong random value (not default)
- [ ] `DATABASE_URL` uses SSL mode
- [ ] `CORS_ORIGIN` set to exact production domain
- [ ] Sentry DSN configured for error tracking
- [ ] Email service (Resend) configured and verified
- [ ] Twilio credentials configured for SMS
- [ ] All GitHub secrets configured for CI/CD

## Troubleshooting

### Common Issues

**Railway healthcheck fails**

- Check `PORT` variable (should be set automatically by Railway)
- Verify `DATABASE_URL` is accessible
- Check Sentry DSN is valid

**Stripe webhooks fail**

- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check webhook endpoint in Stripe dashboard: `https://api.brisacubana.com/api/webhooks/stripe`
- Ensure webhook signature verification is enabled

**CORS errors in production**

- Verify `CORS_ORIGIN` matches exact frontend URL
- Check no trailing slash in CORS_ORIGIN
- Ensure credentials: true is set in CORS config

## References

- [Railway Environment Variables](https://docs.railway.app/guides/variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Stripe Webhook Signatures](https://stripe.com/docs/webhooks/signatures)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
