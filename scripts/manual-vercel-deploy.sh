#!/usr/bin/env bash

# Manual fallback deployment helper for Web/API while CI is blocked.
# Usage:
#   scripts/manual-vercel-deploy.sh web
#   scripts/manual-vercel-deploy.sh api

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 <web|api>" >&2
  exit 1
fi

TARGET="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "$TARGET" in
  web)
    PROJECT_DIR="$ROOT_DIR"
    PREBUILD_DIR="$ROOT_DIR/.vercel/output"
    ;;
  api)
    PROJECT_DIR="$ROOT_DIR/apps/api"
    PREBUILD_DIR="$PROJECT_DIR/.vercel/output"
    ;;
  *)
    echo "Destino inválido: $TARGET (usa web o api)" >&2
    exit 1
    ;;
esac

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm no está instalado en este entorno." >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI no está instalado. Ejecuta 'pnpm add --global vercel' antes de continuar." >&2
  exit 1
fi

echo "➡️  Instalando dependencias..."
pnpm install --frozen-lockfile

if [[ "$TARGET" == "api" ]]; then
  (cd "$ROOT_DIR/apps/api" && pnpm exec prisma generate)
fi

echo "➡️  Ejecutando vercel pull..."
(
  cd "$PROJECT_DIR"
  vercel pull --yes --environment=production --scope brisa-cubana
)

echo "➡️  Construyendo prebuild..."
(
  cd "$PROJECT_DIR"
  vercel build --prod --scope brisa-cubana
)

echo "➡️  Desplegando prebuild a producción..."
URL="$(
  cd "$PROJECT_DIR"
  vercel deploy "$PREBUILD_DIR" --prebuilt --yes --prod --scope brisa-cubana
)"

echo "✅ Deploy de $TARGET completado: $URL"
