# Documentation Standards

Norma para mantener la documentación sincronizada con el estado real del proyecto.

## Principios

1. **Fuente única de verdad**: README, reportes de producción y docs de MkDocs deben reflejar la última evidencia verificada (tests, builds, despliegues).
2. **Actualización simultánea**: cualquier cambio funcional requiere actualizar código, tests y documentación relevante en el mismo PR.
3. **Revisión automática**: `pnpm docs:build` es obligatorio antes de merge a `main` o `develop` (ver sección _Checklist_).

## Checklist antes de merge

| Paso | Comando / acción                | Resultado esperado                                                       |
| ---- | ------------------------------- | ------------------------------------------------------------------------ |
| 1    | `pnpm lint`                     | Sin errores ni warnings                                                  |
| 2    | `pnpm typecheck`                | Sin errores                                                              |
| 3    | `pnpm test`                     | 865/865 tests OK (850 API + 10 Web + 5 UI)                               |
| 4    | `pnpm test:e2e` (opcional)      | 6 suites E2E con Playwright                                              |
| 5    | `pnpm docs:build`               | Sin warnings estructurales (excepto enlaces intencionalmente pendientes) |
| 6    | Actualizar tablas de estado     | `README.md` y `docs/operations/production/CURRENT_STATUS.md`             |
| 7    | Registrar cambios mayor > menor | `CHANGELOG.md` + etiqueta Git si aplica                                  |

## Guía de Estilo (Markdown + Voz)

Adoptamos los principios del [Google Markdown Style Guide](https://github.com/google/styleguide/blob/gh-pages/docguide/style.md):

- **Legibilidad del source**: evita HTML embebido salvo casos excepcionales.
- **Encabezados escalonados**: un solo `#` por documento y jerarquía secuencial (`##`, `###`, ...).
- **Listas concisas**: frases paralelas y punto final solo si la oración es completa.
- **Tablas con encabezados claros** y sin celdas vacías; utiliza `N/A` cuando aplique.
- **Bloques de código con lenguaje declarado** (por ejemplo, ``bash`).

Voz y tono:

- Usa segunda persona (“ejecuta”, “valida”) y voz activa.
- Evita regionalismos y tecnicismos innecesarios (“re-introducir” → “volver a configurar”).
- Indica contexto y resultado esperado en cada paso (“Ejecuta X para obtener Y”).

Idiomas y formato:

- Español como idioma principal; reserva términos en inglés para APIs, librerías o citas.
- Fechas en formato ISO (`YYYY-MM-DD`).
- Enlaces relativos a archivos concretos (`../for-developers/README.md`) y no a carpetas.

## Workflow de actualización

1. Ejecutar comandos de verificación (tabla anterior).
2. Actualizar docs relevantes:
   - Estado general (`README.md` → sección “Estado del Proyecto”).
   - Reportes (`PRODUCTION_READINESS_REPORT.md`, `PRODUCTION_AUDIT_REPORT.md`).
   - Guías afectadas (deployment, testing, runbooks, etc.).
3. Citar fuentes externas cuando se importen buenas prácticas. Ejemplo: “Según [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)…”
4. Correr `pnpm docs:build` y revisar advertencias
   - El build actual (2025-10-03) aún reporta enlaces faltantes en `docs/index.md` → usar esta guía como referencia para corregirlos.
5. Adjuntar salida relevante en el PR (logs de tests, build, docs).

## Versionado y despliegue de documentación

- Utilizamos [mike](https://github.com/jimporter/mike) para gestionar versiones de documentación. Versiona al menos cada release mayor o cuando la API cambie.
- Flujo recomendado:
  1. Instala dependencias (`pip install -r requirements.txt`).
  2. Genera versión: `mike deploy <version> latest` (ej. `mike deploy 1.0 latest`).
  3. Etiqueta como predeterminada: `mike set-default latest`.
  4. Publica en GitHub Pages: `mike publish` o `mkdocs gh-deploy` para entornos puntuales.
- Mantén historial en `gh-pages` y documenta cambios en `docs/operations/production/PRODUCTION_DEPLOYMENT_GUIDE.md`.
- Ejecuta `pnpm docs:api` siempre que se modifique `apps/api/API_ENDPOINTS.md` para sincronizar la referencia publicada.

Calendario sugerido:

| Frecuencia                  | Actividad                                                                           | Responsable            |
| --------------------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| Mensual (inicio 2025-11-01) | Revisar advertencias de `pnpm docs:build` y backlog de issues de documentación      | Tech Writing + SRE     |
| Trimestral                  | Liberar versión con `mike deploy <YYYY.Q>` y actualizar `README.md`/`docs/index.md` | Plataforma             |
| Post-release                | Ejecutar check de calidad funcional (precisión, completitud) y registrar hallazgos  | Equipo cross-funcional |

## Auditorías periódicas

- **Semanal**: verificar que la fecha “Last Updated” de los principales docs esté dentro de la semana corriente si hubo cambios.
- **Mensual**: ejecutar `pnpm docs:build` y revisar la lista completa de advertencias, creando issues para cada incidencia.
- **Trimestral**: revisar `mkdocs.yml` y la navegación para garantizar que todas las rutas existen y remover secciones obsoletas.

## Herramientas recomendadas

- `markdownlint` y `cspell` (ya configurados en `pnpm lint`).
- Extensión VS Code “Markdown All in One” para previsualizar.
- `mkdocs serve` para iterar sobre la documentación en caliente.

---

**Última actualización:** 2025-10-03
