# Sincronización de Variables de Entorno (Vercel & GitHub Actions)

Este procedimiento asegura que los proyectos de Vercel y los workflows de GitHub usen los dominios y credenciales oficiales definidos en `docs/operations/domain-map.md`.

## 1. Variables obligatorias

| Variable                             | Proyecto(s)                             | Entornos             | Valor producción                               |
| ------------------------------------ | --------------------------------------- | -------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`               | `brisa-cubana-clean-intelligence` (web) | dev / preview / prod | `https://brisacubanacleanintelligence.com`     |
| `NEXTAUTH_URL`                       | Web                                     | dev / preview / prod | `https://brisacubanacleanintelligence.com`     |
| `NEXT_PUBLIC_SITE_URL`               | Web                                     | dev / preview / prod | `https://brisacubanacleanintelligence.com`     |
| `NEXT_PUBLIC_API_URL`                | Web                                     | dev / preview / prod | `https://api.brisacubanacleanintelligence.com` |
| `INTERNAL_API_URL`                   | Web                                     | dev / preview / prod | `https://api.brisacubanacleanintelligence.com` |
| `PORTAL_MAGIC_LINK_BASE_URL`         | API                                     | dev / preview / prod | `https://brisacubanacleanintelligence.com`     |
| `SLACK_WEBHOOK_URL`                  | Web / API                               | dev / preview / prod | URL del webhook (Slack Alerts)                 |
| `LEAD_WEBHOOK_URL`                   | Web                                     | dev / preview / prod | Endpoint CRM/automation                        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Web                                     | dev / preview / prod | Clave Stripe live                              |
| `STRIPE_SECRET_KEY`                  | API                                     | dev / preview / prod | Clave Stripe live                              |
| `STRIPE_WEBHOOK_SECRET`              | API                                     | dev / preview / prod | Firma webhook Stripe                           |

> ⚠️ Mantén los valores reales en 1Password. No commit de credenciales.

## 2. Carga en Vercel (CLI)

Ejecuta desde la raíz del repo (requiere login con `vercel login`):

```bash
# Selecciona proyecto web
vercel link --project brisa-cubana-clean-intelligence

# Set de variables (repite para cada entorno)
for env in production preview development; do
  vercel env add NEXT_PUBLIC_BASE_URL $env <<<"https://brisacubanacleanintelligence.com"
  vercel env add NEXTAUTH_URL $env <<<"https://brisacubanacleanintelligence.com"
  vercel env add NEXT_PUBLIC_SITE_URL $env <<<"https://brisacubanacleanintelligence.com"
  vercel env add NEXT_PUBLIC_API_URL $env <<<"https://api.brisacubanacleanintelligence.com"
  vercel env add INTERNAL_API_URL $env <<<"https://api.brisacubanacleanintelligence.com"
done

# Variables sensibles (introduce manualmente cada valor real)
for env in production preview development; do
  vercel env add SLACK_WEBHOOK_URL $env
  vercel env add LEAD_WEBHOOK_URL $env
  vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY $env
done
```

Para el proyecto API:

```bash
vercel link --project brisa-cubana-clean-intelligence-api

for env in production preview development; do
  vercel env add PORTAL_MAGIC_LINK_BASE_URL $env <<<"https://brisacubanacleanintelligence.com"
  vercel env add STRIPE_SECRET_KEY $env
  vercel env add STRIPE_WEBHOOK_SECRET $env
  vercel env add SLACK_WEBHOOK_URL $env
done
```

> Los comandos con `<<<` rellenan valores constantes. Para secretos, deja que el CLI solicite la entrada (quedará oculta).

### Verificación

```bash
vercel env ls --project brisa-cubana-clean-intelligence
vercel env ls --project brisa-cubana-clean-intelligence-api
```

Confirma que cada clave aparece en los tres entornos.

## 3. Sincronización con GitHub Actions

Si los workflows consumen las mismas credenciales:

```bash
# Secrets por ambiente (production / preview / development)
gh secret set NEXT_PUBLIC_API_URL --env production --body "https://api.brisacubanacleanintelligence.com"
gh secret set NEXT_PUBLIC_BASE_URL --env production --body "https://brisacubanacleanintelligence.com"
gh secret set PORTAL_MAGIC_LINK_BASE_URL --env production --body "https://brisacubanacleanintelligence.com"

# Secretos sensibles (introduce valor cuando lo solicite)
gh secret set STRIPE_SECRET_KEY --env production
gh secret set STRIPE_WEBHOOK_SECRET --env production
gh secret set SLACK_WEBHOOK_URL --env production
```

Repite para `preview` y `development` según necesidad. Asegura consistencia con Vercel.

## 4. Link Vercel ↔ GitHub Actions

- `VERCEL_PROJECT_ID_WEB` debe apuntar a `prj_n11x8GsVN5qDw0eOFAcQiOfpc0Zg` (Web).
- `VERCEL_PROJECT_ID_API` debe apuntar a `prj_XN0HG1kF1XanhlMq78ZBPM01Ky3j` (API).
- `VERCEL_ORG_ID` y `VERCEL_TOKEN` tienen que pertenecer al equipo `brisa-cubana` (consulta en 1Password).
- Verifica que ambos proyectos tengan GitHub linkeado al repo `albertodimas/brisa-cubana-clean-intelligence` y branch productivo `main`:

```bash
TOKEN=$(jq -r '.token' ~/.vercel/auth.json) # o exporta $VERCEL_TOKEN desde 1Password
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v9/projects/prj_n11x8GsVN5qDw0eOFAcQiOfpc0Zg?teamId=brisa-cubana" | jq '.link, .targets.production'
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v9/projects/prj_XN0HG1kF1XanhlMq78ZBPM01Ky3j?teamId=brisa-cubana" | jq '.link, .targets.production'
```

Confirma que `link.productionBranch` sea `main` y que los dominios correspondan a los oficiales (`*.brisacubanacleanintelligence.com`). Si algún ID no coincide, actualiza los secrets en GitHub (`gh secret set ... --env production`) antes de volver a ejecutar la CI.

## 5. Checklist de validación

- [ ] `curl -I https://brisacubanacleanintelligence.com` devuelve HSTS y responde 200.
- [ ] `curl -I https://api.brisacubanacleanintelligence.com/health` devuelve 200.
- [ ] `vercel env ls` muestra valores correctos para web y api.
- [ ] Workflows en GitHub pasan con las variables sincronizadas.
- [ ] Actualiza `docs/operations/domain-map.md` si hubiera cambios en dominios o integraciones.
- [ ] Mantén el CLI de Vercel en `48.4.1` hasta que se resuelva el bug `spawn pnpm ENOENT` (ver issue de coordinación con Claude).
- [ ] Si se modifica el pipeline, conserva el paso `corepack prepare pnpm@10.18.0 --activate`, la copia de `pnpm` a `/usr/bin` y el shim `node_modules/.bin/pnpm` antes de ejecutar `vercel build`.
- [ ] Si el bug persiste, sigue `docs/operations/manual-vercel-deploy.md` para ejecutar `vercel build`/`vercel deploy` manualmente.

Guarda este documento como referencia antes de cada rotación de claves o alta de nuevos subdominios.
