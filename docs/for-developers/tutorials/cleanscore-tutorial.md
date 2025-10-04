# Tutorial: Operación de CleanScore™

## Objetivo

Guiar al personal de operaciones para capturar y publicar un informe CleanScore™ completo para una propiedad residencial de prueba.

## Audiencia

- Supervisores de campo y personal de QA.
- Ingenieros que validan el flujo de evidencias y puntaje automático.

## Prerrequisitos

| Recurso             | Detalle                                                             |
| ------------------- | ------------------------------------------------------------------- |
| Cuenta admin        | `admin@brisacubanaclean.com` / `Admin123!` (seed).                  |
| Propiedad demo      | “Skyline Loft” creada por el seed inicial.                          |
| Dispositivo móvil   | Cámara 1080p+, con app de captura instalada (Figma prototype v0.2). |
| Acceso a S3 staging | Credenciales `CLEAN_SCORE_S3_*` cargadas en `apps/api/.env`.        |
| Feature flag        | `CLEAN_SCORE_AI=true` en `apps/api/.env` y `apps/web/.env.local`.   |

## Paso 1. Preparar entorno

1. Levanta la API y Web local (consulta [Quickstart](../quickstart.md)).
2. Verifica que el flag esté activo: `curl http://localhost:3001/api/features | jq '.features.cleanScoreAI.enabled'` → `true`.
3. Asegúrate de que `apps/api/prisma/seed.ts` generó la propiedad “Skyline Loft”.

## Paso 2. Registrar inspección inicial

1. Inicia sesión en <http://localhost:3000> con credenciales de staff (`staff@brisacubanaclean.com`).
2. Navega a **Dashboard → CleanScore™ → Nueva inspección**.
3. Selecciona “Skyline Loft” y confirma fecha/hora.
4. Registra checklist inicial (mínimo 3 áreas).

## Paso 3. Capturar evidencias

1. Desde el dispositivo móvil, abre la app de captura (mock Figma).
2. Escanea el QR generado por el dashboard.
3. Captura fotos obligatorias: sala, cocina, baño. Asegúrate de usar orientación horizontal.
4. Captura al menos un video corto como walkthrough.
5. Finaliza la carga y verifica que las evidencias aparecen en el dashboard (estado “Procesando”).

## Paso 4. Ejecutar análisis CleanScore™

1. Ejecuta la API de scoring para registrar el informe (puedes repetir el comando si deseas forzar nuevos datos desde el dashboard):
   ```bash
   curl -X POST http://localhost:3001/api/reports/cleanscore \
     -H "Authorization: Bearer <TOKEN_ADMIN>" \
     -H "Content-Type: application/json" \
     -d '{
       "bookingId": "<ID_COMPLETED>",
       "images": [
         "https://storage.mock/cleanscore/livingroom.jpg",
         "https://storage.mock/cleanscore/kitchen.jpg",
         "https://storage.mock/cleanscore/bathroom.jpg"
       ],
       "videos": ["https://storage.mock/cleanscore/walkthrough.mp4"],
       "checklist": [
         {"area": "Kitchen", "status": "PASS"},
         {"area": "Bathrooms", "status": "PASS"},
         {"area": "Final inspection", "status": "PASS"}
       ],
       "notes": "Inspección tutorial generada desde curl"
     }'
   ```
2. En el dashboard (ruta `/dashboard/reports/cleanscore`), localiza el booking y revisa:
   - Puntaje general (`score` debería aparecer con valor ≥ 90 cuando el checklist está completo).
   - Observaciones generadas (sección “Observaciones del equipo”).
   - Evidencias adjuntas (fotos y videos quedan listados en la tarjeta).

## Paso 5. Publicar informe

1. Desde `/dashboard/reports/cleanscore`, haz clic en “Publicar y enviar” en el reporte que creaste.
2. El reporte se marca como `Publicado` y se dispara el correo hacia el cliente (“Tu CleanScore™ Report - <Propiedad>”).
3. Confirma recepción en la bandeja de MailHog (subject: “Tu CleanScore™ Report - …”).

## Validación

- API: `GET http://localhost:3001/api/reports/cleanscore/<ID>` debe devolver el informe con `status: PUBLISHED`.
- Dashboard: la tarjeta de la propiedad muestra el último score y enlace al PDF.
- Si tienes S3 configurado: carpeta `cleanscore/<bookingID>/` contiene imágenes y `report.pdf`.

## Troubleshooting

| Problema             | Causa                     | Solución                                                       |
| -------------------- | ------------------------- | -------------------------------------------------------------- |
| Llega score `null`   | Job no ejecutado          | Re-lanzar script del paso 4 y revisar logs (`pnpm dev:api`).   |
| Evidencias no cargan | Credenciales S3 inválidas | Verificar `CLEAN_SCORE_S3_ACCESS_KEY` en `.env`.               |
| Correo no recibido   | MailHog no activo         | Revisar `docker compose ps` y restablecer `pnpm docker:reset`. |

## Próximos pasos

- Automatizar la invocación del endpoint mediante cron o pipeline en `docs/operations/production/PRODUCTION_DEPLOYMENT_GUIDE.md`.
- Documentar variantes de scoring (propiedades comerciales) cuando el modelo esté disponible.

## Registro de cambios

| Fecha      | Cambio                                     | Responsable |
| ---------- | ------------------------------------------ | ----------- |
| 2025-10-03 | Creación del tutorial (Diátaxis: Tutorial) | Plataforma  |
