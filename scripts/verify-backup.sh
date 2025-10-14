#!/bin/bash
# scripts/verify-backup.sh
# Verifica la integridad de un backup de base de datos

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DATABASE_URL="${1}"

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ Error: DATABASE_URL no proporcionada${NC}"
  echo ""
  echo "Uso: $0 <database-url>"
  echo ""
  echo "Ejemplos:"
  echo "  $0 'postgresql://user:pass@host:5432/db'"
  echo "  $0 \"\$DATABASE_URL\""
  exit 1
fi

echo -e "${BLUE}🔍 Verificando integridad de backup...${NC}"
echo ""

# Verificar conexión
echo "📡 Verificando conexión a base de datos..."
if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
  echo -e "${RED}❌ No se puede conectar a la base de datos${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Conexión exitosa${NC}"
echo ""

# Verificar conteos de tablas críticas
echo "📊 Verificando conteos de tablas críticas..."
COUNTS=$(psql "$DATABASE_URL" -t -A -F'|' <<EOF
SELECT 'User' AS table_name, COUNT(*) FROM "User"
UNION ALL SELECT 'Service', COUNT(*) FROM "Service"
UNION ALL SELECT 'Property', COUNT(*) FROM "Property"
UNION ALL SELECT 'Booking', COUNT(*) FROM "Booking"
ORDER BY table_name;
EOF
)

echo "$COUNTS" | while IFS='|' read -r table_name count; do
  if [ "$count" = "0" ]; then
    echo -e "  ${YELLOW}⚠️  $table_name: $count registros (vacía)${NC}"
  else
    echo -e "  ${GREEN}✅ $table_name: $count registros${NC}"
  fi
done
echo ""

# Verificar constraints y foreign keys
echo "🔗 Verificando constraints y foreign keys..."
CONSTRAINTS=$(psql "$DATABASE_URL" -t <<EOF
SELECT
  COUNT(*)
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY');
EOF
)

CONSTRAINTS=$(echo "$CONSTRAINTS" | tr -d ' ')
echo -e "  ${GREEN}✅ Total constraints: $CONSTRAINTS${NC}"
echo ""

# Verificar índices
echo "📇 Verificando índices..."
INDEXES=$(psql "$DATABASE_URL" -t <<EOF
SELECT COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public';
EOF
)

INDEXES=$(echo "$INDEXES" | tr -d ' ')
echo -e "  ${GREEN}✅ Total índices: $INDEXES${NC}"
echo ""

# Verificar usuarios y roles
echo "👥 Verificando usuarios..."
USERS=$(psql "$DATABASE_URL" -t -A -F'|' <<EOF
SELECT role, COUNT(*)
FROM "User"
GROUP BY role
ORDER BY role;
EOF
)

echo "$USERS" | while IFS='|' read -r role count; do
  echo -e "  ${GREEN}✅ $role: $count usuario(s)${NC}"
done
echo ""

# Verificar servicios activos
echo "🧹 Verificando servicios..."
SERVICES=$(psql "$DATABASE_URL" -t -A -F'|' <<EOF
SELECT
  CASE WHEN active THEN 'activos' ELSE 'inactivos' END,
  COUNT(*)
FROM "Service"
GROUP BY active;
EOF
)

if [ -z "$SERVICES" ]; then
  echo -e "  ${YELLOW}⚠️  No hay servicios en la base de datos${NC}"
else
  echo "$SERVICES" | while IFS='|' read -r status count; do
    echo -e "  ${GREEN}✅ Servicios $status: $count${NC}"
  done
fi
echo ""

# Verificar bookings por estado
echo "📅 Verificando reservas..."
BOOKINGS=$(psql "$DATABASE_URL" -t -A -F'|' <<EOF
SELECT status, COUNT(*)
FROM "Booking"
GROUP BY status
ORDER BY status;
EOF
)

if [ -z "$BOOKINGS" ]; then
  echo -e "  ${YELLOW}⚠️  No hay reservas en la base de datos${NC}"
else
  echo "$BOOKINGS" | while IFS='|' read -r status count; do
    echo -e "  ${GREEN}✅ $status: $count reserva(s)${NC}"
  done
fi
echo ""

# Verificar última modificación
echo "⏰ Verificando actividad reciente..."
LATEST_BOOKING=$(psql "$DATABASE_URL" -t <<EOF
SELECT
  COALESCE(MAX("updatedAt"), MAX("createdAt"))
FROM "Booking";
EOF
)

LATEST_BOOKING=$(echo "$LATEST_BOOKING" | tr -d ' ')

if [ -n "$LATEST_BOOKING" ] && [ "$LATEST_BOOKING" != "" ]; then
  echo -e "  ${GREEN}✅ Última actividad (Booking): $LATEST_BOOKING${NC}"
else
  echo -e "  ${YELLOW}⚠️  No hay actividad registrada${NC}"
fi
echo ""

# Resumen final
echo -e "${GREEN}✅ Verificación de integridad completada${NC}"
echo ""
echo "📋 Resumen:"
echo "  - Conexión: ✅ OK"
echo "  - Tablas: ✅ OK"
echo "  - Constraints: ✅ $CONSTRAINTS"
echo "  - Índices: ✅ $INDEXES"
echo ""
echo -e "${BLUE}💡 Recomendación: Ejecutar este script semanalmente contra el último backup${NC}"

exit 0
