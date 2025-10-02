# Brisa Cubana Clean Intelligence — Documentation Hub

Bienvenido a la base de conocimiento oficial del proyecto. Aquí encontrarás guías técnicas, operativas y de negocio para mantener la plataforma alineada con los estándares actuales.

---

## Para developers

Documentación técnica y operativa:

- [Quickstart](for-developers/quickstart.md) — puesta en marcha en local.
- [Environment Variables](for-developers/environment-variables.md) — inventario completo para todos los entornos.
- [Deployment](for-developers/deployment.md) — Vercel, Railway y buenas prácticas de releases.
- [Testing](for-developers/testing.md) — cobertura, tipos de pruebas y pipelines.
- [Documentation Standards](development/documentation-standards.md) — reglas de estilo y veracidad.
- [Diagrams](for-developers/diagrams/README.md) — C4, flujos de reservas y rutas internas.

---

## Para negocio y operaciones

Recursos para la operación y el crecimiento:

- [Vision & Strategy](for-business/vision-strategy.md).
- [Market & Compliance](for-business/market-compliance.md).
- [Roadmap](for-business/roadmap.md).
- [SOPs](for-business/operations/sops/index.md) y manuales de soporte.
- [Risk Register](for-business/operations/risk/risk-register.md).

---

## Referencias y plantillas

- [Templates](reference/templates/index.md) — ADR, manuales, contratos, listas de chequeo.
- [Model Cards](for-developers/ai-ml/model-cards/README.md) — fichas de los modelos en desarrollo.
- [Sources](reference/sources.md) — bibliografía utilizada en investigación.

---

## Inicio rápido

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
docker compose up -d
pnpm db:setup
pnpm dev
```

Servicios locales:

- Web: http://localhost:3000
- API: http://localhost:3001
- MailHog: http://localhost:8026
- Docs: http://localhost:8000 (`make serve`)

---

## Información útil

| Dato                 | Valor                   |
| -------------------- | ----------------------- |
| Archivos Markdown    | 90                      |
| Stack                | MkDocs + Material theme |
| Búsqueda             | Integrada (lunr.js)     |
| Dark mode            | Disponible              |
| Última actualización | 5 de febrero de 2026    |

Las contribuciones a la documentación siguen el flujo descrito en [CONTRIBUTING.md](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/CONTRIBUTING.md). Utiliza PRs con revisión para mantener coherencia.

---

¿Dudas o sugerencias? Abre un issue en GitHub o escribe a `albertodimasmorazaldivar@gmail.com`.
