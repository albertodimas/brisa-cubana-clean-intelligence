# Brisa OS · Brisa Cubana Clean Intelligence

[![CI (Main Branch)](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/ci.yml?label=CI&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/ci.yml)
[![Nightly E2E](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/nightly.yml?label=Nightly%20E2E&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/nightly.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/codeql.yml?label=CodeQL&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/codeql.yml)

Monorepo (pnpm + Turborepo) del nuevo **Brisa OS**: el software asequible que digitaliza empresas de limpieza y turnovers con checklists hoteleros, evidencia automática y portal cliente white‑label. Incluye API Hono + Prisma (`apps/api`) y frontend Next.js 16 (`apps/web`), desplegado en `brisacubanacleanintelligence.com`.

> Visión completa, planes y roadmap: [`docs/product/saas-vision.md`](docs/product/saas-vision.md). Toda la documentación futura debe alinearse con ese archivo.

---

## Brisa OS en una frase

> “Sistema operativo para empresas de limpieza premium: checklists listos, fotos y firmas, portal cliente con tu marca y automatizaciones IA, todo desde USD 99/mes.”

### Problemas que resolvemos

- Evidencia dispersa (WhatsApp, papel) → centralizamos fotos, checklists y firmas por servicio.
- Clientes ciegos → portal white‑label con timeline, alertas y aprobaciones.
- Operación manual → calendario, inventario/restocks y tickets en un solo lugar.
- Falta de diferenciación → procesos hoteleros + reportes profesionales generan confianza.

### Diferenciadores clave

1. Plantillas basadas en 12K+ servicios reales (turnover, deep clean, staging, mantenimiento).
2. Evidencia premium (timeline con fotos, firmas y métricas SLA).
3. Inventario/restocks + alertas multicanal (email, Slack, WhatsApp Business).
4. IA integrada (resúmenes automáticos, detección de incidencias, recomendaciones).
5. Precios accesibles con onboarding guiado para empresas que nunca tuvieron software.

### Planes de referencia

| Plan        | Precio (mensual) | Para quién       | Incluye                                                                                            |
| ----------- | ---------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| **Starter** | USD 99           | 1‑5 propiedades  | Checklists premium, fotos y reportes básicos, portal estándar, 1 integración PMS.                  |
| **Growth**  | USD 249          | 5‑25 propiedades | Portal white‑label, inventario/restocks, alertas multicanal, IA de resúmenes, soporte prioritario. |
| **Scale**   | USD 499 base     | 25+ propiedades  | Multi-tenant, dashboards financieros, API/webhooks, IA avanzada, success manager.                  |
| **Add-ons** | Según uso        | Cualquier plan   | Usuarios extra, integraciones personalizadas, consultoría/onboarding asistido, branding completo.  |

---

## Estado del proyecto

- Release estable actual: `v0.4.2`. La transición a SaaS quedará registrada a partir de `v0.5.0`.
- Deploys automatizados (web/API) en Vercel → `https://brisacubanacleanintelligence.com` y `https://api.brisacubanacleanintelligence.com`.
- Roadmap, riesgos y planes activos: [`docs/overview/status.md`](docs/overview/status.md) y [`docs/product/saas-vision.md`](docs/product/saas-vision.md).
- Histórico previo (modelo servicios) archivado en [`docs/archive/`](docs/archive/); no modificar sin referencia.

---

## Desarrollo / Arranque rápido

```bash
pnpm install
docker compose up -d
pnpm db:push && pnpm db:seed
pnpm dev          # web:3000, api:3001
```

- **Tenant base**: define el slug por defecto tanto en la API (`DEFAULT_TENANT_SLUG`) como en la web (`NEXT_PUBLIC_DEFAULT_TENANT_SLUG`). Para el entorno actual seguimos usando `brisa-cubana`, pero ya puedes declarar otros slugs por empresa.
- **Login multi-tenant**: el formulario solicita el `Código de tenant` y se lo pasa a NextAuth ⇒ el token de sesión ahora incluye `tenantId/tenantSlug` y todas las llamadas autenticadas quedan scopeadas.
- Usuarios demo: `admin@brisacubanacleanintelligence.com / Brisa123!`, `operaciones@… / Brisa123!`, `cliente@… / Brisa123!`.
- Variantes, scripts y troubleshooting: [Guía completa](docs/development/guides/quickstart.md).
- Sincronización de variables: [docs/operations/env-sync.md](docs/operations/env-sync.md).

---

## Sistema de documentación (actualizado)

| Dominio           | Punto de entrada                                                                                                                                                                               | Qué cubre                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Visión SaaS       | [`docs/product/saas-vision.md`](docs/product/saas-vision.md)                                                                                                                                   | Cliente ideal, propuesta de valor, planes, roadmap y tareas pendientes.               |
| Manual general    | [`docs/README.md`](docs/README.md)                                                                                                                                                             | Política de documentación, inventario de carpetas activas y scripts de mantenimiento. |
| Estado & roadmap  | [`docs/overview/status.md`](docs/overview/status.md) · [`docs/overview/recovery-plan.md`](docs/overview/recovery-plan.md)                                                                      | Salud operativa, riesgos y plan integral por sprint.                                  |
| Desarrollo & QA   | [`docs/development/guides/quickstart.md`](docs/development/guides/quickstart.md) · [`docs/development/qa/e2e-strategy.md`](docs/development/qa/e2e-strategy.md)                                | Setup local, portal cliente, estrategia de pruebas y lineamientos UI/UX.              |
| Operaciones       | [`docs/operations/deployment.md`](docs/operations/deployment.md) · [`docs/operations/security.md`](docs/operations/security.md) · [`docs/operations/env-sync.md`](docs/operations/env-sync.md) | Despliegues, seguridad, env-sync, observabilidad y runbooks.                          |
| Referencia formal | [`docs/reference/api-reference.md`](docs/reference/api-reference.md) · [`docs/reference/openapi.yaml`](docs/reference/openapi.yaml)                                                            | OpenAPI actualizada y contratos compartidos.                                          |
| Documentos raíz   | [`CHANGELOG.md`](CHANGELOG.md) · [`SECURITY.md`](SECURITY.md)                                                                                                                                  | Cambios visibles para usuarios y política de divulgación responsable.                 |

> **Regla:** toda entrega debe explicitar qué documentos tocó y ejecutar `pnpm docs:verify`. El CI bloquea merges si el árbol de documentación queda incongruente.

---

## Contribuciones / Buenas prácticas

1. Toda tarea debe enlazar el objetivo descrito en `docs/product/saas-vision.md` (ej. “Landing SaaS”, “Multi-tenant API”, “IA resúmenes”).
2. Ejecuta la batería mínima: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e:critical`.
3. Si modificas docs, corre `pnpm docs:verify` y actualiza este README cuando cambie el público objetivo.
4. Usa el PR para explicar qué documentos cambiaste y cómo validar la feature (demo, captura MCP, etc.).

Guías QA/regresión: [`docs/development/qa/e2e-strategy.md`](docs/development/qa/e2e-strategy.md) y [`docs/development/qa/regression-checklist.md`](docs/development/qa/regression-checklist.md).

---

## Seguridad y soporte

- Política de divulgación: [`SECURITY.md`](SECURITY.md)
- Reportes urgentes: `seguridad@brisacubanacleanintelligence.com`
- Operaciones: `operaciones@brisacubanacleanintelligence.com`

---

Hecho en Miami. Mantén CI verde, evita regresiones y documenta cada cambio para que Brisa OS llegue a todas las empresas de limpieza. 💚
