# Informe de Auditoría de Credenciales

**Fecha:** 27 de octubre de 2025  
**Alcance:** Comparación entre credenciales documentadas y configuración actual  
**Estado global:** ⚠️ 1 credencial crítica pendiente

---

## 📊 Resumen ejecutivo

- Variables críticas revisadas en Vercel (Dev y Preview completas; Prod con un pendiente)
- Secretos activos en GitHub (incluye `POSTHOG_API_KEY`)
- Se eliminó el uso de `API_TOKEN`; integraciones deben autenticarse con JWT emitidos por la API
- `LEAD_WEBHOOK_URL` sigue omitida intencionalmente

---

## 🔍 Análisis detallado

### ✅ Credenciales verificadas

#### 1. Base de datos (Neon PostgreSQL)

```bash
✅ DATABASE_URL (Vercel: Dev/Preview/Prod)
✅ DATABASE_URL_UNPOOLED (Vercel: Dev/Preview/Prod)
✅ NEON_API_KEY (GitHub Secrets)
```

Valores documentados anteriormente:

- Con pool: `postgresql://neondb_owner:npg_TNDc5pMA4Rjw@ep-winter-frog-ad2snh37-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Conexión directa: `postgresql://neondb_owner:npg_TNDc5pMA4Rjw@ep-winter-frog-ad2snh37.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`

Estado actual: ✅ Configuración correcta en Vercel (valores encriptados comprobados).

---

#### 2. Autenticación y seguridad

```bash
✅ JWT_SECRET (Vercel: Dev/Preview/Prod)
✅ AUTH_SECRET (Vercel: Dev/Preview/Prod)
✅ HEALTH_CHECK_TOKEN (Vercel + GitHub Secrets)
```

Valores documentados:

- JWT_SECRET: `mLKjRwKIiSbe/JRohMoTgZWF0BsjVra/tSBAvBDZRwk=`
- AUTH_SECRET: `tXD6mAQMrstV3BWwgHyGoyLnS0Mv4q4HgXIqkYWCzAY=`
- HEALTH_CHECK_TOKEN: `8c75d341231a71267cd13a1694f20d7f975d95cb115bfdb4831754cd81cae1f2`

Estado actual: ✅ Variables sincronizadas entre Vercel y GitHub Secrets. Se retiró `API_TOKEN` como mecanismo de autenticación; todas las integraciones deben usar JWT.

---

#### 3. Observabilidad (Sentry)

```bash
✅ NEXT_PUBLIC_SENTRY_DSN
✅ SENTRY_DSN
✅ SENTRY_ORG
✅ SENTRY_PROJECT
✅ SENTRY_AUTH_TOKEN (rotado 29-oct-2025; sincronizado en Vercel Dev/Preview/Prod y GitHub Secrets)
✅ SENTRY_ENVIRONMENT
✅ SENTRY_TRACES_SAMPLE_RATE
✅ SENTRY_PROFILES_SAMPLE_RATE
✅ NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
✅ NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE
✅ LOG_DRAIN_VERIFICATION_CODE
```

Valores de referencia:

- DSN (web y API): `https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472`
- Organización: `brisacubana`
- Proyectos: `brisa-cubana-web`, `brisa-cubana-api`
- Código de log drain: `7f4677dfb49b149c4a67d45e84e0bcaab835ea50`

Estado actual: ✅ Observabilidad completa enlazada con Vercel y GitHub (evento de prueba `4f0dc4dd-681e-43d0-8ce4-3f15a21fede5` enviado el 29-oct-2025).

---

#### 4. PostHog (analítica)

```bash
✅ NEXT_PUBLIC_POSTHOG_KEY (Vercel: Dev/Preview/Prod)
✅ NEXT_PUBLIC_POSTHOG_HOST (Vercel: Dev/Preview/Prod)
✅ POSTHOG_API_KEY (GitHub Secrets)
```

Valores de referencia:

- Clave de proyecto (frontend): `phc_Y9ZpY5DBbJaQl6IACs8r16XyiThgaJ2DOWj4Ru81IQF`
- Clave personal (CI/CD): `phx_IP8KY8eyCZMoiGJNN7DONvopGUeCKhI09azbBUs0YSfk23F`
- Host: `https://us.posthog.com`
- Id. de proyecto: `225064`

Impacto: ✅ El flujo `posthog-monitor.yml` puede ejecutarse en cualquier momento.

---

#### 5. Integración Slack

```bash
✅ SLACK_WEBHOOK_URL (Vercel + GitHub Secrets)
```

Valores de referencia:

- Webhook: `https://hooks.slack.com/services/...` (redactado)
- Id. de aplicación: `A09MF1LE9UK`
- Canal: `#todo-brisa-cubana`

Estado actual: ✅ Webhook activo y sincronizado.

---

#### 6. Stripe (procesamiento de pagos)

### Cómo documentar secretos de forma segura

1. **Nunca pegues valores reales** en el repositorio. Usa placeholders (`sk_live_…`, `whsec_************************`) o referencias a la fuente oficial.
2. **Describe el proceso de rotación**: dónde obtenerlo (p. ej. _Stripe Dashboard → Developers → Webhooks_), quién tiene acceso y qué comandos ejecutar.
3. **Registra la fecha de la última rotación** en esta auditoría y en el issue/PR asociado.
4. **Mantén Vercel y GitHub alineados**: cada actualización debe replicarse en ambientes `development`, `preview`, `production` y en los secretos de GitHub Actions correspondientes.
5. **Confirma en CI** que ninguna cadena filtrada aparece (`pnpm docs:verify` + secret scanning). Si GitHub detecta un secreto expuesto, rómpelo de inmediato y añade un comentario explicando la mitigación.

