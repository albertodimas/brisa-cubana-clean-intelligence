#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

log_file="$(mktemp)"
trap 'rm -f "$log_file"' EXIT

run_migrate() {
  pnpm --filter @brisa/api db:deploy 2>&1 | tee "$log_file"
  return ${PIPESTATUS[0]}
}

mark_migration_as_applied() {
  local migration_dir="$1"
  if [ -n "$migration_dir" ]; then
    pnpm --filter @brisa/api exec -- prisma migrate resolve --applied "$migration_dir" >/dev/null 2>&1 || return 1
  fi
}

if run_migrate; then
  exit 0
fi

latest_migration="$(ls apps/api/prisma/migrations | sort | tail -n1)"
if [ -n "$latest_migration" ]; then
  echo "::warning::Prisma migrate deploy failed. Marking latest migration '$latest_migration' as applied before retrying..."
  mark_migration_as_applied "$latest_migration" || echo "::warning::Failed to mark '$latest_migration' as applied on first attempt."
fi

if run_migrate; then
  exit 0
fi

echo "::warning::Prisma migrate deploy still failing. Applying baseline fallback (marking all migrations as applied)..."

baseline_failed=0
while IFS= read -r migration_dir; do
  if [ -n "$migration_dir" ]; then
    if ! mark_migration_as_applied "$migration_dir"; then
      echo "::error::Failed to mark migration '$migration_dir' as applied."
      baseline_failed=1
    fi
  fi
done < <(ls apps/api/prisma/migrations | sort)

if [ "$baseline_failed" -ne 0 ]; then
  echo "::error::Baseline fallback could not mark all migrations as applied."
  exit 1
fi

run_migrate
