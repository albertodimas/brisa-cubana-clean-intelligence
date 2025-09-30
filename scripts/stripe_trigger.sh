#!/usr/bin/env bash
set -euo pipefail

if ! command -v stripe >/dev/null 2>&1; then
  echo "[stripe-trigger] CLI de Stripe no encontrada. Instálala desde https://stripe.com/docs/stripe-cli." >&2
  exit 1
fi

EVENT=${1:-checkout.session.completed}

case "$EVENT" in
  checkout.session.completed|checkout.session.expired|payment_intent.payment_failed)
    ;;
  *)
    echo "[stripe-trigger] Evento no soportado: $EVENT" >&2
    echo "Usa uno de: checkout.session.completed, checkout.session.expired, payment_intent.payment_failed" >&2
    exit 1
    ;;
end

stripe trigger "$EVENT"
