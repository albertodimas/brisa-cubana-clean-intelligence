# Tutorial: Concierge AI - Atención al Cliente

## Objetivo

Configurar y probar el flujo Concierge AI para responder solicitudes básicas de huéspedes desde el dashboard interno.

## Audiencia

- Equipo de Customer Success.
- Ingenieros encargados de la integraciones LLM.

## Prerrequisitos

| Recurso                    | Detalle                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| API Key OpenAI o Anthropic | Definir `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` en `apps/api/.env`.                          |
| Flag de modo real          | `CONCIERGE_MODE=llm` en `apps/api/.env` (o `ENABLE_AI_CONCIERGE=true`).                     |
| Seed de clientes           | Ejecutar `pnpm --filter=@brisa/api db:seed` (incluye cuenta `client@brisacubanaclean.com`). |
| Navegador actualizado      | Se recomienda Chrome/Edge para WebSocket.                                                   |

## Paso 1. Verificar configuración

1. Inicia API y Web (`pnpm dev`).
2. Confirma que el endpoint `/api/concierge/status` responda `"mode": "llm"`:
   ```bash
   curl http://localhost:3001/api/concierge/status | jq '{mode, provider}'
   ```
3. Activa panel de logs para seguir conversaciones (`pnpm dev:api` y busca tag `concierge`).

## Paso 2. Simular solicitud de un huésped

1. En <http://localhost:3000>, inicia sesión como `client@brisacubanaclean.com`.
2. Abre **Support → Concierge AI**.
3. Envía el mensaje: “Hola, necesito confirmar la hora de limpieza de hoy”.
4. Verifica que la petición aparezca en el dashboard de agentes (usuario admin).

## Paso 3. Responder desde Concierge AI

1. Inicia sesión como admin en una segunda pestaña.
2. Accede a **Dashboard → Concierge AI → Bandeja de entrada**.
3. Selecciona la conversación creada y pulsa “Generar respuesta AI”.
4. Revisa la propuesta, edítala si es necesario y envía.

## Paso 4. Confirmar contexto y acciones

1. Comprueba que el historial muestre la respuesta generada con etiqueta `AI`.
2. Si la petición requiere acción (ej. reprogramar limpieza), crea un booking o abre un ticket siguiendo el enlace sugerido.
3. Verifica en MailHog que el huésped recibió la respuesta (`subject: Concierge AI Response`).

## Paso 5. Validar métricas

1. Ejecuta:
   ```bash
   curl http://localhost:3001/api/concierge/metrics | jq '.'
   ```
   Debes observar el contador `messagesProcessed` incrementado.
2. Revisa logs para confirmar que la llamada LLM demoró < 5s.

## Troubleshooting

| Problema                 | Causa                    | Solución                                                   |
| ------------------------ | ------------------------ | ---------------------------------------------------------- |
| `mode` sigue `mock`      | Falta API key            | Define `OPENAI_API_KEY` en `.env` y reinicia API.          |
| No se generan respuestas | Throttling del proveedor | Consulta dashboard del LLM y ajusta `CONCIERGE_LLM_MODEL`. |
| Correo no llega          | MailHog caído            | `docker compose restart mailhog`.                          |

## Próximos pasos

- Configurar base de conocimiento via `CONCIERGE_KB_BUCKET` para respuestas personalizadas.
- Documentar escalamiento a agentes humanos en `docs/operations/runbooks/INCIDENT_RESPONSE.md`.

## Registro de cambios

| Fecha      | Cambio                                | Responsable |
| ---------- | ------------------------------------- | ----------- |
| 2025-10-03 | Tutorial inicial (Diátaxis: Tutorial) | Plataforma  |
