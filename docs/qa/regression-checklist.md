# Checklist de Regresiones

**Última actualización:** 15 de octubre de 2025

Este documento define los escenarios críticos que deben verificarse antes de cada despliegue a producción para prevenir regresiones.

---

## 1. Autenticación y Autorización

### 1.1 Login Exitoso

- [ ] Usuario ADMIN puede iniciar sesión
- [ ] Usuario COORDINATOR puede iniciar sesión
- [ ] Usuario CLIENT puede iniciar sesión
- [ ] Usuario STAFF puede iniciar sesión (si implementado)
- [ ] Sesión persiste después de recargar página
- [ ] Cookie HttpOnly `auth_token` se establece correctamente

### 1.2 Login Fallido

- [ ] Credenciales incorrectas muestran error apropiado
- [ ] Email inválido es rechazado por validación
- [ ] Password vacío es rechazado
- [ ] Usuario no existente muestra error genérico (sin revelar existencia)

### 1.3 Rate Limiting

- [ ] 5 intentos fallidos de login activan rate limit
- [ ] Rate limit muestra mensaje claro al usuario
- [ ] Rate limit se resetea después de 60 segundos
- [ ] Rate limit no afecta usuarios diferentes (por IP)

### 1.4 Logout

- [ ] Botón de logout es visible cuando hay sesión activa
- [ ] Logout limpia cookie `auth_token`
- [ ] Logout redirige a página de login o home público
- [ ] No se puede acceder a operaciones protegidas después de logout

### 1.5 Permisos por Rol

- [ ] ADMIN puede crear/editar/eliminar todos los recursos
- [ ] COORDINATOR puede crear/editar servicios, propiedades, reservas
- [ ] CLIENT no puede crear servicios ni propiedades
- [ ] Endpoints protegidos retornan 401 sin autenticación
- [ ] Endpoints con permisos insuficientes retornan 403

---

## 2. API de Servicios

### 2.1 Listar Servicios (Público)

- [ ] `/api/services` retorna lista de servicios sin autenticación
- [ ] Servicios ordenados por `name ASC`
- [ ] Incluye campos: id, name, description, basePrice, durationMin, active, createdAt, updatedAt
- [ ] Servicios inactivos (`active: false`) también se retornan

### 2.2 Crear Servicio (ADMIN/COORDINATOR)

- [ ] POST `/api/services` crea servicio con datos válidos
- [ ] Requiere autenticación (Bearer JWT válido)
- [ ] Requiere rol ADMIN o COORDINATOR
- [ ] Valida que `name` no esté vacío
- [ ] Valida que `basePrice` sea numérico positivo
- [ ] Valida que `durationMin` sea numérico positivo
- [ ] Retorna 201 con servicio creado

### 2.3 Actualizar Servicio (ADMIN/COORDINATOR)

- [ ] PATCH `/api/services/:id` actualiza servicio existente
- [ ] Requiere autenticación y permisos
- [ ] Permite actualización parcial de campos
- [ ] Valida datos igual que creación
- [ ] Retorna 404 si servicio no existe
- [ ] Retorna servicio actualizado

### 2.4 Eliminar Servicio (ADMIN)

- [ ] DELETE `/api/services/:id` marca el servicio como eliminado (`deletedAt` no nulo)
- [ ] Requiere autenticación y permisos ADMIN
- [ ] Retorna 404 si el servicio no existe o ya fue eliminado
- [ ] Servicio eliminado no aparece en listados (soft delete aplicado)

---

## 3. API de Propiedades

### 3.1 Listar Propiedades (Público)

- [ ] `/api/properties` retorna lista de propiedades sin autenticación
- [ ] Incluye relación con `owner` (User)
- [ ] Ordenadas por `id ASC`

### 3.2 Crear Propiedad (ADMIN/COORDINATOR)

- [ ] POST `/api/properties` crea propiedad con datos válidos
- [ ] Requiere autenticación y permisos
- [ ] Valida que `address` no esté vacío
- [ ] Valida que `ownerId` sea UUID válido
- [ ] Valida que `ownerId` corresponda a usuario existente
- [ ] Retorna 201 con propiedad creada

