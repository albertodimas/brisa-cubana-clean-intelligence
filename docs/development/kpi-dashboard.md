# Project KPIs Cheat Sheet

Pequeño tablero operativo con comandos rápidos para verificar la salud del sistema en entornos locales o staging.

## Feature Flags

```bash
curl http://localhost:3001/api/features | jq '.features'
```

Muestra si `cleanScoreAI`, `conciergeAI` y `payments` están habilitados, junto con la fuente del flag (`CLEAN_SCORE_AI`, `CONCIERGE_MODE`, etc.).

## Concierge AI

```bash
# Estado general
curl http://localhost:3001/api/concierge/status | jq '{mode, provider, emailDeliveryEnabled}'

# Métricas agregadas
curl http://localhost:3001/api/concierge/metrics | jq '.'
```

Valores esperados:

- `mode: "llm"` cuando `CONCIERGE_MODE=llm` o `ENABLE_AI_CONCIERGE=true`.
- `messagesProcessed` aumenta cada vez que un usuario o la IA envía un mensaje.
- `tokensGenerated` suma los tokens reportados por el proveedor LLM.

## CleanScore™

```bash
# Listado resumido
curl http://localhost:3001/api/reports/cleanscore?limit=5 | jq '.reports[] | {bookingId, status, score}'

# Detalle de un booking
curl http://localhost:3001/api/reports/cleanscore/<BOOKING_ID> | jq '{bookingId, status, score, checklist, videos}'
```

Notas:

- El puntaje `score` ahora se entrega en escala 0-100.
- Los reportes generados vía staff app quedan en `DRAFT` hasta que se publique con `PATCH /api/reports/cleanscore/:bookingId`.

## Tareas sugeridas

- Automatizar estos comandos en un script de observabilidad (`scripts/status.sh`).
- Exponer los contadores en un panel Grafana usando los nuevos indicadores Prometheus:
  - `brisa_api_concierge_conversations_total`
  - `brisa_api_concierge_messages_total`
  - `brisa_api_concierge_tokens_total`
