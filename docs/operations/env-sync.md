# Sincronización de Variables de Entorno

> ✅ Referencia rápida: ejecuta `pnpm env:status` para validar que `.env.local` cumple con el manifest central (`config/env.manifest.json`). Si quieres que el comando devuelva código de error cuando falte alguna variable (por ejemplo en CI), usa `pnpm env:status --strict`. Actualiza el manifest cuando añadas o elimines claves para evitar duplicados entre Vercel, GitHub Actions y desarrollo.

La plataforma ejecuta automáticamente esta verificación todos los lunes a las 06:00 UTC mediante el workflow `Env Manifest Audit`. Si aparece en rojo, revisa los pasos inferiores y corrige los entornos antes de volver a ejecutar manualmente el job (`Actions → Env Manifest Audit → Run workflow`).

Pasos para alinear los valores de entorno propios del proxy web y del portal cliente después de retirar `API_TOKEN`.

## 1. Vercel – Proyecto Web (`brisa-cubana-clean-intelligence`)

1. Comprobar valores locales:
   ```bash
   grep -E "^(PROXY_ALLOWED_ORIGINS|PORTAL_MAGIC_LINK_EXPOSE_DEBUG)" .env.local
   ```
2. Propagar a cada entorno con la CLI (usa el scope del equipo):

   ```bash
   export VERCEL_ORG_ID=team_GI7iQ5ivPN36nVRB1Y9IJ9UW
   export VERCEL_PROJECT_ID=prj_n11x8GsVN5qDw0eOFAcQiOfpc0Zg

   # Producción
   vercel env rm PROXY_ALLOWED_ORIGINS production --yes || true
   echo "https://brisacubanacleanintelligence.com,https://brisa-cubana-clean-intelligence.vercel.app" | \
     vercel env add PROXY_ALLOWED_ORIGINS production

   # Preview
   vercel env rm PROXY_ALLOWED_ORIGINS preview --yes || true
   echo "https://preview.brisacubanacleanintelligence.com" | \
     vercel env add PROXY_ALLOWED_ORIGINS preview

   # Development
   vercel env rm PROXY_ALLOWED_ORIGINS development --yes || true
   echo "http://localhost:3000" | vercel env add PROXY_ALLOWED_ORIGINS development

   # Asegurar que la bandera de debug no queda activa salvo en dev
   vercel env rm PORTAL_MAGIC_LINK_EXPOSE_DEBUG production --yes || true
   vercel env rm PORTAL_MAGIC_LINK_EXPOSE_DEBUG preview --yes || true
   echo "true" | vercel env add PORTAL_MAGIC_LINK_EXPOSE_DEBUG development
   ```

3. Ajustar las URL públicas y la telemetría para evitar redirecciones a `vercel.app`:

   ```bash
   # URL canónica (sin trailing slash ni espacios)
   echo "https://brisacubanacleanintelligence.com" | vercel env add NEXT_PUBLIC_SITE_URL production --force
   echo "https://brisacubanacleanintelligence.com" | vercel env add NEXT_PUBLIC_BASE_URL production --force

   # Host de PostHog (evita cambiar a us.posthog.com)
   echo "https://us.i.posthog.com" | vercel env add NEXT_PUBLIC_POSTHOG_HOST production --force

   # Habilitar el checkout sólo cuando esté listo comercialmente
   echo "false" | vercel env add NEXT_PUBLIC_ENABLE_PUBLIC_CHECKOUT production --force
   ```

   Repite el procedimiento para los entornos preview/development según corresponda (por ejemplo, dejar `NEXT_PUBLIC_ENABLE_PUBLIC_CHECKOUT` en `true` sólo en staging controlado).

4. Si no se usa la CLI, repetir los mismos valores desde **Settings → Environment Variables** en el panel de Vercel.

## 2. GitHub Actions

1. Eliminar cualquier rastro del secreto `API_TOKEN`:
   ```bash
   gh secret remove API_TOKEN || true
   gh secret remove API_TOKEN --env preview-web || true
   gh secret remove API_TOKEN --env production-web || true
   gh secret remove API_TOKEN --env preview-api || true
   gh secret remove API_TOKEN --env production-api || true
   ```
2. Confirmar que `JWT_SECRET` y `AUTH_SECRET` siguen presentes en los entornos correspondientes:
   ```bash
   gh secret list --env production-web | grep -E "(JWT_SECRET|AUTH_SECRET)"
   gh secret list --env production-api | grep -E "(JWT_SECRET|AUTH_SECRET)"
   ```

## 3. Smoke test posterior

Una vez propagados los valores:

1. Ejecutar `pnpm test:e2e:smoke` en CI o local con envs de staging.
2. Verificar desde el navegador que:
   - Las peticiones `/api/*` funcionan desde un dominio permitido.
   - Un dominio no listado carece de cabecera `Access-Control-Allow-Origin`.
   - El portal cliente no recibe `debugToken` en la respuesta (salvo entorno dev).

Documenta en el PR o changelog el momento en que se hicieron los cambios para mantener trazabilidad.
