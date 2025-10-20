#!/bin/bash
# scripts/verify-doc-structure.sh
# Garantiza que la documentación siga la estructura verificada del proyecto.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

violations=0

# 1. No debe haber markdowns sueltos en docs/ (excepto README.md)
unexpected_markdown=$(find docs -maxdepth 1 -type f -name "*.md" ! -name "README.md")
if [[ -n "${unexpected_markdown}" ]]; then
  echo "❌ Documentación fuera de estructura (docs/*.md):"
  echo "${unexpected_markdown}"
  violations=1
fi

# 2. Archivos obligatorios que deben existir
required_files=(
  "SECURITY.md"
  "docs/README.md"
  "docs/guides/quickstart.md"
  "docs/overview/status.md"
  "docs/reference/api-reference.md"
  "docs/reference/openapi.yaml"
  "docs/operations/security.md"
  "docs/operations/backup-recovery.md"
  "docs/operations/deployment.md"
  "docs/operations/backup-log.md"
  "docs/operations/observability.md"
  "docs/operations/observability-setup.md"
  "docs/operations/alerts.md"
  "docs/operations/incident-runbook.md"
  "docs/operations/sentry.md"
  "docs/qa/e2e-strategy.md"
  "docs/qa/regression-checklist.md"
  "docs/qa/performance-budgets.md"
  "docs/product/user-management.md"
  "docs/product/pagination.md"
  "docs/product/phase-2-roadmap.md"
  "docs/product/rfc-public-components.md"
  "docs/product/analytics-dashboard.md"
  "docs/archive/2025-10-08-session-log.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "${file}" ]]; then
    echo "❌ Falta archivo de documentación requerido: ${file}"
    violations=1
  fi
done

# 3. Patrones prohibidos (referencias a rutas antiguas o dispersas)
forbidden_patterns=(
  "docs/quickstart.md"
  "docs/status.md"
  "docs/SECURITY.md"
  "docs/BACKUP_RECOVERY.md"
  "docs/OBSERVABILITY.md"
  "docs/REGRESSION_CHECKLIST.md"
  "docs/E2E_STRATEGY.md"
  "docs/PERFORMANCE_BUDGETS.md"
  "docs/PAGINATION.md"
  "docs/USER_MANAGEMENT.md"
  "docs/API_DOCUMENTATION.md"
  "docs/SESSION_LOG.md"
  "docs/DEPLOYMENT.md"
)

for pattern in "${forbidden_patterns[@]}"; do
  if rg --fixed-strings --glob "*.md" --glob "*.yml" --glob "*.yaml" -q "${pattern}" docs README.md CHANGELOG.md .github; then
    echo "❌ Referencia obsoleta detectada: ${pattern}"
    violations=1
  fi
done

if [[ ${violations} -ne 0 ]]; then
  echo ""
  echo "🚫 Verificación de documentación fallida. Revisa los mensajes anteriores."
  exit 1
fi

echo "✅ Documentación verificada: estructura y referencias correctas."
