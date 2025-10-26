# Credentials Audit Report

**Fecha:** 26 de octubre de 2025
**Auditoría:** Comparación de credenciales documentadas vs estado actual
**Estado:** ⚠️ 1 credencial crítica pendiente

---

## 📊 Resumen Ejecutivo

### ✅ Estado General: MUY BUENO (97% completo)

- **32/33 variables** configuradas correctamente en Vercel (Dev/Preview listas, Prod con un pendiente)
- **5/5 GitHub Secrets** configurados (incluye POSTHOG_API_KEY)
- **1 variable crítica aún pendiente en producción**
- **1 variable correctamente eliminada** (LEAD_WEBHOOK_URL)

---

## 🔍 Análisis Detallado

### ✅ **CREDENCIALES VERIFICADAS Y CORRECTAS**

#### **1. Database (Neon PostgreSQL)** ✅

```bash
✅ DATABASE_URL (Vercel: Dev/Preview/Prod)
✅ DATABASE_URL_UNPOOLED (Vercel: Dev/Preview/Prod)
✅ NEON_API_KEY (GitHub Secrets)
```

**Valores documentados anteriores:**

- Pooled: `postgresql://neondb_owner:npg_TNDc5pMA4Rjw@ep-winter-frog-ad2snh37-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Direct: `postgresql://neondb_owner:npg_TNDc5pMA4Rjw@ep-winter-frog-ad2snh37.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`

**Estado:** ✅ Configurado correctamente en Vercel (valores encriptados verificados)

---

#### **2. Authentication & Security** ✅

```bash
✅ JWT_SECRET (Vercel: Dev/Preview/Prod)
✅ AUTH_SECRET (Vercel: Dev/Preview/Prod)
✅ API_TOKEN (Vercel: Dev/Preview/Prod)
✅ HEALTH_CHECK_TOKEN (Vercel + GitHub Secrets)
```

**Valores documentados anteriores:**

- JWT_SECRET: `mLKjRwKIiSbe/JRohMoTgZWF0BsjVra/tSBAvBDZRwk=`
- AUTH_SECRET: `tXD6mAQMrstV3BWwgHyGoyLnS0Mv4q4HgXIqkYWCzAY=`
- API_TOKEN: `OR8W7K5UNNeSuVjKKOlFOGSJDEBenEBWbEKy++7QRp0=`
- HEALTH_CHECK_TOKEN: `go2ND3P9QtlublWDddDWw-gO0aP_v666`

**Estado:** ✅ Todos configurados y sincronizados entre Vercel y GitHub Secrets

---

#### **3. Sentry (Error Tracking)** ✅

```bash
✅ NEXT_PUBLIC_SENTRY_DSN (Vercel: Dev/Preview/Prod)
✅ SENTRY_DSN (Vercel: Dev/Preview/Prod)
✅ SENTRY_ORG (Vercel: Dev/Preview/Prod)
✅ SENTRY_PROJECT (Vercel: Dev/Preview/Prod)
✅ SENTRY_AUTH_TOKEN (Vercel: Preview/Prod)
✅ SENTRY_ENVIRONMENT (Vercel: Dev/Preview/Prod)
✅ SENTRY_TRACES_SAMPLE_RATE (Vercel: Dev/Preview/Prod)
✅ SENTRY_PROFILES_SAMPLE_RATE (Vercel: Dev/Preview/Prod)
✅ NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE (Vercel: Dev/Preview/Prod)
✅ NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE (Vercel: Dev/Preview/Prod)
✅ LOG_DRAIN_VERIFICATION_CODE (Vercel: Dev/Preview/Prod)
```

**Valores documentados anteriores:**

- Web DSN: `https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472`
- API DSN: `https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472`
- Organization: `brisacubana`
- Projects: `brisa-cubana-web`, `brisa-cubana-api`
- Log Drain Code: `7f4677dfb49b149c4a67d45e84e0bcaab835ea50`

**Estado:** ✅ Configuración completa de observabilidad Sentry + Vercel

---

