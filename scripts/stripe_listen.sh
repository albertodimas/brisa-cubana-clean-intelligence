#!/usr/bin/env bash
set -euo pipefail

if ! command -v stripe >/dev/null 2>&1; then
  echo "[stripe-listen] No se encontró la CLI de Stripe. Instálala desde https://stripe.com/docs/stripe-cli." >&2
  exit 1
fi

FORWARD_URL="${STRIPE_WEBHOOK_FORWARD_URL:-http://localhost:3001/api/payments/webhook}"
EVENTS="checkout.session.completed,checkout.session.expired,payment_intent.payment_failed"

cat <<MSG
[stripe-listen] Iniciando reenvío de eventos a ${FORWARD_URL}
[stripe-listen] Se escucharán los eventos: ${EVENTS}
[stripe-listen] Copia el valor de 'Signing secret' que muestre la CLI en STRIPE_WEBHOOK_SECRET para validar las peticiones.
MSG

stripe listen --events "${EVENTS}" --forward-to "${FORWARD_URL}"
