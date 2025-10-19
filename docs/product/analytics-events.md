# Diccionario de Eventos – PostHog

**Última actualización:** 19 de octubre de 2025

| Nombre                    | Categoría | Descripción                                  | Propiedades principales                                   |
| ------------------------- | --------- | -------------------------------------------- | --------------------------------------------------------- |
| `cta_request_proposal`    | marketing | Click al CTA de cotización en la landing.    | `source`, `campaign`, `utm_medium`, `serviceId`           |
| `cta_portal_demo`         | marketing | Click al CTA de demo portal cliente.         | `source`, `campaign`, `utm_medium`                        |
| `checkout_started`        | checkout  | Inicio del flujo de checkout multipaso.      | `serviceId`, `plan`, `source`, `utm_campaign`             |
| `checkout_completed`      | checkout  | Pago completado y reserva confirmada.        | `serviceId`, `plan`, `amount`, `currency`, `utm_campaign` |
| `checkout_payment_failed` | checkout  | Pago fallido (Stripe).                       | `serviceId`, `plan`, `errorCode`, `utm_campaign`          |
| `portal.link.requested`   | portal    | Cliente solicita enlace mágico.              | `customerId`, `channel`                                   |
| `portal.link.verify`      | portal    | Cliente verifica enlace mágico exitosamente. | `customerId`, `expiresAt`                                 |
| `portal.logout`           | portal    | Cliente cierra sesión desde el portal.       | `customerId`                                              |
| `portal.booking.action`   | portal    | Cliente cancela/reagenda desde el portal.    | `customerId`, `bookingId`, `action`                       |

> **Nota:** reemplaza valores `source`/`campaign` con nomenclatura estandarizada (`paid-search`, `organic`, etc.). Actualiza este documento cuando se añadan eventos o propiedades nuevas.
