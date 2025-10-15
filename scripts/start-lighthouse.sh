#!/usr/bin/env bash
set -euo pipefail

export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"
export INTERNAL_API_URL="${INTERNAL_API_URL:-http://localhost:3001}"

pnpm --filter @brisa/api start &
API_PID=$!

pnpm --filter @brisa/web start &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT

wait "$API_PID" "$WEB_PID"
