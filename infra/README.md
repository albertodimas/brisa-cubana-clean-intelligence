# Infrastructure as Code (IaC)

> Production infrastructure for Brisa Cubana Clean Intelligence
> **Managed by:** Platform Engineering Team
> **Last Updated:** October 2, 2025

---

## 📁 Directory Structure

```
infra/
├── terraform/          # Terraform IaC for Railway + Vercel
│   ├── main.tf        # Provider configuration
│   ├── vercel.tf      # Vercel web app infrastructure
│   ├── railway.tf     # Railway API infrastructure
│   └── terraform.tfvars.example
├── railway/           # Railway-specific configs
├── vercel/            # Vercel-specific configs
└── kubernetes/        # K8s manifests (future migration)
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Terraform
brew install terraform  # macOS
# or
sudo apt install terraform  # Ubuntu

# Authenticate
export VERCEL_API_TOKEN="your_token"  # Scope: Full Access
export RAILWAY_TOKEN="your_token"
```

### Initialize Infrastructure

```bash
cd infra/terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Fill with real values

# Initialize Terraform
terraform init

# Review changes
terraform plan

# Apply infrastructure
terraform apply
```

---

## 🔐 Secrets Management

**NEVER commit secrets to version control.**

### Required Secrets

1. **Database**
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string

2. **Authentication**
   - `JWT_SECRET` - Generate with `openssl rand -hex 64`
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

3. **Payment Processing**
   - `STRIPE_SECRET_KEY` - Stripe API key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

4. **Email**
   - `RESEND_API_KEY` - Resend email API key

5. **AI**
   - `OPENAI_API_KEY` - OpenAI API key for AI Concierge

### Secret Rotation

Rotate secrets every 90 days or immediately if compromised:

```bash
# Generate new secrets
openssl rand -hex 64 > new_jwt_secret
openssl rand -base64 32 > new_nextauth_secret

# Update in Terraform
nano terraform.tfvars

# Apply changes (zero-downtime rotation)
terraform apply
```

---

## 🌍 Environments

| Environment     | Purpose                | Branch    | Auto-Deploy |
| --------------- | ---------------------- | --------- | ----------- |
| **Production**  | Live customer traffic  | `main`    | ✅ Yes      |
| **Staging**     | Pre-production testing | `develop` | ✅ Yes      |
| **Development** | Local development      | N/A       | ❌ No       |

---

## 📊 Infrastructure Components

### Vercel (Web App)

- **Framework:** Next.js 15.5 (App Router)
- **Region:** `iad1` (US East)
- **Features:**
  - Edge functions for API routes
  - Automatic HTTPS/SSL
  - DDoS protection
  - Rate limiting via Firewall
  - Preview deployments

### Railway (API)

- **Runtime:** Node.js 24 + tsx
- **Region:** US East
- **Features:**
  - Docker-based deployment
  - Auto-scaling
  - Health checks
  - Custom domain: api.brisacubana.com

---

## 🔄 Deployment Workflow

1. **Code pushed to GitHub** (`main` branch)
2. **GitHub Actions runs CI/CD:**
   - Lint, typecheck, tests
   - Build artifacts
   - Security scans
3. **Terraform applies changes** (if infra modified)
4. **Railway deploys API** (Docker container)
5. **Vercel deploys Web** (Next.js build)
6. **Health checks verify** both services
7. **Slack notification** on success/failure

---

## 🛠️ Maintenance

### Update Infrastructure

```bash
# Pull latest code
git pull origin main

# Review Terraform changes
terraform plan

# Apply updates
terraform apply
```

### Destroy Infrastructure (DANGER)

```bash
# Only for non-production environments
terraform destroy

# Production requires approval and runbook
# See: docs/operations/runbooks/DISASTER_RECOVERY.md
```

---

## 📚 References

- **Vercel Terraform Provider:** https://registry.terraform.io/providers/vercel/vercel/latest
- **Railway Terraform Provider:** https://registry.terraform.io/providers/terraform-community-providers/railway/latest
- **Vercel Integration Guide:** https://vercel.com/guides/integrating-terraform-with-vercel
- **Railway IaC Feedback:** https://station.railway.com/feedback/infrastructure-as-code-1ee4fe54

All references consulted on **October 2, 2025**.

---

## ⚠️ Troubleshooting

### Terraform State Lock

```bash
# If state is locked, force unlock (use with caution)
terraform force-unlock <lock_id>
```

### Provider Authentication

```bash
# Verify tokens are set
echo $VERCEL_API_TOKEN
echo $RAILWAY_TOKEN

# Re-login if expired
vercel login
railway login
```

### Terraform State Drift

```bash
# Detect drift
terraform plan -detailed-exitcode

# Import existing resources
terraform import vercel_project.web prj_xxxxx
terraform import railway_service.api srv_xxxxx
```

---

## 📞 Support

- **Platform Team:** platform@brisacubana.com
- **On-Call:** PagerDuty escalation
- **Runbooks:** `docs/operations/runbooks/` directory
