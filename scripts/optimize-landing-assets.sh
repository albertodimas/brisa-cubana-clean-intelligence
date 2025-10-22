#!/bin/bash

# Script de optimización de assets para landing page
# Uso: ./scripts/optimize-landing-assets.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Landing Assets Optimizer${NC}"
echo -e "${GREEN}================================${NC}\n"

# Verificar dependencias
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}Error: cwebp no está instalado${NC}"
    echo "Instalar con: sudo apt install webp"
    exit 1
fi

if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick no está instalado${NC}"
    echo "Instalar con: sudo apt install imagemagick"
    exit 1
fi

# Directorios
ASSETS_DIR="apps/web/public/assets"
HERO_DIR="$ASSETS_DIR/hero"
MOCKUPS_16_9_DIR="$ASSETS_DIR/mockups/16-9"
MOCKUPS_4_5_DIR="$ASSETS_DIR/mockups/4-5"
INPUT_DIR="${1:-./assets-input}"

echo -e "${YELLOW}📁 Directorio de entrada: $INPUT_DIR${NC}"
echo -e "${YELLOW}📁 Directorio de salida: $ASSETS_DIR${NC}\n"

# Verificar que existe directorio de entrada
if [ ! -d "$INPUT_DIR" ]; then
    echo -e "${RED}Error: El directorio $INPUT_DIR no existe${NC}"
    echo -e "${YELLOW}Crear con: mkdir -p $INPUT_DIR/{hero,mockups}${NC}"
    exit 1
fi

# Función para optimizar hero image
optimize_hero() {
    local input_file="$1"
    local filename=$(basename "$input_file" | sed 's/\.[^.]*$//')

    echo -e "${GREEN}🖼️  Procesando hero image: $filename${NC}"

    # Generar variantes responsive
    for size in 2400 1920 1280 768; do
        local output_file="$HERO_DIR/hero-${size}w.webp"

        if [ "$size" -eq 2400 ]; then
            # Original a 2400px ancho
            cwebp -q 85 -resize "$size" 0 "$input_file" -o "$output_file"
        else
            # Redimensionar desde el original
            convert "$input_file" -resize "${size}x" -quality 85 "temp_${size}.jpg"
            cwebp -q 85 "temp_${size}.jpg" -o "$output_file"
            rm "temp_${size}.jpg"
        fi

        local file_size=$(du -h "$output_file" | cut -f1)
        echo -e "  ✅ ${size}w → $file_size"
    done

    echo ""
}

# Función para optimizar mockups 16:9
optimize_mockup_16_9() {
    local input_file="$1"
    local filename=$(basename "$input_file" | sed 's/\.[^.]*$//')

    echo -e "${GREEN}📱 Procesando mockup 16:9: $filename${NC}"

    # Generar variantes
    for size in 1920 1280; do
        local output_file="$MOCKUPS_16_9_DIR/${filename}-${size}w.webp"

        convert "$input_file" -resize "${size}x" -quality 85 "temp_${size}.jpg"
        cwebp -q 85 "temp_${size}.jpg" -o "$output_file"
        rm "temp_${size}.jpg"

        local file_size=$(du -h "$output_file" | cut -f1)
        echo -e "  ✅ ${size}w → $file_size"
    done

    echo ""
}

# Función para optimizar mockups 4:5
optimize_mockup_4_5() {
    local input_file="$1"
    local filename=$(basename "$input_file" | sed 's/\.[^.]*$//')

    echo -e "${GREEN}📱 Procesando mockup 4:5: $filename${NC}"

    # Generar variantes
    for size in 1080 540; do
        local output_file="$MOCKUPS_4_5_DIR/${filename}-${size}w.webp"

        convert "$input_file" -resize "${size}x" -quality 85 "temp_${size}.jpg"
        cwebp -q 85 "temp_${size}.jpg" -o "$output_file"
        rm "temp_${size}.jpg"

        local file_size=$(du -h "$output_file" | cut -f1)
        echo -e "  ✅ ${size}w → $file_size"
    done

    echo ""
}

# Procesar hero images
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🖼️  HERO IMAGES${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "$INPUT_DIR/hero" ]; then
    for file in "$INPUT_DIR/hero"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
        [ -f "$file" ] || continue
        optimize_hero "$file"
    done
else
    echo -e "${YELLOW}⚠️  No se encontró carpeta hero en $INPUT_DIR${NC}\n"
fi

# Procesar mockups 16:9
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📱 MOCKUPS 16:9${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "$INPUT_DIR/mockups/16-9" ]; then
    for file in "$INPUT_DIR/mockups/16-9"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
        [ -f "$file" ] || continue
        optimize_mockup_16_9 "$file"
    done
else
    echo -e "${YELLOW}⚠️  No se encontró carpeta mockups/16-9 en $INPUT_DIR${NC}\n"
fi

# Procesar mockups 4:5
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📱 MOCKUPS 4:5${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "$INPUT_DIR/mockups/4-5" ]; then
    for file in "$INPUT_DIR/mockups/4-5"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
        [ -f "$file" ] || continue
        optimize_mockup_4_5 "$file"
    done
else
    echo -e "${YELLOW}⚠️  No se encontró carpeta mockups/4-5 en $INPUT_DIR${NC}\n"
fi

# Resumen final
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Optimización completada${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}📊 Resumen de archivos generados:${NC}\n"

echo -e "Hero images:"
ls -lh "$HERO_DIR"/*.webp 2>/dev/null | awk '{print "  " $9 " → " $5}' || echo "  (ninguno)"
echo ""

echo -e "Mockups 16:9:"
ls -lh "$MOCKUPS_16_9_DIR"/*.webp 2>/dev/null | awk '{print "  " $9 " → " $5}' || echo "  (ninguno)"
echo ""

echo -e "Mockups 4:5:"
ls -lh "$MOCKUPS_4_5_DIR"/*.webp 2>/dev/null | awk '{print "  " $9 " → " $5}' || echo "  (ninguno)"
echo ""

# Calcular peso total
total_size=$(du -sh "$ASSETS_DIR" | cut -f1)
echo -e "${GREEN}💾 Peso total de assets: $total_size${NC}\n"

echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo -e "  1. Revisar assets en: $ASSETS_DIR"
echo -e "  2. Actualizar componentes React con nuevas rutas"
echo -e "  3. Ejecutar: pnpm build"
echo -e "  4. Probar responsive en DevTools"
echo -e "  5. Medir Lighthouse Performance (objetivo: >90)"
echo -e "  6. Actualizar issue #64 con checkmarks ✅\n"

echo -e "${GREEN}¡Listo! 🎉${NC}"
