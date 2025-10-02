#!/bin/bash
set -e

echo "🚀 Brisa Cubana Clean Intelligence - Automated Local Setup"
echo "==========================================================="
echo ""

# Colors
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
  echo -e "${RED}❌ Node.js 24+ required. Please install correct version:${NC}"
  echo "   nvm install 24.9.0"
  echo "   nvm use 24.9.0"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check pnpm
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
  corepack enable
  corepack prepare pnpm@10.17.1 --activate
fi
echo -e "${GREEN}✅ pnpm $(pnpm -v)${NC}"

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker not found. Please install Docker Desktop.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')${NC}"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pnpm install --frozen-lockfile

# Setup environment variables
echo ""
echo "⚙️  Setting up environment variables..."

# Root .env
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${GREEN}✅ Created .env${NC}"
else
  echo -e "${YELLOW}⚠️  .env already exists, skipping${NC}"
fi

# API .env
if [ ! -f "apps/api/.env" ]; then
  cp apps/api/.env.example apps/api/.env
  echo -e "${GREEN}✅ Created apps/api/.env${NC}"
else
  echo -e "${YELLOW}⚠️  apps/api/.env already exists, skipping${NC}"
fi

# Web .env.local
if [ ! -f "apps/web/.env.local" ]; then
  cp apps/web/.env.local.example apps/web/.env.local
  echo -e "${GREEN}✅ Created apps/web/.env.local${NC}"
else
  echo -e "${YELLOW}⚠️  apps/web/.env.local already exists, skipping${NC}"
fi

# Generate secrets
echo ""
echo "🔐 Generating secrets..."
JWT_SECRET=$(openssl rand -hex 64)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Update JWT_SECRET in apps/api/.env
if [ "$(uname)" == "Darwin" ]; then
  # macOS
  sed -i '' "s/JWT_SECRET=\".*\"/JWT_SECRET=\"$JWT_SECRET\"/" apps/api/.env
  sed -i '' "s/NEXTAUTH_SECRET=\".*\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" apps/web/.env.local
else
  # Linux
  sed -i "s/JWT_SECRET=\".*\"/JWT_SECRET=\"$JWT_SECRET\"/" apps/api/.env
  sed -i "s/NEXTAUTH_SECRET=\".*\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" apps/web/.env.local
fi

echo -e "${GREEN}✅ Generated JWT_SECRET and NEXTAUTH_SECRET${NC}"

# Start Docker services
echo ""
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

MAX_RETRIES=30
RETRY=0
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1 || [ $RETRY -eq $MAX_RETRIES ]; do
  echo "   Attempt $((RETRY+1))/$MAX_RETRIES..."
  RETRY=$((RETRY+1))
  sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo -e "${RED}❌ PostgreSQL failed to start${NC}"
  exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
pnpm --filter=@brisa/api db:generate

# Push database schema
echo "🗄️  Pushing database schema..."
pnpm --filter=@brisa/api db:push

# Seed database
echo "🌱 Seeding database..."
pnpm --filter=@brisa/api db:seed

# Setup Python venv for docs (optional)
echo ""
echo "📚 Setting up Python venv for documentation (optional)..."
if command -v python3 &> /dev/null; then
  bash scripts/setup_env.sh
  echo -e "${GREEN}✅ Python venv created${NC}"
else
  echo -e "${YELLOW}⚠️  Python3 not found, skipping docs setup${NC}"
fi

# Setup complete
echo ""
echo "==========================================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Start development servers:"
echo "   ${YELLOW}pnpm dev${NC}"
echo ""
echo "2. Access services:"
echo "   • Frontend:  http://localhost:3000"
echo "   • API:       http://localhost:3001"
echo "   • Docs:      make serve (http://localhost:8000)"
echo ""
echo "3. Demo credentials:"
echo "   • Emails:   admin@brisacubanaclean.com, staff@brisacubanaclean.com, client@brisacubanaclean.com, carlos.mendez@example.com"
echo "   • Passwords: Admin123! (admin), Staff123!, Client123!, Manager123!"
echo ""
echo "4. Useful commands:"
echo "   • Prisma Studio:  pnpm --filter=@brisa/api db:studio"
echo "   • Run tests:      pnpm test"
echo "   • Check types:    pnpm typecheck"
echo "   • Lint:           pnpm lint"
echo ""
echo "🎉 Happy coding!"
