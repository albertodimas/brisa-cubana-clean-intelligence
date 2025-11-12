# Brisa OS – Guía de configuración en producción

**Última actualización:** 12 de noviembre de 2025  
**Estado:** Vigente (SaaS – Brisa OS)

---

## 🔐 Critical Environment Variables

### **1. Stripe Secret Key (REQUIRED)**

El proyecto actualmente tiene configuradas las claves públicas de Stripe pero **falta la clave secreta**.

#### **Acción requerida:**

1. **Obtener las claves de Stripe Dashboard:**
   - Ve a https://dashboard.stripe.com/apikeys
   - Copia las claves según el entorno:
     - **Test mode:** `sk_test_...` (para Development + Preview)
     - **Live mode:** `sk_live_...` (solo para Production)

2. **Agregar a Vercel:**

   ```bash
   # Development (test mode)
   vercel env add STRIPE_SECRET_KEY development
   # Pega: sk_test_...

   # Preview (test mode)
   vercel env add STRIPE_SECRET_KEY preview
   # Pega: sk_test_...

   # Production (live mode - SOLO si tienes cuenta verificada)
   vercel env add STRIPE_SECRET_KEY production
   # Pega: sk_live_...
   ```

3. **Verificar variables existentes:**

   ```bash
   vercel env ls | grep STRIPE
   ```

   Deberías ver:

   ```
   ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (Dev/Preview/Prod)
   ✅ STRIPE_WEBHOOK_SECRET                (Dev/Preview/Prod)
   ✅ STRIPE_SECRET_KEY                    (Dev/Preview/Prod) ← NUEVO
   ```

4. **Redeploy después de agregar:**

   ```bash
   # Para preview (última rama)
   vercel

   # Para production (main)
   vercel --prod
   ```

````

### **2. Cache de Calendario (opcional)**

`CALENDAR_CACHE_TTL_MS` controla el tiempo de vida (en milisegundos) de la caché que utiliza `/api/calendar`. El default es `60000`. Si necesitas depurar en caliente puedes ponerlo en `0`, pero en producción recomendamos mantenerlo entre 30 000 y 120 000 para aligerar Prisma cuando se cambian filtros constantemente.

```bash
vercel env add CALENDAR_CACHE_TTL_MS preview
vercel env add CALENDAR_CACHE_TTL_MS production
````

---

## 🌐 Web App Environment Sync

El proyecto `web` en Vercel requiere un set mínimo de variables alineadas en **preview** y **production** para que los builds no fallen (Next 16 valida esto en `next.config.mjs`). Usa este bloque como checklist cada vez que clones el proyecto o restableces el entorno:

```bash
vercel env add NEXT_PUBLIC_API_URL preview
vercel env add NEXT_PUBLIC_API_URL production
vercel env add INTERNAL_API_URL preview
vercel env add INTERNAL_API_URL production
vercel env add NEXT_PUBLIC_BASE_URL preview
vercel env add NEXT_PUBLIC_BASE_URL production
vercel env add NEXT_PUBLIC_SITE_URL preview
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add NEXTAUTH_URL preview
vercel env add NEXTAUTH_URL production
vercel env add PORTAL_MAGIC_LINK_BASE_URL preview
vercel env add PORTAL_MAGIC_LINK_BASE_URL production
vercel env add PORTAL_MAGIC_LINK_CONFIRMATION_PATH preview
vercel env add PORTAL_MAGIC_LINK_CONFIRMATION_PATH production
vercel env add NEXT_PUBLIC_POSTHOG_HOST preview
vercel env add NEXT_PUBLIC_POSTHOG_HOST production
vercel env add NEXT_PUBLIC_POSTHOG_KEY preview
vercel env add NEXT_PUBLIC_POSTHOG_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_ENABLE_PUBLIC_CHECKOUT preview
vercel env add NEXT_PUBLIC_ENABLE_PUBLIC_CHECKOUT production
```

> Todas apuntan a `https://api.brisacubanacleanintelligence.com` / `https://brisacubanacleanintelligence.com` salvo las claves PostHog y Stripe. Tras el alta, ejecuta `vercel env pull --environment production` para verificar que `NEXT_PUBLIC_API_URL` e `INTERNAL_API_URL` estén presentes; sin ellas el build muere con `NEXT_PUBLIC_API_URL or INTERNAL_API_URL must be defined`.

