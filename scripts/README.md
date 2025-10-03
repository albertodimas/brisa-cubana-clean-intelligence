# Guía de Scripts

Colección de scripts de automatización y utilidades empleadas en Brisa Cubana Clean Intelligence para desarrollo, pruebas y despliegue.

## Scripts disponibles

### `turbo.js`

Wrapper de Turborepo con manejo de errores mejorado.

```bash
node scripts/turbo.js run dev
node scripts/turbo.js run build
node scripts/turbo.js run test
```

Características clave:

- Detección automática de la CLI de Turbo.
- Mensajes de error normalizados.
- Compatible con cualquier pipeline definido en `turbo.json`.

---

### `setup_env.sh`

Configuración inicial del entorno de documentación (MkDocs).

```bash
./scripts/setup_env.sh
```

Acciones ejecutadas:

- Creación de entorno virtual de Python (`.venv`).
- Instalación de MkDocs 1.6.1 y Material 9.6.20.
- Instalación de plugins requeridos para la documentación.

---

### `mkdocs_serve.sh`

Levantamiento del servidor de documentación en modo desarrollo.

```bash
./scripts/mkdocs_serve.sh
```

- Puerto por defecto: `http://localhost:8000`.

---

### `stripe_listen.sh`

Encaminamiento local de webhooks de Stripe.

```bash
./scripts/stripe_listen.sh
```

Requisitos previos:

- Stripe CLI instalada (`brew install stripe/stripe-cli/stripe`).
- Autenticación mediante `stripe login`.

Funcionalidad:

- Reenvía webhooks a `http://localhost:3001/api/payments/webhook`.
- Muestra `STRIPE_WEBHOOK_SECRET` para copiar en variables de entorno.

---

### `stripe_trigger.sh`

Generación de eventos Stripe para pruebas.

```bash
./scripts/stripe_trigger.sh checkout.session.completed
./scripts/stripe_trigger.sh payment_intent.payment_failed
```

Eventos soportados:

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- Otros eventos disponibles en la CLI de Stripe.

---

### `generate_diagrams.mjs`

Generación de diagramas Mermaid a PNG/SVG.

```bash
node scripts/generate_diagrams.mjs
```

- Entrada: archivos `.mmd` en `docs/resources/diagrams/`.
- Salida: imágenes en `docs/_build/diagrams/`.
- Requiere `@mermaid-js/mermaid-cli` instalado.

---

### `apps/api/scripts/reconcile-payments.ts`

Script de conciliación de pagos con Stripe, ejecutado por cron o workflow.

```bash
cd apps/api
pnpm payments:reconcile
```

Funciones principales:

- Revisa bookings con estados `PENDING_PAYMENT` o `REQUIRES_ACTION`.
- Consulta Stripe y actualiza el estado local.
- Genera alertas mediante Slack si detecta discrepancias.

Variables necesarias:

```bash
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_..."
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/..." # opcional
```

Cron sugerido:

```bash
0 * * * * cd /path/to/apps/api && pnpm payments:reconcile
```

---

## Uso en CI/CD

Ejemplo de integración en GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Preparar entorno de documentación
  run: ./scripts/setup_env.sh

- name: Construir documentación
  run: pnpm docs:build

# .github/workflows/payments-reconcile.yml
- name: Conciliar pagos
  run: cd apps/api && pnpm payments:reconcile
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

---

## Creación de nuevos scripts

### Bash

```bash
#!/bin/bash
set -euo pipefail

log() { echo "[$(date +%T)] $1"; }

log "Iniciando script"
# Lógica aquí
log "Finalizado"
```

Asegúrate de otorgar permisos de ejecución (`chmod +x scripts/<nombre>.sh`).

### Node.js / TypeScript

```typescript
// scripts/my-script.mjs
import { execSync } from "node:child_process";

try {
  execSync("pnpm build", { stdio: "inherit" });
} catch (error) {
  console.error("Fallo en build", error);
  process.exit(1);
}
```

Ejecución: `node scripts/my-script.mjs`.

---

## Buenas prácticas

1. Documentar cada script en este archivo.
2. Añadir comentarios que expliquen supuestos y efectos secundarios.
3. Validar dependencias antes de ejecutar (`command -v`).
4. Proveer mensajes claros de éxito/fracaso.
5. Utilizar códigos de salida adecuados (0 = éxito, ≠0 = error).
6. Diseñar scripts idempotentes cuando sea posible.

---

## Resolución de incidencias comunes

| Problema                      | Solución recomendada                          |
| ----------------------------- | --------------------------------------------- |
| `Permission denied`           | `chmod +x scripts/<script>.sh`                |
| `stripe: command not found`   | Instalar Stripe CLI y ejecutar `stripe login` |
| `python: No module named ...` | Ejecutar `./scripts/setup_env.sh`             |

---

## Recursos

- [Turborepo](https://turbo.build/repo/docs)
- [MkDocs](https://www.mkdocs.org/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli)

---

## Contribuciones

1. Agregar el script al repositorio bajo `scripts/` o carpeta correspondiente.
2. Documentarlo en este README con uso, dependencias y ejemplos.
3. Añadir pruebas o ejemplos de integración si aplica.
4. Solicitar revisión del equipo de Plataforma.
