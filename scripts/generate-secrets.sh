#!/bin/bash

##
# Generate secure random secrets for deployment
# Usage: ./scripts/generate-secrets.sh [environment]
#
# Environments: development, staging, production
##

set -e

ENVIRONMENT=${1:-staging}

echo "🔐 Generating secrets for ${ENVIRONMENT} environment..."
echo ""

# JWT Secret (64 bytes = 512 bits)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "JWT_SECRET=${JWT_SECRET}"
echo ""

# NextAuth Secret (32 bytes = 256 bits)
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
echo "AUTH_SECRET=${NEXTAUTH_SECRET}  # Same as NEXTAUTH_SECRET"
echo ""

# Database encryption key (optional, 32 bytes)
DB_ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')
echo "DB_ENCRYPTION_KEY=${DB_ENCRYPTION_KEY}"
echo ""

echo "✅ Secrets generated successfully!"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Store these secrets in a secure password manager (1Password, LastPass, etc.)"
echo "   2. Never commit these to git"
echo "   3. Use different secrets for each environment"
echo "   4. Rotate secrets periodically (every 90 days recommended)"
echo ""
echo "📝 Next steps:"
echo "   1. Add to Railway: railway variables set JWT_SECRET=\"...\""
echo "   2. Add to Vercel: vercel env add NEXTAUTH_SECRET production"
echo "   3. Update .env.local for local development"
echo ""
