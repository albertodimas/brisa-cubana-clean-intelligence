# Playbook soporte al cliente

## Objetivo

Ofrecer soporte 24/7 alineado a la marca, blending IA y humanos.

## Canales

- Concierge IA (chat web, WhatsApp, app) con fallback humano.
- Teléfono de emergencia 24/7 (Ops hotline).
- Email y portal cliente (tickets + CleanScore™).
- Panel de incidentes (Sentry + Grafana) para alertas proactivas.

## Clasificación tickets

- Nivel 1: preguntas frecuentes → IA.
- Nivel 2: ajustes de agenda, facturación → CS Rep.
- Nivel 3: incidencias críticas (daños, quejas graves) → Ops Lead + Legal si aplica.

## SLA

| Tipo                         | Tiempo respuesta | Tiempo resolución |
| ---------------------------- | ---------------- | ----------------- |
| General                      | ≤ 15 min         | ≤ 24 h            |
| Emergencia (daños/huéspedes) | ≤ 5 min          | ≤ 4 h             |
| Property manager enterprise  | ≤ 10 min         | ≤ 8 h             |

## Scripts (borradores)

- Confirmación servicio.
- Rework/resolución CleanScore bajo.
- Manejo reseñas negativas.
- Situaciones sensibles (pérdida, daño).

## Herramientas

- Intercom/Front para inbox unificado.
- CRM (HubSpot) para seguimiento y playbooks.
- Copiloto IA: resúmenes automáticos, traducción, sugerencias.
- LaunchDarkly + PagerDuty para toggles y escalamiento inmediato.
- Sentry + Grafana para detección temprana.

## QA soporte

- Revisiones quincenales de tickets + auditoría mensual Comité IA.
- NPS/C-SAT post-resolución y dashboard semanal.
- Revisión de transcripciones de voz para garantizar tono y cumplimiento.

## Automatizaciones de comunicación

- Email bienvenida y onboarding cliente con checklists.
- Recordatorios pre y post servicio (reseñas, CleanScore™).
- Secuencias para clientes inactivos y upsells automáticos.
- Alertas proactivas (Temporal + LaunchDarkly) cuando un SLA se acerca al límite.
- Plantillas IA (ES/EN) conectadas al knowledge graph.

## Macros crisis B2B

- **Actualización property manager (cada 2 h):**
  "Hola {Nombre PM}, resumen al {hora}: {#} unidades listas / {#} en progreso. Próximo hito {hora siguiente}. Fotos adjuntas en carpeta segura."
- **Mensaje a huésped reubicado:**
  "Hola {Nombre huésped}, somos Brisa Cubana apoyando a {Property}. Tu nueva unidad es {dirección}. Check-in listo a las {hora}. Cualquier duda responde a este mensaje 24/7."
- **Alertar a cuadrilla asignada:**
  "Equipo {nombre}, prioridad alta en {dirección}. Instrucciones: {detalle}. Recoger kit en {punto}. Confirmar llegada con foto inicial."
- **Confirmación cierre incidente:**
  "Carlos, la unidad {código} quedó operativa. CleanScore {valor}, fotos en {link}. Factura parcial enviada, siguiente revisión {fecha}."
