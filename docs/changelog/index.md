# Development Session Logs

**Nota:** Este directorio contiene registros detallados de sesiones de desarrollo internas. Para el **Changelog oficial de releases públicos**, ver [CHANGELOG.md](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/CHANGELOG.md) en el root del repositorio.

## Diferencia entre estos logs y CHANGELOG.md

| Archivo                          | Propósito                      | Audiencia                            | Formato                                         |
| -------------------------------- | ------------------------------ | ------------------------------------ | ----------------------------------------------- |
| **CHANGELOG.md** (root)          | Releases públicos con semver   | Usuarios, contribuidores externos    | [Keep a Changelog](https://keepachangelog.com/) |
| **docs/changelog/session-\*.md** | Logs de sesiones de desarrollo | Equipo interno, referencia histórica | Narrativo, detallado                            |

## Registros de Sesiones de Desarrollo

## 2025-09-28

- Documentación inicial del plan maestro (visión, mercado, arquitectura).

## 2025-09-29

- Añadidas secciones enterprise-ready (marketing, QA, riesgos, datos, soporte, partners, roadmap, decision log, pre-dev summary).
- Plantillas (entrevista, minutas, ADR) y herramientas (scripts, Makefile).
- Templates IA evaluation, insurance, seguridad química, CRM.

## 2025-09-30

- Activados canales de contacto de privacidad y seguridad (emails/telefonía) en la documentación.
- Añadido registro inicial de insights de investigación y checklist de vigilancia regulatoria.
- Integrados linters Markdown/ortografía en CI y guía de calidad editorial.
- Cartera de datos de mercado 2024 (turismo, salarios, competencia) consolidada con referencias verificadas y plan de actualización trimestral.
- Fixes de infraestructura: Node 24 en workflows, @types agregados, TODO comments actualizados, engines.node corregido.
- Autenticación API reforzada con contraseñas hasheadas, JWT (`JWT_SECRET`) y middleware RBAC en Hono.
- NextAuth v5 consume tokens firmados y expone dashboard con reservas próximas, catálogo de servicios y formulario de booking.
- Integración Stripe Checkout + webhook: sesiones de pago, actualización automática de estado y reintentos desde `/api/payments`.
- Panel staff/admin para gestionar estados de reservas (server actions + actualización en tiempo real).
- Script `pnpm stripe:listen` para pruebas locales del webhook y nuevas métricas/filters de conciliación en dashboard.
- Historial de conciliación con notas registradas por staff, enlaces directos a Stripe, export CSV `/api/audit/export` y alertas Slack (`/api/alerts/payment`, `payment_alerts`).
- Nuevas suites Vitest para servicios/usuarios/pagos con escenarios de autorización; cliente server-side centraliza llamadas protegidas.
- Documentación de setup y arquitectura actualizada (nuevos secretos, flujos de acceso) + changelog sincronizado.
