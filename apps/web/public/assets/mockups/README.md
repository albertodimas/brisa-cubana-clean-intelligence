# Mockups Operativos

Estos mockups sintetizan la interfaz del portal y sirven como relleno premium mientras se capturan pantallas reales. Los archivos viven en este directorio y conservan los mismos nombres que consume la landing para evitar tocar código.

## Convenciones

| Subcarpeta | Uso en el sitio                                                | Resolución objetivo                                    |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `16-9/`    | Secciones de dashboard en escritorio (`apps/web/app/page.tsx`) | 1920×1080 (`*-1920w.webp`) y 1280×720 (`*-1280w.webp`) |
| `4-5/`     | Bloques móviles / sección "Portal cliente"                     | 1080×1350 (`*-1080w.webp`) y 540×675 (`*-540w.webp`)   |

- Los archivos deben ser WebP comprimidos (`libwebp`, calidad 90–95).
- Mantén los nombres para no romper los imports. Si necesitas variaciones, actualiza primero el contenido y luego renombra en el código.
- El diseño actual usa fondos oscuros, acentos `#14B8A6`, `#38BDF8` y tipografías DejaVu embebidas desde FFmpeg.

## Reemplazo rápido con capturas reales

1. Genera la captura (PNG o JPEG) desde la app real.
2. Ajusta la resolución con `ffmpeg` o `sharp`:
   ```bash
   ffmpeg -i captura.png -vf "scale=1920:-1" -vcodec libwebp -quality 95 portal-dashboard-1920w.webp
   ffmpeg -i portal-dashboard-1920w.webp -vf scale=1280:-1 -vcodec libwebp -quality 95 portal-dashboard-1280w.webp
   ```
3. Sustituye ambos tamaños en la carpeta correspondiente.
4. Verifica en local con `pnpm --filter @brisa/web dev` y revisa la sección de mockups.

## Placeholders actuales

Los archivos entregados el 26-oct-2025 son placeholders generados con FFmpeg que representan:

- `portal-dashboard-*`: tablero con métricas SLA y tarjetas de desempeño.
- `portal-bookings-*`: cronograma de turnos y backlog operativo.
- `portal-services-*`: matriz de servicios/stock con KPIs.
- `portal-mobile-*`: flujo del portal cliente (enlace mágico, alertas y tareas).

Usa estas bases hasta contar con capturas reales; al reemplazarlas no olvides regenerar los tamaños secundarios.