Adicional:

- `HEALTH_CHECK_TOKEN` debe existir en el proyecto API y también como secreto de GitHub para que el monitor “Production Health Monitor” no regrese códigos `000`.
- Cuando edites este bloque vuelve a desplegar los dos proyectos (`apps/web` y `apps/api`) con `vercel --cwd apps/web` y `vercel --cwd apps/api` para propagar los envs recien cargados.

## 📊 Lead Capture System

El sistema de captura de leads se orquesta internamente (landing → API → PostgreSQL) y puede replicar cada registro hacia Slack y/o un CRM vía webhook. El endpoint `/api/leads` ejecuta hasta **3 intentos** con _timeouts_ de 5 segundos antes de marcar un fallo definitivo (ver `apps/api/src/routes/leads.ts`). Los leads QA (emails con `qa+` o notas de prueba) se marcan automáticamente como `LOST` para no contaminar el pipeline comercial.

### **Arquitectura actual:**

```
Landing Form → API /api/leads → PostgreSQL (tabla leads) → Slack (opcional)
```

### **Variables de entorno:**

```bash
# ✅ RECOMENDADO
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
LEAD_WEBHOOK_URL=https://crm.miempresa.com/hooks/brisa-leads

# Opcional
# Si no defines LEAD_WEBHOOK_URL los leads quedan en Postgres + Slack.
```

> Usa `scripts/test-lead-webhook.sh` tras exportar `LEAD_WEBHOOK_URL` para validar que el CRM responda 2xx. Cada intento fallido se loguea como `[lead webhook] attempt <n> failed` y se reintenta automáticamente con _backoff_ incremental.

### **Endpoints disponibles:**

```bash
# Público (landing page)
POST https://brisa-cubana-clean-intelligence-api.vercel.app/api/leads

# Admin (panel interno)
GET https://brisa-cubana-clean-intelligence-api.vercel.app/api/leads
# Requiere: Authorization: Bearer <JWT>
```

### **Schema de datos:**

```prisma
model Lead {
  id              String     @id @default(cuid())
  name            String
  email           String
  phone           String?
  company         String?
  propertyCount   String?
  serviceInterest String?
  notes           String?
  status          LeadStatus @default(NEW)
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  utmContent      String?
  utmTerm         String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  CONVERTED
  LOST
}
```

---

## 💸 Cobros manuales (Zelle / transferencias bancarias)

Mientras Stripe Billing pasa a modo live, los servicios se cobran manualmente a través de Zelle o transferencias ACH.

### 1. Datos de cobro

- **Cuenta Zelle:** `payments@brisacubanacleanintelligence.com`
- **Titular:** Brisa Cubana Clean Intelligence LLC
- **Referencia sugerida:** `Servicio-{propiedad}-{fecha}`

### 2. Flujo operativo

1. Al cerrar un turno en el panel, generar el reporte PDF/Markdown y adjuntar evidencias.
2. Enviar correo “Resumen de servicio” con el reporte y datos de pago (plantilla en `docs/operations/templates/email-post-service.md`).
3. Registrar en el panel (campo notas) la fecha de cobro y método (`Zelle`, `ACH`, etc.).
4. Actualizar el dashboard financiero semanal (ver `docs/operations/backup-log.md`) con monto, cliente y status (`pendiente`, `pagado`).

### 3. Facturación / recibos

- Usar la plantilla `docs/operations/templates/invoice-manual.docx` (personalizar con EIN al obtenerlo).
- Condiciones estándar: _pago neto 7 días_, mora 1.5 % mensual.
- Al recibir el pago, enviar confirmación rápida por correo y marcar el turno como “Pagado” en el panel.

Cuando Stripe esteja listo, se actualizará este documento para reflejar Checkout/Billing y automatizar recibos.

---

## 🎨 Active Data Refresh

Proceso para actualizar contenido, métricas y assets en producción.

### **1. Actualizar Assets (Imágenes/Videos)**

#### **Estructura de carpetas:**

