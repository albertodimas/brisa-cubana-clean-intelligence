#!/bin/bash
# scripts/cleanup-local-env.sh
# Limpia artefactos locales para mantener el entorno alineado con el repositorio.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "🧹 Limpiando artefactos locales..."
rm -rf node_modules .turbo .next
find apps -maxdepth 2 -name "node_modules" -type d -prune -exec rm -rf {} +
find apps -maxdepth 2 -name ".next" -type d -prune -exec rm -rf {} +
find apps -maxdepth 3 -name ".turbo" -type d -prune -exec rm -rf {} +

echo "📦 Instalando dependencias frescas..."
pnpm install

echo "✅ Entorno limpio y dependencias reinstaladas."
