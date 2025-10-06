#!/usr/bin/env bash
#
# audit-consistency.sh
# Audits consistency between documentation and implemented code
#
# Usage: ./scripts/audit-consistency.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🔍 Brisa Cubana Clean Intelligence - Consistency Audit"
echo "======================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ISSUES=0
WARNINGS=0

# Function to print section
section() {
  echo ""
  echo -e "${BLUE}## $1${NC}"
  echo "---"
}

# Function to print check
check() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to print warning
warning() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

# Function to print error
error() {
  echo -e "${RED}✗${NC} $1"
  ((ISSUES++))
}

section "1. API Endpoints vs Documentation"

# Count implemented endpoints
IMPLEMENTED_ENDPOINTS=$(find apps/api/src/routes -name "*.ts" -not -name "*.test.ts" -exec grep -h "^\s*\(auth\|bookings\|services\|properties\|users\|payments\|alerts\|concierge\|features\|health\|metrics\|reports\|reconciliation\)\.\(get\|post\|put\|patch\|delete\)" {} \; 2>/dev/null | wc -l || echo "0")

echo "Implemented route files:"
ls -1 apps/api/src/routes/*.ts | grep -v test | while read -r file; do
  basename "$file" .ts
done

echo ""
echo "API Endpoint files found: $(find apps/api/src/routes -name "*.ts" -not -name "*.test.ts" | wc -l)"

# Check if API_ENDPOINTS.md exists and is up to date
if [ -f "apps/api/API_ENDPOINTS.md" ]; then
  check "API_ENDPOINTS.md exists"

  # Check for documented routes
  ROUTES=(auth bookings services properties users payments alerts concierge reports reconciliation)
  for route in "${ROUTES[@]}"; do
    if grep -q "## ${route^}" apps/api/API_ENDPOINTS.md 2>/dev/null; then
      check "Route /${route} documented"
    else
      if [ -f "apps/api/src/routes/${route}.ts" ]; then
        warning "Route /${route} implemented but not documented in API_ENDPOINTS.md"
      fi
    fi
  done
else
  error "apps/api/API_ENDPOINTS.md not found"
fi

section "2. Environment Variables"

# Check .env.example files
if [ -f ".env.example" ]; then
  check "Root .env.example exists"
else
  error "Root .env.example missing"
fi

if [ -f "apps/api/.env.example" ]; then
  check "apps/api/.env.example exists"

  # Check critical variables are documented
  REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_ACCESS_EXPIRATION" "JWT_REFRESH_EXPIRATION")
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" apps/api/.env.example; then
      check "Required var ${var} documented"
    else
      error "Required var ${var} missing in apps/api/.env.example"
    fi
  done
else
  error "apps/api/.env.example missing"
fi

if [ -f "apps/web/.env.local.example" ]; then
  check "apps/web/.env.local.example exists"
else
  error "apps/web/.env.local.example missing"
fi

section "3. Database Schema"

# Check Prisma schema
if [ -f "apps/api/prisma/schema.prisma" ]; then
  check "Prisma schema exists"

  # Count models
  MODEL_COUNT=$(grep -c "^model " apps/api/prisma/schema.prisma)
  echo "  Database models: ${MODEL_COUNT}"

  # Check seed file
  if [ -f "apps/api/prisma/seed.ts" ]; then
    check "Seed file exists"
  else
    warning "Seed file missing (apps/api/prisma/seed.ts)"
  fi
else
  error "Prisma schema missing"
fi

section "4. Tests Coverage"

# Unit tests
if [ -d "apps/api/src" ]; then
  TOTAL_FILES=$(find apps/api/src -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" -not -path "*/generated/*" | wc -l)
  TEST_FILES=$(find apps/api/src -name "*.test.ts" -o -name "*.spec.ts" | wc -l)

  echo "Source files (API): ${TOTAL_FILES}"
  echo "Test files (API): ${TEST_FILES}"

  if [ "$TEST_FILES" -gt 0 ]; then
    check "Unit tests present"
  else
    warning "No unit test files found"
  fi
fi

# E2E tests
if [ -d "apps/web/e2e" ]; then
  E2E_COUNT=$(find apps/web/e2e -name "*.spec.ts" | wc -l)
  echo "E2E test files: ${E2E_COUNT}"

  if [ "$E2E_COUNT" -gt 0 ]; then
    check "E2E tests present"
  else
    warning "No E2E test files found"
  fi
fi

# Load tests
if [ -d "tests/load" ]; then
  LOAD_TEST_COUNT=$(find tests/load -name "*.test.js" | wc -l)
  echo "Load test scenarios: ${LOAD_TEST_COUNT}"

  if [ "$LOAD_TEST_COUNT" -ge 5 ]; then
    check "Load tests present (${LOAD_TEST_COUNT} scenarios)"
  else
    warning "Incomplete load test suite (expected 5, found ${LOAD_TEST_COUNT})"
  fi
fi

section "5. Documentation Structure"

# Check key documentation files
REQUIRED_DOCS=(
  "README.md"
  "CONTRIBUTING.md"
  "docs/index.md"
  "docs/for-developers/quickstart.md"
  "docs/for-developers/architecture.md"
  "docs/for-developers/testing.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    check "$doc exists"
  else
    error "$doc missing"
  fi
done

# Check MkDocs configuration
if [ -f "mkdocs.yml" ]; then
  check "mkdocs.yml exists"
else
  error "mkdocs.yml missing"
fi

section "6. CI/CD Pipelines"

# Check GitHub workflows
REQUIRED_WORKFLOWS=(
  ".github/workflows/ci.yml"
  ".github/workflows/deploy-production.yml"
)

for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
  if [ -f "$workflow" ]; then
    check "$(basename "$workflow") exists"
  else
    warning "$(basename "$workflow") missing"
  fi
done

section "7. Production Readiness"

# Check deployment files
if [ -f "docker-compose.yml" ]; then
  check "docker-compose.yml exists"
else
  warning "docker-compose.yml missing"
fi

if [ -f ".dockerignore" ]; then
  check ".dockerignore exists"
else
  warning ".dockerignore missing"
fi

# Check Dockerfiles (monorepo has per-app Dockerfiles)
if [ -f "apps/api/Dockerfile" ]; then
  check "API Dockerfile exists (apps/api/Dockerfile)"
else
  error "API Dockerfile missing"
fi

if [ -f "apps/web/Dockerfile" ]; then
  check "Web Dockerfile exists (apps/web/Dockerfile)"
else
  warning "Web Dockerfile missing"
fi

# Check security files
if [ -f "SECURITY.md" ]; then
  check "SECURITY.md exists"
else
  warning "SECURITY.md missing"
fi

section "8. Package Configuration"

# Check package.json scripts
if [ -f "package.json" ]; then
  check "Root package.json exists"

  REQUIRED_SCRIPTS=("dev" "build" "test" "lint" "typecheck" "test:e2e")
  for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"${script}\":" package.json; then
      check "Script '${script}' defined"
    else
      error "Script '${script}' missing in package.json"
    fi
  done
fi

section "9. Git Configuration"

# Check .gitignore
if [ -f ".gitignore" ]; then
  check ".gitignore exists"

  CRITICAL_IGNORES=("node_modules" ".env" "dist")
  for ignore in "${CRITICAL_IGNORES[@]}"; do
    if grep -q "^${ignore}" .gitignore; then
      check "${ignore} ignored"
    else
      warning "${ignore} not in .gitignore"
    fi
  done
else
  error ".gitignore missing"
fi

# Check for sensitive files in repo
if git ls-files | grep -q "\.env$"; then
  error ".env file committed to repository!"
fi

if git ls-files | grep -q "\.env\.local$"; then
  error ".env.local file committed to repository!"
fi

section "10. TypeScript Configuration"

# Check tsconfig files
TSCONFIG_FILES=(
  "tsconfig.base.json"
  "apps/api/tsconfig.json"
  "apps/web/tsconfig.json"
  "packages/ui/tsconfig.json"
)

for tsconfig in "${TSCONFIG_FILES[@]}"; do
  if [ -f "$tsconfig" ]; then
    check "$tsconfig exists"
  else
    warning "$tsconfig missing"
  fi
done

section "Summary"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All consistency checks passed!${NC}"
  exit 0
elif [ $ISSUES -eq 0 ]; then
  echo -e "${YELLOW}⚠ ${WARNINGS} warnings found (non-critical)${NC}"
  exit 0
else
  echo -e "${RED}✗ ${ISSUES} critical issues found${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warnings found${NC}"
  fi
  exit 1
fi
