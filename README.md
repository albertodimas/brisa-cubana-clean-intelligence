# Brisa Cubana Clean Intelligence

Plataforma integral de limpieza inteligente para Miami-Dade, diseñada con IA, automatización y experiencia premium, honrando raíces cubanas.

## Visión

Ser el sistema operativo inteligente que conecta clientes, cuadrillas y aliados para ofrecer servicios de limpieza personalizados, sostenibles y de calidad verificada en todo Miami.

## Estado actual

- [x] Investigación de mercado, regulación y stack tecnológico al día (28 sep 2025).
- [x] Plan maestro documentado en `docs/` (MkDocs + Material).
- [x] Entorno local configurado (nvm + pnpm, Bun, MkDocs en `.venv`).
- [x] **Infraestructura base completa**: API CRUD, Prisma, Docker Compose, CI/CD.
- [x] **Testing y QA**: Vitest configurado con coverage, Husky pre-commit hooks.
- [ ] Validación con clientes objetivo (entrevistas/encuestas).
- [ ] Despliegue a producción (Vercel + Railway/Fly.io).

## Inicio rápido

**Guía completa de setup**: Ver [SETUP.md](SETUP.md)

```bash
# Requisitos: Node 24, Docker
nvm use
pnpm install
cp .env.example .env
docker compose up -d
pnpm --filter=@brisa/api db:push
pnpm --filter=@brisa/api db:seed
pnpm dev
```

## Documentación

Este repositorio usa **MkDocs + Material**. Para visualizar la documentación como sitio estático:

```bash
make setup     # Crear venv e instalar dependencias
make serve     # Levantar en http://localhost:8000
```

> `mkdocs build` generará la carpeta `site/`. El workflow `documentation.yml` también construye la doc en CI.

## Estructura

```
.
├── apps/
│   ├── api/                   # API Hono (TS) lista para Bun/Node
│   └── web/                   # Next.js 15 (App Router + Turbopack)
├── packages/
│   └── ui/                    # Design system compartido (tsup + Vitest)
├── docs/                      # Base de conocimiento MkDocs + Material
├── scripts/
│   ├── setup_env.sh
│   └── mkdocs_serve.sh
├── .github/workflows/
│   └── documentation.yml
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── package.json
├── pnpm-lock.yaml
├── README.md
├── LICENSE
├── SECURITY.md
├── Makefile
├── mkdocs.yml
├── requirements.txt
└── ...
```

## Entorno tecnológico

- `nvm` 0.40.3 (ver `.nvmrc` → Node 24.9.0).
- `pnpm` 10.17.1 vía Corepack + Turborepo 2.5.8 para pipelines.
- `bun` 1.2.23 (servicios event-driven y pruebas cross-runtime).
- `python` 3.13.3 + `.venv` local con `mkdocs` 1.6.1 y `mkdocs-material` 9.6.20.

## Próximos pasos inmediatos

1. Registrar dominios/redes para la marca (pendiente).
2. Ejecutar entrevistas de validación (pendiente).
3. Kickoff Sprint 0 (ambientes, CI/CD, integraciones sandbox).
4. Mantener vigilancia regulatoria y tecnológica continua.

---

> Nota: todo el contenido se mantiene actualizado con las versiones más recientes de las dependencias (Bun 1.2.23, Next.js 15.5.4, React 19.1.1, Hono 4.9.9, Temporal 1.28.1, Redpanda 25.2.5, Redis 8.2.1, LangChain 0.3.35, MkDocs 1.6.1, etc.) y el contexto de Miami-Dade a septiembre de 2025.


## Automatización

Disponibles utilidades para ahorrar tiempo:

- `pnpm dev` / `pnpm build` / `pnpm lint`: ejecutan pipelines con Turborepo 2.5.8.
- `turbo.json`: define dependencias y caché incremental entre apps/paquetes.
- `scripts/setup_env.sh`: crea `.venv` e instala dependencias de documentación.
- `scripts/mkdocs_serve.sh`: levanta MkDocs en modo desarrollo.
- `Makefile`: wrappers para `pnpm dev`, setup de docs y limpieza.
- `.github/workflows/documentation.yml`: usa Node 24 + pnpm para lint + build de la doc.
- `apps/web`: landing Next.js 15 con componentes `@brisa/ui`, framer-motion y lucide-react.
- `packages/ui`: tokens de diseño compartidos (botones, badges, cards, métricas, secciones).

Ejemplo:

```bash
make setup
make serve
```


## Calidad documental

Antes de abrir un PR, ejecuta los linters para evitar sorpresas en CI:

```bash
pnpm install
pnpm lint          # Turbo (apps + paquetes) + markdownlint + cspell
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
