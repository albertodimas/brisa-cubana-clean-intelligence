# VS Code GitHub Actions Linter - Known False Positives

Este archivo documenta los "errores" reportados por el linter de GitHub Actions de VS Code
que son en realidad **falsos positivos** y no afectan la funcionalidad.

## ❌ False Positive: "Context access might be invalid: STORE_PATH"

**Archivos afectados:**

- `.github/workflows/ci.yml` (líneas 42, 86, 139, 181, 252)

**Razón:**
La variable `env.STORE_PATH` se define dinámicamente en un paso anterior:

```yaml
- name: Get pnpm store directory
  shell: bash
  run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
```

El linter de VS Code no reconoce variables de entorno definidas dinámicamente con `$GITHUB_ENV`.

**Verificación:**
Los workflows funcionan correctamente en GitHub Actions. Ver historial de ejecuciones.

## ❌ False Positive: "Context access might be invalid: SLACK_WEBHOOK_URL"

**Archivos afectados:**

- `.github/workflows/deploy-production.yml` (líneas 121, 142, 222, 243)

**Razón:**
La variable `secrets.SLACK_WEBHOOK_URL` es un secreto **opcional** de GitHub.
Los pasos que la usan tienen `continue-on-error: true`, lo que significa que el workflow
continúa incluso si el secreto no está definido.

**Comportamiento esperado:**

- Si el secreto existe → Notificación a Slack enviada
- Si el secreto NO existe → Paso se salta, workflow continúa

**Verificación:**
Los workflows funcionan correctamente con o sin el secreto definido.

---

## ✅ Conclusión

Estos "errores" son advertencias del linter de VS Code y **NO afectan la ejecución**
de los workflows en GitHub Actions. Los workflows han sido probados y funcionan correctamente.

Para verificar:

```bash
# Ver historial de ejecuciones
gh run list --workflow=ci.yml
gh run list --workflow=deploy-production.yml
```