```
apps/web/public/assets/
├── video/
│   ├── hero.mp4                    # Video principal (< 5MB recomendado)
│   └── hero-poster.jpg             # Frame del video para placeholder
├── hero/
│   ├── hero-768w.webp             # Mobile
│   ├── hero-1280w.webp            # Tablet
│   ├── hero-1920w.webp            # Desktop
│   └── hero-2400w.webp            # Retina
└── mockups/
    ├── 16-9/                       # Mockups horizontales (desktop)
    │   ├── portal-dashboard-1280w.webp
    │   ├── portal-dashboard-1920w.webp
    │   ├── portal-bookings-1280w.webp
    │   ├── portal-bookings-1920w.webp
    │   ├── portal-services-1280w.webp
    │   └── portal-services-1920w.webp
    └── 4-5/                        # Mockups verticales (móvil)
        ├── portal-mobile-540w.webp
        └── portal-mobile-1080w.webp
```

#### **Optimización de imágenes:**

```bash
# Usando sharp (CLI)
pnpm exec sharp -i original.png -o hero-1920w.webp --webp quality=85

# O usando herramientas visuales:
# - Squoosh: https://squoosh.app
# - ImageOptim: https://imageoptim.com
# - TinyPNG: https://tinypng.com
```

#### **Formato recomendado:**

- **WebP** para imágenes (85% calidad, hasta 90% reducción vs PNG)
- **MP4/H.264** para videos (compresión alta, compatible con todos los browsers)
- **Resoluciones**:
  - Mobile: 540w-768w
  - Tablet: 1024w-1280w
  - Desktop: 1920w
  - Retina: 2400w

---

### **2. Actualizar Copy y Métricas**

Todos los valores están centralizados en `apps/web/app/page.tsx`.

#### **Estadísticas del hero** (líneas 360-390):

```typescript
<dl className="grid grid-cols-2 gap-3">
  <div>
    <dt className="font-medium text-brisa-600">12-25</dt>  // ← CAMBIAR AQUÍ
    <dd>rotaciones/año por propiedad</dd>
  </div>
  <div>
    <dt className="font-medium text-brisa-600">81%</dt>    // ← CAMBIAR AQUÍ
    <dd>reviews influidas por la limpieza</dd>
  </div>
  <div>
    <dt className="font-medium text-brisa-600">13K+</dt>   // ← CAMBIAR AQUÍ
    <dd>listados activos en Miami y alrededores</dd>
  </div>
  <div>
    <dt className="font-medium text-brisa-600">24/7</dt>
    <dd>cobertura operativa en temporada alta</dd>
  </div>
</dl>
```

#### **Precios de servicios** (líneas 93-140):

```typescript
const pricingTiers: PricingTier[] = [
  {
    id: "turnover",
    name: "Turnover Premium Airbnb",
    headline: "Turnos garantizados < 120 min", // sincronizado con landing
    price: "$249", // precio base por salida confirmada
    priceSuffix: "por salida",
    description: "Para listados urbanos con 12-25 rotaciones al año...",
    features: [
      "Reposición completa de amenities...",
      // ...
    ],
  },
  {
    id: "deep-clean",
    name: "Deep Clean Brickell Collection",
    headline: "Detallado premium trimestral", // sincronizado con landing
    price: "$369", // precio base por servicio programado
    // ...
  },
  // ...
];
```

#### **Redes sociales** (líneas 142-175):

```typescript
const socialLinks = [
  {
    name: "Instagram",
    handle: "@BrisaCleanIntelligence", // ← CAMBIAR AQUÍ
    href: "https://instagram.com/BrisaCleanIntelligence", // ← CAMBIAR AQUÍ
    description: "Historias y reels del equipo en acción...",
  },
  {
    name: "Facebook",
    handle: "Brisa Clean Intelligence", // ← CAMBIAR AQUÍ
    href: "https://facebook.com/BrisaCleanIntelligence", // ← CAMBIAR AQUÍ
    description: "Casos completos, reseñas de clientes...",
  },
  // ...
];
```

---

### **3. Proceso de Deployment**

#### **Checklist pre-deployment:**

```bash
# 1. Verificar cambios
git status

# 2. Linter
pnpm lint

# 3. TypeScript
pnpm typecheck

# 4. Tests
pnpm test

# 5. Build local
pnpm build

# 6. Verificar bundle size
# Web debe ser < 250KB First Load JS
# API debe compilar sin errores
```

#### **Deployment a producción:**

