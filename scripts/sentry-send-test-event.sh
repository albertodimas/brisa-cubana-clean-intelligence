#!/usr/bin/env bash
set -euo pipefail

# Envía un evento a Sentry usando sentry-cli para probar la integración (Slack/Email).
# Uso:
#   SENTRY_AUTH_TOKEN=... SENTRY_ORG=... SENTRY_PROJECT=... pnpm sentry:test-event "Mensaje opcional"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm no está instalado en este entorno." >&2
  exit 1
fi

MESSAGE=${1:-"Manual test event from scripts/sentry-send-test-event.sh"}
ENVIRONMENT=${SENTRY_ENVIRONMENT:-production}
RELEASE=${SENTRY_RELEASE:-"cli-test-"$(date +"%Y%m%d%H%M%S")}

echo "▶️ Enviando evento de prueba a Sentry (env=${ENVIRONMENT}, release=${RELEASE})..."

pnpm exec sentry-cli send-event \
  --message "$MESSAGE" \
  --env "$ENVIRONMENT" \
  --level error \
  --release "$RELEASE" \
  --tag source=cli-test \
  --tag trigger=runbook \
  --tag environment="$ENVIRONMENT"

echo "✅ Evento enviado. Verifica la alerta correspondiente en Slack/Email."
