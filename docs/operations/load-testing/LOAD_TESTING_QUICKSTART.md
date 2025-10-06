# Quick Start - Load Testing

**Time to first test:** 5 minutes

## Prerequisites Checklist

- [ ] Staging environment is running
- [ ] Test users exist in staging (admin + client)
- [ ] You have their passwords
- [ ] k6 is installed (or script will auto-install)

## Step 1: Set Credentials (30 seconds)

```bash
export TEST_ADMIN_PASSWORD="your-admin-password"
export TEST_CLIENT_PASSWORD="your-client-password"
```

## Step 2: Run Smoke Test (1 minute)

```bash
cd /home/ubuntu-workstation/Escritorio/brisa-cubana-clean-intelligence
SCENARIO=smoke ./scripts/run-load-tests.sh
```

## Step 3: View Results (30 seconds)

```bash
# Open HTML report
firefox tests/load/results/report_*.html

# Or view in terminal
cat tests/load/results/test_results_*.log
```

## That's It

You've just run your first load test.

---

## Run All Tests (50 minutes)

```bash
./scripts/run-load-tests.sh
```

This runs all 5 scenarios:

1. Smoke (1 min)
2. Load (5 min)
3. Stress (10 min)
4. Spike (3 min)
5. Soak (30 min)

---

## GitHub Actions Setup

### 1. Add Secrets (2 minutes)

```bash
gh secret set TEST_ADMIN_EMAIL -b "admin@brisacubanaclean.com"
gh secret set TEST_ADMIN_PASSWORD  # will prompt
gh secret set TEST_CLIENT_EMAIL -b "client@brisacubanaclean.com"
gh secret set TEST_CLIENT_PASSWORD  # will prompt
```

### 2. Trigger Workflow (30 seconds)

```bash
gh workflow run load-test.yml -f scenario=smoke
```

### 3. View Results

```bash
gh run list --workflow=load-test.yml
gh run view <run-id>
```

---

## Common Commands

```bash
# Smoke test (fastest)
SCENARIO=smoke ./scripts/run-load-tests.sh

# Load test (recommended for weekly runs)
SCENARIO=load ./scripts/run-load-tests.sh

# Custom staging
STAGING_URL=https://my-staging.com SCENARIO=smoke ./scripts/run-load-tests.sh

# Help
./scripts/run-load-tests.sh --help
```

---

## Troubleshooting

### "Cannot reach staging"

```bash
# Test manually
curl https://staging.brisacubanaclean.com/api/health
```

### "Authentication failed"

```bash
# Test login
curl -X POST https://staging.brisacubanaclean.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"yourpass"}'
```

### "k6 not found"

```bash
# Script auto-installs, but if needed:
sudo snap install k6
```

---

## Full Documentation

- **Complete Guide:** `docs/operations/LOAD_TESTING_GUIDE.md`
- **GitHub Secrets:** `docs/operations/GITHUB_SECRETS_SETUP.md`
- **Results Analysis:** `tests/load/results/README.md`
- **Setup Summary:** `LOAD_TESTING_SETUP_SUMMARY.md`

---

**Need help?** Check the troubleshooting section in `docs/operations/LOAD_TESTING_GUIDE.md`
