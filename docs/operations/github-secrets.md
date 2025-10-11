# GitHub Secrets – Post-Deploy Seed

Estos secretos se definen en **Settings → Secrets and variables → Actions** del repositorio y son necesarios para que `post-deploy-seed.yml` sincronice y siembre la base de datos de producción después de cada merge en `main`.

| Clave                                | Descripción                                                                    | Ejemplo / Formato                                         |
| ------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `PRODUCTION_DATABASE_URL`            | Cadena de conexión principal (pool) usada por Prisma (`db push` y seed).       | `postgresql://user:password@host:5432/db?sslmode=require` |
| `PRODUCTION_DATABASE_URL_UNPOOLED`\* | (Opcional) Cadena directa sin pool. Si no se define, se reutiliza la anterior. | `postgresql://user:password@host:5432/db?sslmode=require` |
| `API_TOKEN`                          | Token de autenticación para integraciones servidor-servidor.                   | `brisa_prod_token_xxxxx`                                  |
| `JWT_SECRET`                         | Secreto para firmar y verificar JWT.                                           | Cadena aleatoria de 32+ caracteres                        |
| `AUTH_SECRET`                        | Secreto usado por Auth.js en la aplicación web.                                | Cadena aleatoria de 32+ caracteres                        |

\* Si la cadena principal funciona para conexiones directas, puedes omitir `PRODUCTION_DATABASE_URL_UNPOOLED`.

## Configuración con GitHub CLI

```bash
# Autentica tu CLI si no lo has hecho
gh auth login --web

# Define los secretos requeridos
secrets=(
  PRODUCTION_DATABASE_URL
  PRODUCTION_DATABASE_URL_UNPOOLED
  API_TOKEN
  JWT_SECRET
  AUTH_SECRET
)

for secret in "${secrets[@]}"; do
  echo "Configurando $secret"
  gh secret set "$secret" --body "<valor>"
done
```

> Reemplaza `<valor>` con la cadena correspondiente. Ejecuta el bucle manualmente por secreto si prefieres no guardar las cadenas en texto plano.

## Verificación rápida

```bash
# Lista los secretos definidos
gh secret list

# Mostrar sólo los relacionados al workflow
gh secret list | grep -E "(PRODUCTION_DATABASE_URL|API_TOKEN|JWT_SECRET|AUTH_SECRET)"
```

Una vez configurados, el workflow `post-deploy-seed.yml` aparecerá como job adicional cada vez que `CI (Main Branch)` finalice en verde. Si alguno falta, el job fallará en el paso “Validate production database secret”.
