#!/bin/bash

# Script para arrancar la plataforma Brisa Cubana en local
# Inicia API backend, frontend web y servicios necesarios

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      🏝️  Brisa Cubana - Local Development Setup          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar Docker
echo -e "${BLUE}🐳 Verificando Docker...${NC}"
if ! docker --version &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker disponible${NC}"
echo ""

# 2. Verificar/Arrancar PostgreSQL
echo -e "${BLUE}🗄️  Verificando PostgreSQL...${NC}"
if docker ps | grep -q "brisa-cubana-postgres-dev"; then
    echo -e "${GREEN}✅ PostgreSQL ya está corriendo${NC}"
else
    echo -e "${YELLOW}⚠️  Arrancando PostgreSQL...${NC}"
    docker-compose up -d postgres
    echo -e "${GREEN}✅ PostgreSQL iniciado${NC}"
    echo "Esperando a que PostgreSQL esté listo..."
    sleep 5
fi
echo ""

# 3. Verificar migraciones
echo -e "${BLUE}📊 Verificando migraciones de base de datos...${NC}"
cd apps/api
if pnpm prisma migrate status 2>&1 | grep -q "up to date"; then
    echo -e "${GREEN}✅ Base de datos actualizada${NC}"
else
    echo -e "${YELLOW}⚠️  Aplicando migraciones...${NC}"
    pnpm prisma migrate deploy
    echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
fi
cd ../..
echo ""

# 4. Instalar dependencias si es necesario
echo -e "${BLUE}📦 Verificando dependencias...${NC}"
if [ ! -d "node_modules" ] || [ ! -d "apps/api/node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Instalando dependencias...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✅ Dependencias ya instaladas${NC}"
fi
echo ""

# 5. Compilar API si es necesario
echo -e "${BLUE}🔨 Compilando API...${NC}"
cd apps/api
if [ ! -d "dist" ]; then
    pnpm build
    echo -e "${GREEN}✅ API compilada${NC}"
else
    echo -e "${GREEN}✅ API ya compilada (usa 'pnpm build' para recompile)${NC}"
fi
cd ../..
echo ""

# 6. Mostrar URLs
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🚀 SERVICIOS LISTOS                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📡 API Backend (Hono):${NC}"
echo "   http://localhost:3001"
echo "   http://localhost:3001/health"
echo "   http://localhost:3001/metrics"
echo ""
echo -e "${GREEN}🌐 Frontend (Next.js):${NC}"
echo "   http://localhost:3000"
echo ""
echo -e "${GREEN}🗄️  Base de Datos (PostgreSQL):${NC}"
echo "   localhost:5433"
echo "   Database: brisa_cubana_dev"
echo "   User: postgres"
echo ""

# 7. Preguntar cómo arrancar
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}¿Cómo quieres arrancar los servicios?${NC}"
echo ""
echo "1. 🚀 Arrancar TODO (API + Frontend en modo desarrollo)"
echo "2. 🔧 Solo API Backend"
echo "3. 🎨 Solo Frontend"
echo "4. 📊 Ver logs de PostgreSQL"
echo "5. ❌ Salir"
echo ""
read -p "Selecciona una opción (1-5): " option

case $option in
    1)
        echo ""
        echo -e "${GREEN}🚀 Arrancando API y Frontend...${NC}"
        echo ""
        echo "API corriendo en: http://localhost:3001"
        echo "Frontend corriendo en: http://localhost:3000"
        echo ""
        echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
        echo ""
        # Arrancar en paralelo
        pnpm turbo run dev --parallel
        ;;
    2)
        echo ""
        echo -e "${GREEN}🔧 Arrancando solo API...${NC}"
        echo ""
        echo "API corriendo en: http://localhost:3001"
        echo "Documentación: http://localhost:3001/health"
        echo ""
        echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
        echo ""
        cd apps/api && pnpm dev
        ;;
    3)
        echo ""
        echo -e "${GREEN}🎨 Arrancando solo Frontend...${NC}"
        echo ""
        echo "Frontend corriendo en: http://localhost:3000"
        echo ""
        echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
        echo ""
        cd apps/web && pnpm dev
        ;;
    4)
        echo ""
        echo -e "${BLUE}📊 Logs de PostgreSQL:${NC}"
        docker logs -f brisa-cubana-postgres-dev
        ;;
    5)
        echo ""
        echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac
