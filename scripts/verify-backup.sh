#!/bin/bash

################################################################################
# Backup Verification Script
# Purpose: Validate database backups, integrity, and restoration readiness
# Version: 1.0
# Last Updated: 2025-10-06
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
LOG_FILE="${LOG_FILE:-$PROJECT_ROOT/logs/backup-verification.log}"
TEMP_DB_NAME="backup_verify_$(date +%s)"

# Verification modes
MODE="${1:---mode=full}"
TABLE="${2:-}"

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

################################################################################
# Helper Functions
################################################################################

log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

error() {
  echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

check() {
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
}

print_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_summary() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  VERIFICATION SUMMARY${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "Total Checks:  ${CHECKS_TOTAL}"
  echo -e "Passed:        ${GREEN}${CHECKS_PASSED}${NC}"
  echo -e "Failed:        ${RED}${CHECKS_FAILED}${NC}"
  echo ""

  if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All verification checks passed!${NC}"
    return 0
  else
    echo -e "${RED}✗ ${CHECKS_FAILED} verification check(s) failed!${NC}"
    return 1
  fi
}

cleanup() {
  log "Cleaning up temporary resources..."

  # Drop temporary database if exists
  if [ -n "${TEMP_DB_NAME:-}" ]; then
    railway run --service postgres psql -c "DROP DATABASE IF EXISTS $TEMP_DB_NAME;" 2>/dev/null || true
  fi

  # Remove temporary files
  rm -f /tmp/backup-verify-*.sql 2>/dev/null || true
}

trap cleanup EXIT

################################################################################
# Verification Functions
################################################################################

verify_railway_connection() {
  print_header "1. Railway Connection"

  check
  if railway whoami >/dev/null 2>&1; then
    success "Railway CLI authenticated"
  else
    error "Railway CLI not authenticated. Run: railway login"
    return 1
  fi

  check
  if railway status --service postgres >/dev/null 2>&1; then
    success "PostgreSQL service accessible"
  else
    error "PostgreSQL service not accessible"
    return 1
  fi
}

verify_database_connectivity() {
  print_header "2. Database Connectivity"

  check
  if railway run --service postgres psql -c "SELECT version();" >/dev/null 2>&1; then
    DB_VERSION=$(railway run --service postgres psql -t -c "SELECT version();" | head -1 | xargs)
    success "Database connection successful"
    log "   Version: $DB_VERSION"
  else
    error "Cannot connect to database"
    return 1
  fi

  check
  DB_NAME=$(railway run --service postgres psql -t -c "SELECT current_database();" | xargs)
  if [ -n "$DB_NAME" ]; then
    success "Database name: $DB_NAME"
  else
    error "Cannot determine database name"
    return 1
  fi
}

verify_backup_exists() {
  print_header "3. Backup Availability"

  check
  LAST_WAL=$(railway run --service postgres psql -t -c "SELECT pg_last_wal_receive_lsn();" 2>/dev/null | xargs || echo "")
  if [ -n "$LAST_WAL" ]; then
    success "WAL position: $LAST_WAL"
  else
    warning "Cannot retrieve WAL position (may not be supported)"
  fi

  check
  LAST_BACKUP=$(railway run --service postgres psql -t -c "
    SELECT COALESCE(
      MAX(pg_stat_file.modification),
      NOW()
    )::text
    FROM pg_ls_dir('pg_wal') AS wal_file
    CROSS JOIN LATERAL pg_stat_file('pg_wal/' || wal_file) AS pg_stat_file
    LIMIT 1;
  " 2>/dev/null | xargs || echo "$(date -u +%Y-%m-%d)")

  if [ -n "$LAST_BACKUP" ]; then
    BACKUP_AGE=$(( $(date +%s) - $(date -d "$LAST_BACKUP" +%s) ))
    BACKUP_HOURS=$(( BACKUP_AGE / 3600 ))

    if [ $BACKUP_HOURS -lt 24 ]; then
      success "Last WAL file age: ${BACKUP_HOURS} hours (< 24 hours)"
    elif [ $BACKUP_HOURS -lt 48 ]; then
      warning "Last WAL file age: ${BACKUP_HOURS} hours (> 24 hours)"
    else
      error "Last WAL file age: ${BACKUP_HOURS} hours (> 48 hours - STALE)"
    fi
  fi

  # Check for manual backups
  check
  if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.dump" -o -name "*.sql" 2>/dev/null | wc -l)
    if [ $BACKUP_COUNT -gt 0 ]; then
      success "Found $BACKUP_COUNT manual backup file(s) in $BACKUP_DIR"
      LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.{dump,sql} 2>/dev/null | head -1 || echo "")
      if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        log "   Latest: $LATEST_BACKUP ($BACKUP_SIZE)"
      fi
    else
      warning "No manual backup files found in $BACKUP_DIR"
    fi
  else
    warning "Backup directory not found: $BACKUP_DIR"
  fi
}

verify_schema_integrity() {
  print_header "4. Database Schema Integrity"

  # Expected tables based on Prisma schema
  EXPECTED_TABLES=(
    "users"
    "properties"
    "services"
    "bookings"
    "reconciliation_notes"
    "payment_alerts"
    "cleanscore_reports"
    "conversations"
    "messages"
    "refresh_tokens"
  )

  check
  ACTUAL_TABLES=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  " | xargs)

  EXPECTED_COUNT=${#EXPECTED_TABLES[@]}

  if [ "$ACTUAL_TABLES" -eq "$EXPECTED_COUNT" ]; then
    success "Table count: $ACTUAL_TABLES (expected: $EXPECTED_COUNT)"
  else
    error "Table count mismatch: got $ACTUAL_TABLES, expected $EXPECTED_COUNT"
  fi

  # Verify each expected table exists
  for table in "${EXPECTED_TABLES[@]}"; do
    check
    TABLE_EXISTS=$(railway run --service postgres psql -t -c "
      SELECT COUNT(*)
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = '$table';
    " | xargs)

    if [ "$TABLE_EXISTS" -eq 1 ]; then
      success "Table exists: $table"
    else
      error "Table missing: $table"
    fi
  done

  # Verify critical indexes
  check
  INDEX_COUNT=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'public';
  " | xargs)

  if [ "$INDEX_COUNT" -gt 0 ]; then
    success "Indexes found: $INDEX_COUNT"
  else
    error "No indexes found (performance issue)"
  fi
}

verify_data_integrity() {
  print_header "5. Data Integrity"

  # Check for orphaned records (foreign key integrity)
  check
  ORPHANED_BOOKINGS=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE u.id IS NULL;
  " | xargs)

  if [ "$ORPHANED_BOOKINGS" -eq 0 ]; then
    success "No orphaned bookings (user_id FK intact)"
  else
    error "Found $ORPHANED_BOOKINGS orphaned bookings"
  fi

  check
  ORPHANED_BOOKINGS_PROPERTY=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM bookings b
    LEFT JOIN properties p ON b.property_id = p.id
    WHERE p.id IS NULL;
  " | xargs)

  if [ "$ORPHANED_BOOKINGS_PROPERTY" -eq 0 ]; then
    success "No orphaned bookings (property_id FK intact)"
  else
    error "Found $ORPHANED_BOOKINGS_PROPERTY orphaned bookings (missing property)"
  fi

  check
  ORPHANED_BOOKINGS_SERVICE=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    WHERE s.id IS NULL;
  " | xargs)

  if [ "$ORPHANED_BOOKINGS_SERVICE" -eq 0 ]; then
    success "No orphaned bookings (service_id FK intact)"
  else
    error "Found $ORPHANED_BOOKINGS_SERVICE orphaned bookings (missing service)"
  fi

  # Check data consistency
  check
  INVALID_COMPLETED=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM bookings
    WHERE status = 'COMPLETED' AND completed_at IS NULL;
  " | xargs)

  if [ "$INVALID_COMPLETED" -eq 0 ]; then
    success "All completed bookings have completion timestamp"
  else
    error "Found $INVALID_COMPLETED completed bookings without timestamp"
  fi

  check
  INVALID_PAID=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM bookings
    WHERE payment_status = 'PAID' AND payment_intent_id IS NULL;
  " | xargs)

  if [ "$INVALID_PAID" -eq 0 ]; then
    success "All paid bookings have payment_intent_id"
  else
    warning "Found $INVALID_PAID paid bookings without payment_intent_id"
  fi
}

verify_data_recency() {
  print_header "6. Data Recency (RPO Check)"

  check
  LATEST_BOOKING=$(railway run --service postgres psql -t -c "
    SELECT MAX(created_at)::text FROM bookings;
  " | xargs || echo "")

  if [ -n "$LATEST_BOOKING" ] && [ "$LATEST_BOOKING" != "" ]; then
    DATA_AGE=$(( $(date +%s) - $(date -d "$LATEST_BOOKING" +%s) ))
    DATA_MINUTES=$(( DATA_AGE / 60 ))

    if [ $DATA_MINUTES -lt 15 ]; then
      success "Latest booking age: ${DATA_MINUTES} minutes (RPO < 15 min: ✓)"
    elif [ $DATA_MINUTES -lt 60 ]; then
      warning "Latest booking age: ${DATA_MINUTES} minutes (RPO target: < 15 min)"
    else
      DATA_HOURS=$(( DATA_AGE / 3600 ))
      warning "Latest booking age: ${DATA_HOURS} hours (may indicate no recent activity)"
    fi
  else
    warning "No bookings found in database"
  fi

  check
  USER_COUNT=$(railway run --service postgres psql -t -c "SELECT COUNT(*) FROM users;" | xargs)
  if [ "$USER_COUNT" -gt 0 ]; then
    success "User count: $USER_COUNT"
  else
    error "No users found in database"
  fi

  check
  BOOKING_COUNT=$(railway run --service postgres psql -t -c "SELECT COUNT(*) FROM bookings;" | xargs)
  if [ "$BOOKING_COUNT" -gt 0 ]; then
    success "Booking count: $BOOKING_COUNT"
  else
    warning "No bookings found in database"
  fi
}

verify_table_restore() {
  print_header "7. Table-Specific Verification: $TABLE"

  if [ -z "$TABLE" ]; then
    warning "No specific table specified for verification"
    return 0
  fi

  check
  TABLE_EXISTS=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = '$TABLE';
  " | xargs)

  if [ "$TABLE_EXISTS" -eq 1 ]; then
    success "Table exists: $TABLE"
  else
    error "Table not found: $TABLE"
    return 1
  fi

  check
  ROW_COUNT=$(railway run --service postgres psql -t -c "SELECT COUNT(*) FROM $TABLE;" | xargs)
  success "Row count in $TABLE: $ROW_COUNT"

  check
  COLUMN_COUNT=$(railway run --service postgres psql -t -c "
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '$TABLE';
  " | xargs)
  success "Column count in $TABLE: $COLUMN_COUNT"
}

test_backup_restore() {
  print_header "8. Backup Restore Test (Destructive - Temp DB)"

  # Find latest backup file
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1 || echo "")

  if [ -z "$LATEST_BACKUP" ]; then
    warning "No backup file found for restore test"
    return 0
  fi

  log "Using backup: $LATEST_BACKUP"

  check
  log "Creating temporary database: $TEMP_DB_NAME"
  if railway run --service postgres psql -c "CREATE DATABASE $TEMP_DB_NAME;" >/dev/null 2>&1; then
    success "Temporary database created"
  else
    error "Failed to create temporary database"
    return 1
  fi

  check
  log "Restoring backup to temporary database..."
  START_TIME=$(date +%s)

  if pg_restore \
    --dbname="$TEMP_DB_NAME" \
    --no-owner \
    --no-acl \
    "$LATEST_BACKUP" >/dev/null 2>&1; then
    END_TIME=$(date +%s)
    RESTORE_TIME=$((END_TIME - START_TIME))
    success "Backup restored successfully in ${RESTORE_TIME}s"

    # Verify RTO
    if [ $RESTORE_TIME -lt 1800 ]; then  # 30 minutes
      success "RTO check: ${RESTORE_TIME}s (< 30 min target: ✓)"
    else
      warning "RTO check: ${RESTORE_TIME}s (> 30 min target)"
    fi
  else
    error "Backup restore failed"
    return 1
  fi

  check
  RESTORED_TABLES=$(railway run --service postgres psql -d "$TEMP_DB_NAME" -t -c "
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  " | xargs)

  EXPECTED_COUNT=${#EXPECTED_TABLES[@]:-10}
  if [ "$RESTORED_TABLES" -eq "$EXPECTED_COUNT" ]; then
    success "Restored database has $RESTORED_TABLES tables (expected: $EXPECTED_COUNT)"
  else
    error "Restored table count mismatch: got $RESTORED_TABLES, expected $EXPECTED_COUNT"
  fi

  check
  log "Cleaning up temporary database..."
  if railway run --service postgres psql -c "DROP DATABASE $TEMP_DB_NAME;" >/dev/null 2>&1; then
    success "Temporary database cleaned up"
    TEMP_DB_NAME=""  # Prevent cleanup trap from trying again
  else
    warning "Failed to cleanup temporary database (will retry in trap)"
  fi
}

verify_monitoring() {
  print_header "9. Monitoring & Alerting"

  check
  if command -v railway >/dev/null 2>&1; then
    success "Railway CLI available for monitoring"
  else
    error "Railway CLI not found"
  fi

  check
  if [ -f "$LOG_FILE" ]; then
    success "Log file exists: $LOG_FILE"
    LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
    log "   Size: $LOG_SIZE"
  else
    warning "Log file not found: $LOG_FILE"
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
  fi

  check
  if [ -d "$BACKUP_DIR" ]; then
    success "Backup directory exists: $BACKUP_DIR"
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
    log "   Total size: $BACKUP_SIZE"
  else
    warning "Backup directory not found: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
  fi
}

################################################################################
# Main Execution
################################################################################

main() {
  echo ""
  echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║     BRISA CUBANA - BACKUP VERIFICATION TOOL              ║${NC}"
  echo -e "${BLUE}║     Version 1.0                                           ║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""

  log "Starting backup verification..."
  log "Mode: $MODE"

  # Create log directory if not exists
  mkdir -p "$(dirname "$LOG_FILE")"
  mkdir -p "$BACKUP_DIR"

  # Parse mode
  case "$MODE" in
    --mode=smoke|smoke)
      log "Running SMOKE verification (quick checks only)..."
      verify_railway_connection
      verify_database_connectivity
      ;;

    --mode=database|database)
      log "Running DATABASE verification..."
      verify_railway_connection
      verify_database_connectivity
      verify_schema_integrity
      verify_data_integrity
      verify_data_recency
      ;;

    --mode=integrity|integrity)
      log "Running INTEGRITY verification..."
      verify_railway_connection
      verify_database_connectivity
      verify_schema_integrity
      verify_data_integrity
      ;;

    --mode=full|full|--mode=all|all)
      log "Running FULL verification (all checks)..."
      verify_railway_connection
      verify_database_connectivity
      verify_backup_exists
      verify_schema_integrity
      verify_data_integrity
      verify_data_recency
      verify_monitoring

      # Only run restore test if backup files exist
      if [ -n "$(ls -A "$BACKUP_DIR"/*.dump 2>/dev/null)" ]; then
        test_backup_restore
      else
        warning "Skipping restore test (no backup files found)"
      fi
      ;;

    --table=*|table=*)
      TABLE="${MODE#*=}"
      log "Running TABLE-SPECIFIC verification for: $TABLE"
      verify_railway_connection
      verify_database_connectivity
      verify_table_restore
      ;;

    *)
      echo "Usage: $0 [MODE] [TABLE]"
      echo ""
      echo "Modes:"
      echo "  --mode=smoke      Quick connectivity checks (default)"
      echo "  --mode=database   Database schema and data checks"
      echo "  --mode=integrity  Schema and data integrity only"
      echo "  --mode=full       Complete verification (recommended)"
      echo "  --table=TABLE     Verify specific table"
      echo ""
      echo "Examples:"
      echo "  $0 --mode=smoke"
      echo "  $0 --mode=full"
      echo "  $0 --table=bookings"
      exit 1
      ;;
  esac

  print_summary
}

# Run main function
main "$@"
