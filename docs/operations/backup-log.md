# Backup Run Log

Registro verificado de ejecuciones de respaldo para Brisa OS (Brisa Cubana Clean Intelligence). Completa una entrada cada vez que se ejecuta `scripts/verify-backup.sh` o se realiza un `pg_dump` manual.

| Fecha (UTC) | Ejecutado por | Procedimiento                                 | Resultado | Evidencia                                         |
| ----------- | ------------- | --------------------------------------------- | --------- | ------------------------------------------------- |
| 2025-10-14  | Codex (local) | `scripts/verify-backup.sh` contra base seeded | ✅ OK     | `scripts/verify-backup.sh` log (`localhost:5433`) |

## Cómo registrar un respaldo

1. Ejecuta el procedimiento descrito en [`backup-recovery.md`](backup-recovery.md).
2. Guarda la evidencia correspondiente (archivo `.log`, suma de verificación, artefacto en almacenamiento seguro).
3. Añade una fila en la tabla anterior usando el commit que contenga la evidencia.
4. Actualiza el estado en [`overview/status.md`](../overview/status.md) si se detecta algún incidente.

> Este archivo solo debe contener ejecuciones completadas y verificadas. No registres pruebas fallidas ni planes futuros.

---

## Registro de Assets y Licencias

### Imágenes de Landing (Unsplash - Licencia Libre)

**Fecha de descarga:** 2025-10-30

