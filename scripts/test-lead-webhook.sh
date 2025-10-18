#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${LEAD_WEBHOOK_URL:-}" ]]; then
  echo "LEAD_WEBHOOK_URL no está definido. Exporta la variable antes de ejecutar este script." >&2
  exit 1
fi

payload=${1:-'{"event":"landing_lead.test","payload":{"name":"qa","email":"qa@example.com","propertyCount":"1-5 unidades"}}'}

curl -v "$LEAD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$payload"
