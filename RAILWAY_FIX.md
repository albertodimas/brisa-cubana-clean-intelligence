# 🔧 Solución para Railway Deployment

## ❌ Problema Identificado

El build de Railway está **completándose correctamente** (41.35s), pero el deployment se queda atascado porque la configuración del servicio tiene valores incorrectos.

### Logs del Build ✅

```
[92mBuild time: 41.35 seconds[0m
```

El Dockerfile se construye exitosamente con las 3 etapas (deps, builder, runner).

### Problema en la Configuración ❌

1. **Start Command incorrecto**: `pnpm --filter @brisa/api dev`
2. **NODE_ENV incorrecto**: `staging` (debería ser `production`)

---

## 🛠️ Solución Paso a Paso

### 1. Acceder a Railway Dashboard

Ve a: https://railway.app/project/[tu-project-id]/service/@brisa/api

### 2. Ir a Settings (Configuración)

#### Opción A: Eliminar el Start Command (RECOMENDADO)

1. En la sección **"Deploy"**, busca **"Start Command"**
2. Si dice: `pnpm --filter @brisa/api dev` → **BÓRRALO COMPLETAMENTE**
3. Deja el campo vacío para que use el `CMD` del Dockerfile

**¿Por qué?** El Dockerfile ya tiene configurado el comando correcto:

```dockerfile
CMD ["npx", "tsx", "apps/api/src/server.ts"]
```

#### Opción B: Cambiar el Start Command

Si prefieres mantener un Start Command, cámbialo a:

```bash
pnpm --filter @brisa/api start
```

### 3. Corregir Variables de Entorno

En la sección **"Variables"**, busca y cambia:

#### `NODE_ENV` ❌→✅

```diff
- NODE_ENV = staging
+ NODE_ENV = production
```

#### Verificar otras variables importantes

- ✅ `API_PORT = 3001`
- ✅ `DATABASE_URL` debe apuntar a la base de datos de producción
- ✅ `JWT_SECRET` debe estar configurado
- ✅ Todas las credenciales de servicios externos (Stripe, Twilio, etc.)

### 4. Re-deployar

Después de hacer los cambios:

1. **Opción 1**: Haz clic en "Deploy" → "Redeploy" en Railway dashboard

2. **Opción 2**: Haz un push a GitHub para trigger el workflow:

```bash
git commit --allow-empty -m "chore: trigger Railway redeploy"
git push origin main
```

---

## ✅ Verificación

Una vez que el deployment termine (debería tomar ~2-3 minutos), verifica:

### 1. Check del servicio

```bash
curl https://brisaapi-production-up-railw-ae5ab70u.up.railway.app/healthz
```

**Respuesta esperada:**

```json
{ "ok": true }
```

### 2. Check del dominio custom

```bash
curl https://api.brisacubana.com/healthz
```

### 3. Ver logs del contenedor en Railway

Deberías ver:

```
API ready on http://localhost:3001 (pid XX, env production)
```

**NOTA**: Ya NO debería decir `env staging` ni ejecutar `npm dev`.

---

## 📊 Comparación de Configuraciones

### ❌ Configuración ACTUAL (Incorrecta)

```yaml
Start Command: pnpm --filter @brisa/api dev
NODE_ENV: staging
Resultado: API se ejecuta en modo desarrollo
```

### ✅ Configuración CORRECTA (Opción A - Recomendada)

```yaml
Start Command: [VACÍO - usa Dockerfile CMD]
NODE_ENV: production
Resultado: API se ejecuta con tsx en producción
```

### ✅ Configuración CORRECTA (Opción B - Alternativa)

```yaml
Start Command: pnpm --filter @brisa/api start
NODE_ENV: production
Resultado: API se ejecuta con tsx en producción
```

---

## 🔍 Debugging

Si después de los cambios el deployment sigue fallando:

### Ver Deploy Logs en Railway

1. Ve al deployment que está corriendo
2. Haz clic en la pestaña **"Deploy Logs"** (no "Details")
3. Busca errores en la fase de "Deploy" o "Network"

### Comandos útiles desde terminal

```bash
# Ver últimos workflows de GitHub
gh run list --workflow=deploy-production.yml --limit 5

# Ver logs de un workflow específico
gh run view [ID] --log

# Ver estado de Railway
railway status --service @brisa/api

# Ver logs de Railway (si tienes CLI configurado)
railway logs --service @brisa/api
```

---

## 📝 Resumen de Cambios Hechos en el Código

### ✅ Ya implementado en el código

1. ✅ `tsup.config.ts`: `bundle: true` y `shims: false`
2. ✅ `Dockerfile`: CMD usa `npx tsx apps/api/src/server.ts`
3. ✅ `package.json`: Script `start` agregado
4. ✅ `railway.toml`: Healthcheck y restart policy configurados
5. ✅ GitHub Actions: Workflows completándose exitosamente

### ⏳ Pendiente (Configuración de Railway)

1. ❌ Eliminar o cambiar Start Command
2. ❌ Cambiar `NODE_ENV` a `production`

---

**Última actualización**: 2025-10-01
**Estado**: Esperando cambios en configuración de Railway Dashboard