| Archivo                         | Fuente                                                             | Autor                    | Licencia         | Notas                                      |
| ------------------------------- | ------------------------------------------------------------------ | ------------------------ | ---------------- | ------------------------------------------ |
| `hero-turnover-luxury.webp`     | [Unsplash](https://unsplash.com/photos/1600210492493-0946911123ea) | Spacejoy                 | Unsplash License | Sala de estar moderna para hero de landing |
| `amenities-towels.webp`         | [Unsplash](https://unsplash.com/photos/1584132967334-10e028bd69f7) | Tobias Tullius           | Unsplash License | Amenidades hoteleras y toallas spa         |
| `team-housekeeping-tablet.webp` | [Unsplash](https://unsplash.com/photos/1581578731548-c64695cc6952) | LinkedIn Sales Navigator | Unsplash License | Personal con tecnología/tablets            |
| `staging-amenity-refresh.webp`  | [Unsplash](https://unsplash.com/photos/1522771739844-6a9f6d5f14af) | Francesca Tosolini       | Unsplash License | Habitación de hotel lista                  |
| `portal-tech-modern.webp`       | [Unsplash](https://unsplash.com/photos/1566073771259-6a8506099945) | Mimi Thian               | Unsplash License | Gestión con tablet en ambiente moderno     |

**Licencia:** [Unsplash License](https://unsplash.com/license) - Uso libre para fines comerciales y no comerciales, sin atribución requerida.

**Optimizaciones aplicadas:**

- Formato: WebP con calidad 82
- Tamaño: 1920px ancho máximo
- Peso: 77KB - 452KB por imagen

### Assets Adicionales - Contenido Visual Completo (2025-10-30)

**Fecha de descarga:** 2025-10-30

| Archivo                     | Fuente                                                             | Autor                    | Licencia         | Notas                                                        |
| --------------------------- | ------------------------------------------------------------------ | ------------------------ | ---------------- | ------------------------------------------------------------ |
| `hero-mobile-vertical.webp` | [Unsplash](https://unsplash.com/photos/1560185009-5bf9f2849488)    | R Architecture           | Unsplash License | Hero vertical para móvil/stories (1080x1920) - Suite de lujo |
| `team-cleaning-action.webp` | [Unsplash](https://unsplash.com/photos/1581578731548-c64695cc6952) | LinkedIn Sales Navigator | Unsplash License | Equipo profesional en acción con tablet (1920x1280)          |
| `kitchen-before.webp`       | [Unsplash](https://unsplash.com/photos/1556911220-bff31c812dba)    | Jason Briscoe            | Unsplash License | Before: Cocina para comparación (1500x899)                   |
| `kitchen-after.webp`        | [Unsplash](https://unsplash.com/photos/1556909212-d5b604d0c90d)    | Jason Briscoe            | Unsplash License | After: Cocina impecable (1500x1000)                          |
| `bathroom-before.webp`      | [Unsplash](https://unsplash.com/photos/1584622650111-993a426fbf0a) | Sidekix Media            | Unsplash License | Before: Baño para comparación (1500x1000)                    |
| `bathroom-after.webp`       | [Unsplash](https://unsplash.com/photos/1552321554-5fefe8c9ef14)    | Paul Hanaoka             | Unsplash License | After: Baño premium limpio (1500x2249)                       |
| `amenities-kit.webp`        | [Unsplash](https://unsplash.com/photos/1584132967334-10e028bd69f7) | Tobias Tullius           | Unsplash License | Kit de amenidades hoteleras detalle (1500x1000)              |
| `amenities-detail.webp`     | [Unsplash](https://unsplash.com/photos/1591088398332-8a7791972843) | Brands&People            | Unsplash License | Amenidades spa y toallas (1500x1125)                         |

**Optimizaciones aplicadas:**

- Formato: WebP con calidad 82
- Dimensiones: 1080x1920 (vertical móvil), 1500-1920px (horizontal)
- Peso: 64KB - 309KB por imagen
- Total: 8 nuevos assets (1.16 MB total)

### Identidad visual (Generada internamente)

| Archivo                    | Fuente                            | Autor               | Licencia                               | Notas                                                             |
| -------------------------- | --------------------------------- | ------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| `brand-ai-concept.webp`    | ChatGPT Image – sesión 2025-10-29 | Equipo Brisa Cubana | Propiedad Brisa Cubana (uso exclusivo) | Logomarca oficial, convertida a WebP (1024px, calidad 82)         |
| `brand-ai-concept-512.png` | ChatGPT Image – sesión 2025-10-29 | Equipo Brisa Cubana | Propiedad Brisa Cubana (uso exclusivo) | Variante 512px para favicon/Apple Touch, derivada del máster WebP |

### Nuevos assets 2025-10-30 (Unsplash y generación interna)

| Archivo                     | Fuente                                              | Autor                    | Licencia                               | Notas                                                     |
| --------------------------- | --------------------------------------------------- | ------------------------ | -------------------------------------- | --------------------------------------------------------- |
| `hero-mobile-vertical.webp` | [Unsplash](https://unsplash.com/photos/r5KSMkyoSC8) | R Architecture           | Unsplash License                       | Hero vertical móvil (1080x1920), WebP calidad 82          |
| `team-cleaning-action.webp` | [Unsplash](https://unsplash.com/photos/m3hn2Kn5Bns) | LinkedIn Sales Navigator | Unsplash License                       | Equipo en acción con tablet (1920x1280)                   |
| `kitchen-before.webp`       | [Unsplash](https://unsplash.com/photos/OQMZwNd3ThU) | Jason Briscoe            | Unsplash License                       | Antes – cocina (1500x899)                                 |
| `kitchen-after.webp`        | [Unsplash](https://unsplash.com/photos/JIUjvqe2ZHg) | Jason Briscoe            | Unsplash License                       | Después – cocina (1500x1000)                              |
| `bathroom-before.webp`      | [Unsplash](https://unsplash.com/photos/0ZPSX_mQ3xI) | Sidekix Media            | Unsplash License                       | Antes – baño (1500x1000)                                  |
| `bathroom-after.webp`       | [Unsplash](https://unsplash.com/photos/oaCnDkzGZ38) | Paul Hanaoka             | Unsplash License                       | Después – baño (1500x2249)                                |
| `amenities-kit.webp`        | [Unsplash](https://unsplash.com/photos/lwnmhrQE32M) | Tobias Tullius           | Unsplash License                       | Kit amenidades (1500x1000)                                |
| `amenities-detail.webp`     | [Unsplash](https://unsplash.com/photos/TOOK1rEsWj0) | Brands&People            | Unsplash License                       | Detalle amenidades (1500x1125)                            |
| `pattern-waves.svg`         | Generado internamente                               | Equipo Brisa Cubana      | Propiedad Brisa Cubana                 | Pattern olas vectorial 1200x800                           |
| `pattern-waves.png`         | Generado internamente                               | Equipo Brisa Cubana      | Propiedad Brisa Cubana                 | Pattern olas raster 2048x1365                             |
| `pattern-tile.svg`          | Generado internamente                               | Equipo Brisa Cubana      | Propiedad Brisa Cubana                 | Pattern tileable 400x400                                  |
| `pattern-tile.png`          | Generado internamente                               | Equipo Brisa Cubana      | Propiedad Brisa Cubana                 | Pattern tileable fallback 2048x2048                       |
| `pattern-waves.svg`         | Generado internamente 2025-10-30                    | Equipo Brisa Cubana      | Propiedad Brisa Cubana (uso exclusivo) | Pattern de olas sutiles para fondos de sección (1200x800) |
| `pattern-waves.png`         | Generado internamente 2025-10-30                    | Equipo Brisa Cubana      | Propiedad Brisa Cubana (uso exclusivo) | Pattern PNG alta resolución (2048x1365, 95% quality)      |
| `pattern-tile.svg`          | Generado internamente 2025-10-30                    | Equipo Brisa Cubana      | Propiedad Brisa Cubana (uso exclusivo) | Pattern repetible (tileable) 400x400 para fondos CSS      |
| `pattern-tile.png`          | Generado internamente 2025-10-30                    | Equipo Brisa Cubana      | Propiedad Brisa Cubana (uso exclusivo) | Pattern tile PNG (2048x2048, 95% quality)                 |
