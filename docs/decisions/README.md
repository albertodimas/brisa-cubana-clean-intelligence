# Registro de decisiones (ADR)

Este directorio concentra los **Architectural Decision Records** del proyecto. Cada ADR documenta el contexto, la decisión tomada, las alternativas evaluadas y las implicaciones operativas.

## Cuándo crear un ADR

- Cambios que afecten la arquitectura global (frameworks, librerías core, patrones de componentes).
- Alteraciones en flujos críticos (autenticación, billing, observabilidad, seguridad).
- Migraciones que requieran coordinación entre equipos u operaciones (bases de datos, pipelines CI/CD, proveedores externos).

Si la decisión impacta solo a un equipo o feature aislado y su reversión es trivial, basta con un comentario detallado en el PR. De lo contrario, registra un ADR **antes** o en paralelo al desarrollo.

## Flujo

1. Copia la plantilla `templates/adr-template.md` y coloca el archivo en este directorio con la convención `YYYYMMDD-titulo-descriptivo.md`.
2. Completa cada sección (Contexto, Decisión, Consecuencias, Métricas de éxito). Usa lenguaje claro y enlaces a PRs, issues, diagramas o documentación externa.
3. Actualiza `docs/overview/status.md` con un resumen de la decisión y referencia al ADR.
4. Añade el ADR al PR correspondiente y asegúrate de que `pnpm docs:verify` pasa.

## Plantilla

```bash
docs/
  decisions/
    20251027-ejemplo-adr.md
    templates/
      adr-template.md
```

Puedes obtener un borrador rápido ejecutando:

```bash
cp docs/decisions/templates/adr-template.md docs/decisions/$(date +"%Y%m%d")-mi-decision.md
```

Revisa los ADR existentes (`tailwind-v4-plan.md`, `notifications-realtime-channel.md`, etc.) para ejemplos prácticos.
