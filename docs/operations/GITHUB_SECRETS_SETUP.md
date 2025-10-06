# GitHub Secrets Setup for Load Testing

This guide explains how to configure GitHub repository secrets for automated load testing.

## Required Secrets

The load testing GitHub Action requires the following secrets to be configured in your repository:

| Secret Name            | Description                   | Example                       |
| ---------------------- | ----------------------------- | ----------------------------- |
| `TEST_ADMIN_EMAIL`     | Admin user email for staging  | `admin@brisacubanaclean.com`  |
| `TEST_ADMIN_PASSWORD`  | Admin user password           | `SecurePass123!`              |
| `TEST_CLIENT_EMAIL`    | Client user email for staging | `client@brisacubanaclean.com` |
| `TEST_CLIENT_PASSWORD` | Client user password          | `SecurePass123!`              |

## Setup Instructions

### Using GitHub Web UI

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

   **Secret 1:**
   - Name: `TEST_ADMIN_EMAIL`
   - Value: `admin@brisacubanaclean.com`
   - Click **Add secret**

   **Secret 2:**
   - Name: `TEST_ADMIN_PASSWORD`
   - Value: Your admin password
   - Click **Add secret**

   **Secret 3:**
   - Name: `TEST_CLIENT_EMAIL`
   - Value: `client@brisacubanaclean.com`
   - Click **Add secret**

   **Secret 4:**
   - Name: `TEST_CLIENT_PASSWORD`
   - Value: Your client password
   - Click **Add secret**

### Using GitHub CLI

```bash
# Set secrets using gh CLI
gh secret set TEST_ADMIN_EMAIL -b "admin@brisacubanaclean.com"
gh secret set TEST_ADMIN_PASSWORD  # Will prompt for value
gh secret set TEST_CLIENT_EMAIL -b "client@brisacubanaclean.com"
gh secret set TEST_CLIENT_PASSWORD  # Will prompt for value

# Verify secrets are set
gh secret list
```

### Using GitHub CLI (non-interactive)

```bash
# Set from environment variables
echo "$ADMIN_PASSWORD" | gh secret set TEST_ADMIN_PASSWORD
echo "$CLIENT_PASSWORD" | gh secret set TEST_CLIENT_PASSWORD

# Set from files
gh secret set TEST_ADMIN_PASSWORD < admin_password.txt
gh secret set TEST_CLIENT_PASSWORD < client_password.txt
```

## Creating Test Users in Staging

Before setting secrets, ensure the test users exist in your staging environment:

### Option 1: Database Seed

Add to `apps/api/prisma/seed.ts`:

```typescript
// Test users for load testing
const testAdmin = await prisma.user.create({
  data: {
    email: "admin@brisacubanaclean.com",
    name: "Load Test Admin",
    role: "ADMIN",
    password: await hashPassword("YourSecurePassword"),
  },
});

const testClient = await prisma.user.create({
  data: {
    email: "client@brisacubanaclean.com",
    name: "Load Test Client",
    role: "CLIENT",
    password: await hashPassword("YourSecurePassword"),
  },
});
```

### Option 2: API Registration

```bash
# Create admin user
curl -X POST https://staging.brisacubanaclean.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@brisacubanaclean.com",
    "password": "YourSecurePassword",
    "name": "Load Test Admin",
    "role": "ADMIN"
  }'

# Create client user
curl -X POST https://staging.brisacubanaclean.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@brisacubanaclean.com",
    "password": "YourSecurePassword",
    "name": "Load Test Client",
    "role": "CLIENT"
  }'
```

### Option 3: Database Direct

```sql
-- Connect to staging database
psql -h staging-db.example.com -U postgres -d brisa_cubana

-- Create admin user (hash password appropriately)
INSERT INTO users (email, name, role, password, created_at, updated_at)
VALUES (
  'admin@brisacubanaclean.com',
  'Load Test Admin',
  'ADMIN',
  '$2b$10$...',  -- bcrypt hash
  NOW(),
  NOW()
);

-- Create client user
INSERT INTO users (email, name, role, password, created_at, updated_at)
VALUES (
  'client@brisacubanaclean.com',
  'Load Test Client',
  'CLIENT',
  '$2b$10$...',  -- bcrypt hash
  NOW(),
  NOW()
);
```

## Verification

### Test Secrets are Working

```bash
# Trigger a manual workflow run
gh workflow run load-test.yml \
  -f scenario=smoke \
  -f staging_url=https://staging.brisacubanaclean.com

# Watch the run
gh run watch
```

### Test Login Manually

```bash
# Test admin login
curl -X POST https://staging.brisacubanaclean.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@brisacubanaclean.com",
    "password": "YourPassword"
  }'

# Should return:
# {"accessToken": "...", "user": {...}}
```

## Security Best Practices

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't reuse production passwords

2. **Rotate Regularly**

   ```bash
   # Update secrets periodically
   gh secret set TEST_ADMIN_PASSWORD
   gh secret set TEST_CLIENT_PASSWORD
   ```

3. **Limit Scope**
   - Test users should only exist in staging
   - No access to production data
   - Limited permissions

4. **Monitor Usage**
   - Review GitHub Actions logs
   - Check for unauthorized access
   - Audit test user activity in staging

## Troubleshooting

### Secret Not Found Error

```
Error: Secret TEST_ADMIN_PASSWORD not found
```

**Solution:**

```bash
# List current secrets
gh secret list

# Set missing secret
gh secret set TEST_ADMIN_PASSWORD
```

### Authentication Failed

```
Error: login successful: false
```

**Solution:**

1. Verify user exists in staging database
2. Check password is correct
3. Test login manually with curl
4. Ensure secret value has no extra spaces/newlines

### Secret Value Issues

```bash
# Common issues:
# - Extra newline: use -b flag or echo -n
# - Wrong encoding: ensure UTF-8
# - Special characters: quote properly

# Correct:
echo -n "password" | gh secret set TEST_ADMIN_PASSWORD

# Incorrect (adds newline):
echo "password" | gh secret set TEST_ADMIN_PASSWORD
```

## Alternative: Environment-Specific Secrets

For multiple environments:

```bash
# Staging secrets
gh secret set STAGING_TEST_ADMIN_PASSWORD
gh secret set STAGING_TEST_CLIENT_PASSWORD

# Production secrets (if needed)
gh secret set PROD_TEST_ADMIN_PASSWORD
gh secret set PROD_TEST_CLIENT_PASSWORD
```

Update workflow to use environment-specific secrets:

```yaml
env:
  TEST_ADMIN_PASSWORD: ${{ secrets.STAGING_TEST_ADMIN_PASSWORD }}
  TEST_CLIENT_PASSWORD: ${{ secrets.STAGING_TEST_CLIENT_PASSWORD }}
```

## Resources

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI Secrets](https://cli.github.com/manual/gh_secret)
- [Load Testing Guide](./LOAD_TESTING_GUIDE.md)

---

**Last Updated:** 2025-10-06
**Maintained by:** DevOps Team
