# 🚀 Autonomous Deployment Setup Guide

> **Goal**: Enable Claude to autonomously deploy and monitor the project to production

---

## 📋 Current Status

**CI/CD Pipeline**: ✅ **100% GREEN**

- ✅ All 171 tests passing
- ✅ Coverage reporting to Codecov
- ✅ Linting, TypeCheck, Build all passing
- ⚠️ Deployment workflows need credential configuration

**Last Updated**: October 2, 2025

---

## 🔐 Required Credentials

### GitHub Secrets (Current Status)

```bash
# View current secrets:
gh secret list

# Expected output:
CODECOV_TOKEN              ✅ Set (2025-10-02)
RAILWAY_PRODUCTION_TOKEN   ⚠️ Needs verification
VERCEL_TOKEN               ⚠️ Needs verification
VERCEL_ORG_ID              ✅ Set
VERCEL_PROJECT_ID          ✅ Set
SLACK_WEBHOOK_URL          ❌ Optional (not set)
```

### What's Needed

1. **Railway Service Name** - Currently unknown
2. **Valid Railway Token** - Current token is expired
3. **Vercel Configuration** - Root directory needs verification

---

## 🛠️ Setup Instructions

### Option 1: Automated Script (Recommended)

Run the provided setup script:

```bash
./scripts/setup-deployment-credentials.sh
```

This script will:

1. ✅ Check all required tools are installed
2. ✅ Authenticate with Railway and Vercel
3. ✅ Collect all necessary configuration
4. ✅ Update GitHub Secrets
5. ✅ Generate summary for Claude

**Copy the entire output and provide it to Claude.**

### Option 2: Manual Configuration

If you prefer manual setup:

#### Step 1: Railway Configuration

```bash
# Authenticate
railway login

# Link project
railway link

# Get service information
railway whoami
railway status
railway service list

# Get environment variables
railway variables
```

**Copy all output above**

#### Step 2: Vercel Configuration

```bash
# Authenticate
vercel login

# List projects
vercel ls

# Inspect project
vercel inspect brisa-cubana-clean-intelligence

# Get environment variables
vercel env ls --environment production
```

**Copy all output above**

#### Step 3: Update GitHub Secrets

```bash
# Railway token
gh secret set RAILWAY_PRODUCTION_TOKEN
# Paste token from: https://railway.app/account/tokens

# Vercel token
gh secret set VERCEL_TOKEN
# Paste token from: https://vercel.com/account/tokens

# (Optional) Slack webhook
gh secret set SLACK_WEBHOOK_URL
# Paste webhook URL from Slack app settings
```

---

## 📤 Providing Information to Claude

Once you've collected all the information, **paste it in the chat** in this format:

```
Railway Configuration:
- Service Name: [paste here]
- Project: [paste railway status output]
- Variables: [paste railway variables output]

Vercel Configuration:
- Project: [paste vercel ls output]
- Inspection: [paste vercel inspect output]
- Environment: [paste vercel env ls output]

GitHub Secrets:
[paste gh secret list output]
```

---

## ✅ What Claude Will Do Autonomously

Once credentials are provided, Claude will:

1. **Update Deployment Workflows** (10 min)
   - Fix Railway service name in `.github/workflows/deploy-production.yml`
   - Verify Vercel root directory and build command
   - Update any missing configuration

2. **Execute Test Deployment** (30 min)
   - Deploy API to Railway
   - Deploy Web to Vercel
   - Verify health checks
   - Test connectivity between services

3. **Setup Monitoring** (20 min)
   - Configure Sentry error tracking
   - Setup uptime monitoring
   - Add status badges to README
   - Configure alerting

4. **Documentation** (15 min)
   - Document production URLs
   - Create deployment procedures
   - Add rollback procedures
   - Update CLAUDE.md with final config

5. **Verification** (30 min)
   - End-to-end smoke tests
   - Auth flow verification
   - CRUD operations test
   - Integration tests (Stripe, Resend, Twilio)

**Total estimated time**: ~2 hours for complete autonomous deployment

---

## 🚨 Important Notes

### Security

- ✅ All secrets are stored in GitHub Secrets (encrypted)
- ✅ Never commit secrets to the repository
- ✅ Tokens are environment-specific (production only)
- ✅ Script uses `read -s` for sensitive input (hidden)

### Prerequisites

Ensure these tools are installed:

```bash
# Check installations
railway --version   # @railway/cli
vercel --version    # vercel@latest
gh --version        # GitHub CLI
node --version      # Node.js 24+
pnpm --version      # pnpm 10+
```

### Troubleshooting

**Railway login fails:**

```bash
# Clear credentials and retry
rm -rf ~/.railway
railway login
```

**Vercel login fails:**

```bash
# Clear credentials and retry
rm -rf ~/.vercel
vercel login
```

**GitHub CLI not authenticated:**

```bash
gh auth login
```

---

## 📞 Support

If you encounter issues:

1. Check the error message carefully
2. Verify all tools are up to date
3. Ensure you have admin access to Railway/Vercel projects
4. Provide the error message to Claude

---

## 🎯 Success Criteria

After autonomous deployment, you should have:

- ✅ Working production API on Railway
- ✅ Working production Web on Vercel
- ✅ All environment variables configured
- ✅ Health checks passing
- ✅ Monitoring and alerting active
- ✅ Documentation complete
- ✅ Rollback procedures documented

---

**Ready to start?** Run: `./scripts/setup-deployment-credentials.sh`