```bash
# 1. Commit
git add apps/web/public/assets apps/web/app/page.tsx
git commit -m "feat: actualizar assets y métricas de producción

- Agregar video hero optimizado
- Actualizar precios a valores reales
- Corregir handles de redes sociales
- Optimizar imágenes a WebP 85%"

# 2. Push a main (auto-deploy)
git push origin main

# 3. Verificar CI/CD en GitHub Actions
# https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions

# 4. Verificar deployment en Vercel
# https://vercel.com/albertodimas-projects/brisa-cubana-clean-intelligence

# 5. Validar en producción
# https://brisa-cubana-clean-intelligence.vercel.app

# 6. Forzar refresh del cache (si es necesario)
# Ctrl/Cmd + Shift + R
# O modo incógnito: Ctrl/Cmd + Shift + N
```

#### **Rollback en caso de problemas:**

```bash
# Opción 1: Revertir en Vercel Dashboard
# Settings → Deployments → [deployment anterior] → Promote to Production

# Opción 2: Revertir git commit
git revert HEAD
git push origin main

# Opción 3: Rollback a commit específico
git reset --hard <commit-hash>
git push origin main --force  # ⚠️ Solo si es urgente
```

---

## 🔄 Workflow recomendado

### **Para cambios pequeños (copy, precios):**

```bash
1. Editar apps/web/app/page.tsx
2. pnpm lint && pnpm typecheck
3. git commit -m "feat: actualizar precios Q1 2026"
4. git push origin main
```

### **Para cambios grandes (assets, diseño):**

```bash
1. Crear branch: git checkout -b feat/new-assets
2. Hacer cambios
3. Verificar: pnpm lint && pnpm typecheck && pnpm build
4. Commit: git commit -m "feat: nuevo diseño hero section"
5. Push: git push origin feat/new-assets
6. Crear PR en GitHub
7. Verificar Preview URL de Vercel
8. Merge a main después de aprobación
```

---

## 📈 Monitoring Post-Deployment

### **1. Verificar en Sentry (primeras 24h):**

- https://sentry.io/organizations/brisacubana/projects/
- Revisar errores nuevos
- Verificar performance regression

### **2. Verificar en Vercel Analytics:**

- https://vercel.com/albertodimas-projects/brisa-cubana-clean-intelligence/analytics
- Core Web Vitals
- Real User Monitoring

### **3. Verificar leads:**

```bash
# Conectarse a la base de datos
psql $DATABASE_URL

# Ver leads recientes
SELECT id, name, email, status, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

# Ver conversión por fuente UTM
SELECT utm_source, COUNT(*) as total,
       COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted
FROM leads
GROUP BY utm_source;
```

### **4. Verificar Slack notifications:**

- Revisar canal configurado en SLACK_WEBHOOK_URL
- Verificar que lleguen notificaciones de leads nuevos

---

## 🆘 Troubleshooting

### **Assets no cargan:**

```bash
# 1. Verificar que existen
ls -la apps/web/public/assets/video/

# 2. Verificar referencias en código
grep -r "hero.mp4" apps/web/app/

# 3. Clear cache de Vercel
# Dashboard → Settings → General → Clear Cache
```

### **Leads no se guardan:**

```bash
# 1. Verificar endpoint
curl -X POST https://brisa-cubana-clean-intelligence-api.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com"}'

# 2. Verificar logs en Vercel
# Dashboard → Logs → Filter by /api/leads

# 3. Verificar Prisma schema
DATABASE_URL="..." pnpm exec prisma db push
```

### **Stripe checkout falla:**

```bash
# 1. Verificar STRIPE_SECRET_KEY configurado
vercel env ls | grep STRIPE_SECRET_KEY

# 2. Verificar modo (test vs live)
# Dashboard → Settings → Environment Variables
# Development/Preview debe usar sk_test_...
# Production debe usar sk_live_... (solo si cuenta verificada)

# 3. Verificar webhook secret coincide
# Stripe Dashboard → Webhooks → [endpoint] → Signing secret
```

---

## 📞 Contacto y Soporte

- **GitHub Issues:** https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues
- **Vercel Support:** https://vercel.com/support
- **Stripe Support:** https://support.stripe.com

---

**Documento mantenido por:** Claude Code + Alberto Dimas
**Última revisión:** 26 de octubre de 2025
