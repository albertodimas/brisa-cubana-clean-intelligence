# Rollback Procedures

## Overview

This document provides step-by-step procedures for rolling back deployments in case of critical issues in production.

## Emergency Response Team

**Primary Contacts:**

- DevOps Lead: [Contact Info]
- Backend Lead: [Contact Info]
- CTO: [Contact Info]

## Severity Levels

### P0 - Critical (Immediate Rollback Required)

- Production API completely down
- Data corruption or loss
- Security breach
- Payment processing failures

### P1 - High (Rollback within 15 minutes)

- Major feature broken
- Performance degradation >50%
- Authentication failures affecting >10% users

### P2 - Medium (Rollback within 1 hour)

- Minor feature broken
- Performance degradation <50%
- UI/UX issues affecting user experience

### P3 - Low (Schedule fix, no immediate rollback)

- Cosmetic issues
- Minor bugs with workarounds

## Railway API Rollback

### Method 1: Redeploy Previous Version (Recommended)

**Steps:**

1. **Identify the last known good deployment**:
   - Navigate to Railway dashboard → API service → Deployments tab
   - Or use: `railway logs --limit 100`

2. **Find the stable commit hash**:

   ```bash
   git log --oneline -10
   ```

3. **Trigger rollback via Railway Dashboard**:
   - Click "Deployments" tab
   - Find last successful deployment
   - Click "Redeploy" button

4. **Verify rollback**:
   ```bash
   curl https://api.brisacubana.com/
   ```

### Method 2: Environment Variable Rollback

1. Access Railway Dashboard → Variables tab
2. Restore previous values from backup
3. Click "Deploy Changes"

## Vercel Web Rollback

### Method 1: Instant Rollback (Recommended)

**Steps:**

1. Navigate to Vercel Dashboard → Deployments tab
2. Find last stable "Production" deployment
3. Click "Promote to Production"
4. Verify at https://brisacubana.com

### Method 2: Redeploy via CLI

```bash
# Checkout stable commit
git checkout <stable-commit-hash>

# Deploy to production
vercel --prod
```

## Database Migration Rollback

**⚠️ IMPORTANT: Prisma does not support automatic rollbacks.**

### Safe Approach: Compensating Migration

1. **Create reversing migration**:

   ```bash
   cd apps/api
   npx prisma migrate dev --name revert_changes
   ```

2. **Test in staging first**
3. **Apply to production**:
   ```bash
   DATABASE_URL="production-url" npx prisma migrate deploy
   ```

### Emergency Database Restore

Contact Railway support for point-in-time restore.

## Rollback Verification Checklist

### API (Railway)

- [ ] Health endpoint: `curl https://api.brisacubana.com/`
- [ ] Database connectivity working
- [ ] Authentication working
- [ ] No error spikes in Sentry

### Web (Vercel)

- [ ] Homepage loads
- [ ] API integration working
- [ ] No console errors
- [ ] Vercel Analytics normal

## Post-Rollback Actions

### Immediate (Within 1 hour)

1. Document incident
2. Notify stakeholders
3. Monitor metrics

### Within 24 Hours

1. Root cause analysis
2. Update runbooks
3. Post-mortem meeting

## Rollback Time Targets

| Severity | Detection | Rollback | Total MTTR |
| -------- | --------- | -------- | ---------- |
| P0       | < 5 min   | < 10 min | < 15 min   |
| P1       | < 10 min  | < 15 min | < 25 min   |
| P2       | < 30 min  | < 30 min | < 60 min   |

## Emergency Contacts

- Railway Support: support@railway.app
- Vercel Support: https://vercel.com/support
- Stripe Support: https://support.stripe.com/

## Additional Resources

- [Railway Documentation](https://docs.railway.app/deploy/rollback)
- [Vercel Instant Rollbacks](https://vercel.com/docs/deployments/instant-rollback)
- [Environment Variables Setup](./railway-env-setup.md)

---

**Last Updated**: 2025-10-01
**Review Frequency**: Quarterly