### 3.3 Actualizar Propiedad (ADMIN/COORDINATOR)

- [ ] PATCH `/api/properties/:id` actualiza propiedad
- [ ] Permite actualización parcial
- [ ] Retorna 404 si propiedad no existe

---

## 4. API de Reservas (Bookings)

### 4.1 Listar Reservas (Público con filtros)

- [ ] `/api/bookings` retorna todas las reservas sin filtros
- [ ] Filtro `status` funciona (ej. `?status=CONFIRMED`)
- [ ] Filtro `from` funciona (fecha inicio)
- [ ] Filtro `to` funciona (fecha fin)
- [ ] Filtro `propertyId` funciona
- [ ] Filtro `serviceId` funciona
- [ ] Filtro `customerId` funciona
- [ ] Combinación de filtros funciona
- [ ] Incluye relaciones: service, property, customer

### 4.2 Crear Reserva (ADMIN/COORDINATOR)

- [ ] POST `/api/bookings` crea reserva con datos válidos
- [ ] Genera código único formato BRISA-XXXX
- [ ] Copia `finalPrice` desde `service.basePrice`
- [ ] Copia `durationMin` desde `service.durationMin`
- [ ] Valida que `scheduledFor` sea fecha válida
- [ ] Valida que `serviceId`, `propertyId`, `customerId` existan
- [ ] Retorna 201 con reserva creada

### 4.3 Actualizar Reserva (ADMIN/COORDINATOR)

