# Guía Operativa: Portal Cliente

**Última actualización:** 7 de noviembre de 2025  
**Responsables:** Producto · Operaciones · QA

Esta guía describe cómo habilitar, verificar y operar el portal de autoservicio para clientes hospedado en `/clientes`. Cubre los flujos actuales (beta) basados en enlaces mágicos, las acciones disponibles para los clientes y los criterios de observabilidad/QA.

---

## 1. Panorama general

- **Rutas clave:** `/clientes`, `/clientes/acceso`, `/clientes/acceso/confirmar`, `/clientes/[customerId]`, `/clientes/[customerId]/reservas/[bookingId]`.
- **Autenticación:** enlaces mágicos emitidos por la API (cookies `portal_token` HttpOnly + `portal_customer_id` pública).
- **Estado actual:** Beta validada en CI (`tests/e2e/portal-client.spec.ts`) con seeds demo. El modo producción requiere SMTP configurado para envío de correos.

---

## 2. Prerrequisitos por entorno

| Entorno    | Requerimientos                                                                                                                     | Notas                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Local      | `PORTAL_MAGIC_LINK_EXPOSE_DEBUG="true"` en `.env.local` para obtener `debugToken` sin SMTP.                                        | Permite QA rápido sin correo.                                                                       |
| Preview    | SMTP real o sandbox (Mailtrap/Resend), `PORTAL_MAGIC_LINK_BASE_URL` apuntando al dominio de preview y `ENABLE_TEST_UTILS="false"`. | Mantén `EXPOSE_DEBUG="false"` para simular experiencia real y validar correos de extremo a extremo. |
| Producción | SMTP productivo (credenciales en Vercel + 1Password), `EXPOSE_DEBUG="false"` y `ENABLE_TEST_UTILS="false"`.                        | Revisar `docs/operations/security.md` para rotación de claves y checklist de correo.                |

Variables mínimas:

```dotenv
PORTAL_MAGIC_LINK_FROM="Brisa Cubana <no-reply@brisacubanacleanintelligence.com>"
PORTAL_MAGIC_LINK_SMTP_HOST="smtp.mailtrap.io"
PORTAL_MAGIC_LINK_SMTP_PORT="587"
PORTAL_MAGIC_LINK_SMTP_USER="smtp-user"
PORTAL_MAGIC_LINK_SMTP_PASSWORD="smtp-password"
PORTAL_MAGIC_LINK_BASE_URL="https://brisa-cubana-clean-intelligence.vercel.app"
PORTAL_MAGIC_LINK_CONFIRMATION_PATH="/clientes/acceso/confirmar"
PORTAL_MAGIC_LINK_TTL_MINUTES="15"
PORTAL_MAGIC_LINK_EXPOSE_DEBUG="false"
```

---

## 3. Flujo de acceso

1. El cliente ingresa su correo registrado en `/clientes/acceso`.
2. La API (`POST /api/portal/auth/request`) genera token temporal (TTL configurable).
3. El correo contiene enlace `PORTAL_MAGIC_LINK_BASE_URL + CONFIRMATION_PATH?token=...`.
4. `/clientes/acceso/confirmar` valida el token vía `POST /api/portal/auth/verify`.
5. La API devuelve cookies de sesión (`portal_token`, `portal_customer_id`) y vencimiento `expiresAt`.
6. El frontend redirige a `/clientes/[customerId]` mostrando dashboard con reservas.

> QA local: usa `cliente@brisacubanacleanintelligence.com`, captura `debugToken` del response y navega a `/clientes/acceso/confirmar?token=...`.

---

## 4. Funcionalidades actuales

### 4.1 Dashboard

- **Tarjetas de métricas:** próximas reservas, historial y confirmadas (componente `PortalStatCard`).
- **Notices de sesión:** contador regresivo (se metaboliza con `portal-session.ts`).
- **Lista de próximas reservas:** acciones `Reagendar`, `Cancelar`, link a detalle. Usa `PortalBookingCard`.
- **Historial:** lista paginada con etiquetas de estado y CTA a detalle.

### 4.2 Detalle de reserva

- Ruta `/clientes/[customerId]/reservas/[bookingId]`.
- Incluye timeline, notas de operaciones, botones de soporte (`mailto`), breadcrumbs para regresar al dashboard.

### 4.3 Acciones de autoservicio

| Acción        | Endpoint                                   | Validaciones                                                                    | Efecto                                                                                      |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Reagendar     | `POST /api/portal/bookings/:id/reschedule` | Fecha futura, reserva del cliente, estados mutables (`CONFIRMED`, `SCHEDULED`). | Actualiza `scheduledAt`, registra nota opcional, genera notificación `BOOKING_RESCHEDULED`. |
| Cancelar      | `POST /api/portal/bookings/:id/cancel`     | Reserva del cliente, no completada/cancelada.                                   | Marca `CANCELLED`, registra motivo, notificación `BOOKING_CANCELLED`.                       |
| Cerrar sesión | `POST /api/portal/auth/logout`             | Requiere token portal                                                           | Limpia cookies y redirige a `/clientes/acceso`.                                             |

### 4.4 Descarga de comprobantes PDF (Sprint 4)

