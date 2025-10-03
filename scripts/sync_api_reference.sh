#!/usr/bin/env bash
set -euo pipefail

SRC="apps/api/API_ENDPOINTS.md"
DEST="docs/for-developers/api-reference.md"

if [[ ! -f "$SRC" ]]; then
  echo "⚠️  No se encontró $SRC" >&2
  exit 1
fi

cp "$SRC" "$DEST"
echo "✓ Sincronizado $DEST desde $SRC"
