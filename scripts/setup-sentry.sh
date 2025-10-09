#!/bin/bash

# Setup Sentry for Brisa Cubana Clean Intelligence
# This script helps configure Sentry DSN keys in Vercel

set -e

echo "🔧 Sentry Setup for Brisa Cubana"
echo "================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

echo "📝 Step 1: Create Sentry Projects"
echo "   1. Go to https://sentry.io and sign in/create account"
echo "   2. Create a new organization (or use existing)"
echo "   3. Create TWO projects:"
echo "      - Name: 'brisa-web' | Platform: Next.js"
echo "      - Name: 'brisa-api' | Platform: Node.js"
echo ""
read -p "Press ENTER when projects are created..."

echo ""
echo "📋 Step 2: Get DSN Keys"
echo "   For each project, go to Settings → Client Keys (DSN)"
echo ""

# Get Web DSN
read -p "Enter Web DSN (starts with https://): " WEB_DSN
if [[ ! $WEB_DSN =~ ^https:// ]]; then
    echo "❌ Invalid DSN format"
    exit 1
fi

# Get API DSN
read -p "Enter API DSN (starts with https://): " API_DSN
if [[ ! $API_DSN =~ ^https:// ]]; then
    echo "❌ Invalid DSN format"
    exit 1
fi

echo ""
echo "🚀 Step 3: Configure Vercel Environment Variables"

# Add NEXT_PUBLIC_SENTRY_DSN (web)
echo "Adding NEXT_PUBLIC_SENTRY_DSN to production..."
echo "$WEB_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production

echo "Adding NEXT_PUBLIC_SENTRY_DSN to preview..."
echo "$WEB_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN preview

echo "Adding NEXT_PUBLIC_SENTRY_DSN to development..."
echo "$WEB_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN development

# Add SENTRY_DSN (api)
echo "Adding SENTRY_DSN to production..."
echo "$API_DSN" | vercel env add SENTRY_DSN production

echo "Adding SENTRY_DSN to preview..."
echo "$API_DSN" | vercel env add SENTRY_DSN preview

echo "Adding SENTRY_DSN to development..."
echo "$API_DSN" | vercel env add SENTRY_DSN development

echo ""
echo "✅ Sentry DSN configured successfully!"
echo ""
echo "📊 Step 4: Verify Setup"
echo "   1. Deploy to Vercel: git push origin main"
echo "   2. Trigger test error: visit /api/test-error (if exists)"
echo "   3. Check Sentry dashboard for captured errors"
echo ""
echo "🔔 Next Steps:"
echo "   - Configure alerts in Sentry dashboard"
echo "   - Set up Slack/email notifications"
echo "   - Define performance budgets"
echo ""
