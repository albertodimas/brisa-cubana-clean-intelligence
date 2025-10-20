#!/usr/bin/env bash
set -euo pipefail

RESULT_FILE=".lighthouseci/assertion-results.json"
if [[ ! -f "$RESULT_FILE" ]]; then
  echo "::error::No se encontró $RESULT_FILE. Ejecuta 'pnpm exec lhci autorun' antes de validar."
  exit 1
fi

allowed_warnings=("legacy-javascript" "render-blocking-insight" "network-dependency-tree-insight")

mapfile -t warnings < <(jq -r '.[] | select(.category=="warning") | .name' "$RESULT_FILE" | sort -u)

fail=0
for warning in "${warnings[@]}"; do
  skip=0
  for allowed in "${allowed_warnings[@]}"; do
    if [[ "$warning" == "$allowed" ]]; then
      skip=1
      break
    fi
  done
  if [[ "$skip" -eq 1 ]]; then
    continue
  fi
  echo "::error::Advertencia de Lighthouse no permitida: ${warning}"
  fail=1
done

if [[ "$fail" -eq 1 ]]; then
  echo "Fallo: se detectaron advertencias no listadas en el allowlist."
  exit 1
fi

echo "✅ Advertencias de Lighthouse dentro del allowlist controlado."
