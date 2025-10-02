# Staging Environment Setup Guide

Guía completa para configurar el entorno de staging de Brisa Cubana Clean Intelligence.

---

## Tabla de Contenidos

- [Overview](#overview)
- [Pre-requisitos](#pre-requisitos)
- [Database Setup (Neon)](#database-setup-neon)
- [API Deployment (Railway)](#api-deployment-railway)
- [Web Deployment (Vercel)](#web-deployment-vercel)
- [Configuración de Servicios Externos](#configuracion-de-servicios-externos)
- [Testing del Staging](#testing-del-staging)
- [Troubleshooting](#troubleshooting)

---

## Overview

El entorno de **staging** es una réplica de producción para testing de features antes del deploy final. Usa servicios separados para evitar afectar datos de producción.

**Arquitectura:**

```
┌────────────────────────────────────────────────┐
│            STAGING ENVIRONMENT                 │
├────────────────────────────────────────────────┤
│                                                │
│  Web App (Vercel)                             │
│  └─> brisa-cubana-staging.vercel.app          │
│                                                │
│  API (Railway)                                 │
│  └─> api-brisa-cubana-staging.up.railway.app  │
│                                                │
│  Database (Neon)                               │
│  └─> PostgreSQL 17 Serverless                 │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Pre-requisitos

### 1. Cuentas necesarias

- **GitHub**: Repositorio con acceso push
- **Vercel**: Cuenta free o pro
- **Railway**: Cuenta free ($5 crédito inicial)
- **Neon**: Cuenta free (1 proyecto gratis)
- **Stripe**: Cuenta test mode
- **Resend**: Cuenta con API key

### 2. CLIs instalados

```bash
# Vercel CLI
npm install -g vercel

# Railway CLI
npm install -g @railway/cli

# Autenticar
vercel login
railway login
```

---

## Database Setup (Neon)

### 1. Crear proyecto en Neon

1. Ir a [neon.tech](https://neon.tech)
2. Click en **New Project**
3. Configuración:
   - **Project name**: `brisa-cubana-staging`
   - **Region**: `US East (Ohio)` (más cercano a Railway/Vercel)
   - **PostgreSQL version**: 17
4. Click **Create Project**

### 2. Obtener connection string

1. En el dashboard del proyecto, click en **Connection Details**
2. Copiar el **Connection string** (formato: `postgresql://user:pass@host/db`)
3. Guardar para uso posterior

### 3. Aplicar migraciones

```bash
# Desde el root del proyecto
cd apps/api

# Configurar DATABASE_URL temporalmente
export DATABASE_URL="postgresql://neon-connection-string"

# Aplicar migraciones
pnpm prisma migrate deploy

# Seed con datos de prueba (opcional)
pnpm run seed
```

### 4. Verificar conexión

```bash
# Test de conexión
psql $DATABASE_URL -c "SELECT version();"

# Ver tablas creadas
psql $DATABASE_URL -c "\dt"
```

---

## API Deployment (Railway)

### 1. Crear proyecto en Railway

```bash
railway login
railway init

# Seguir el prompt:
# - Project name: brisa-cubana-staging
# - Environment: staging
```

### 2. Conectar repositorio

1. Dashboard de Railway → **New Project**
2. **Deploy from GitHub repo**
3. Seleccionar: `albertodimas/brisa-cubana-clean-intelligence`
4. Root Directory: `apps/api`
5. Click **Deploy Now**

### 3. Configurar variables de entorno

```bash
# Via CLI
railway variables set DATABASE_URL="postgresql://neon-connection-string"
railway variables set JWT_SECRET="random-64-char-secret-for-staging"
railway variables set NODE_ENV="staging"
railway variables set API_PORT="3001"

# O via Dashboard
# Settings → Variables → Raw Editor → Pegar:
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-here
NODE_ENV=staging
API_PORT=3001
WEB_APP_URL=https://brisa-cubana-staging.vercel.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@brisacubana.com
LOG_LEVEL=debug
```

### 4. Configurar dominio (opcional)

1. Settings → Networking → **Generate Domain**
2. O configurar custom domain: `api-staging.brisacubana.com`

### 5. Verificar deployment

```bash
# Health check
curl https://api-brisa-cubana-staging.up.railway.app/health

# Debería retornar:
# {"status":"ok","timestamp":"2025-09-30T...","version":"0.1.0"}
```

---

## Web Deployment (Vercel)

### 1. Crear proyecto en Vercel

```bash
vercel login

# Desde el root del proyecto
vercel link

# Seguir el prompt:
# - Set up new project? Y
# - Scope: tu-usuario
# - Link to existing project? N
# - Project name: brisa-cubana-staging
# - Root directory: apps/web
```

### 2. Configurar variables de entorno

```bash
# Production environment
vercel env add NEXTAUTH_URL production
# Valor: https://brisa-cubana-staging.vercel.app

vercel env add NEXTAUTH_SECRET production
# Valor: random-32-char-secret-for-staging

vercel env add NEXT_PUBLIC_API_URL production
# Valor: https://api-brisa-cubana-staging.up.railway.app

vercel env add NEXT_PUBLIC_APP_URL production
# Valor: https://brisa-cubana-staging.vercel.app

# O via Dashboard:
# vercel.com → Project → Settings → Environment Variables
```

### 3. Deploy

```bash
# Deploy a producción (staging usa production environment en Vercel)
vercel --prod

# O push a develop branch (auto-deploy configurado en workflow)
git push origin develop
```

### 4. Verificar deployment

1. Abrir: `https://brisa-cubana-staging.vercel.app`
2. Registrar usuario de prueba
3. Crear booking
4. Verificar en Railway logs que API recibe requests

---

## Configuración de Servicios Externos {#configuracion-de-servicios-externos}

### Stripe (Test Mode)

```bash
# 1. Dashboard de Stripe → Developers → Webhooks
# 2. Add endpoint:
#    URL: https://api-brisa-cubana-staging.up.railway.app/api/payments/webhook
#    Events: checkout.session.completed, payment_intent.payment_failed
# 3. Copiar signing secret (whsec_...)
# 4. Agregarlo a Railway variables: STRIPE_WEBHOOK_SECRET

# 5. Test webhook
stripe trigger checkout.session.completed --api-key sk_test_...
```

### Twilio (Test Mode)

```bash
# 1. Dashboard de Twilio → Phone Numbers → Manage → Buy a number
# 2. Configurar WhatsApp Sandbox:
#    Messaging → Try it out → Send WhatsApp message
#    Join code: "join [your-code]"
# 3. Copiar credentials a Railway:
#    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
```

### Resend (Production API Key)

```bash
# 1. Dashboard de Resend → API Keys → Create API Key
# 2. Name: "Brisa Cubana Staging"
# 3. Copiar y agregar a Railway: RESEND_API_KEY
# 4. Settings → Domains → Verify domain (brisacubana.com)
```

---

## Testing del Staging

### 1. Health Checks

```bash
# API
curl https://api-brisa-cubana-staging.up.railway.app/health

# Web
curl -I https://brisa-cubana-staging.vercel.app

# Database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

### 2. End-to-End Test

```bash
# 1. Abrir web app
open https://brisa-cubana-staging.vercel.app

# 2. Crear cuenta de prueba
# Email: test@example.com
# Password: Test1234!

# 3. Agregar propiedad
# 4. Crear booking
# 5. Verificar:
#    - Email recibido (Resend)
#    - WhatsApp notification (Twilio)
#    - Stripe checkout funciona
#    - Dashboard muestra booking

# 6. Como STAFF:
# - Login con staff@brisacubana.com
# - Verificar Staff App en /staff
# - Cambiar booking a IN_PROGRESS
# - Verificar notificación enviada
```

### 3. Load Testing (opcional)

```bash
# Instalar k6
brew install k6

# Crear script simple
cat > load-test.js <<EOF
import http from 'k6/http';
export const options = {
  vus: 10,
  duration: '30s',
};
export default function () {
  http.get('https://api-brisa-cubana-staging.up.railway.app/api/services');
}
EOF

# Ejecutar
k6 run load-test.js
```

---

## Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar connection string
railway variables | grep DATABASE_URL

# Test directo
psql $DATABASE_URL -c "SELECT 1"

# Verificar IP allowlist en Neon (debería ser "Allow all")
```

### Error: "Stripe webhook verification failed"

```bash
# Re-generar webhook secret
# 1. Stripe Dashboard → Webhooks → [endpoint] → Signing secret → Roll
# 2. Actualizar en Railway
railway variables set STRIPE_WEBHOOK_SECRET="whsec_nuevo..."

# 3. Redeploy
railway up
```

### Error: "NEXTAUTH_URL mismatch"

```bash
# Verificar que NEXTAUTH_URL coincida EXACTAMENTE con el dominio
vercel env ls

# Si no coincide, actualizar:
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
# Valor: https://brisa-cubana-staging.vercel.app (SIN trailing slash)

# Redeploy
vercel --prod
```

### Logs no aparecen en Railway

```bash
# Ver logs en vivo
railway logs --tail

# Verificar que LOG_LEVEL esté en "debug"
railway variables | grep LOG_LEVEL
```

---

## Maintenance

### Actualizar Staging

```bash
# Automático: Push a develop branch
git checkout develop
git pull origin main
git push origin develop

# Manual desde CLI
railway up --environment staging
vercel --prod
```

### Resetear Database

```bash
# ⚠️ ESTO BORRARÁ TODOS LOS DATOS
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-aplicar migraciones
cd apps/api
pnpm prisma migrate deploy
pnpm run seed
```

### Backup de Staging

```bash
# Exportar DB
pg_dump $DATABASE_URL > staging-backup-$(date +%Y%m%d).sql

# Restaurar
psql $DATABASE_URL < staging-backup-20250930.sql
```

---

## Checklist de Setup Completo

- [ ] Neon project creado con PostgreSQL 17
- [ ] Migraciones aplicadas en Neon DB
- [ ] Railway project creado y conectado a GitHub
- [ ] Variables de entorno configuradas en Railway
- [ ] API deployado y health check pasando
- [ ] Vercel project creado y linked
- [ ] Variables de entorno configuradas en Vercel
- [ ] Web app deployado y accesible
- [ ] Stripe webhook configurado en test mode
- [ ] Twilio configurado con sandbox
- [ ] Resend API key agregado
- [ ] GitHub Actions workflow funcionando
- [ ] End-to-end test completado exitosamente
- [ ] Slack notifications configuradas (opcional)
- [ ] Documentación actualizada

---

**Última actualización:** 30 de septiembre de 2025

Ver también:

- [Environment Variables](environment-variables.md)
- [github-secrets.md](./github-secrets.md)
- [Quickstart](quickstart.md)
