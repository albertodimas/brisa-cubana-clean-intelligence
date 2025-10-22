# Video · Turno Nocturno

**Objetivo:** alojar el B-roll vertical del turno nocturno (#60) y su poster asociado.

## Especificaciones

| Archivo                      | Requisito                                           |
| ---------------------------- | --------------------------------------------------- |
| `night-shift.mp4`            | Formato H.264, 1080×1920, 60–90 s, bitrate ≤ 8 Mbps |
| `night-shift-poster.jpg`     | Imagen 1080×1920, < 300 KB, compresión sRGB         |
| `night-shift-transcript.vtt` | Opcional, subtítulos WebVTT para accesibilidad      |

## Flujo de trabajo

1. Copiar los archivos finales al directorio actual (`apps/web/public/assets/video/`).
2. Ejecutar `pnpm --filter @brisa/web dev` y abrir la landing: el componente `NightShiftMedia` comprobará el `HEAD` del video/poster y actualizará el bloque automáticamente.
3. Verificar que el video reproduce en mobile/desktop y que inicia de forma silenciosa (`muted`, `playsInline`).
4. Confirmar Lighthouse Performance ≥ 90 y que no aparece el placeholder.
5. Subir los archivos a la carpeta compartida de marketing usando la convención `BrisaCubana_<Asset>_V###_YYYYMMDD.ext` para trazabilidad.
6. Reemplazar el placeholder temporal (`night-shift.mp4` / `night-shift-poster.jpg`) antes del release público; eliminar cualquier marca “Placeholder” del footage definitivo.

## Optimización recomendada

```bash
# Reducir bitrate y mantener calidad
ffmpeg -i raw-footage.mp4 -vf "scale=1080:-2" -c:v libx264 -preset slow -crf 20 -c:a aac night-shift.mp4

# Generar poster desde el segundo 3
ffmpeg -ss 00:00:03 -i night-shift.mp4 -frames:v 1 -vf "scale=1080:1920" night-shift-poster.jpg
```

> Nota: Mantén los fuentes originales (`raw-footage/`) fuera del repositorio; solo los assets optimizados residen aquí.
