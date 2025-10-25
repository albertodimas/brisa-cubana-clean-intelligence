# Deploy manual a Vercel (contingencia)

Cuando los runners de GitHub Actions fallen con `spawn pnpm ENOENT`, puedes realizar el despliegue manual desde una estación con el CLI autenticado.

## Requisitos

- Node.js 22.13.0
- pnpm 10.18.0 (`corepack enable`)
- Vercel CLI 48.4.1 (usar `pnpm add --global vercel@48.4.1`)
- Variables `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_API`, `VERCEL_PROJECT_ID_WEB`, `VERCEL_TOKEN`

## Pasos

```bash
# 1. Preparar entorno
corepack prepare pnpm@10.18.0 --activate
export PATH="$(pnpm env use --global 22 >/dev/null && pnpm env list --global --json | jq -r '.[0].path'):$PATH"
which pnpm

# 2. Sincronizar repo
git fetch origin
git checkout fix/posthog-ci   # o rama a desplegar
pnpm install --frozen-lockfile

# 3. API
cd apps/api
vercel pull --environment=production --scope brisa-cubana --token "$VERCEL_TOKEN"
vercel build --prod --scope brisa-cubana --token "$VERCEL_TOKEN"
API_URL=$(VERCEL_ORG_ID=$VERCEL_ORG_ID vercel deploy .vercel/output --prebuilt --yes --prod --scope brisa-cubana --token "$VERCEL_TOKEN")
cd ../..

# 4. Web
vercel pull --environment=production --scope brisa-cubana --token "$VERCEL_TOKEN"
vercel build --prod --scope brisa-cubana --token "$VERCEL_TOKEN"
WEB_URL=$(VERCEL_ORG_ID=$VERCEL_ORG_ID vercel deploy .vercel/output --prebuilt --yes --prod --scope brisa-cubana --token "$VERCEL_TOKEN")

# 5. Validaciones rápidas
curl -fsS "$API_URL/healthz"
curl -fsS "$WEB_URL/healthz"

echo "API: $API_URL"
echo "Web: $WEB_URL"
```

## Notas

- Ejecuta `pnpm postdeploy:seed` solo si la base productiva necesita semillas (ver `post-deploy-seed.yml`).
- Reporta el resultado en Slack (#deployments) y en el PR asociado.
- Una vez Vercel publique un fix, elimina este procedimiento manual y restablece el workflow automático.
