# Checklist de Activos Visuales · Lanzamiento

**Última actualización:** 22-oct-2025
**Issue de tracking:** [#64](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/64)
**Benchmark:** Structured workflows increase productivity by 30% (PMI 2025)

## 1. Contenido prioritario (Semanas 1-4) — Actualizado 22-oct-2025

| Asset                             | Formato                                       | Uso                                  | Estado (21-oct-2025) / Responsable                     | Requisitos                                                                            |
| --------------------------------- | --------------------------------------------- | ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Foto cuadrilla Skyline Loft       | Horizontal (1920x1080) & cuadrado (1080x1080) | Post lanzamiento IG/FB/LinkedIn      | ⚠️ En producción · Marketing (Laura)                   | Equipo uniformado, iluminación natural, overlay con logo opcional.                    |
| Timelapse Amenity Refresh Express | Vertical 9:16 (1080x1920)                     | TikTok/Reels semana 1                | ⚠️ Programado para 24-oct · Contenido (Juan)           | Capturar restocking, staging, checklist en portal. Añadir textos clave (tiempo, KPI). |
| Mockup Portal Cliente             | 16:9                                          | Post LinkedIn + carruseles           | ✅ Capturado Plan B · Desarrollo (22-oct)              | Capturas high-res de dashboard (reservas, alertas, reportes).                         |
| Mockup Portal Cliente Mobile      | 4:5                                           | Mobile teaser, Stories               | ✅ Capturado Plan B · Desarrollo (22-oct)              | Mini app con acciones rápidas (solicitar turno, ver evidencias, chat).                |
| Testimonio Ana / Carlos / Valeria | Vertical 9:16 + foto retrato                  | Stories, Reels, Facebook testimonial | ✅ Ana listada · Falta Carlos/Valeria (team field ops) | Grabar audio claro, subtítulos en español neutro. Incluir título con rol y ubicación. |
| B-roll guardia nocturna           | Vertical 9:16                                 | Stories behind-the-scenes            | ⚠️ Pendiente sin fecha · Operaciones                   | Clips preparando carro nocturno, revisión checklist, salida a turno.                  |
| Amenity Refresh unboxing          | Vertical 9:16                                 | TikTok semana 2                      | ✅ Grabado 20-oct · Edición en curso (David)           | Mostrar welcome kit, amenities premium, close-up productos.                           |
| Deep Clean detailing              | Vertical & horizontal                         | Reel tip + blog                      | ⚠️ Falta locación confirmada · Marketing               | Enfocar en hotspots (campana cocina, baños, textiles).                                |
| KPI gráfico                       | 1080x1080 + 1920x1080                         | Post semana 4                        | ✅ Versión draft en Figma · Revisión Alberto           | Incluir datos: 97% satisfacción, <15 min alertas, +12K turnovers. Usa paleta oficial. |

## 2. Lineamientos generales

- Paleta: turquesa (#14b8a6), brisa deep (#041318), crema (#f8fafc), contrastes blancos.
- Tipografías recomendadas: DM Sans (titulares), Inter (cuerpo).
- Logos: vector en `docs/assets/branding/logos/` (mantener zona de protección).
- Uso de iconos: consistentemente outline (Similar a Heroicons).

## 3. Pipeline de producción (5 etapas - Industry Standard)

### Etapa 1: Pre-Producción

- Brief finalizado y aprobado
- Recursos asignados (equipo, locación, equipo)
- Timeline confirmado con hitos claros
- Legal/permisos gestionados (releases, autorizaciones)

### Etapa 2: Producción

- Captura de assets según especificaciones
- Control de calidad en sitio
- Backup de archivos inmediato
- Comunicación de progreso al equipo

### Etapa 3: Post-Producción

- Edición según brief y brand guidelines
- Exports en múltiples formatos (según uso)
- Versiones duplicadas (con/sin texto, música)
- Optimización de archivos (compresión sin pérdida de calidad)

### Etapa 4: Revisión y Aprobación

- Review interno (creativos + stakeholders)
- Ciclo de retroalimentación (máx. 48h turnaround)
- Sign-off final documentado
- Archivo de versiones

### Etapa 5: Distribución y Archivo

- Upload a carpeta compartida con nomenclatura estándar
- Actualización de este checklist
- Archivo de source files para reutilización
- Documentación de performance (post-launch)

**Tiempo promedio por asset:** Photo: 2-3 días | Video: 4-6 días | Design: 3-4 días

## 4. Pendientes / Próximos

- [ ] Fotografía profesional en Azure Villa (interior + exterior). _Owner: Marketing (Laura). Deadline sugerido: 25-oct._
- [ ] Captura de pantalla portal con nueva sección de auditoría RFID. _Owner: Diseño (Marta)._
- [ ] Video testimonial en inglés (subtítulos español) para LinkedIn Ads. _Owner: Field Ops + Marketing. Grabación a agendar._

> Mantén actualizado este checklist conforme se produzcan nuevos activos o se cierre material. Guarda versiones finales con naming `YYYYMMDD_asset-descripcion.ext`.
> **Acción inmediata:** Marketing debe confirmar la entrega de los assets marcados ⚠️ antes del 25-oct para desbloquear el reemplazo de placeholders en la landing (`apps/web/app/page.tsx`) y los reportes Lighthouse.

## 5. Nomenclatura de archivos (Industry Standard)

**Formato obligatorio:**

```
ProjectName_Asset-Description_Version_YYYYMMDD.ext
```

**Ejemplos:**

- ✅ `BrisaCubana_Skyline-Loft-Team_V001_20251025.jpg`
- ✅ `BrisaCubana_Amenity-Refresh-Timelapse_Text_V001_20251024.mp4`
- ❌ `foto final.jpg` (sin contexto, espacios)
- ❌ `deep_clean_v1.1.mp4` (underscores, versioning inconsistente)

**Reglas:**

1. **Hyphens, no spaces:** `Skyline-Loft` no `Skyline Loft`
2. **3-digit versions:** `V001, V002` no `V1, V1.1, V2`
3. **YYYYMMDD dates:** Sortable chronologically
4. **Descriptive but concise:** Balance between clarity and brevity
5. **No special characters:** Avoid &, ?, /, \*, #, etc.

**Estructura de carpetas:**

```
drive/marketing/2025-11-lanzamiento/
├── 01-raw-footage/        # Source files, unedited
├── 02-in-progress/        # Active projects
├── 03-final-assets/       # Delivery-ready
│   ├── photo/
│   ├── video/
│   └── design/
└── 04-archive/            # Historical versions
```

## 6. Issues de tracking

| Issue                                                                            | Asset                | Owner      | Status              | Link                   |
| -------------------------------------------------------------------------------- | -------------------- | ---------- | ------------------- | ---------------------- |
| [#57](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/57) | Foto Skyline Loft    | Laura      | 🟡 Pre-producción   | Workflows documentados |
| [#58](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/58) | Timelapse Amenity    | Juan       | 🟢 Scheduled 24-oct | Workflows documentados |
| [#59](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/59) | Mockup Portal RFID   | Marta      | 🟡 Post-producción  | Workflows documentados |
| [#60](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/60) | B-roll Guardia       | Operations | 🔴 Blocked          | Sin guardia/fecha      |
| [#61](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/61) | Reel Deep Clean      | Marketing  | 🔴 Blocked          | Sin locación           |
| [#64](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues/64) | **Tracking Maestro** | Alberto    | 🟢 Activo           | Dashboard consolidado  |

**Legend:** 🟢 On Track | 🟡 In Progress | 🔴 Blocked | ✅ Complete

---

**Última revisión:** 22-oct-2025 18:00 UTC
**Próxima revisión:** 25-oct-2025 (post-primera oleada de entregas)
