#!/bin/bash
# scripts/verify-no-secrets.sh
# Verifica que no se commiteen archivos .env con credenciales reales

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Verificando archivos de entorno..."

# Lista de archivos .env que NO deben estar en el repo (excepto .env.example)
FORBIDDEN_ENV_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  "apps/api/.env"
  "apps/api/.env.local"
  "apps/api/.env.production"
  "apps/web/.env"
  "apps/web/.env.local"
  "apps/web/.env.production"
)

ERRORS=0

for file in "${FORBIDDEN_ENV_FILES[@]}"; do
  if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: Archivo prohibido encontrado en Git: $file${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done

# Verificar si hay archivos staged con extensión .env (excepto .example)
STAGED_ENV_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.env(\.|$)' | grep -v '\.env\.example$' || true)

if [ -n "$STAGED_ENV_FILES" ]; then
  echo -e "${RED}❌ ERROR: Intentando commitear archivos .env:${NC}"
  echo "$STAGED_ENV_FILES"
  ERRORS=$((ERRORS + 1))
fi

# Verificar que no haya URLs de producción en archivos staged
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|md)$' || true)

if [ -n "$STAGED_FILES" ]; then
  # Buscar patrones sospechosos de credenciales de producción
  PROD_PATTERNS=(
    "neon\.tech"
    "postgresql://.*@ep-"
    "npg_[A-Za-z0-9]+"
    "aws_secret_access_key"
    "AKIA[0-9A-Z]{16}"
    "sk-[A-Za-z0-9]{32,}"
  )

  for pattern in "${PROD_PATTERNS[@]}"; do
    MATCHES=$(git diff --cached -U0 | grep -E "^\+.*$pattern" | grep -v "^\+\+\+" || true)
    if [ -n "$MATCHES" ]; then
      echo -e "${YELLOW}⚠️  WARNING: Posible credencial de producción detectada (patrón: $pattern):${NC}"
      echo "$MATCHES"
      echo ""
      echo -e "${YELLOW}Si esto es intencional (ej. documentación), añade un comentario explicando.${NC}"
      # No incrementamos ERRORS aquí, solo warning
    fi
  done
fi

# Verificar .gitignore tiene las entradas necesarias
REQUIRED_GITIGNORE_ENTRIES=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
)

MISSING_GITIGNORE=0
for entry in "${REQUIRED_GITIGNORE_ENTRIES[@]}"; do
  if ! grep -q "^$entry$" .gitignore 2>/dev/null; then
    if [ $MISSING_GITIGNORE -eq 0 ]; then
      echo -e "${YELLOW}⚠️  WARNING: Entradas faltantes en .gitignore:${NC}"
    fi
    echo "  - $entry"
    MISSING_GITIGNORE=1
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ VERIFICACIÓN FALLÓ: $ERRORS error(es) encontrado(s)${NC}"
  echo ""
  echo "Para solucionar:"
  echo "  1. git rm --cached <archivo>  # Eliminar del staging"
  echo "  2. git rm <archivo>            # Eliminar del repo completamente"
  echo "  3. Verificar que .gitignore incluye el archivo"
  echo ""
  echo "Si ya commiteaste credenciales:"
  echo "  1. Rotar TODAS las credenciales comprometidas"
  echo "  2. git filter-repo --path <archivo> --invert-paths"
  echo "  3. Forzar push (coordinar con equipo)"
  exit 1
fi

echo -e "${GREEN}✅ Verificación completada: No se encontraron secretos${NC}"
exit 0
