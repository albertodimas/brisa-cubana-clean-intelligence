#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

log_file="$(mktemp)"
trap 'rm -f "$log_file"' EXIT

if pnpm --filter @brisa/api db:deploy 2>&1 | tee "$log_file"; then
  exit 0
fi

if ! grep -q "P3005" "$log_file" && ! grep -q "P3018" "$log_file"; then
  echo "::error::Prisma migrate deploy failed. Baseline fallback skipped because the error is not P3005."
  exit 1
fi

if grep -q "P3018" "$log_file"; then
  failing_migration="$(grep -m1 'Migration name:' "$log_file" | awk '{print $3}')"
  if [ -z "$failing_migration" ]; then
    echo "::error::Prisma migrate deploy failed with P3018 but migration name could not be determined."
    exit 1
  fi
  echo "::warning::Detected Prisma P3018 (migration already applied). Marking '$failing_migration' as applied before retrying..."
  if ! pnpm --filter @brisa/api exec -- prisma migrate resolve --applied "$failing_migration" >/dev/null 2>&1; then
    echo "::error::Failed to mark migration '$failing_migration' as applied."
    exit 1
  fi
  pnpm --filter @brisa/api db:deploy
  exit 0
fi

echo "::warning::Detected Prisma baseline issue (P3005). Marking migrations as applied before retrying..."

baseline_failed=0
while IFS= read -r migration_dir; do
  if [ -n "$migration_dir" ]; then
    if ! pnpm --filter @brisa/api exec -- prisma migrate resolve --applied "$migration_dir" >/dev/null 2>&1; then
      echo "::error::Failed to mark migration '$migration_dir' as applied."
      baseline_failed=1
    fi
  fi
done < <(ls apps/api/prisma/migrations | sort)

if [ "$baseline_failed" -ne 0 ]; then
  exit 1
fi

pnpm --filter @brisa/api db:deploy
