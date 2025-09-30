# GitHub Secrets Configuration Guide

Esta guía documenta todos los secretos necesarios para configurar en GitHub Actions para CI/CD y deployment automático.

## 📋 Tabla de Contenidos

- [¿Por qué GitHub Secrets?](#por-qué-github-secrets)
- [Secretos Requeridos](#secretos-requeridos)
- [Secretos Opcionales](#secretos-opcionales)
- [Cómo Configurar Secretos](#cómo-configurar-secretos)
- [Verificación](#verificación)
- [Rotación de Secretos](#rotación-de-secretos)

---

## ¿Por qué GitHub Secrets?

Los secretos de GitHub Actions permiten:

- ✅ Ejecutar tests que requieren servicios externos
- ✅ Desplegar automáticamente a producción/staging
- ✅ Enviar notificaciones a Slack
- ✅ Reportar coverage a Codecov
- ✅ Ejecutar reconciliaciones programadas de pagos

**⚠️ NUNCA** commitear secretos en el código. Siempre usar GitHub Secrets o variables de entorno seguras.

---

## Secretos Requeridos

### 1. **DATABASE_URL** (Crítico)

Conexión a PostgreSQL para CI/CD y workflows programados.

**Formato:**

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Ejemplos:**

```bash
# Railway
postgresql://postgres:mypassword@containers-us-west-123.railway.app:5432/railway

# Neon
postgresql://user:password@ep-cool-mud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Supabase
postgresql://postgres.xxxxxxxxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Dónde obtenerlo:**

- Railway: Dashboard → Database → Connection String
- Neon: Dashboard → Connection String (pooled)
- Supabase: Project Settings → Database → Connection String

**Usado en:**

- `.github/workflows/ci.yml` (tests)
- `.github/workflows/payments-reconcile.yml` (reconciliación)

---

### 2. **JWT_SECRET** (Crítico)

Secreto para firmar y verificar tokens JWT de autenticación.

**Generar:**

```bash
openssl rand -hex 64
```

**Ejemplo:**

```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef12345678901234567890
```

**Requerimientos:**

- Mínimo 64 caracteres hexadecimales
- Único por entorno (dev ≠ staging ≠ prod)
- Rotar cada 90 días

**Usado en:**

- API para generar/verificar access tokens

---

### 3. **STRIPE_SECRET_KEY** (Crítico para Pagos)

API key privada de Stripe para procesar pagos.

**Formato:**

```
sk_live_51[REDACTED_KEY_HERE_80_CHARS]
```

**Dónde obtenerlo:**

- [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Developers → API Keys

**Ambientes:**

- **Test**: `sk_test_...` (para staging/CI)
- **Live**: `sk_live_...` (para producción)

⚠️ **NUNCA** usar live keys en desarrollo/CI

**Usado en:**

- `.github/workflows/payments-reconcile.yml`
- API backend para crear checkout sessions y webhooks

---

### 4. **STRIPE_WEBHOOK_SECRET** (Crítico para Webhooks)

Secreto para verificar la firma de eventos de Stripe.

**Formato:**

```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Dónde obtenerlo:**

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Webhooks
2. Crear webhook con endpoint: `https://tu-api.com/api/payments/webhook`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Copiar "Signing secret"

**Ambientes:**

- Test: Un webhook para staging
- Live: Un webhook para producción

**Usado en:**

- API para validar eventos entrantes de Stripe

---

### 5. **NEXTAUTH_SECRET** (Crítico)

Secreto para cifrar cookies y tokens de NextAuth.

**Generar:**

```bash
openssl rand -base64 32
```

**Ejemplo:**

```
xV3kM8pL2qR9nT4wZ7yB6cA5dF1gH0jI==
```

**Requerimientos:**

- Base64 encoded
- Mínimo 32 bytes
- Único por entorno

**Usado en:**

- Frontend Next.js para sesiones seguras

---

## Secretos Opcionales

### 6. **CODECOV_TOKEN** (Code Coverage)

Token para subir reportes de coverage a Codecov.

**Dónde obtenerlo:**

1. Ir a [Codecov](https://codecov.io/)
2. Conectar tu repositorio
3. Settings → Repository Upload Token

**Formato:**

```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Usado en:**

- `.github/workflows/ci.yml` (job: test)

**Si no se configura:** Los tests correrán pero no se subirá coverage a Codecov.

---

### 7. **SENTRY_DSN** (Error Tracking)

DSN para enviar errores a Sentry.

**Dónde obtenerlo:**

1. [Sentry Dashboard](https://sentry.io/)
2. Create Project → Next.js / Node.js
3. Settings → Client Keys (DSN)

**Formato:**

```
https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@oxxxxxx.ingest.sentry.io/xxxxxxx
```

**Usado en:**

- Frontend y Backend para capturar errores en producción

**Si no se configura:** La app funcionará pero sin tracking de errores.

---

### 8. **ALERTS_SLACK_WEBHOOK** (Notificaciones)

Webhook de Slack para alertas de pagos fallidos.

**Cómo crear:**

1. Ir a [Slack API Apps](https://api.slack.com/apps)
2. Create New App → From Scratch
3. Incoming Webhooks → Activate
4. Add New Webhook to Workspace
5. Seleccionar canal (ej: `#alerts-payments`)
6. Copiar Webhook URL

**Formato:**

```
https://hooks.slack.com/services/T[WORKSPACE_ID]/B[CHANNEL_ID]/[SECRET_TOKEN]
```

**Usado en:**

- API para enviar alertas cuando hay pagos fallidos o pendientes

**Si no se configura:** Las alertas se guardan en DB pero no se notifican a Slack.

---

### 9. **VERCEL_TOKEN** (Deployment)

Token para despliegues automáticos a Vercel desde GitHub Actions.

**Cómo obtenerlo:**

1. [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create Token → Scope: Full Account
3. Copiar token (solo se muestra una vez)

**Usado en:**

- Despliegue automatizado desde GitHub Actions (alternativa a integración nativa)

**Si no se configura:** Usar integración nativa Vercel-GitHub (recomendado).

---

## Cómo Configurar Secretos

### Opción 1: GitHub Web UI

1. Ir a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click en "New repository secret"
4. Nombre: `DATABASE_URL`
5. Value: Pegar el valor
6. Click "Add secret"
7. Repetir para cada secreto

### Opción 2: GitHub CLI

```bash
# Configurar un secreto
gh secret set DATABASE_URL --body "postgresql://user:pass@host:5432/db"

# Desde archivo
echo "postgresql://user:pass@host:5432/db" | gh secret set DATABASE_URL

# Listar secretos configurados
gh secret list

# Eliminar un secreto
gh secret delete NOMBRE_SECRETO
```

### Opción 3: Script Automatizado

```bash
#!/bin/bash
# setup-secrets.sh

# Cargar desde .env.production (NO commitear este archivo)
source .env.production

gh secret set DATABASE_URL --body "$DATABASE_URL"
gh secret set JWT_SECRET --body "$JWT_SECRET"
gh secret set STRIPE_SECRET_KEY --body "$STRIPE_SECRET_KEY"
gh secret set STRIPE_WEBHOOK_SECRET --body "$STRIPE_WEBHOOK_SECRET"
gh secret set NEXTAUTH_SECRET --body "$NEXTAUTH_SECRET"

# Opcionales
[ -n "$CODECOV_TOKEN" ] && gh secret set CODECOV_TOKEN --body "$CODECOV_TOKEN"
[ -n "$SENTRY_DSN" ] && gh secret set SENTRY_DSN --body "$SENTRY_DSN"
[ -n "$ALERTS_SLACK_WEBHOOK" ] && gh secret set ALERTS_SLACK_WEBHOOK --body "$ALERTS_SLACK_WEBHOOK"

echo "✅ Secretos configurados correctamente"
```

---

## Verificación

### Verificar que los secretos están configurados

```bash
# Listar todos los secretos
gh secret list

# Debería mostrar:
# DATABASE_URL            Updated 2025-09-30
# JWT_SECRET              Updated 2025-09-30
# STRIPE_SECRET_KEY       Updated 2025-09-30
# STRIPE_WEBHOOK_SECRET   Updated 2025-09-30
# NEXTAUTH_SECRET         Updated 2025-09-30
```

### Verificar en un Workflow

Los workflows pueden acceder a secretos con `${{ secrets.NOMBRE_SECRETO }}`:

```yaml
- name: Run tests
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
  run: pnpm test
```

### Test de Conectividad

Crear un workflow temporal para verificar:

```yaml
name: Test Secrets
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Database Connection
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          echo "DATABASE_URL configurado: ${DATABASE_URL:0:20}..."
          # Aquí podrías hacer un ping real si tienes psql instalado
```

---

## Rotación de Secretos

### Frecuencia Recomendada

| Secreto                 | Frecuencia                      | Criticidad |
| ----------------------- | ------------------------------- | ---------- |
| `JWT_SECRET`            | Cada 90 días                    | 🔴 Alta    |
| `NEXTAUTH_SECRET`       | Cada 90 días                    | 🔴 Alta    |
| `STRIPE_SECRET_KEY`     | Anual o si comprometido         | 🔴 Alta    |
| `DATABASE_URL`          | Al cambiar DB o si comprometido | 🔴 Alta    |
| `STRIPE_WEBHOOK_SECRET` | Anual o si comprometido         | 🟡 Media   |
| `CODECOV_TOKEN`         | Anual                           | 🟢 Baja    |

### Proceso de Rotación

1. **Generar nuevo secreto:**

   ```bash
   NEW_JWT_SECRET=$(openssl rand -hex 64)
   ```

2. **Actualizar en GitHub:**

   ```bash
   gh secret set JWT_SECRET --body "$NEW_JWT_SECRET"
   ```

3. **Actualizar en servicios de deployment:**
   - Vercel: Environment Variables
   - Railway: Variables
   - Fly.io: Secrets

4. **Verificar que la app siga funcionando**

5. **Documentar la rotación en un issue cerrado**

---

## Checklist de Configuración

Antes de hacer deploy a producción, verifica:

- [ ] `DATABASE_URL` configurado y funcionando
- [ ] `JWT_SECRET` generado (64 chars hex)
- [ ] `NEXTAUTH_SECRET` generado (32 bytes base64)
- [ ] `STRIPE_SECRET_KEY` configurado (live keys para prod)
- [ ] `STRIPE_WEBHOOK_SECRET` configurado con endpoint correcto
- [ ] Webhook de Stripe configurado en Dashboard
- [ ] `CODECOV_TOKEN` configurado (opcional)
- [ ] `SENTRY_DSN` configurado (opcional)
- [ ] `ALERTS_SLACK_WEBHOOK` configurado (opcional)
- [ ] Todos los secretos verificados con `gh secret list`
- [ ] CI/CD workflow ejecutado exitosamente
- [ ] Deployment a staging probado
- [ ] Deployment a producción validado

---

## Troubleshooting

### Error: "Secret not found"

**Causa:** El workflow intenta usar un secreto que no está configurado.

**Solución:**

```bash
gh secret set NOMBRE_SECRETO --body "valor"
```

### Error: "Invalid DATABASE_URL"

**Causa:** Formato incorrecto de la URL de conexión.

**Solución:** Verifica que tenga el formato correcto:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Error: "Stripe signature verification failed"

**Causa:** `STRIPE_WEBHOOK_SECRET` incorrecto o endpoint no coincide.

**Solución:**

1. Verificar que el webhook en Stripe Dashboard apunta al endpoint correcto
2. Re-copiar el "Signing secret"
3. Actualizar el secreto en GitHub

---

## Seguridad

### ✅ Buenas Prácticas

- ✅ Usar GitHub Secrets (nunca commitear secretos)
- ✅ Rotar secretos regularmente
- ✅ Usar secrets diferentes por ambiente (dev/staging/prod)
- ✅ Limitar acceso al repositorio
- ✅ Habilitar 2FA en GitHub
- ✅ Revisar logs de acceso regularmente

### ❌ Nunca Hacer

- ❌ Commitear `.env` con valores reales
- ❌ Usar production keys en desarrollo
- ❌ Compartir secretos por email/Slack
- ❌ Hardcodear secretos en código
- ❌ Usar el mismo secreto en múltiples proyectos
- ❌ Loguear valores de secretos en CI

---

## Referencias

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [NextAuth Secret Configuration](https://next-auth.js.org/configuration/options#secret)
- [Railway Secrets](https://docs.railway.app/develop/variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Última actualización:** 30 de septiembre de 2025
**Mantenedor:** albertodimasmorazaldivar@gmail.com