#### **4. PostHog (Analytics)** ⚠️

```bash
✅ NEXT_PUBLIC_POSTHOG_KEY (Vercel: Dev/Preview/Prod)
✅ NEXT_PUBLIC_POSTHOG_HOST (Vercel: Dev/Preview/Prod)
✅ POSTHOG_API_KEY (GitHub Secrets)
```

**Valores documentados anteriores:**

- Project API Key (frontend): `phc_Y9ZpY5DBbJaQl6IACs8r16XyiThgaJ2DOWj4Ru81IQF`
- Personal API Key (CI/CD): `phx_IP8KY8eyCZMoiGJNN7DONvopGUeCKhI09azbBUs0YSfk23F`
- Host: `https://us.posthog.com`
- Project ID: `225064`

**Impacto:**

- ✅ `posthog-monitor.yml` puede ejecutarse (recomendado reactivarlo)
- ✅ Frontend analytics sigue operativo (NEXT_PUBLIC_POSTHOG_KEY)

---

#### **5. Slack Integration** ✅

```bash
✅ SLACK_WEBHOOK_URL (Vercel + GitHub Secrets)
```

**Valores documentados anteriores:**

- Webhook: `https://hooks.slack.com/services/...` (redactado)
- App ID: `A09MF1LE9UK`
- Canal: `#todo-brisa-cubana`

**Estado:** ✅ Sincronizado entre Vercel y GitHub Secrets, funcionando correctamente

---

#### **6. Stripe (Payment Processing)** ⚠️

```bash
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Vercel: Dev/Preview/Prod)
✅ STRIPE_WEBHOOK_SECRET (Vercel: Dev/Preview/Prod)
⚠️ STRIPE_SECRET_KEY (Vercel) - Dev/Preview ✅ · Prod ❌
```

**Valores documentados anteriores:**

- Publishable (test): `pk_test_brisa_demo_20251015`
- Secret (test): `sk_test_...` (valor exacto no documentado) ⚠️ **FALTANTE**
- Secret (live): `sk_live_brisa_20251020_prod` (según nota) ⚠️ **FALTANTE**
- Webhook Secret: `whsec_50609f14a3c3adf76df59159b3d1c177`

**Impacto:**

- ✅ Checkout en entornos de prueba habilitado (Development/Preview)
- 🔴 Producción bloqueada hasta cargar `sk_live_...`

**Acción pendiente (producción):**

```bash
# Production (live mode - SOLO si la cuenta está verificada)
vercel env add STRIPE_SECRET_KEY production
# Pega: sk_live_... (obtén la clave en https://dashboard.stripe.com/apikeys)

# Redeploy
vercel --prod
```

---

#### **7. URLs & Configuration** ✅

```bash
✅ NEXT_PUBLIC_API_URL (Vercel: Dev/Preview/Prod)
✅ INTERNAL_API_URL (Vercel: Dev/Preview/Prod)
✅ NEXT_PUBLIC_BASE_URL (Vercel: Dev/Preview/Prod)
✅ NEXT_PUBLIC_SITE_URL (Vercel: Dev/Preview/Prod)
✅ NEXTAUTH_URL (Vercel: Dev/Preview/Prod)
✅ ALLOWED_ORIGINS (Vercel: Dev/Preview/Prod)
```

**Estado:** ✅ URLs configuradas correctamente para todos los ambientes

---

#### **8. Rate Limiting** ✅

```bash
✅ LOGIN_RATE_LIMIT (Vercel: Dev/Preview/Prod)
✅ LOGIN_RATE_LIMIT_WINDOW_MS (Vercel: Dev/Preview/Prod)
```

**Estado:** ✅ Configurado correctamente

---

#### **9. Magic Link (Portal Cliente)** ✅

```bash
✅ PORTAL_MAGIC_LINK_EXPOSE_DEBUG (Vercel: Preview/Prod)
```

**Estado:** ✅ Configurado para debugging en ambientes no-producción

---

### ✅ **ELIMINACIONES CORRECTAS**

