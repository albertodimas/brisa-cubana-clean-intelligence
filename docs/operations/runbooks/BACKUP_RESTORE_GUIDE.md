# Backup & Restore Guide

**Purpose:** Comprehensive guide for backup strategies, restoration procedures, and data recovery for Brisa Cubana Clean Intelligence.
**Version:** 1.0
**Last Updated:** 6 de octubre de 2025

---

## Executive Summary

This guide covers all backup and restore procedures for the Brisa Cubana platform. Our backup strategy ensures:

- **RPO (Recovery Point Objective):** < 15 minutes
- **RTO (Recovery Time Objective):** < 1 hour
- **Data Durability:** 99.999999999% (11 nines)
- **Retention Policy:** 30 days point-in-time recovery

**Quick Reference:**

- PostgreSQL backups: Automated by Railway (continuous WAL archiving)
- Configuration backups: Git repository (version controlled)
- Secrets backups: Encrypted in Railway/Vercel (not in git)

---

## Table of Contents

1. [Backup Types and Strategy](#1-backup-types-and-strategy)
2. [Database Backups](#2-database-backups)
3. [Application Configuration](#3-application-configuration)
4. [Secrets and Credentials](#4-secrets-and-credentials)
5. [File Storage](#5-file-storage)
6. [Restoration Procedures](#6-restoration-procedures)
7. [Backup Validation](#7-backup-validation)
8. [Testing and Drills](#8-testing-and-drills)

---

## 1. Backup Types and Strategy

### 1.1 Backup Types

| Type                      | Frequency              | Retention    | Method              | Location                |
| ------------------------- | ---------------------- | ------------ | ------------------- | ----------------------- |
| **Database - Continuous** | Real-time WAL          | 30 days PITR | Railway managed     | Railway cloud storage   |
| **Database - Snapshot**   | Daily 2 AM UTC         | 30 days      | Automated dump      | Railway cloud storage   |
| **Configuration**         | Every commit           | Unlimited    | Git version control | GitHub repository       |
| **Secrets**               | On change              | Current only | Encrypted env vars  | Railway/Vercel platform |
| **Media Files**           | Future (S3 versioning) | 90 days      | Object versioning   | AWS S3 (planned)        |

### 1.2 Backup Strategy Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BACKUP ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  PostgreSQL (Railway)                                        │
│  ┌──────────────────────────────────────────────────┐       │
│  │ • Continuous WAL Archiving (Point-in-Time)       │       │
│  │ • Daily automated dumps                          │       │
│  │ • 30-day retention                               │       │
│  │ • Cross-region replication (planned)             │       │
│  └──────────────────────────────────────────────────┘       │
│                           ↓                                   │
│  Application Code & Config (GitHub)                          │
│  ┌──────────────────────────────────────────────────┐       │
│  │ • Version controlled repository                  │       │
│  │ • Branch protection enabled                      │       │
│  │ • Unlimited retention                            │       │
│  │ • Disaster recovery via git clone                │       │
│  └──────────────────────────────────────────────────┘       │
│                           ↓                                   │
│  Secrets & Environment Variables                             │
│  ┌──────────────────────────────────────────────────┐       │
│  │ • Railway encrypted storage                      │       │
│  │ • Vercel encrypted storage                       │       │
│  │ • Manual backup to encrypted vault (optional)    │       │
│  │ • Rotation strategy documented                   │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 RPO/RTO Targets

| Scenario            | RPO Target   | RTO Target   | Backup Method                |
| ------------------- | ------------ | ------------ | ---------------------------- |
| Database corruption | < 5 minutes  | < 30 minutes | PITR from WAL                |
| Complete DB loss    | < 15 minutes | < 45 minutes | Latest snapshot + WAL replay |
| Application failure | 0 minutes    | < 15 minutes | Git checkout + redeploy      |
| Secrets compromised | 0 minutes    | < 30 minutes | Rotate + redeploy            |
| Region outage       | < 15 minutes | < 1 hour     | Cross-region restore         |

---

## 2. Database Backups

### 2.1 PostgreSQL Backup Configuration

**Railway automatically provides:**

1. **Continuous WAL (Write-Ahead Log) Archiving**
   - Real-time transaction log backup
   - Point-in-time recovery up to 30 days
   - RPO: < 1 minute

2. **Automated Daily Snapshots**
   - Full database dump at 2:00 AM UTC
   - Compressed and encrypted
   - Retention: 30 days

### 2.2 Manual Database Backup

**When to use:** Before major migrations, data changes, or deployments

```bash
# Option 1: Using Railway CLI (recommended)
railway run --service postgres pg_dump \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="/tmp/backup-$(date +%Y%m%d-%H%M%S).dump" \
  brisa_production

# Option 2: Direct pg_dump
pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=brisa_production \
  --format=custom \
  --compress=9 \
  --file="backup-$(date +%Y%m%d-%H%M%S).dump"

# Option 3: Schema-only backup (for versioning)
railway run --service postgres pg_dump \
  --schema-only \
  --file="/tmp/schema-$(date +%Y%m%d).sql" \
  brisa_production

# Option 4: Data-only backup
railway run --service postgres pg_dump \
  --data-only \
  --format=custom \
  --compress=9 \
  --file="/tmp/data-$(date +%Y%m%d).dump" \
  brisa_production
```

### 2.3 Backup Storage Locations

**Primary Storage (Railway Managed):**

- Location: Railway cloud storage (encrypted)
- Access: Via Railway dashboard or CLI
- Retention: 30 days automatic

**Secondary Storage (Manual - Recommended):**

```bash
# Download backup locally for offline storage
railway run --service postgres pg_dump --format=custom \
  brisa_production > backups/manual-$(date +%Y%m%d).dump

# Upload to external storage (example: AWS S3)
aws s3 cp backups/manual-$(date +%Y%m%d).dump \
  s3://brisa-backups/postgres/manual-$(date +%Y%m%d).dump \
  --storage-class GLACIER

# Verify backup integrity
pg_restore --list backups/manual-$(date +%Y%m%d).dump
```

### 2.4 Incremental Backup Strategy

**For large databases (future optimization):**

```bash
# Base backup
railway run --service postgres pg_basebackup \
  -D /backups/base \
  -Ft -z -Xs -P

# WAL archiving (continuous)
# Configured automatically by Railway
# Archive location: Railway cloud storage

# Point-in-Time Recovery (PITR)
# Restore to specific timestamp using WAL replay
```

### 2.5 Backup Verification

**After each backup, verify integrity:**

```bash
# Verify backup file integrity
pg_restore --list backup-20251006.dump | head -20

# Verify backup size and completeness
du -h backup-20251006.dump
pg_restore --list backup-20251006.dump | wc -l

# Test restore to temporary database (recommended)
railway run --service postgres psql -c "CREATE DATABASE backup_test;"
railway run --service postgres pg_restore \
  --dbname=backup_test \
  --clean \
  backup-20251006.dump
railway run --service postgres psql -d backup_test -c "
  SELECT
    table_name,
    (xpath('/row/cnt/text()',
      query_to_xml(format('select count(*) as cnt from %I', table_name),
      false, true, '')))[1]::text::int as row_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
"
railway run --service postgres psql -c "DROP DATABASE backup_test;"
```

---

## 3. Application Configuration

### 3.1 Version-Controlled Configuration

**All configuration is stored in Git:**

```bash
# Configuration files backed up in repository
apps/api/.env.example              # API environment template
apps/web/.env.local.example        # Web app environment template
apps/api/prisma/schema.prisma      # Database schema
docker-compose.yml                 # Local development setup
.github/workflows/*.yml            # CI/CD pipelines
package.json                       # Dependencies and scripts

# Backup repository (clone to safe location)
git clone --mirror git@github.com:albertodimas/brisa-cubana-clean-intelligence.git \
  /backups/repo-mirror-$(date +%Y%m%d).git

# Verify repository backup
cd /backups/repo-mirror-$(date +%Y%m%d).git
git log --oneline -10
git branch -a
```

### 3.2 Configuration Snapshot

**Create configuration snapshot before changes:**

```bash
#!/bin/bash
# Script: backup-config.sh

BACKUP_DIR="./backups/config-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup key configuration files
cp apps/api/.env.example $BACKUP_DIR/
cp apps/web/.env.local.example $BACKUP_DIR/
cp apps/api/prisma/schema.prisma $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/
cp package.json $BACKUP_DIR/
cp pnpm-lock.yaml $BACKUP_DIR/

# Create git snapshot
git log --oneline -1 > $BACKUP_DIR/git-commit.txt
git diff > $BACKUP_DIR/git-diff.txt
git status > $BACKUP_DIR/git-status.txt

# Create archive
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
echo "Configuration backup saved to: $BACKUP_DIR.tar.gz"
```

### 3.3 Dependency Backup

**Lock files ensure reproducible builds:**

```bash
# pnpm lock file (committed to git)
pnpm-lock.yaml

# Backup node_modules (optional, for offline deployment)
tar -czf node_modules-backup-$(date +%Y%m%d).tar.gz \
  apps/api/node_modules \
  apps/web/node_modules \
  packages/*/node_modules

# Verify dependencies match lock file
pnpm install --frozen-lockfile
pnpm audit
```

---

## 4. Secrets and Credentials

### 4.1 Secrets Inventory

**Critical secrets to backup (never commit to git):**

| Secret                | Location | Backup Method                         |
| --------------------- | -------- | ------------------------------------- |
| DATABASE_URL          | Railway  | Environment export + encrypted vault  |
| JWT_SECRET            | Railway  | Environment export + encrypted vault  |
| JWT_REFRESH_SECRET    | Railway  | Environment export + encrypted vault  |
| NEXTAUTH_SECRET       | Vercel   | Environment export + encrypted vault  |
| STRIPE_SECRET_KEY     | Railway  | Stripe dashboard + encrypted vault    |
| STRIPE_WEBHOOK_SECRET | Railway  | Stripe dashboard + encrypted vault    |
| RESEND_API_KEY        | Railway  | Resend dashboard + encrypted vault    |
| TWILIO_AUTH_TOKEN     | Railway  | Twilio dashboard + encrypted vault    |
| OPENAI_API_KEY        | Railway  | OpenAI dashboard + encrypted vault    |
| ANTHROPIC_API_KEY     | Railway  | Anthropic dashboard + encrypted vault |

### 4.2 Secrets Backup Procedure

**Manual secrets backup (quarterly or on change):**

```bash
#!/bin/bash
# Script: backup-secrets.sh (RUN LOCALLY ONLY - NEVER COMMIT)

# Export Railway secrets (requires Railway CLI authentication)
railway variables --service api > secrets-railway-api-$(date +%Y%m%d).txt
railway variables --service web > secrets-railway-web-$(date +%Y%m%d).txt

# Export Vercel secrets (requires Vercel CLI authentication)
vercel env pull .env.vercel.production
mv .env.vercel.production secrets-vercel-$(date +%Y%m%d).env

# Encrypt secrets backup
gpg --symmetric --cipher-algo AES256 secrets-railway-api-$(date +%Y%m%d).txt
gpg --symmetric --cipher-algo AES256 secrets-railway-web-$(date +%Y%m%d).txt
gpg --symmetric --cipher-algo AES256 secrets-vercel-$(date +%Y%m%d).env

# Remove plaintext files
shred -vfz -n 3 secrets-railway-api-$(date +%Y%m%d).txt
shred -vfz -n 3 secrets-railway-web-$(date +%Y%m%d).txt
shred -vfz -n 3 secrets-vercel-$(date +%Y%m%d).env

# Store encrypted files in secure location
# DO NOT commit to git
# Store in password manager, encrypted USB, or secure cloud storage

echo "Secrets backed up and encrypted successfully"
```

### 4.3 Secrets Restoration

**Restore secrets to new environment:**

```bash
# Decrypt secrets backup
gpg --decrypt secrets-railway-api-20251006.txt.gpg > secrets-railway-api.txt

# Restore to Railway (manual - one by one for security)
railway variables set DATABASE_URL="$(grep DATABASE_URL secrets-railway-api.txt | cut -d'=' -f2-)" --service api
railway variables set JWT_SECRET="$(grep JWT_SECRET secrets-railway-api.txt | cut -d'=' -f2-)" --service api
# ... continue for all secrets

# Or use Railway CLI bulk import (if available)
cat secrets-railway-api.txt | while read line; do
  KEY=$(echo $line | cut -d'=' -f1)
  VALUE=$(echo $line | cut -d'=' -f2-)
  railway variables set "$KEY=$VALUE" --service api
done

# Verify secrets are set
railway variables --service api

# Clean up plaintext files
shred -vfz -n 3 secrets-railway-api.txt
```

### 4.4 Secrets Rotation Schedule

**Regular rotation for security:**

| Secret                  | Rotation Frequency | Last Rotated | Next Rotation |
| ----------------------- | ------------------ | ------------ | ------------- |
| JWT_SECRET              | Every 90 days      | [Date]       | [Date]        |
| DATABASE_URL (password) | Every 180 days     | [Date]       | [Date]        |
| API Keys (3rd party)    | Annually           | [Date]       | [Date]        |
| Webhook Secrets         | On compromise      | [Date]       | As needed     |

**Rotation procedure:**

1. Generate new secret
2. Update in platform (Railway/Vercel)
3. Deploy applications with new secret
4. Verify all services working
5. Revoke old secret
6. Update backup vault

---

## 5. File Storage

### 5.1 Current State (Local/Temporary)

**Currently, file storage is minimal:**

- CleanScore photos: Temporarily stored (to be moved to S3)
- No user uploads currently
- All critical data in PostgreSQL

### 5.2 Future State (S3/Object Storage)

**When S3 is implemented:**

```bash
# S3 Bucket Configuration (planned)
Bucket: brisa-cubana-media-production
Region: us-east-1
Versioning: Enabled
Lifecycle:
  - Current version: Retain indefinitely
  - Previous versions: Retain 90 days
  - Deleted objects: Retain 30 days
Encryption: AES-256 (SSE-S3)
Backup: Cross-region replication to us-west-2

# Backup S3 to external storage
aws s3 sync s3://brisa-cubana-media-production \
  /backups/s3-$(date +%Y%m%d) \
  --storage-class GLACIER

# Restore from S3 backup
aws s3 sync /backups/s3-20251006 \
  s3://brisa-cubana-media-production-restore
```

---

## 6. Restoration Procedures

### 6.1 Database Full Restore

**Scenario: Complete database loss or corruption**

**Step 1: Assess the situation**

```bash
# Check if database is accessible
railway run --service postgres psql -c "SELECT version();"

# If database is corrupted or lost, proceed with restore
```

**Step 2: Create new database instance (if needed)**

```bash
# If current database is unrecoverable
railway run --service postgres psql -c "CREATE DATABASE brisa_production_restore;"
```

**Step 3: Restore from latest backup**

```bash
# Option A: Restore from Railway automated backup (via dashboard)
# 1. Go to Railway dashboard
# 2. Select PostgreSQL service
# 3. Navigate to Backups tab
# 4. Select latest backup
# 5. Click "Restore"

# Option B: Restore from manual backup
railway run --service postgres pg_restore \
  --dbname=brisa_production \
  --clean \
  --if-exists \
  --verbose \
  /path/to/backup-20251006.dump

# Option C: Restore from external backup
pg_restore \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=brisa_production \
  --clean \
  --if-exists \
  --verbose \
  backups/manual-20251006.dump
```

**Step 4: Verify restoration**

```bash
# Run verification script
./scripts/verify-backup.sh --mode full

# Manual verification queries
railway run --service postgres psql -d brisa_production -c "
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM properties) as properties,
  (SELECT COUNT(*) FROM bookings) as bookings,
  (SELECT COUNT(*) FROM payments) as payments,
  (SELECT COUNT(*) FROM cleanscore_reports) as reports,
  (SELECT MAX(created_at) FROM bookings) as latest_booking;
"
```

**Step 5: Reconnect application**

```bash
# Update DATABASE_URL if needed
railway variables set DATABASE_URL="postgresql://..." --service api

# Restart API service
railway up --service api --detach

# Verify API connectivity
curl https://api.brisacubana.com/health
```

**Estimated Time:** 30-45 minutes

### 6.2 Point-in-Time Recovery (PITR)

**Scenario: Restore to specific timestamp (e.g., before bad migration)**

**Step 1: Identify recovery point**

```bash
# Determine exact timestamp to restore to
# Example: 2025-10-06 14:30:00 UTC

RESTORE_TIMESTAMP="2025-10-06 14:30:00 UTC"
```

**Step 2: Execute PITR (Railway-specific)**

```bash
# Railway provides PITR through dashboard or CLI
railway run --service postgres -- \
  psql -c "SELECT pg_create_restore_point('before_bad_migration');"

# Restore using WAL replay to specific point
# Note: This typically requires Railway support or dashboard
# Contact: support@railway.app with timestamp

# Alternative: Restore to temporary database and export data
railway run --service postgres pg_restore \
  --dbname=brisa_production_pitr \
  --clean \
  backups/base-backup.dump

# Replay WAL logs up to specific timestamp
# (Railway automated process)
```

**Step 3: Verify recovery point**

```bash
railway run --service postgres psql -d brisa_production_pitr -c "
SELECT
  MAX(created_at) as latest_record,
  '$RESTORE_TIMESTAMP'::timestamp - MAX(created_at) as time_difference
FROM bookings;
"
```

**Step 4: Swap databases**

```bash
# Rename current database
railway run --service postgres psql -c \
  "ALTER DATABASE brisa_production RENAME TO brisa_production_old;"

# Rename restored database
railway run --service postgres psql -c \
  "ALTER DATABASE brisa_production_pitr RENAME TO brisa_production;"

# Update connection string if needed
railway variables set DATABASE_URL="..." --service api
railway up --service api --detach
```

**Estimated Time:** 45-60 minutes

### 6.3 Partial Table Restore

**Scenario: Single table corrupted (e.g., bookings table)**

**Step 1: Backup current state**

```bash
# Backup corrupted table (for forensics)
railway run --service postgres pg_dump \
  --table=bookings \
  --format=custom \
  --file=/tmp/bookings-corrupted-$(date +%Y%m%d-%H%M%S).dump \
  brisa_production
```

**Step 2: Restore table from backup**

```bash
# Option A: Restore single table from full backup
pg_restore \
  --table=bookings \
  --dbname=brisa_production \
  --clean \
  backups/latest-full.dump

# Option B: Restore to temporary database first (safer)
railway run --service postgres psql -c "CREATE DATABASE temp_restore;"
pg_restore --dbname=temp_restore backups/latest-full.dump

# Copy table from temp to production
railway run --service postgres psql -c "
  BEGIN;
  DROP TABLE IF EXISTS bookings CASCADE;
  CREATE TABLE bookings AS SELECT * FROM temp_restore.public.bookings;
  -- Recreate constraints and indexes
  ALTER TABLE bookings ADD PRIMARY KEY (id);
  -- ... add other constraints
  COMMIT;
"

# Drop temporary database
railway run --service postgres psql -c "DROP DATABASE temp_restore;"
```

**Step 3: Verify table integrity**

```bash
# Run specific table checks
./scripts/verify-backup.sh --table bookings

# Verify foreign key relationships
railway run --service postgres psql -c "
SELECT
  COUNT(*) as orphaned_bookings
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
WHERE u.id IS NULL;
"
```

**Estimated Time:** 20-30 minutes

### 6.4 Application Configuration Restore

**Scenario: Configuration error or deployment failure**

**Step 1: Identify last working state**

```bash
# Check git history for last stable commit
git log --oneline -10

# Identify deployment before issue
railway deployments --service api | head -10
```

**Step 2: Revert to stable state**

```bash
# Option A: Rollback deployment (fastest)
railway rollback --service api --to [DEPLOYMENT_ID]

# Option B: Git revert and redeploy
git checkout [STABLE_COMMIT_SHA]
git checkout -b hotfix/revert-bad-deploy
git push origin hotfix/revert-bad-deploy
railway up --service api

# Option C: Restore from configuration backup
tar -xzf backups/config-20251006-143000.tar.gz
cp config-20251006-143000/apps/api/.env.example apps/api/.env.example
git add . && git commit -m "Restore configuration from backup"
git push origin main
```

**Step 3: Verify application**

```bash
# Check deployment status
railway status --service api

# Verify health endpoints
curl https://api.brisacubana.com/health

# Run smoke tests
pnpm --filter @brisa/web test:e2e:smoke
```

**Estimated Time:** 10-20 minutes

### 6.5 Complete Disaster Recovery

**Scenario: Total infrastructure loss (region outage, provider failure)**

**Step 1: Provision new infrastructure**

```bash
# Create new Railway project
railway init

# Create PostgreSQL service
railway add --service postgres

# Create API service
railway add --service api

# Link to GitHub repository
railway link [GITHUB_REPO]
```

**Step 2: Restore database**

```bash
# Restore from external backup
pg_restore \
  --host=[NEW_DB_HOST] \
  --port=[NEW_DB_PORT] \
  --username=[NEW_DB_USER] \
  --dbname=brisa_production \
  --clean \
  /backups/latest-external-backup.dump
```

**Step 3: Configure secrets**

```bash
# Decrypt secrets backup
gpg --decrypt backups/secrets-railway-20251006.txt.gpg > secrets.txt

# Set all environment variables
cat secrets.txt | while read line; do
  railway variables set "$line" --service api
done
```

**Step 4: Deploy application**

```bash
# Deploy from git
railway up --service api
railway up --service web

# Or deploy from Docker
docker build -t brisa-api -f apps/api/Dockerfile .
docker push registry.railway.app/brisa-api:latest
railway up --service api --image registry.railway.app/brisa-api:latest
```

**Step 5: Update DNS and verify**

```bash
# Update DNS records to new Railway URLs
# Example: api.brisacubana.com -> [NEW_RAILWAY_URL]

# Verify complete system
./scripts/check-status.sh
./scripts/verify-backup.sh --mode full

# Run E2E tests
pnpm --filter @brisa/web test:e2e
```

**Estimated Time:** 60-90 minutes

---

## 7. Backup Validation

### 7.1 Automated Backup Verification

**Use the verification script:**

```bash
# Full verification (database + configuration)
./scripts/verify-backup.sh --mode full

# Database-only verification
./scripts/verify-backup.sh --mode database

# Integrity checks only
./scripts/verify-backup.sh --mode integrity

# Quick smoke test
./scripts/verify-backup.sh --mode smoke
```

### 7.2 Manual Verification Steps

**Weekly verification checklist:**

```bash
# 1. Verify backup exists and is recent
railway run --service postgres psql -c "
  SELECT
    pg_last_wal_receive_lsn() as wal_position,
    NOW() - pg_last_xact_replay_timestamp() as replication_lag;
"

# 2. Test backup file integrity
ls -lh backups/manual-*.dump
pg_restore --list backups/manual-latest.dump | head -20

# 3. Verify backup completeness
EXPECTED_TABLES=10  # Adjust based on schema
ACTUAL_TABLES=$(pg_restore --list backups/manual-latest.dump | grep "TABLE DATA" | wc -l)
if [ $ACTUAL_TABLES -eq $EXPECTED_TABLES ]; then
  echo "✅ Backup contains all tables"
else
  echo "❌ Backup missing tables: expected $EXPECTED_TABLES, got $ACTUAL_TABLES"
fi

# 4. Verify data counts
railway run --service postgres psql -c "
SELECT
  'users' as table_name, COUNT(*) FROM users UNION ALL
SELECT 'properties', COUNT(*) FROM properties UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
" > /tmp/current-counts.txt

# Compare with backup
pg_restore --data-only backups/manual-latest.dump | \
  psql -d temp_verify -c "
    SELECT 'users', COUNT(*) FROM users UNION ALL
    SELECT 'properties', COUNT(*) FROM properties;
  " > /tmp/backup-counts.txt

diff /tmp/current-counts.txt /tmp/backup-counts.txt
```

### 7.3 Restore Testing (Monthly)

**Test restore procedure monthly:**

```bash
#!/bin/bash
# Monthly restore test

# 1. Create test database
railway run --service postgres psql -c "DROP DATABASE IF EXISTS backup_test;"
railway run --service postgres psql -c "CREATE DATABASE backup_test;"

# 2. Restore latest backup
START_TIME=$(date +%s)
pg_restore \
  --dbname=backup_test \
  --clean \
  backups/manual-$(date +%Y%m%d).dump
END_TIME=$(date +%s)
RESTORE_TIME=$((END_TIME - START_TIME))

echo "Restore completed in $RESTORE_TIME seconds"

# 3. Verify restoration
railway run --service postgres psql -d backup_test -c "
  SELECT
    COUNT(*) as total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public';
"

# 4. Run integrity checks
railway run --service postgres psql -d backup_test -c "
  SELECT COUNT(*) FROM bookings WHERE user_id NOT IN (SELECT id FROM users);
" | grep -q "0" && echo "✅ Foreign key integrity OK" || echo "❌ Foreign key integrity FAILED"

# 5. Cleanup
railway run --service postgres psql -c "DROP DATABASE backup_test;"

# 6. Record results
echo "$(date): Restore test completed in ${RESTORE_TIME}s" >> logs/restore-tests.log
```

---

## 8. Testing and Drills

### 8.1 Backup Testing Schedule

| Test Type                | Frequency         | Last Executed | Next Scheduled |
| ------------------------ | ----------------- | ------------- | -------------- |
| **Backup Verification**  | Daily (automated) | [Date]        | [Date]         |
| **Restore Test (dev)**   | Weekly            | [Date]        | [Date]         |
| **Full DR Drill**        | Quarterly         | [Date]        | [Date]         |
| **PITR Test**            | Monthly           | [Date]        | [Date]         |
| **Partial Restore Test** | Monthly           | [Date]        | [Date]         |

### 8.2 Pre-Production Testing

**Before major releases, verify backups:**

```bash
# 1. Create fresh backup
./scripts/backup-all.sh

# 2. Test restoration to staging
pg_restore --dbname=staging backups/pre-release-$(date +%Y%m%d).dump

# 3. Run test suite against restored data
pnpm --filter @brisa/api test:integration

# 4. Verify E2E flows
pnpm --filter @brisa/web test:e2e

# 5. Document results
echo "$(date): Pre-release backup test passed" >> logs/backup-tests.log
```

### 8.3 Disaster Recovery Drill

**Quarterly comprehensive drill:**

See [DR Drill Procedure](./DR_DRILL_PROCEDURE.md) for complete process.

**Quick drill checklist:**

- [ ] Simulate database failure
- [ ] Execute restore procedure
- [ ] Verify RTO < 60 minutes
- [ ] Verify RPO < 15 minutes
- [ ] Test team coordination
- [ ] Document lessons learned
- [ ] Update runbooks if needed

---

## 9. Monitoring and Alerting

### 9.1 Backup Monitoring

**Set up alerts for backup failures:**

```bash
# Monitor backup age (alert if > 24 hours old)
LAST_BACKUP=$(railway run --service postgres psql -t -c \
  "SELECT MAX(backup_time) FROM pg_stat_archiver;")

BACKUP_AGE=$(( $(date +%s) - $(date -d "$LAST_BACKUP" +%s) ))
if [ $BACKUP_AGE -gt 86400 ]; then
  echo "⚠️ ALERT: Last backup is > 24 hours old"
  # Send alert to PagerDuty, Slack, etc.
fi

# Monitor WAL archiving
railway run --service postgres psql -c "
  SELECT
    archived_count,
    failed_count,
    last_archived_time
  FROM pg_stat_archiver;
"
```

### 9.2 Backup Health Dashboard

**Key metrics to monitor:**

| Metric               | Target                 | Alert Threshold |
| -------------------- | ---------------------- | --------------- |
| Last backup age      | < 24 hours             | > 24 hours      |
| Backup size          | Within 20% of previous | > 50% change    |
| Restore test success | 100%                   | < 100%          |
| WAL archive lag      | < 5 minutes            | > 15 minutes    |
| Backup storage usage | < 80% capacity         | > 90% capacity  |

---

## 10. Appendix

### 10.1 Quick Reference Commands

```bash
# Database Backup
railway run --service postgres pg_dump --format=custom -f backup.dump brisa_production

# Database Restore
railway run --service postgres pg_restore --dbname=brisa_production --clean backup.dump

# Verify Backup
./scripts/verify-backup.sh --mode full

# List Backups
railway backups --service postgres

# Point-in-Time Recovery
# Contact Railway support with target timestamp

# Export Secrets
railway variables --service api > secrets-backup.txt
gpg --symmetric --cipher-algo AES256 secrets-backup.txt
shred -vfz -n 3 secrets-backup.txt
```

### 10.2 Troubleshooting

**Common issues and solutions:**

| Issue                  | Cause            | Solution                                 |
| ---------------------- | ---------------- | ---------------------------------------- |
| pg_restore fails       | Version mismatch | Use `--no-owner --no-acl` flags          |
| Backup file corrupted  | Transfer error   | Re-download or use checksum verification |
| Restore takes too long | Large database   | Use parallel restore: `--jobs=4`         |
| Foreign key errors     | Restore order    | Use `--disable-triggers` (carefully)     |
| Connection timeout     | Network issues   | Increase `--connect-timeout`             |

### 10.3 Contact Information

**Backup/Restore Support:**

- Database Team: [Email]
- DevOps Team: [Email]
- Railway Support: support@railway.app
- Emergency Hotline: [Phone]

**External Resources:**

- Railway Backup Documentation: https://docs.railway.app/databases/postgresql#backups
- PostgreSQL PITR Guide: https://www.postgresql.org/docs/17/continuous-archiving.html

---

**Document Owner:** Database & Platform Team
**Review Frequency:** Quarterly
**Last Backup Drill:** [Date]
**Next Backup Drill:** [Date]