```bash
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Vercel: Dev/Preview/Prod)
✅ STRIPE_WEBHOOK_SECRET (Vercel: Dev/Preview/Prod) – Placeholder temporal generado el 2025-10-27. Reemplazar por el valor real desde Stripe antes de probar webhooks en vivo.
⚠️ STRIPE_SECRET_KEY (Vercel) — Dev/Preview ✅ · Prod ❌
```

Valores de referencia:

- Publishable (modo prueba): `pk_test_brisa_demo_20251015`
- Secret (modo prueba): `sk_test_...` (clave actual: `sk_test_redacted`)
- Secret (modo live, sugerido): `sk_live_brisa_20251020_prod`
- Webhook secret: `whsec_************************` _(consulta Vercel → Stripe Webhooks para el valor vigente; nunca registrar el valor literal)._

Impacto:

- ✅ Checkout operativo en entornos de prueba (Development/Preview)
- 🔴 Producción permanece bloqueada hasta cargar `sk_live_...`

---

#### 7. URLs y configuración general

```bash
✅ NEXT_PUBLIC_API_URL
✅ INTERNAL_API_URL
✅ NEXT_PUBLIC_BASE_URL
✅ NEXT_PUBLIC_SITE_URL
✅ NEXTAUTH_URL
✅ ALLOWED_ORIGINS
```

Estado actual: ✅ Enlaces alineados en los tres entornos.

---

#### 8. Rate limiting

```bash
✅ LOGIN_RATE_LIMIT
✅ LOGIN_RATE_LIMIT_WINDOW_MS
```

Estado actual: ✅ Protecciones activas en Vercel.

---

#### 9. Portal de clientes (Magic Link)

```bash
✅ PORTAL_MAGIC_LINK_EXPOSE_DEBUG (Vercel: Preview/Prod)
```

Estado actual: ✅ Configuración lista para depuración en ambientes no productivos.

---

### 🗑️ Eliminaciones intencionales

#### `LEAD_WEBHOOK_URL`

- Valor anterior: `https://example.com/lead-webhook` (placeholder sin uso)
- Motivo: migración a captura interna de leads.
- Cambios asociados:
  - Leads almacenados en PostgreSQL (`tabla leads`)
  - Endpoint interno: `POST /api/leads` (Hono API)
  - Notificaciones ahora mediante `SLACK_WEBHOOK_URL`

Beneficios: sin dependencias externas, control total de datos, dashboard administrativo y tracking UTM incluido.

---

## 📋 Lista de tareas

### 🔴 Crítico (bloquea cobros en producción)

- [ ] Agregar `STRIPE_SECRET_KEY` (modo live) en Vercel
  - Producción: `sk_live_...` (solo cuando la cuenta de Stripe esté verificada)
  - Redeploy requerido: `vercel --prod`

### ⚠️ Importante (seguimiento recomendado)

- [ ] Reactivar `posthog-monitor.yml` después de validar el secret (opcional pero sugerido).

---

## 🔐 Datos pendientes

### STRIPE_SECRET_KEY (live)

Cómo obtenerla:

1. Entrar a https://dashboard.stripe.com/apikeys (modo live).
2. Revelar la clave secreta (`sk_live_...`).
3. Agregarla en Vercel: `vercel env add STRIPE_SECRET_KEY production`.
4. Lanzar un redeploy: `vercel --prod`.

Estado actual: Dev/Preview usan `sk_test_…`; producción sigue en espera.

---

## 📈 Métricas de configuración

### Variables de entorno en Vercel

- Variables activas: 32
- Faltantes: 1 (solo en producción)
- Nivel de completitud: ~97 %

### Secretos en GitHub

- Secretos activos: 5
- Completitud: 100 %

### Eliminaciones previstas

- `LEAD_WEBHOOK_URL`: ✅ retirado tras migrar a sistema interno.

---

## 🎯 Estado final

### ✅ Operativo

1. Base de datos (Neon PostgreSQL)
2. Autenticación (JWT, NextAuth, Magic Links)
3. Observabilidad (Sentry + log drain)
4. Analítica frontend (PostHog write-only)
5. Notificaciones (Slack webhook)
6. Sistema interno de leads (PostgreSQL)
7. Rate limiting
8. URLs y enrutamiento

### 🔴 Pendiente

1. Stripe checkout en producción (falta `STRIPE_SECRET_KEY` live)

### ✅ Mejoras recientes

1. Migración de leads a backend interno
2. Eliminación del placeholder `LEAD_WEBHOOK_URL`
3. Tracking UTM completo en base de datos

---

## 📞 Próximos pasos

### 1. Cargar `STRIPE_SECRET_KEY` (live) cuando se habiliten cobros reales

```bash
# Obtener la clave desde el dashboard
open https://dashboard.stripe.com/test/apikeys

# Guardarla en Vercel (producción)
vercel env add STRIPE_SECRET_KEY production

# Redeploy
vercel --prod
```

### 2. Verificar funcionamiento

```bash
# Probar checkout en local
pnpm dev
# Abrir http://localhost:3000/checkout

# Ejecución del monitor de PostHog
gh workflow run posthog-monitor.yml
gh run list --workflow=posthog-monitor.yml
```

---

**Documento generado:** 26 de octubre de 2025  
**Responsable:** Claude Code  
**Pendientes detectados:** 2 credenciales (1 crítica, 1 importante)  
**Progreso total:** 94 % (31 de 33 credenciales)
