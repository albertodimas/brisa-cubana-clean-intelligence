# Railway Environment Variables Setup Guide

## Overview

This guide provides step-by-step instructions for configuring all required environment variables in Railway for the Brisa Cubana Clean Intelligence API.

## Prerequisites

- Railway account with access to the project
- Railway CLI installed and authenticated
- Access to external service credentials (Stripe, Twilio, Resend, etc.)

## Critical Environment Variables

### 1. JWT_SECRET (CRITICAL - Security)

**Purpose**: Signs and verifies JWT tokens for user authentication.

**Requirements**:

- Minimum 32 characters
- Cryptographically random
- Never commit to version control

**Generate**:

```bash
openssl rand -base64 48
```

**Set in Railway Dashboard**:

1. Go to Railway dashboard → Your Project → API Service
2. Navigate to "Variables" tab
3. Add variable:
   - Name: `JWT_SECRET`
   - Value: `<output from openssl command>`
4. Click "Add" and redeploy

### 2. STRIPE_WEBHOOK_SECRET (CRITICAL - Payment Security)

**Purpose**: Verifies webhook signatures from Stripe to prevent fraudulent payment events.

**Requirements**:

- Obtained from Stripe Dashboard
- Format: `whsec_...`
- Must match the webhook endpoint configured in Stripe

**Obtain from Stripe**:

1. Log into [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → Webhooks
3. Find your production endpoint: `https://api.brisacubana.com/api/webhooks/stripe`
4. Click "Reveal" next to "Signing secret"
5. Copy the value (starts with `whsec_`)

**Set in Railway**:

1. Railway dashboard → Variables
2. Add variable:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...`
3. Redeploy

### 3. STRIPE_SECRET_KEY (CRITICAL - Payment Processing)

**Purpose**: Authenticates API requests to Stripe for payment processing.

**Obtain**:

1. Stripe Dashboard → Developers → API keys
2. Copy "Secret key" (starts with `sk_live_` for production)

**Set in Railway**:

- Name: `STRIPE_SECRET_KEY`
- Value: `sk_live_...`

### 4. DATABASE_URL (Auto-configured by Railway)

**Note**: If using Railway's PostgreSQL service, this is automatically configured. Verify it exists in Variables tab.

**Format**: `postgresql://user:password@host:port/database?sslmode=require`

### 5. CORS_ORIGIN (CRITICAL - Security)

**Purpose**: Restricts which domains can make requests to the API.

**Set in Railway**:

- Name: `CORS_ORIGIN`
- Value: `https://brisacubana.com`

**Never use wildcards (`*`) in production.**

### 6. NODE_ENV (CRITICAL - Production Behavior)

**Set in Railway**:

- Name: `NODE_ENV`
- Value: `production`

## Optional But Recommended Variables

### Email Service (Resend)

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@brisacubana.com
```

**Obtain**:

1. [Resend Dashboard](https://resend.com/api-keys)
2. Create new API key for production
3. Verify domain ownership for `brisacubana.com`

### SMS/Voice Service (Twilio)

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

**Obtain**:

1. [Twilio Console](https://console.twilio.com/)
2. Copy Account SID and Auth Token
3. Purchase/configure phone number

### Error Tracking (Sentry)

```bash
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=brisa-cubana
SENTRY_PROJECT=api
```

**Obtain**:

1. [Sentry Dashboard](https://sentry.io/)
2. Create project for "brisa-cubana-api"
3. Copy DSN from project settings
4. Generate Auth Token for source maps upload (optional)

### AI Services (OpenAI)

```bash
OPENAI_API_KEY=sk-...
```

**Obtain**:

1. [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key for production
3. Set usage limits

## Setting Variables via Railway Dashboard

### Method 1: Web UI (Recommended)

1. Navigate to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Select the "API" service
4. Click "Variables" tab
5. Click "New Variable"
6. Enter name and value
7. Click "Add"
8. Railway will automatically redeploy

### Method 2: Railway CLI (Non-interactive)

**Note**: Railway CLI requires interactive mode for `railway service` command. For CI/CD, use Railway API or set variables via dashboard before deployment.

For bulk import:

```bash
# Create variables.txt with KEY=VALUE pairs
cat > variables.txt <<EOF
JWT_SECRET=your-secret-here
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_live_...
CORS_ORIGIN=https://brisacubana.com
NODE_ENV=production
EOF

# Use Railway CLI to import (requires interactive session)
railway variables --import variables.txt

# IMPORTANT: Delete variables.txt after import
rm variables.txt
```

### Method 3: Railway API

Use Railway's GraphQL API for programmatic access:

```bash
curl https://backboard.railway.app/graphql \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation variableUpsert($input: VariableUpsertInput!) { variableUpsert(input: $input) }",
    "variables": {
      "input": {
        "projectId": "YOUR_PROJECT_ID",
        "environmentId": "YOUR_ENVIRONMENT_ID",
        "serviceId": "YOUR_SERVICE_ID",
        "name": "JWT_SECRET",
        "value": "your-secret-value"
      }
    }
  }'