- **Ruta Next:** `GET /app/api/portal/bookings/[bookingId]/pdf`
- **Qué hace:** Genera un recibo PDF (componentes `BookingReceipt` + React PDF) con datos del booking, propiedad, servicio, costo y sello temporal (`generatedAt`).
- **Autorización:** Usa las cookies `portal_token` y `portal_customer_id` enviadas automáticamente por el navegador. Si faltan, responde 401.
- **Rate limiting:** 10 descargas por minuto por correo (`X-RateLimit-*` en headers). El limitador es en memoria; cuando se habilite Redis bastará con apuntar `REDIS_URL`.
- **QA:** En el portal, cada tarjeta muestra “Descargar comprobante”. Valida que:
  - Archivos sigan el formato `comprobante-{code}-{id}.pdf`.
  - Estados en el PDF muestren el badge correcto (confirmada, completada, etc.).
  - Al superar 10 descargas/minuto aparezca mensaje amigable.
  - El endpoint responde 404 si el booking no pertenece al cliente.

---

## 5. Observabilidad y telemetría

- **Logs API:** `apps/api/src/routes/portal-*.ts` emiten eventos `Magic link solicitado`, `Portal booking cancellation/reschedule processed`.
- **Sentry Web:** `recordPortalEvent` captura breadcrumbs `portal.dashboard.refresh`, `portal.booking.cancelled/rescheduled`, `portal.logout`.
- **Métricas sugeridas:** configurar alerta cuando `portal.booking.action.error` exceda 3 eventos en 15 minutos o cuando `portal.session.expired` escale.
- **Web Vitals:** etiquetadas con `pageType: "portal"` (ver `apps/web/lib/web-vitals.ts`).

> Revisa `docs/operations/observability.md` §5 para configurar alertas Sentry → Slack y tableros de métricas de negocio.

---

## 6. QA y evidencias

- **CTest automatizado:** `tests/e2e/portal-client.spec.ts` (suite @critical) + `tests/e2e/csv-export.spec.ts` cubre interacción con el mismo dataset cuando se descargan comprobantes/exportaciones. Ejecutar con `pnpm test:e2e:critical`.
- **Seeds dependientes:** `prisma/seed.demo.ts` crea reservas demo para el cliente `cliente@brisacubanacleanintelligence.com`.
- **Manual QA:** agregar resultados y capturas en [`docs/development/qa/regression-checklist.md`](../qa/regression-checklist.md) sección 8 (Portal cliente).

Checklist previo a habilitar cambios en producción:

- [ ] `pnpm test:e2e:critical` sin fallos.
- [ ] Validar expiración de cookies en DevTools (comparar con `session.expiresAt`).
- [ ] Confirmar recepción de notificaciones para roles `ADMIN`/`COORDINATOR`.
- [ ] Enviar y cancelar una reserva desde portal; revisar logs Pino en Vercel.
- [ ] Validar accesibilidad con axe DevTools (contrastes, foco, `aria-live`).

---

## 7. Resolución de incidencias comunes

| Síntoma                                   | Causa probable                                                    | Mitigación                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| El enlace mágico muestra "Token inválido" | Token expirado o consumido                                        | Generar nuevo enlace; verificar hora del servidor y `MAGIC_LINK_TTL_MINUTES`.                        |
| El dashboard no carga reservas            | Seed incompleto o token sin scope `portal-client`                 | Ejecutar `pnpm --filter @brisa/api db:seed:demo` o revisar firma JWT (`scope`, `aud`).               |
| Acciones de cancelación/reschedule fallan | Reserva ya en estado `IN_PROGRESS/COMPLETED` o falta notificación | Validar estado, revisar logs API (`Portal booking ...`).                                             |
| Logout no elimina cookies                 | Proxy sin limpiar `Set-Cookie`                                    | Revisar `app/api/[...route]/route.ts` y asegurar `set-cookie` se propaga.                            |
| No llegan correos en producción           | SMTP bloqueado o campos faltantes                                 | Revisar credenciales en Vercel, confirmar `PORTAL_MAGIC_LINK_FROM`.                                  |
| API responde 503 al solicitar enlace      | SMTP no configurado (`PORTAL_MAGIC_LINK_*` incompletas)           | Completar variables en Vercel; sin SMTP la API rechaza la solicitud para evitar falsas expectativas. |
| Botón "Descargar PDF" retorna 429         | Cliente excedió 10 descargas/minuto                               | Esperar 60 s; validar que no haya pruebas automatizadas ejecutándose con la misma cuenta.            |
| PDF muestra datos incompletos             | API `/api/portal/bookings/:id` no retorna relaciones nuevas       | Regenerar seeds o revisar migraciones (`assignedStaff`, `propertyOwner`).                            |

---

## 8. Roadmap inmediato

- Integrar autenticación sin `debugToken` en preview (simulación de correo vía Mailtrap).
- Documentar futuras acciones (descarga de comprobantes, actualización de datos de facturación) cuando se implementen.
- Añadir métricas de uso del portal en el dashboard de negocio (ver `docs/operations/observability.md` para blueprint).

Mantén esta guía sincronizada con cada cambio funcional y enlaza nuevas evidencias (capturas, sesiones de QA) desde `docs/overview/status.md`.
