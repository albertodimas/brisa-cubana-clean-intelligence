#!/bin/bash
# Setup Deployment Credentials
# This script guides you through configuring Railway and Vercel for autonomous deployment

set -e

echo "🚀 Brisa Cubana - Deployment Credentials Setup"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
print_section "🔍 Checking Required Tools"

if ! command_exists railway; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install: npm install -g @railway/cli"
    exit 1
fi

if ! command_exists vercel; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install: npm install -g vercel"
    exit 1
fi

if ! command_exists gh; then
    echo -e "${RED}❌ GitHub CLI not found${NC}"
    echo "Install: https://cli.github.com/"
    exit 1
fi

echo -e "${GREEN}✅ All tools installed${NC}"

# Railway Configuration
print_section "🚂 Railway Configuration"

echo "Please authenticate with Railway:"
railway login

echo ""
echo "Linking Railway project..."
railway link

echo ""
echo "📋 Available Railway services:"
railway service list

echo ""
echo -e "${YELLOW}Copy the output above and provide it to Claude${NC}"
echo ""

read -p "Enter the exact Railway service name for API: " RAILWAY_SERVICE_NAME

echo ""
echo "Railway service selected: $RAILWAY_SERVICE_NAME"
echo ""

read -p "Press Enter to continue to Vercel setup..."

# Vercel Configuration
print_section "▲ Vercel Configuration"

echo "Please authenticate with Vercel:"
vercel login

echo ""
echo "📋 Vercel projects:"
vercel ls

echo ""
echo "Inspecting project configuration..."
vercel inspect brisa-cubana-clean-intelligence || echo "Run: vercel link first"

echo ""
echo "📋 Vercel environment variables:"
vercel env ls --environment production

echo ""
echo -e "${YELLOW}Copy the output above and provide it to Claude${NC}"
echo ""

read -p "Press Enter to continue to GitHub Secrets setup..."

# GitHub Secrets
print_section "🔐 GitHub Secrets Configuration"

echo "Current GitHub Secrets:"
gh secret list

echo ""
read -p "Do you want to update RAILWAY_PRODUCTION_TOKEN? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Getting Railway token..."
    echo "Go to: https://railway.app/account/tokens"
    echo "Create a new token and paste it here:"
    read -s RAILWAY_TOKEN
    echo ""
    echo "$RAILWAY_TOKEN" | gh secret set RAILWAY_PRODUCTION_TOKEN
    echo -e "${GREEN}✅ Railway token updated${NC}"
fi

echo ""
read -p "Do you want to update VERCEL_TOKEN? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Getting Vercel token..."
    echo "Go to: https://vercel.com/account/tokens"
    echo "Create a new token and paste it here:"
    read -s VERCEL_TOKEN
    echo ""
    echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN
    echo -e "${GREEN}✅ Vercel token updated${NC}"
fi

# Summary
print_section "📝 Summary - Copy this to Claude"

cat << EOF
Railway Configuration:
- Service Name: $RAILWAY_SERVICE_NAME
- Status: $(railway status)

Vercel Configuration:
- Run 'vercel inspect brisa-cubana-clean-intelligence' output above

GitHub Secrets:
$(gh secret list)

Next Steps:
1. Copy all the output above
2. Provide it to Claude
3. Claude will update the deployment workflows
4. Test deployment will be executed
5. Monitoring will be configured

EOF

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Now provide all the output above to Claude for autonomous deployment setup."
echo ""
