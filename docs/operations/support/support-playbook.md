# Playbook soporte al cliente

## Objetivo
Ofrecer soporte 24/7 alineado a la marca, blending IA y humanos.

## Canales
- Agente IA (chat web, WhatsApp, app) con fallback humano.
- Teléfono de emergencia (24/7).
- Email.

## Clasificación tickets
- Nivel 1: preguntas frecuentes → IA.
- Nivel 2: ajustes de agenda, facturación → CS Rep.
- Nivel 3: incidencias críticas (daños, quejas graves) → Ops Lead + Legal si aplica.

## SLA
| Tipo | Tiempo respuesta | Tiempo resolución |
|------|------------------|-------------------|
| General | ≤ 15 min | ≤ 24 h |
| Emergencia | ≤ 5 min | ≤ 4 h |

## Scripts (borradores)
- Confirmación servicio.
- Rework/resolución CleanScore bajo.
- Manejo reseñas negativas.
- Situaciones sensibles (pérdida, daño).

## Herramientas
- Intercom/Front para inbox unificado.
- CRM (HubSpot/Zoho) para seguimiento.
- Integración IA (respuestas sugeridas, resumen tickets).

## QA soporte
- Revisiones quincenales de tickets.
- NPS/C-SAT post-resolución.


## Automatizaciones de comunicación
- Email bienvenida y onboarding cliente.
- Recordatorios pre-servicio y post-servicio (solicitar reseñas).
- Secuencias para clientes inactivos.
- Plantillas IA para respuestas rápidas (ver templates CRM).

## Macros crisis B2B
- **Actualización property manager (cada 2 h):**
  "Hola {Nombre PM}, resumen al {hora}: {#} unidades listas / {#} en progreso. Próximo hito {hora siguiente}. Fotos adjuntas en carpeta segura."
- **Mensaje a huésped reubicado:**
  "Hola {Nombre huésped}, somos Brisa Cubana apoyando a {Property}. Tu nueva unidad es {dirección}. Check-in listo a las {hora}. Cualquier duda responde a este mensaje 24/7."
- **Alertar a cuadrilla asignada:**
  "Equipo {nombre}, prioridad alta en {dirección}. Instrucciones: {detalle}. Recoger kit en {punto}. Confirmar llegada con foto inicial."
- **Confirmación cierre incidente:**
  "Carlos, la unidad {código} quedó operativa. CleanScore {valor}, fotos en {link}. Factura parcial enviada, siguiente revisión {fecha}."
