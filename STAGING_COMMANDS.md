# Staging Setup - Comandos Exactos

## 1. Neon Database

```bash
# Crear en: https://console.neon.tech
# Project: brisa-cubana-staging
# Region: US East (Ohio)
# PostgreSQL: 17

# Copiar connection string y exportar
export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb"

# Aplicar migraciones
cd apps/api
pnpm prisma migrate deploy
pnpm run seed
cd ../..
```

## 2. Railway (API)

```bash
# Login y crear proyecto
railway login
railway init
# Name: brisa-cubana-staging

# Configurar variables
railway variables set DATABASE_URL="$DATABASE_URL"
railway variables set JWT_SECRET="$(openssl rand -base64 48)"
railway variables set NODE_ENV="staging"
railway variables set API_PORT="3001"
railway variables set WEB_APP_URL="https://brisa-cubana-staging.vercel.app"
railway variables set STRIPE_SECRET_KEY="sk_test_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables set TWILIO_ACCOUNT_SID="AC..."
railway variables set TWILIO_AUTH_TOKEN="..."
railway variables set TWILIO_PHONE_NUMBER="+1..."
railway variables set TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
railway variables set RESEND_API_KEY="re_..."
railway variables set EMAIL_FROM="noreply@brisacubana.com"
railway variables set LOG_LEVEL="debug"

# Deploy
railway up
```

## 3. Vercel (Web)

```bash
# Login y link proyecto
vercel login
vercel link
# Name: brisa-cubana-staging
# Root: apps/web

# Configurar variables
vercel env add NEXTAUTH_URL production
# Valor: https://brisa-cubana-staging.vercel.app

vercel env add NEXTAUTH_SECRET production
# Valor: $(openssl rand -base64 32)

vercel env add NEXT_PUBLIC_API_URL production
# Valor: https://[railway-url].up.railway.app

vercel env add NEXT_PUBLIC_APP_URL production
# Valor: https://brisa-cubana-staging.vercel.app

# Deploy
vercel --prod
```

## 4. GitHub Secrets

```bash
# En: github.com/albertodimas/brisa-cubana-clean-intelligence/settings/secrets/actions

# Railway
RAILWAY_STAGING_TOKEN=...
RAILWAY_PRODUCTION_TOKEN=...

# Vercel
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# Slack (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 5. Verificación

```bash
# Health checks
curl https://[railway-url].up.railway.app/health
curl https://brisa-cubana-staging.vercel.app

# Test E2E
# 1. Abrir https://brisa-cubana-staging.vercel.app
# 2. Registrarse
# 3. Crear booking
# 4. Verificar notificaciones
```

## URLs Finales

- Web: https://brisa-cubana-staging.vercel.app
- API: https://[railway-url].up.railway.app
- DB: Neon PostgreSQL 17
