# Brisa Cubana Clean Intelligence — Documentation Hub

Bienvenido a la base de conocimiento oficial del proyecto. Aquí se consolidan los manuales técnicos, las guías operativas y el material de negocio que acompañan la plataforma.

## Estructura de la documentación

- **Developer Guides:** Onboarding técnico, infraestructura local, despliegues y estándares de calidad.
- **Business & Operations:** Estrategia comercial, SOPs, gobierno operativo y gestión de riesgos.
- **Reference Library:** Plantillas, fuentes de investigación y artefactos reutilizables.

## Developer Guides

- [Quickstart](for-developers/quickstart.md): Puesta en marcha detallada del entorno local.
- [Environment Variables](for-developers/environment-variables.md): Inventario y recomendaciones por entorno.
- [Deployment](for-developers/deployment.md): Procedimientos para Vercel, Railway y Fly.io.
- [Architecture](for-developers/architecture.md): Principios de diseño y vistas de alto nivel.
- [Testing](for-developers/testing.md): Tipos de pruebas, cobertura y pipelines.
- [Documentation Standards](development/documentation-standards.md): Criterios de estilo, veracidad y mantenimiento.
- [Delivery Plan](development/delivery-plan.md): Release train, ventanas de despliegue y RACI.
- [Architecture Diagrams](for-developers/diagrams/README.md): Modelos C4, flujos de reservas y rutas internas.

## Business & Operations

- [Vision & Strategy](for-business/vision-strategy.md): Narrativa de producto, posicionamiento y OKRs.
- [Market & Compliance](for-business/market-compliance.md): Regulaciones relevantes y análisis competitivo.
- [Roadmap](for-business/roadmap.md): Hitos por trimestre y dependencias críticas.
- [SOPs](for-business/operations/sops/index.md): Procedimientos operativos estándar y checklists.
- [Runbooks](operations/runbooks/README.md): Protocolos de go-live, rollback e incidentes.
- [Risk Register](for-business/operations/risk/risk-register.md): Riesgos identificados, probabilidad e impacto.

## Reference Library

- [Templates](reference/templates/index.md): ADRs, manuales, contratos y listas de control.
- [Model Cards](for-developers/ai-ml/model-cards/README.md): Estado de los modelos de IA en desarrollo.
- [Sources](reference/sources.md): Bibliografía y fuentes consultadas en la investigación.

## Inicio rápido (resumen)

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
docker compose up -d
pnpm db:setup
pnpm dev
```

Servicios locales relevantes:

- Web: http://localhost:3000
- API: http://localhost:3001
- MailHog: http://localhost:8026
- Documentación: http://localhost:8000 (`make serve`)

## Métricas de la documentación

| Dato                 | Valor                   |
| -------------------- | ----------------------- |
| Archivos Markdown    | 120 (2025-10-04)        |
| Stack                | MkDocs 1.6.1 + Material |
| Búsqueda             | Integrada (lunr + ES)   |
| Modo oscuro          | Disponible              |
| Última actualización | 2025-10-03              |

Las contribuciones siguen el flujo descrito en [CONTRIBUTING.md](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/CONTRIBUTING.md). Cada cambio debe plantearse mediante Pull Request y revisión cruzada.

## Contacto

¿Dudas o sugerencias? Abre un issue en GitHub o escribe a `albertodimasmorazaldivar@gmail.com`.
