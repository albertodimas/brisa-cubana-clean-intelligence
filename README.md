# Brisa Cubana Clean Intelligence

Plataforma integral de limpieza inteligente para Miami-Dade, diseñada con IA, automatización y experiencia premium, honrando raíces cubanas.

## Visión

Ser el sistema operativo inteligente que conecta clientes, cuadrillas y aliados para ofrecer servicios de limpieza personalizados, sostenibles y de calidad verificada en todo Miami.

## Estado actual

- [x] Investigación de mercado, regulación y stack tecnológico al día (28 sep 2025).
- [x] Plan maestro documentado en `docs/` (MkDocs + Material).
- [x] Entorno local configurado (NVM/NPM, Bun, MkDocs en `.venv`).
- [ ] Sprint 0 (setup repos, CI/CD, infraestructura).
- [ ] Validación con clientes objetivo (entrevistas/encuestas).

## Documentación

Este repositorio usa **MkDocs + Material**. Para visualizar la documentación como sitio estático:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

> `mkdocs build` generará la carpeta `site/`. El workflow `documentation.yml` también construye la doc en CI.

## Estructura

```
.
├── README.md
├── LICENSE
├── SECURITY.md
├── requirements.txt
├── .gitignore
├── .github/workflows/documentation.yml
├── mkdocs.yml
├── docs/
│   ├── index.md
│   ├── 01-vision-estrategia.md
│   ├── 02-mercado-y-compliance.md
│   ├── 03-experiencia-y-diseno.md
│   ├── 04-arquitectura-y-stack.md
│   ├── 05-ia-y-automatizacion.md
│   ├── 06-integraciones-ecosistema.md
│   ├── 07-roadmap-y-operaciones.md
│   ├── checklist-pre-rollout.md
│   ├── changelog/
│   │   └── index.md
│   ├── insights/
│   │   └── index.md
│   ├── operations/
│   │   ├── index.md
│   │   ├── domain-and-branding.md
│   │   ├── interview-plan.md
│   │   ├── sprint0-plan.md
│   │   ├── pre-dev-summary.md
│   │   ├── product/
│   │   │   └── product-roadmap.md
│   │   ├── integrations/
│   │   │   └── sandbox-plan.md
│   │   ├── policies/
│   │   │   ├── index.md
│   │   │   ├── privacy-policy-draft.md
│   │   │   └── governance-ia-charter.md
│   │   ├── sops/
│   │   │   ├── index.md
│   │   │   ├── onboarding-staff.md
│   │   │   ├── inventory-management.md
│   │   │   ├── emergency-response.md
│   │   │   └── maintenance.md
│   │   ├── branding/
│   │   │   └── style-guide-outline.md
│   │   ├── finance/
│   │   │   └── financial-model-outline.md
│   │   ├── marketing/
│   │   │   └── gtm-plan.md
│   │   ├── qa/
│   │   │   └── testing-strategy.md
│   │   ├── risk/
│   │   │   └── risk-register.md
│   │   ├── partners/
│   │   │   └── partner-onboarding.md
│   │   ├── data/
│   │   │   └── data-analytics-plan.md
│   │   ├── support/
│   │   │   └── support-playbook.md
│   │   └── checklists/
│   │       ├── index.md
│   │       ├── sprint0-checklist.md
│   │       └── launch-checklist.md
│   └── resources/
│       └── templates/
│           ├── adr-template.md
│           ├── chemical-safety-guideline.md
│           ├── crm-integration-checklist.md
│           ├── ia-model-eval-template.md
│           ├── insurance-checklist.md
│           ├── interview-notes-template.md
│           └── meeting-minutes-template.md
└── scripts/
    ├── setup_env.sh
    └── mkdocs_serve.sh
```

## Entorno tecnológico

- `nvm` 0.40.3 (cargado desde `.bashrc`/`.profile`).
- `node` v24.9.0 (alias por defecto sugerido) / `npm` 11.6.1.
- `bun` v1.2.23.
- `python` 3.13.3 + `.venv` local con `mkdocs` 1.6.1 y `mkdocs-material` 9.6.20.

## Próximos pasos inmediatos

1. Registrar dominios/redes para la marca (pendiente).
2. Ejecutar entrevistas de validación (pendiente).
3. Kickoff Sprint 0 (ambientes, CI/CD, integraciones sandbox).
4. Mantener vigilancia regulatoria y tecnológica continua.

---

> Nota: todo el contenido se mantiene actualizado con las versiones más recientes de las dependencias (Bun 1.2.23, Remix 2.17.1, React 19.1.1, Temporal 1.28.1, Redis 8.2, LangChain 0.3.27, MkDocs 1.6.1, etc.) y el contexto de Miami-Dade a septiembre de 2025.


## Automatización

Disponibles utilidades para ahorrar tiempo:

- `scripts/setup_env.sh`: crea `.venv` e instala dependencias de documentación.
- `scripts/mkdocs_serve.sh`: levanta MkDocs en modo desarrollo.
- `Makefile`: targets `setup`, `serve`, `build`, `clean`.
- `.github/workflows/documentation.yml`: ejecuta `markdownlint`, `cspell` y compila la doc en cada PR/push.

Ejemplo:

```bash
make setup
make serve
```


## Calidad documental

Antes de abrir un PR, ejecuta los linters para evitar sorpresas en CI:

```bash
npm install
npm run lint
# o
make lint
```


## Documentación adicional

- Plantillas (entrevistas, minutas, ADR, IA, seguros, química, CRM) en `docs/resources/templates/`.
- Changelog en `docs/changelog/index.md` para registrar cambios futuros.
- Insights de investigación centralizados en `docs/insights/`.
- Datos de mercado 2024 (turismo, salarios, competencia) en `docs/resources/market/`.


## Gestión del proyecto

- Issue tracking sugerido: Jira / Linear.
- Estructura de historias: [Como <rol> quiero <acción> para <beneficio>].
- Vincular tareas con docs correspondientes (ej. entrevistas → interview-plan).