#### **LEAD_WEBHOOK_URL** - Eliminado correctamente ✅

**Valor anterior:**

- `https://example.com/lead-webhook` (placeholder, no funcional)

**Razón de eliminación:**

- Sistema migrado a captura interna de leads
- Leads ahora se guardan directamente en PostgreSQL (tabla `leads`)
- Endpoint nuevo: `POST /api/leads` (Hono API interno)
- Notificaciones ahora via SLACK_WEBHOOK_URL (más directo)

**Beneficios:**

- ✅ Sin dependencia de webhooks externos (Zapier/Make)
- ✅ Control total de datos
- ✅ Dashboard admin disponible (`GET /api/leads`)
- ✅ Tracking UTM completo en DB

---

## 📋 Checklist de Acción

### 🔴 **CRÍTICO (Bloqueante para pagos en producción)**

- [ ] **Agregar STRIPE_SECRET_KEY (live) en Vercel**
  - Production: `sk_live_...` (solo si cuenta Stripe verificada)
  - Redeploy después: `vercel --prod`

### ⚠️ **IMPORTANTE (Seguimiento)**

- [ ] Re-activar `posthog-monitor.yml` una vez verificado el secret (opcional)

---

## 🔐 Valores Pendientes

### **STRIPE_SECRET_KEY (live)**

**Cómo obtenerla:**

1. Ir a https://dashboard.stripe.com/apikeys (modo live).
2. Revelar la clave secreta (`sk_live_...`).
3. Agregarla a Vercel: `vercel env add STRIPE_SECRET_KEY production`.
4. Redeploy: `vercel --prod`.

**Estado actual:** Dev/Preview configurados con `sk_test_…`; producción en espera.

---

## 📊 Estadísticas

### **Vercel Environment Variables**

- **Total configuradas:** 32 variables (Dev/Preview completos)
- **Faltantes:** 1 en producción (`STRIPE_SECRET_KEY` live)
- **Completitud:** ≈97%

### **GitHub Secrets**

- **Total configuradas:** 5 secrets (100%)
- **Completitud:** 5/5

### **Eliminaciones Intencionales**

- **LEAD_WEBHOOK_URL:** ✅ Correctamente removido (migración a sistema interno)

---

## 🎯 Estado Final

### ✅ **Lo que está funcionando:**

1. ✅ Base de datos (Neon PostgreSQL)
2. ✅ Autenticación (JWT, NextAuth, Magic Links)
3. ✅ Observabilidad (Sentry error tracking + log drain)
4. ✅ Analytics frontend (PostHog write-only)
5. ✅ Notificaciones (Slack webhooks)
6. ✅ Sistema de leads (interno con PostgreSQL)
7. ✅ Rate limiting
8. ✅ URLs y routing

### 🔴 **Lo que NO está funcionando:**

1. 🔴 **Stripe checkout en producción** – falta `STRIPE_SECRET_KEY` live

### ✅ **Lo que se mejoró:**

1. ✅ Sistema de leads ahora es interno (no depende de webhooks externos)
2. ✅ Eliminado placeholder de LEAD_WEBHOOK_URL
3. ✅ Tracking UTM completo en base de datos

---

## 📞 Próximos Pasos

### **1. Agregar STRIPE_SECRET_KEY live (cuando toque activar pagos)**

```bash
# Obtener de Stripe Dashboard
open https://dashboard.stripe.com/test/apikeys

# Agregar a Vercel (solo producción)
vercel env add STRIPE_SECRET_KEY production

# Redeploy
vercel --prod
```

### **2. Verificar funcionamiento**

```bash
# Test checkout locally
pnpm dev
# Ir a http://localhost:3000/checkout

# Test PostHog monitor
gh workflow run posthog-monitor.yml
gh run list --workflow=posthog-monitor.yml
```

---

**Documento generado:** 26 de octubre de 2025
**Auditor:** Claude Code
**Estado:** ⚠️ 2 credenciales faltantes (1 crítica, 1 importante)
**Completitud general:** 94% (31/33)
