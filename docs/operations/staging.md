# Entorno Staging – Brisa Cubana Clean Intelligence

**Última actualización:** 23 de octubre de 2025  
**Objetivo:** Proveer un espacio intermedio entre desarrollo local y producción para validar integraciones (Stripe, portal cliente, checkout) con datos realistas sin arriesgar clientes reales.

---

## 1. Infraestructura recomendada

| Recurso                                                        | Descripción                                 | Observaciones                                                          |
| -------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Vercel Project (`brisa-cubana-clean-intelligence-staging`)     | Next.js + proxy `/api/*`                    | Clonar configuración del proyecto principal, habilitar rama `staging`. |
| Vercel Project (`brisa-cubana-clean-intelligence-api-staging`) | API Hono                                    | Compartir esquema Prisma con base dedicada.                            |
| Base de datos                                                  | Neon branch `staging` o Postgres gestionado | Clonar producción y rotar secretos.                                    |
| Stripe                                                         | Cuenta/conexión “modo test”                 | Claves independientes de producción.                                   |

## 2. Variables de entorno

| Variable                     | Valor sugerido                                       | Comentario                                |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL` / `_UNPOOLED` | Cadena Neon branch `staging`                         | No reutilizar credenciales de producción. |
| `AUTH_SECRET`, `JWT_SECRET`  | Generar nuevos                                       | Documentar en vault.                      |
| `STRIPE_*`                   | `pk_test_...`, `sk_test_...`, `whsec_...` exclusivos | Permite probar checkout y webhooks.       |
| `PORTAL_MAGIC_LINK_*`        | SMTP sandbox (Mailtrap/Resend)                       | Validar flujo portal sin clientes reales. |
| `PROXY_ALLOWED_ORIGINS`      | `https://staging.brisacubanacleanintelligence.com`   | Incluye panel/portal autorizados.         |
| `ENABLE_TEST_UTILS`          | `false`                                              | Actívalo solo en QA local controlado.     |

## 3. Pipeline de despliegue

1. Crear rama `staging` desde `main`.
2. Configurar workflow GitHub Actions (opcional) que dispare `vercel deploy --env=preview` apuntando al proyecto `*-staging`.
3. Al aprobar un PR hacia `staging`, ejercer:
   - `pnpm lint && pnpm typecheck && pnpm test`.
   - `pnpm --filter @brisa/api db:deploy` hacia la base staging.
   - `pnpm --filter @brisa/api db:seed` (operativo + demo).
4. Validar manualmente los flujos críticos:
   - Login operativo / roles.
   - Checkout Stripe (modo test).
   - Portal cliente con enlace mágico (SMTP sandbox).
   - Notificaciones SSE y dashboard.

## 4. Datos y limpieza

- Ejecutar `pnpm --filter @brisa/api db:seed:demo` tras cada despliegue para restaurar fixtures.
- Programar limpieza semanal (cron) para expirar tokens/magic links y purgar reservas temporales.
- Mantener seeds alineados con producción; evitar modificaciones manuales directas en la base.

## 5. Accesos

| Perfil     | Responsable       | Acceso                                                                                  |
| ---------- | ----------------- | --------------------------------------------------------------------------------------- |
| Ingeniería | Equipo plataforma | Deploy, Prisma migrations, seeds.                                                       |
| QA         | Equipo QA         | Validaciones portal/checkout, registrar hallazgos en `docs/qa/regression-checklist.md`. |
| Producto   | PO                | Validar UI pública antes de lanzamiento.                                                |

## 6. Checklist previo a release

- [ ] E2E (`pnpm test:e2e:critical`) en staging.
- [ ] Validación manual portal (enlace mágico + acciones).
- [ ] Pago Stripe test → webhook `checkout.session.completed`.
- [ ] Alertas Sentry ↔ Slack operativas (reglas replicadas en ambiente staging o canal dedicado `#alerts-staging`).
- [ ] Informe de QA registrado (enlace a resultados / capturas).

Mantén este documento sincronizado con cualquier cambio en infraestructura. Añade responsables y enlaces reales una vez aprovisionado el entorno.
