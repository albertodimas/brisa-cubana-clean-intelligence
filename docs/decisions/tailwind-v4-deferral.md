# Decisión: Diferir Tailwind v4 hasta Q1 2026

**Fecha:** 14 de octubre de 2025  
**Estado:** DIFERIDA  
**Contexto:** Dependabot propuso Tailwind 3.4.18 → 4.1.14 en PR #34 (cerrado).

## Decisión

Diferir la actualización a Tailwind CSS v4 hasta Q1 2026.

## Razones

1. **Reescritura completa del motor**
   - Nuevo sistema de configuración basado en CSS.
   - Breaking changes masivos en la API.
   - Requiere refactor de más de 100 componentes.
2. **Sin beneficio funcional inmediato**
   - Tailwind v3.4.18 funciona correctamente en la web actual.
   - No hay funcionalidades bloqueantes exclusivas de v4.
   - La experiencia de negocio no se ve afectada.
3. **Alto riesgo de regresiones visuales**
   - El pipeline CI no detecta regresiones de estilo.
   - Requiere QA manual extenso.
   - Posible inconsistencia visual en layouts productivos.
4. **ROI bajo en este momento**
   - Estimado de esfuerzo: 4-8 horas de ingeniería.
   - Riesgo: ALTO.
   - Beneficio a corto plazo: BAJO.
   - Mejor dedicar recursos a funcionalidades de producto.

## Plan Futuro

1. **Q1 2026:** Revisar madurez de Tailwind v4
   - Verificar adopción y estabilidad en la comunidad.
   - Revisar postmortems de early adopters.
   - Identificar breaking changes relevantes.
2. **Asignar sprint dedicado** (1 semana)
   - Investigación: 4 horas.
   - Migración: 8 horas.
   - Testing manual: 4 horas.
   - Contingencia: 4 horas.
3. **Checklist de ejecución**
   - [ ] Crear rama `upgrade/tailwind-v4`.
   - [ ] Actualizar dependencia y configuración basada en CSS.
   - [ ] Migrar 100+ componentes al nuevo sistema de utilidades.
   - [ ] Ejecutar testing visual y QA manual completo.
   - [ ] Verificar despliegue en ambiente preview.
   - [ ] Validar con stakeholders antes del merge.

## Alternativas Consideradas

- **Migrar ahora:** Rechazado por alto riesgo y bajo beneficio.
- **Migrar gradualmente:** Tailwind v4 no soporta coexistencia con v3.
- **No migrar nunca:** No recomendado, la v3 será deprecada eventualmente.

## Seguimiento

- Crear Issue #40 al retomar la migración en Q1 2026.
- Revisar esta decisión en la planificación trimestral de Q1 2026.

---

**Última revisión:** 14 de octubre de 2025
