#!/usr/bin/env bash

# Reporte resumido de deployments en Vercel para un proyecto enlazado.
# Uso:
#   VERCEL_TOKEN=xxx ./scripts/report-vercel-deployments.sh [ruta_proyecto]
#
# Si no se indica ruta, usa el proyecto web (.)
# Para API, ejecutar: ./scripts/report-vercel-deployments.sh apps/api

set -euo pipefail

root_dir="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
project_path="${1:-.}"
config_path="$root_dir/${project_path%/}/.vercel/project.json"

if [[ ! -f "$config_path" ]]; then
  echo "❌ No se encontró $config_path. Asegúrate de ejecutar este script en un repo vinculado a Vercel." >&2
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "❌ La variable VERCEL_TOKEN no está definida. Exporta el token de Vercel antes de ejecutar el script." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ El comando 'jq' es requerido para procesar la respuesta JSON." >&2
  exit 1
fi

project_id="$(jq -r '.projectId' "$config_path")"
org_id="$(jq -r '.orgId' "$config_path")"
project_name="$(jq -r '.projectName // "desconocido"' "$config_path")"
limit="${LIMIT:-10}"

response="$(curl -fsSL \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?teamId=${org_id}&projectId=${project_id}&limit=${limit}")"

echo "Últimos $limit deployments para '${project_name}'"
echo ""

echo "$response" | jq -r '
  ["Edad(min)", "Entorno", "Estado", "Autor", "URL"],
  ( .deployments[]
    | [
        ((now - (.createdAt / 1000)) / 60 | floor),
        (.target // "desconocido"),
        .state,
        (.creator?.username // .meta?.githubCommitAuthorName // "-"),
        ("https://" + .url)
      ]
  )
  | @tsv' | column -t

echo ""
echo "Conteo por entorno (en la ventana consultada):"
echo "$response" | jq -r '
  (.deployments
    | group_by(.target)
    | sort_by(-length)
    | map({target: (.[0].target // "desconocido"), count: length})
    | .[]
  | "\(.target // "desconocido"): \(.count)")'

prod_recent="$(echo "$response" | jq '[.deployments[] | select(.target == "production")] | length')"
if [[ "$prod_recent" -gt 1 ]]; then
  echo ""
  echo "⚠️ Atención: hay $prod_recent deployments marcados como production en la ventana consultada. Revisa si fue una promoción manual o si existe un flujo duplicado."
fi
