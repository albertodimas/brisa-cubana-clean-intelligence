# Documentation Standards

Norma para mantener la documentación sincronizada con el estado real del proyecto.

## Principios

1. **Fuente única de verdad**: README, reportes de producción y docs de MkDocs deben reflejar la última evidencia verificada (tests, builds, despliegues).
2. **Actualización simultánea**: cualquier cambio funcional requiere actualizar código, tests y documentación relevante en el mismo PR.
3. **Revisión automática**: `pnpm docs:build` es obligatorio antes de merge a `main` o `develop` (ver sección _Checklist_).

## Checklist antes de merge

| Paso | Comando / acción                                           | Resultado esperado                                                              |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1    | `pnpm lint`                                                | Sin errores ni warnings                                                         |
| 2    | `pnpm typecheck`                                           | Sin errores                                                                     |
| 3    | `pnpm --filter=@brisa/api exec vitest run --reporter=json` | 171/171 tests OK                                                                |
| 4    | `pnpm test:e2e`                                            | 15/15 escenarios OK (usar datos fake)                                           |
| 5    | `pnpm docs:build`                                          | Sin warnings estructurales (excepto enlaces intencionalmente pendientes)        |
| 6    | Actualizar tablas de estado                                | `README.md`, `PRODUCTION_READINESS_REPORT.md`, `PRODUCTION_DEPLOYMENT_GUIDE.md` |
| 7    | Registrar cambios mayor > menor                            | `CHANGELOG.md` + etiqueta Git si aplica                                         |

## Convenciones de Estilo

- **Formato**: Markdown (`.md`) con títulos `h2` en español, emojis opcionales para secciones.
- **Enlaces**: usar rutas relativas que apunten a archivos reales (`../for-developers/README.md`). Evitar enlaces a carpetas (`dir/`).
- **Fechas**: formato `YYYY-MM-DD` (ej. `2025-10-03`).
- **Idiomas**: Español como idioma principal. Se permite Inglés para nombres propios o citas de documentación externa.
- **Tablas**: sin celdas vacías; siempre incluir encabezado.
- **Código**: usar bloques de código con lenguaje definido (por ejemplo, abrir con tres backticks + `bash` y cerrar con tres backticks).

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
