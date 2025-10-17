#!/usr/bin/env bash
set -euo pipefail

export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"
export INTERNAL_API_URL="${INTERNAL_API_URL:-http://localhost:3001}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/brisa_cubana_e2e}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export JWT_SECRET="${JWT_SECRET:-test-jwt-secret}"
export AUTH_SECRET="${AUTH_SECRET:-test-auth-secret}"
export ENABLE_TEST_UTILS="${ENABLE_TEST_UTILS:-false}"
export LHCI_BYPASS_TOKEN="${LHCI_BYPASS_TOKEN:-local-lhci-bypass}"
export ENABLE_HSTS="${ENABLE_HSTS:-false}"

pnpm --filter @brisa/api build >/dev/null
pnpm --filter @brisa/web build >/dev/null

pnpm --filter @brisa/api start &
API_PID=$!

pnpm --filter @brisa/web start &
WEB_PID=$!

for attempt in {1..60}; do
  if curl -sf "http://localhost:3000/lhci.html?__lhci_bypass=local" >/dev/null 2>&1; then
    echo "http://localhost:3000 ready"
    break
  fi
  sleep 1
done

cleanup() {
  kill "$API_PID" "$WEB_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT

wait "$API_PID" "$WEB_PID"