```

## Verification Checklist

After setting all variables, verify:

### Required Variables Present

```bash
# Check via Railway dashboard Variables tab that these exist:
✓ NODE_ENV=production
✓ DATABASE_URL=postgresql://... (auto-configured if using Railway Postgres)
✓ JWT_SECRET=<32+ character random string>
✓ CORS_ORIGIN=https://brisacubana.com
✓ STRIPE_SECRET_KEY=sk_live_...
✓ STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional Variables (if services configured)

```bash
✓ RESEND_API_KEY=re_...
✓ RESEND_FROM_EMAIL=noreply@brisacubana.com
✓ TWILIO_ACCOUNT_SID=AC...
✓ TWILIO_AUTH_TOKEN=...
✓ TWILIO_PHONE_NUMBER=+1...
✓ SENTRY_DSN=https://...@sentry.io/...
✓ OPENAI_API_KEY=sk-... (if AI concierge enabled)
```

### Security Verification

1. **No secrets in Git**:

   ```bash
   git grep -i "sk_live_\|whsec_\|AC[a-z0-9]" # Should return nothing
   ```

2. **Railway variables encrypted**: All variables in Railway are encrypted at rest

3. **CORS properly configured**: Test API endpoints only respond to allowed origins

4. **Webhook signatures verified**: Check Railway deployment logs for successful Stripe webhook verification

## Testing After Configuration

### 1. Health Check

```bash
curl https://api.brisacubana.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Authentication

```bash
# Attempt to access protected endpoint without token
curl https://api.brisacubana.com/api/users
# Expected: 401 Unauthorized
```

### 3. Stripe Webhook (if configured)

```bash
# Check Railway logs after test webhook from Stripe Dashboard
# Expected: "Webhook verified successfully"
```

## Troubleshooting

### Issue: "JWT_SECRET is not defined"

**Solution**:

1. Verify `JWT_SECRET` exists in Railway Variables
2. Check for typos in variable name (case-sensitive)
3. Trigger redeploy after adding variable

### Issue: "Stripe webhook signature verification failed"

**Causes**:

- `STRIPE_WEBHOOK_SECRET` doesn't match Stripe Dashboard value
- Webhook endpoint URL mismatch
- Variable not set or contains whitespace

**Solution**:

1. Compare webhook secret in Railway with Stripe Dashboard
2. Verify webhook endpoint: `https://api.brisacubana.com/api/webhooks/stripe`
3. Regenerate webhook secret in Stripe if needed
4. Update Railway variable and redeploy

### Issue: "Cannot connect to database"

**Solution**:

1. Check `DATABASE_URL` format includes `?sslmode=require`
2. Verify Railway PostgreSQL service is running
3. Check Railway service logs for connection errors

### Issue: Variables not taking effect

**Solution**:

1. Railway requires redeploy after variable changes
2. Check deployment logs for startup errors
3. Verify variable names match exactly (case-sensitive)

## Security Best Practices

### 1. Secret Rotation

Rotate secrets every 90 days:

- JWT_SECRET
- STRIPE_SECRET_KEY
- API tokens

### 2. Access Control

- Limit Railway project access to essential team members
- Use Railway's team permissions
- Enable 2FA on all accounts

### 3. Monitoring

- Set up Sentry alerts for authentication failures
- Monitor Railway metrics for unusual API activity
- Review webhook logs regularly

### 4. Backup

- Document all variable names (not values) in this file
- Store production secrets in team password manager (1Password, LastPass)
- Never commit secrets to Git, even encrypted

## Emergency Procedures

### Lost JWT_SECRET

1. Generate new secret: `openssl rand -base64 48`
2. Set `JWT_SECRET` in Railway
3. Redeploy API
4. **All users will be logged out** - plan maintenance window

### Compromised Stripe Key

1. Immediately revoke key in Stripe Dashboard
2. Generate new secret key
3. Update `STRIPE_SECRET_KEY` in Railway
4. Redeploy
5. Update any local dev environments

### Database Credential Rotation

1. Railway PostgreSQL handles this automatically
2. If using external database, coordinate with DBA
3. Update `DATABASE_URL` atomically
4. Test connection before finalizing

## Additional Resources

- [Railway Documentation - Environment Variables](https://docs.railway.app/develop/variables)
- [Stripe Webhook Security](https://stripe.com/docs/webhooks/signatures)
- [Sentry Environment Configuration](https://docs.sentry.io/platforms/node/)
- [Environment Variables Documentation](./environment-variables.md)

---

**Last Updated**: 2025-10-01
**Owner**: DevOps Team
**Review Frequency**: Quarterly
