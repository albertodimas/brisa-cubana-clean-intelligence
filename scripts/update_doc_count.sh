#!/bin/bash
# Script para actualizar automáticamente el conteo de documentos en README.md y docs/index.md
# Uso: ./scripts/update_doc_count.sh

set -euo pipefail

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📄 Actualizando conteo de documentos...${NC}"

# Contar archivos .md en docs/
MD_COUNT=$(find docs/ -name "*.md" -type f | wc -l)
CURRENT_DATE=$(date +%Y-%m-%d)

echo -e "${GREEN}✓${NC} Total documentos encontrados: ${YELLOW}${MD_COUNT}${NC}"

# Backup de archivos antes de modificar
cp README.md README.md.bak
cp docs/index.md docs/index.md.bak

echo -e "${BLUE}📝 Actualizando README.md...${NC}"
# Actualizar README.md (línea 46: "docs: Base de conocimiento en MkDocs con XXX documentos.")
sed -i "s/con [0-9]\+ documentos\./con ${MD_COUNT} documentos./g" README.md

echo -e "${BLUE}📝 Actualizando docs/index.md...${NC}"
# Actualizar docs/index.md (línea 60: "| Archivos Markdown | XXX (YYYY-MM-DD) |")
sed -i "s/| Archivos Markdown    | [0-9]\+ ([0-9-]\+)/| Archivos Markdown    | ${MD_COUNT} (${CURRENT_DATE})/g" docs/index.md

# Verificar cambios
README_UPDATED=$(grep -c "${MD_COUNT} documentos" README.md || true)
INDEX_UPDATED=$(grep -c "| ${MD_COUNT} (${CURRENT_DATE})" docs/index.md || true)

if [ "$README_UPDATED" -gt 0 ] && [ "$INDEX_UPDATED" -gt 0 ]; then
  echo -e "${GREEN}✓ Archivos actualizados correctamente${NC}"
  echo -e "${GREEN}  - README.md: ${MD_COUNT} documentos${NC}"
  echo -e "${GREEN}  - docs/index.md: ${MD_COUNT} (${CURRENT_DATE})${NC}"

  # Eliminar backups
  rm README.md.bak docs/index.md.bak

  echo ""
  echo -e "${YELLOW}⚠️  Recuerda hacer commit de los cambios:${NC}"
  echo -e "   git add README.md docs/index.md"
  echo -e "   git commit -m \"docs: actualizar conteo de documentos a ${MD_COUNT}\""
else
  echo -e "${YELLOW}⚠️  No se detectaron cambios. Restaurando backups...${NC}"
  mv README.md.bak README.md
  mv docs/index.md.bak docs/index.md
fi

echo ""
echo -e "${BLUE}📊 Distribución de documentos:${NC}"
find docs/ -type d -maxdepth 1 ! -path docs/ -exec bash -c 'echo "  $(basename {}): $(find {} -name "*.md" | wc -l) archivos"' \;
