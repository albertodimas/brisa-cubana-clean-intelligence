# Plan de Canal en Tiempo Real para Notificaciones Operativas

**Fecha:** 15 de octubre de 2025  
**Estado:** IMPLEMENTADO (15 octubre 2025)  
**Stakeholders:** Plataforma (API + Web), Operaciones, QA

## 1. Contexto

- El panel operativo consume `/api/notifications`, permite marcar individuales y masivas, y muestra badge lateral mediante `NotificationBell`.
- Antes de esta decisión, el refresco dependía de abrir el panel o recargar la página (acciones server). Coordinadores/admins no veían nuevas alertas si la vista quedaba inactiva.
- La API se ejecuta en Hono (Node 22.13.0) con autenticación vía `auth_token` o `Bearer` (NextAuth). Infraestructura actual corre sobre Vercel (frontend) y el API puede vivir en Vercel/Render.
- Navegadores objetivo: escritorio (Chrome ≥ 123, Edge ≥ 123, Safari ≥ 17) en operación diaria; móviles son secundarios.

## 2. Objetivo

Seleccionar el canal de entrega en tiempo real para notificaciones internas (coordinadores/admins) equilibrando simplicidad operativa, compatibilidad y latencia (<5 s). El canal debe integrarse con la infraestructura existente y mantener trazabilidad/auditoría.

## 3. Opciones Analizadas

| Opción                                             | Ventajas                                                                                                                          | Desventajas                                                                                                                                         | Observaciones                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Polling corto (15–30 s)**                        | Implementación inmediata (cron `setInterval`, acción Next)                                                                        | Tráfico innecesario, riesgo de rate-limit en producción, UX “saltos”                                                                                | Viable como fallback pero no cumple objetivo push                       |
| **Long-polling**                                   | Sin cambios de infra, similar a REST                                                                                              | Mantiene conexiones abiertas (coste CPU), difícil balancear escalado serverless, reintentos manuales                                                | Hono soporta `Response` streaming pero complica timeouts en edge        |
| **Server-Sent Events (SSE)**                       | Unidireccional (server→client), soporte nativo en EventSource, fácil auth con cookies/bearer, compatible con proxies y serverless | Sin canal bidireccional (no se necesita), requiere mantener conexión viva y reconectar en 503/429                                                   | Hono expone streaming; Next puede consumir con `EventSource` en cliente |
| **WebSocket**                                      | Tiempo real bidireccional, baja latencia                                                                                          | Infraestructura más compleja (gateway WS, escalado sticky sessions o Redis pub/sub), no necesario para caso actual, requiere cambios grandes en API | Exceso para simple feed de notificaciones                               |
| **Push Notifications (Web Push + Service Worker)** | Entrega incluso con app cerrada                                                                                                   | Requiere permisos, service workers, FCM u otros endpoints, complejidad legal (opt-in)                                                               | Puede evaluarse más adelante para operaciones móviles                   |

## 4. Decisión

- **Canal primario:** **Server-Sent Events (SSE)** expuesto en `GET /api/notifications/stream`.
  - Autenticación reutiliza `auth_token` cookie o `Bearer` token (misma middleware `authenticate`).
  - Reutilizar `NotificationRepository` para entregar batch inicial + eventos incrementales (nuevo registro, `readAt` updates).
  - Mantener el endpoint REST existente como fallback manual y para paginación histórica.
- **Fallback:** polling suave cada 60 s (solo si la conexión SSE se cae y no se restablece tras n intentos). Este comportamiento se gestionará en el cliente (`NotificationBell`).
- Justificación:
  1. Entrega near-real-time (<1 s) con mínima complejidad frente a WebSocket.
  2. Infraestructura compatible con serverless/edge (SSE funciona en Vercel Edge Runtime o Node runtime sin sticky session).
  3. Permite auditar eventos (enviar payload JSON con tipo `NEW_NOTIFICATION` o `READ_ALL_SYNC`).

