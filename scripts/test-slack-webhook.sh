#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
  echo "Usage: SLACK_WEBHOOK_URL=... scripts/test-slack-webhook.sh [message]" >&2
  exit 1
fi

MESSAGE=${1:-"🧪 Test: Brisa Cubana monitoring webhook online"}

payload=$(jq -n --arg text "$MESSAGE" '{text: $text}')

curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$payload"

echo "Mensaje enviado. Verifica el canal asociado al webhook."
