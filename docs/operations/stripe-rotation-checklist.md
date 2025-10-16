# Runbook: Rotación Stripe Live/Staging

**Última actualización:** 16 de octubre de 2025  
**Responsables:** Operaciones · Plataforma

## 1. Preparación (Staging)

1. Solicita nuevas llaves test/live desde Stripe Dashboard → Developers → API keys.
2. Registra los valores en 1Password (`Brisa · Stripe · {entorno}`) con fecha y responsable.
3. Actualiza variables en Vercel (entorno `Preview`):
   ```bash
   vercel env add STRIPE_SECRET_KEY preview
   vercel env add STRIPE_PUBLISHABLE_KEY preview
   vercel env add STRIPE_WEBHOOK_SECRET preview
   ```
4. Actualiza secretos de GitHub Actions (`preview`):
   ```bash
   gh secret set STRIPE_SECRET_KEY --env preview
   gh secret set STRIPE_WEBHOOK_SECRET --env preview
   ```
5. Despliega una rama de prueba (`feature/stripe-rotation-dryrun`) y valida logs en `/api/payments/stripe/intent`.

## 2. Validación

| Check          | Acción                                                               | Evidencia                                   |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| Intent test    | `stripe trigger checkout.session.completed`                          | Logs API (`PaymentIntent de Stripe creado`) |
| Intent fallido | `stripe trigger payment_intent.payment_failed`                       | Sentry `checkout.payment.failed`            |
| Webhook        | `stripe listen --forward-to https://.../api/payments/stripe/webhook` | Respuesta 200 / logs pino                   |
| Checkout UI    | `/checkout` con tarjeta `4242 4242 4242 4242`                        | Confirmación en UI + Sentry breadcrumb      |

## 3. Rotación producción

1. Programa ventana de 15 minutos (baja demanda). Notifica en Slack `#ops`.
2. Ejecuta los comandos de sección 2.1 (`docs/operations/deployment.md`) sobre `production`.
3. Verifica event logs (Stripe Dashboard → Events) y salud de webhooks.
4. Revoca llaves anteriores (`...` menú `Revoke key`).
5. Actualiza `docs/operations/deployment.md` tabla de variables con fecha y alias.

## 4. Post-mortem rápido

- Registra resultados en `docs/operations/backup-log.md` con fecha, responsable y observaciones.
- Añade resumen a `docs/overview/status.md` si hubo incidentes.
- Crea ticket de mejora si detectas fricción (ej. automatizar vercel env update).

## 5. Comandos útiles

```bash
# Validar PaymentIntent con curl
curl -X POST /api/checkout/intent \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"srv_demo","customerEmail":"qa@test.com"}'

# Ejecutar triggers básicos
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
```

Mantén este runbook junto al resto de operaciones y actualízalo tras cada rotación.