## 5. Diseño Propuesto

### 5.1 API (Hono)

1. Endpoint `GET /api/notifications/stream`:
   - Verifica usuario autenticado.
   - Responde `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
   - Envía evento `init` con lote inicial (≤20) y `lastEventId`.
   - Suscribe a un hub en memoria (`apps/api/src/lib/notification-hub.ts`) que emite eventos cada vez que el repositorio crea o actualiza notificaciones.
2. Eventos soportados en producción:
   - `notification:new` → payload completo con `id`, `message`, `type`, `createdAt`.
   - `notification:update` → `id` y nuevo `readAt` cuando cambia el estado.
   - `notification:sync` → lote completo cuando se marca todo como leído (mantiene snapshot consistente).
3. Observabilidad: se registran reconexiones y errores en logs estructurados.
4. Consideración futura: reemplazar el hub in-memory por pub/sub externo (Redis) cuando la carga >10 eventos/s o se despliegue horizontalmente.

### 5.2 Front-end (Next.js)

1. `NotificationBell`:
   - Crear hook `useNotificationStream` que:
     - Establece `EventSource` con credenciales (`withCredentials`).
     - Maneja `open`, `message`, `error` (reintentos con backoff exponencial).
     - Actualiza estado local incrementando `unread`, mutando lista `items` (mantener paginado).
   - Cuando el panel está cerrado, seguir mostrando badge actualizado; cuando está abierto, aplicar diff sin rehacer fetch completo (solo si `hasMore` se requiere se usa REST).
2. Fallback:
   - Tras 3 errores consecutivos → fallback a polling con `fetch /api/notifications` cada 60 s hasta restablecer SSE.
3. Sincronización multiplataforma:
   - Se apoya en `lastEventId` y actualiza el snapshot local cuando llega `notification:sync`.

### 5.3 Seguridad y Compliance

- Validar que SSE respete scopes: solo eventos del `userId` autenticado.
- No exponer mensajes sensibles (ya en base de datos).
- Limitar tamaño de payload (<4 KB por evento).
- Añadir pruebas de desconexión (API corta conexión) y reconexión en cliente.

## 6. Implementación

- ✅ Endpoint SSE `GET /api/notifications/stream` con hub de eventos en memoria.
- ✅ Repositorio notifica high-level events (`notification:new`, `notification:update`, `notification:bulk`).
- ✅ Hook `useNotificationStream` con reconexión exponencial y fallback a polling.
- ✅ Componente `NotificationBell` con panel lateral, badge reactivo y controles de lectura.
- ✅ Tests: integración (`app.integration.test.ts`) + E2E críticos (`tests/e2e/notifications.spec.ts`).
- ✅ Documentación actualizada (`docs/overview/status.md`).

## 7. Riesgos y Mitigaciones

| Riesgo                                                | Impacto | Mitigación                                                                                  |
| ----------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| SSE no soportado en algún entorno (proxy corporativo) | Medio   | Mantener fallback a polling y botón manual “Refrescar”                                      |
| Fugas de memoria por conexiones inactivas             | Alto    | Implementar heartbeat (comentario `event: ping`) y cerrar conexiones sin actividad en 120 s |
| Carga extra en base de datos por chequeos             | Medio   | Usar caché en memoria o pub/sub (p. ej. Redis) en evolución futura                          |
| Tests inestables en CI                                | Medio   | Añadir utilidades en Playwright para mockear `EventSource`, y tests API aislados (vitest)   |

## 8. Dependencias

- Requiere que API continúe en runtime Node (no edge puro) o habilitar streaming en deployment.
- Posible futuro: integración con Redis o queue si las notificaciones aumentan (>10/s).
- No depende de Tailwind v4, pero se ejecutará tras finalizar migración actual para evitar solapamiento.

---

**Próximos pasos:** evaluar migración del hub a pub/sub (Redis) y añadir métricas de stream (entrega y reconexiones) en Sentry antes de escalar usuarios concurrentes.