- [ ] PATCH `/api/bookings/:id` actualiza reserva
- [ ] Permite cambiar `status` (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- [ ] Permite cambiar `scheduledFor`
- [ ] Permite cambiar `finalPrice`
- [ ] Retorna reserva actualizada

---

## 5. API de Clientes

### 5.1 Listar Clientes (ADMIN/COORDINATOR)

- [ ] `/api/customers` retorna usuarios con rol CLIENT
- [ ] Requiere autenticación y permisos ADMIN/COORDINATOR
- [ ] Retorna solo: id, email, fullName
- [ ] No expone password hash ni otros datos sensibles

---

## 6. Frontend Web

### 6.1 Landing Page

- [ ] Página principal (`/`) muestra hero con copy actualizado y CTA dobles (“Solicita una propuesta”, “Explora el portal cliente”)
- [ ] Secciones “Por qué nos eligen”, “Proceso”, “Historias de clientes” y “Planes y precios” cargan sin errores
- [ ] FAQ interactiva abre/cierra acordeones correctamente
- [ ] Formulario “¿Listo para recibir tu propuesta?” valida campos obligatorios y muestra feedback (éxito/error)
- [ ] CTA hero no mostrados para usuarios autenticados mantienen sesión activa (chip en panel tras login)

### 6.2 Panel Operativo

- [ ] Panel se muestra solo a usuarios ADMIN/COORDINATOR
- [ ] Muestra secciones: Crear servicio, Crear propiedad, Crear reserva
- [ ] Formularios tienen validación cliente (HTML5)
- [ ] Formularios muestran mensajes de éxito/error
- [ ] Filtros de reservas funcionan (selector de estado, rango de fechas)
- [ ] Lista de reservas se actualiza después de crear/actualizar

### 6.3 Formularios

- [ ] Crear servicio: muestra mensaje "Servicio creado" al éxito
- [ ] Crear propiedad: muestra mensaje apropiado
- [ ] Crear reserva: muestra mensaje apropiado
- [ ] Actualizar servicio (toggle active): actualiza sin recargar
- [ ] Actualizar reserva (cambiar estado): persiste cambio
- [ ] Errores de servidor se muestran al usuario

### 6.4 Proxy API

- [ ] Llamadas `/api/*` desde frontend se enrutan a API Hono
- [ ] CORS está configurado correctamente
- [ ] Cookies HttpOnly se preservan
- [ ] Query strings se preservan
- [ ] Headers sensibles (`content-length`, `content-encoding`) se limpian

### 6.5 Landing – Analítica y Captura de Leads

- [ ] `LEAD_WEBHOOK_URL` configurado en entorno (revisar Vercel/GitHub Secrets)
- [ ] Enviar formulario público (`/`, sección contacto) produce 200 y dispara evento en destino (Slack/CRM) con payload esperado (puedes validar manualmente con `scripts/test-lead-webhook.sh` apuntando a la URL de webhook)
- [ ] CTA hero y pricing generan eventos `cta_request_proposal` y `cta_portal_demo` visibles en la plataforma de analítica (Vercel/PostHog/GA4)
- [ ] Checkout público registra eventos `checkout_started` y `checkout_completed` (ver logs Sentry o analítica) al completar pago de prueba

---

## 7. Base de Datos

### 7.1 Schema Prisma

- [ ] `prisma db push` ejecuta sin errores
- [ ] Todas las tablas se crean correctamente
- [ ] Seeds operativo + demo corren en el orden documentado

## 8. Pagos (Stripe)

### 8.1 Configuración CLI

- [ ] `pnpm stripe:listen` inicia y muestra `Listening for events on` con endpoint `/api/payments/stripe/webhook`.
- [ ] `stripe trigger checkout.session.completed` se reenvía y el webhook responde `200`.
- [ ] `stripe trigger payment_intent.payment_failed` se reenvía y el webhook responde `200` registrando `type=payment_intent.payment_failed`.
- [ ] Evento con firma alterada (`stripe trigger` + editar header) devuelve `400` y registra `signature_verification_failed`.

### 8.2 Flujo checkout exitoso

- [ ] Usuario completa selección de servicio y fecha sin errores.
- [ ] Stripe Payment Element confirma pago en modo test y muestra pantalla de confirmación.
- [ ] Evento `checkout.session.completed` persiste booking con estado `CONFIRMED`.
- [ ] Logs de API registran `payment_intent.succeeded` y se genera `stripePaymentId`.
- [ ] UI `/checkout` muestra resumen del servicio, genera PaymentIntent via `/api/checkout/intent` y avanza a la fase de pago.

### 8.3 Flujo checkout fallido

- [ ] Stripe rechaza pago (`pm_card_chargeDeclined`) y UI muestra mensaje `Pago rechazado`.
- [ ] El booking permanece en estado `PENDING` y se registra `lastPaymentError`.
- [ ] Retry desde la UI reutiliza la misma Intent y concluye exitosamente tras usar tarjeta válida.
- [ ] Modalidad fallback (Stripe no configurado) muestra instrucción “Configura Stripe…” y bloquea avance.

### 8.4 Observabilidad y entorno

- [ ] Variables `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (API) y `STRIPE_PUBLISHABLE_KEY` (web) están presentes en Development/Preview/Production (verificado vía `vercel env ls`).
- [ ] Sentry captura breadcrumb `checkout.payment_submitted` y evento de error si falla la Intent.
- [ ] Sentry registra `checkout.intent.created`, `checkout.payment.confirmed`/`failed` y breadcrumbs (`intent:create:start`, `payment_confirmed`, `payment_failed`).
- [ ] LHCI en nightly mantiene Performance ≥ 90 en `/checkout`.
- [ ] En entornos sin variables Stripe, el endpoint responde `503` con mensaje "stripe unavailable".

### 8.5 Integridad de datos

- [ ] Foreign keys y constraints (`payments`, `bookings`) están aplicados tras `pnpm prisma migrate deploy`.
- [ ] Índices de búsqueda (`idx_booking_payment_intent`) verificados en base de staging.
- [ ] Seeds demo crean Intent mock (`stripePaymentId="pi_demo"`) sin duplicados.

### 7.2 Seed

- [ ] `pnpm db:seed` crea usuarios demo
- [ ] Usuarios demo tienen passwords hasheados con bcrypt
- [ ] Se crean servicios demo (Turnover Premium, Deep Clean Brickell, Post-Construcción, Amenity Refresh)
- [ ] Se crean propiedades demo (Skyline Loft Brickell, Azure Villa Key Biscayne)
- [ ] Se crean reservas demo (BRISA-0001, BRISA-0002, BRISA-0003)
- [ ] Seed es idempotente (no falla si datos existen)

---

## 8. Seguridad

### 8.1 Credenciales

- [ ] No hay archivos `.env` commiteados en Git
- [ ] `.env.example` tiene valores placeholder
- [ ] `.gitignore` incluye `.env*` (excepto `.env.example`)
- [ ] Pre-commit hook verifica ausencia de secretos
- [ ] Variables de entorno en Vercel están encriptadas

### 8.2 JWT

- [ ] Token JWT se firma con `JWT_SECRET`
- [ ] Token incluye: userId, email, role, fullName
- [ ] Token se valida en middleware `authenticate`
- [ ] Token expirado retorna 401

### 8.3 Passwords

- [ ] Passwords se hashean con bcrypt (10 rounds)
- [ ] Password hash nunca se retorna en API
- [ ] Comparación de passwords usa `bcrypt.compare`

### 8.4 Rate Limiting

- [ ] Login tiene rate limit (5 intentos / 60 segundos)
- [ ] Rate limit configurable vía env vars
- [ ] Rate limit se aplica por IP (o session si implementado)

---

### 8.5 Portal cliente (beta)

- [ ] `/clientes` muestra hero, CTA dual y tarjetas de valor actualizadas.
- [ ] `/clientes/[customerId]` renderiza métricas, tarjetas de reservas y timeline para `cliente@brisacubanacleanintelligence.com`.
- [ ] `POST /api/portal/auth/request` devuelve 200 y `debugToken` con un correo válido registrado.
- [ ] `POST /api/portal/auth/verify` entrega `portalToken` cuando el token es válido.
- [ ] Token expirado o reutilizado devuelve 400.
- [ ] Con SMTP configurado (`PORTAL_MAGIC_LINK_*`), el correo llega y el API no expone `debugToken` cuando `PORTAL_MAGIC_LINK_EXPOSE_DEBUG="false"`.
- [ ] En entornos Preview/Production `ENABLE_TEST_UTILS` permanece en `false` y la API no muestra mensajes “Magic link email skipped - test utils mode”.
- [ ] `GET /api/portal/bookings` responde 200 con las reservas del cliente autenticado y respeta filtros (`status`, paginación).
- [ ] `POST /api/portal/auth/logout` invalida la sesión y limpia cookies (`portal_token`, `portal_customer_id`).
- [ ] Tras verificar un enlace, la respuesta HTTP incluye `Set-Cookie` para `portal_token` (HttpOnly) y `portal_customer_id` con caducidad alineada a `expiresAt`.
- [ ] El dashboard muestra callout con el tiempo restante de sesión y CTA para solicitar un nuevo enlace; al expirar, el mensaje cambia a “Tu sesión ya expiró”.
- [ ] Botones “Reagendar” y “Cancelar” envían solicitudes válidas (`/reschedule`, `/cancel`), muestran mensajes de confirmación y actualizan la lista de reservas sin recargar la página.
- [ ] Cada solicitud genera una notificación en el panel de operaciones (roles ADMIN/COORDINATOR) con el tipo correcto (`BOOKING_CANCELLED` o `BOOKING_RESCHEDULED`).
- [ ] La página `/clientes/[customerId]/reservas/[bookingId]` muestra detalle, timeline y CTA de soporte; las acciones desde allí replican el comportamiento del dashboard.
- [ ] Páginas `/clientes/acceso` y `/clientes/acceso/confirmar` muestran estados correctos (idle/loading/success/error).
- [ ] Consultar [`qa/portal-accessibility.md`](portal-accessibility.md) y cerrar hallazgos abiertos (aria-live, aria-hidden) antes de GA.

## 9. Deployment

### 9.1 Build

- [ ] `pnpm turbo run build` ejecuta sin errores
- [ ] Build de API incluye `prisma generate`
- [ ] Build de Web no tiene errores de TypeScript
- [ ] Build no tiene warnings críticos

### 9.2 Vercel

- [ ] Deployment a producción se completa sin errores
- [ ] Variables de entorno están configuradas en Production
- [ ] Variables de entorno están configuradas en Preview
- [ ] Logs no muestran errores de conexión a base de datos
- [ ] Favicon se carga correctamente (no 404)

### 9.3 CI/CD

- [ ] GitHub Actions CI pasa (lint, typecheck, test, e2e, build)
- [ ] Tests unitarios pasan (161 tests en total: API + Web)
- [ ] Tests E2E críticos pasan (12 tests @critical)
- [ ] Pre-commit hooks se ejecutan correctamente
- [ ] Verificación de secretos pasa

### 9.4 Validación Post-Deploy

**Script automatizado:** `bash scripts/qa/validate-accessibility.sh [production|preview]`

- [ ] Portal landing (`/clientes`) responde 200
- [ ] Portal auth (`/clientes/acceso`) responde 200
- [ ] HTML incluye `aria-live="polite"` (fix commit `ce37e09`)
- [ ] HTML incluye `aria-hidden="true"` en íconos decorativos
- [ ] Headings jerárquicos (h1/h2) presentes
- [ ] Landmarks semánticos (nav, main, section) correctos
- [ ] Atributo `lang="es"` presente en HTML
- [ ] Viewport meta configurado correctamente

**Validación manual post-deploy:**

- [ ] Ejecutar axe DevTools en `/clientes` (espera 0 issues críticos/serios)
- [ ] Ejecutar Lighthouse en `/clientes` (espera score A11y 100/100, vs 97/100 pre-fix)
- [ ] Probar navegación con NVDA para confirmar `aria-live` funciona
- [ ] Actualizar [docs/qa/portal-accessibility.md](portal-accessibility.md) con resultados y fecha

---

## 10. Performance

### 10.1 API

- [ ] Endpoint `/api/services` responde en < 500ms
- [ ] Endpoint `/api/bookings` con filtros responde en < 1s
- [ ] Login responde en < 800ms (incluyendo bcrypt)
- [ ] No hay queries N+1 (verificar con Prisma logs)

### 10.2 Web

- [ ] Página principal carga en < 3s (First Contentful Paint)
- [ ] Panel operativo es interactivo en < 2s (Time to Interactive)
- [ ] No hay errores en consola del navegador
- [ ] Assets (favicon, images) se cargan correctamente

---

## 11. Monitoreo

### 11.1 Logs

- [ ] Logs de Vercel no muestran errores no manejados
- [ ] Logs estructurados incluyen timestamps
- [ ] Errores incluyen stack traces (en desarrollo)
- [ ] No se loguean datos sensibles (passwords, tokens)

### 11.2 Circuito Lead → Slack → PostHog

- [ ] Enviar lead desde landing (`/`), validar mensaje de confirmación.
- [ ] Confirmar en Slack `#leads-operaciones` el mensaje `🆕 Nuevo Lead Recibido`.
- [ ] Ejecutar `POSTHOG_API_KEY=… pnpm posthog:test-event checkout_payment_failed` para verificar ingestión.
- [ ] Ejecutar `POSTHOG_API_KEY=… SLACK_WEBHOOK_URL=… pnpm posthog:monitor` y confirmar alerta `:rotating_light:`.
- [ ] Registrar fecha en `docs/operations/slack-integration.md` (tabla de verificaciones).

## 12. Documentación

### 12.1 Consistencia

- [ ] README.md tiene instrucciones actualizadas
- [ ] docs/guides/quickstart.md es consistente con setup actual
- [ ] docs/overview/status.md refleja estado real del proyecto
- [ ] docs/operations/security.md tiene procedimientos vigentes
- [ ] CHANGELOG.md tiene últimos cambios (si implementado)

---

## Uso del Checklist

### Antes de cada PR

- Ejecutar checklist completo en branch de desarrollo
- Marcar items que fueron afectados por el PR
- Ejecutar tests E2E localmente

### Antes de deployment a producción

- Ejecutar checklist completo
- Verificar que CI está en verde
- Confirmar con stakeholder cambios funcionales
- Registrar evidencias en `docs/qa/reports/<fecha>-go-live.md`. Último informe: [2025-10-20](reports/2025-10-20-go-live.md).

### Después de deployment

- Verificar logs de Vercel
- Ejecutar smoke tests en producción
- Verificar métricas clave (latencia, errores)

---

**Nota:** Este checklist es un documento vivo. Añadir nuevos items conforme se descubran regresiones o se añadan funcionalidades.

- [ ] Ejecutar `pnpm --filter @brisa/api test:integration` (requiere que la base local esté disponible).
