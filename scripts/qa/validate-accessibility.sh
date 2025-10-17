#!/bin/bash
#
# Script de validación de accesibilidad post-deploy
# Valida que los fixes de accesibilidad implementados funcionen correctamente en producción
#
# Uso:
#   bash scripts/qa/validate-accessibility.sh [environment]
#
# Parámetros:
#   environment: production | preview (default: production)
#
# Salida:
#   0 - Todos los checks pasaron
#   1 - Al menos un check falló
#
# Documentación relacionada:
#   - docs/qa/portal-accessibility.md
#   - docs/qa/regression-checklist.md §8
#
# Última actualización: 17-oct-2025

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
ENVIRONMENT="${1:-production}"
TIMEOUT=30

# URLs según entorno
if [[ "$ENVIRONMENT" == "production" ]]; then
  BASE_URL="https://brisa-cubana-clean-intelligence.vercel.app"
elif [[ "$ENVIRONMENT" == "preview" ]]; then
  BASE_URL="${VERCEL_URL:-https://brisa-cubana-clean-intelligence-git-main-brisa-cubana.vercel.app}"
else
  echo -e "${RED}❌ Entorno inválido: $ENVIRONMENT${NC}"
  echo "   Usar: production | preview"
  exit 1
fi

echo -e "${BLUE}🔍 Validación de Accesibilidad - Portal Cliente${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Entorno:     $ENVIRONMENT"
echo "Base URL:    $BASE_URL"
echo "Timestamp:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Contador de checks
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Función auxiliar para checks
run_check() {
  local check_name="$1"
  local check_command="$2"

  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo -n "[$TOTAL_CHECKS] $check_name... "

  if eval "$check_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${RED}✗${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

# ============================================================================
# CHECKS DE ACCESIBILIDAD
# ============================================================================

echo -e "${YELLOW}→ Verificando endpoints del portal${NC}"
echo ""

# Check 1: Portal landing está accesible
run_check \
  "Portal landing (/clientes) responde 200" \
  "curl -s -o /dev/null -w '%{http_code}' --max-time $TIMEOUT '$BASE_URL/clientes' | grep -q 200"

# Check 2: Portal auth está accesible
run_check \
  "Portal auth (/clientes/acceso) responde 200" \
  "curl -s -o /dev/null -w '%{http_code}' --max-time $TIMEOUT '$BASE_URL/clientes/acceso' | grep -q 200"

echo ""
echo -e "${YELLOW}→ Validando fixes de accesibilidad (commit ce37e09)${NC}"
echo ""

# Check 3: PortalCallout tiene aria-live
run_check \
  "PortalCallout incluye aria-live=\"polite\" en HTML" \
  "curl -s --max-time $TIMEOUT '$BASE_URL/clientes' | grep -q 'aria-live=\"polite\"'"

# Check 4: ArrowPathIcon tiene aria-hidden
# Nota: Este check es aproximado ya que requiere JS renderizado
run_check \
  "HTML incluye referencia a aria-hidden (verificar con DevTools)" \
  "curl -s --max-time $TIMEOUT '$BASE_URL/clientes' | grep -q 'aria-hidden'"

echo ""
echo -e "${YELLOW}→ Validando estructura semántica${NC}"
echo ""

# Check 5: Headings jerárquicos
run_check \
  "Portal tiene headings h1/h2 correctos" \
  "curl -s --max-time $TIMEOUT '$BASE_URL/clientes' | grep -qE '<h[12]'"

# Check 6: Landmarks ARIA
run_check \
  "Portal tiene landmarks semánticos (nav, main, section)" \
  "curl -s --max-time $TIMEOUT '$BASE_URL/clientes' | grep -qE '<(nav|main|section)'"

echo ""
echo -e "${YELLOW}→ Validando meta tags de accesibilidad${NC}"
echo ""

# Check 7: Lang attribute
run_check \
  "HTML tiene atributo lang=\"es\"" \
  "curl -s --max-time $TIMEOUT '$BASE_URL/clientes' | grep -q '<html lang=\"es\"'"

# Check 8: Viewport meta
run_check \
  "HTML tiene viewport meta correcto" \
  "curl -s --max-time $TIMEOUT '$BASE_URL/clientes' | grep -q 'viewport'"

# ============================================================================
# RESUMEN
# ============================================================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Resumen de Validación${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Total checks:    $TOTAL_CHECKS"
echo -e "Pasados:         ${GREEN}$PASSED_CHECKS ✓${NC}"

if [[ $FAILED_CHECKS -gt 0 ]]; then
  echo -e "Fallidos:        ${RED}$FAILED_CHECKS ✗${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  Acción requerida:${NC}"
  echo "   1. Revisar logs de deployment en Vercel"
  echo "   2. Verificar que el build incluye los cambios del commit ce37e09"
  echo "   3. Ejecutar validación manual con axe DevTools + Lighthouse"
  echo "   4. Actualizar docs/qa/portal-accessibility.md con resultados"
  echo ""
  exit 1
else
  echo -e "Fallidos:        ${GREEN}0 ✓${NC}"
  echo ""
  echo -e "${GREEN}✅ Validación exitosa${NC}"
  echo ""
  echo -e "${YELLOW}📋 Próximos pasos:${NC}"
  echo "   1. Ejecutar validación manual con NVDA para confirmar aria-live"
  echo "   2. Correr Lighthouse en /clientes para confirmar score 100/100"
  echo "   3. Actualizar tabla §4 en docs/qa/portal-accessibility.md"
  echo "   4. Marcar validación post-deploy como completa en checklist"
  echo ""
  exit 0
fi
