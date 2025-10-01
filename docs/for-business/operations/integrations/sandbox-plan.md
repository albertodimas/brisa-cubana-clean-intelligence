# Plan de integraciones & sandbox

## Objetivo

Asegurar cuentas de desarrollador, credenciales y pruebas automáticas antes del lanzamiento.

## Stripe

- Crear cuenta (o conectar con existente).
- Configurar webhooks → endpoint edge (Cloudflare Worker).
- Activar Radar, 3D Secure, payout schedule.
- Implementar cuentas conectadas si se requiere pago a cuadrillas.

## Twilio / WhatsApp

- Aplicar a WhatsApp Business API (tiempo de aprobación varía).
- Verificar número y marca.
- Configurar plantillas bilingües de mensajes.
- Implementar opt-in/out (TCPA).

## Google Maps Platform

- Habilitar APIs (Geocoding, Directions, Distance Matrix, Places).
- Establecer quotas y alertas.
- Revisar facturación mensual (budget alerts).

## QuickBooks Online

- Crear sandbox company.
- Definir chart of accounts (servicios, impuestos, gastos).
- Integrar con backend para sincronizar facturas/pagos.

## DocuSign

- Set up developer account.
- Crear plantilla contrato B2B (multilenguaje).
- Configurar webhooks para tracking de firmas.

## PMS/PropTech (Fase 2)

- Airbnb API (a través de partner): requiere acuerdos, criterios.
- Hostaway/Guesty: solicitar acceso, revisar docs, definir mapping.
- Cloudbeds / Opera (hoteles): programar piloto.

## IoT

- Seleccionar proveedores (August, Schlage, Nest).
- Documentar APIs/SDK y requerimientos de seguridad.

## Mantenimiento

- Rotación de credenciales, monitor de fallos (status pages), fallback manual.
- Documentar en Runbook cada integración.
