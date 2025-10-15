# Guía de Seguridad - Brisa Cubana Clean Intelligence

## ⚠️ Manejo de Credenciales y Secrets

### 🚨 REGLAS CRÍTICAS

1. **NUNCA commitear archivos .env con credenciales reales**
2. **NUNCA usar credenciales de producción en desarrollo local**
3. **NUNCA compartir secrets en Slack, Discord, o herramientas no seguras**
4. **SIEMPRE usar bases de datos locales para desarrollo**

---

## 📁 Archivos de Configuración

### `.env.example`

- ✅ **SÍ commitear** - Template sin credenciales reales
- ✅ Contiene estructura y variables necesarias
- ✅ Valores de ejemplo para desarrollo local

### `.env.local` (Desarrollo Local)

- ❌ **NO commitear** (está en `.gitignore`)
- ✅ Usar para desarrollo local
- ✅ Apunta a base de datos local
- ✅ Credenciales de desarrollo (no sensibles)

### `.env` (Producción - Solo en Vercel)

- ❌ **NO debe existir en tu máquina local**
- ❌ **NO commitear NUNCA**
- ✅ Solo en Vercel (configurado manualmente)
- ✅ Contiene credenciales reales de producción

---

## 🏗️ Configuración de Desarrollo Local

### 1. Copiar template

```bash
cp apps/api/.env.example apps/api/.env.local
```

### 2. Configurar base de datos local

```bash
# En .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev"
```

### 3. Levantar PostgreSQL local

```bash
docker compose up -d
```

### 4. Aplicar schema

```bash
cd apps/api
pnpm db:push --force-reset
pnpm db:seed:operativo
pnpm db:seed:demo
```

---

## 🔐 Variables de Entorno en Vercel

Las credenciales de producción están configuradas en:

- Vercel Dashboard → Project → Settings → Environment Variables

**Ambientes configurados:**

- `Production` - Credenciales reales
- `Preview` - Credenciales de staging
- `Development` - Credenciales de desarrollo

**Variables críticas adicionales:**

- `STRIPE_SECRET_KEY` (modo test en Preview/Development, live en Production).
- `STRIPE_PUBLISHABLE_KEY` (se usa en la aplicación web para inicializar Stripe.js).
- `STRIPE_WEBHOOK_SECRET` (clave de firma para `/api/payments/stripe/webhook`).
- Documenta los valores en 1Password/Vault del equipo y rota si hay fuga.

---

## 🧪 Testing

### Tests Unitarios

```bash
pnpm test  # Usa variables del código, no necesita .env
```

### Tests E2E (CI)

- GitHub Actions usa variables de entorno definidas en `.github/workflows/ci.yml`
- Usa PostgreSQL temporal (127.0.0.1:5432/brisa_ci)
- **NUNCA** toca la base de producción

---

## 🚨 Qué Hacer en Caso de Fuga de Credenciales

### Si commiteaste accidentalmente un `.env`:

1. **Rotar INMEDIATAMENTE** todas las credenciales expuestas:
   - `JWT_SECRET`
   - `AUTH_SECRET`
   - `API_TOKEN`
   - `DATABASE_URL` (regenerar password en Neon)

2. **Eliminar del historial de Git:**

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch apps/api/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

3. **Force push (PELIGROSO - coordinar con equipo):**

```bash
git push origin --force --all
```

4. **Reportar al equipo** el incidente

---

## ✅ Checklist de Seguridad

Antes de cada commit:

- [ ] `git status` no muestra archivos `.env` o `.env.local`
- [ ] Archivos sensibles están en `.gitignore`
- [ ] No hay credenciales hardcodeadas en el código
- [ ] Variables de entorno usan valores por defecto seguros

---

## 📚 Recursos Adicionales

- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Neon Security Best Practices](https://neon.tech/docs/security)

---

**Última actualización:** 15 de octubre de 2025
**Mantenido por:** Equipo Brisa Cubana
