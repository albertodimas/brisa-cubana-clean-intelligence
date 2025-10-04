# 💼 Playbook unificado: cómo trabajar profesionalmente con un **asistente de código** en un repo

> Guía integral para convertir a tu asistente en un **coequiper de ingeniería**: planifica, investiga en Internet, ejecuta, prueba, documenta y entrega con estándares modernos.

---

## TL;DR

1. **Contexto primero** (issue claro, alcance, criterios de aceptación, rutas).
2. **Plan breve → diffs pequeños y aplicables** (sin razonamiento interno).
3. **Investigar en la web y citar fuentes** para decisiones técnicas y breaking changes.
4. **Tests + tipos + lint + seguridad** antes del PR.
5. **PR atómico con checklist** y autorevisión del asistente.

---

## 1) Principios de colaboración

- **Explícito > implícito**: el asistente necesita _rutas de archivos_ y _contratos_ concretos.
- **Iteración corta**: cambios pequeños, reversibles, con cobertura de pruebas.
- **Investigación activa**: verificar en documentación oficial, notas de versión y fuentes confiables.
- **Calidad por defecto**: tests y docs forman parte del “done”, no extras.
- **Privacidad y licencias**: nada de secretos en prompts/commits; respetar licencias OSS.
- **Transparencia**: explicar decisiones **a alto nivel** (no mostrar razonamiento interno paso a paso).

---

## 2) Prerrequisitos del repo

- **Estructura y documentación**
  - `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `docs/`.
- **Calidad automática**
  - Lint/format (ESLint/Prettier o Ruff/Black), _type-checking_ (TypeScript/pyright/mypy), tests (unit + integración, cobertura objetivo ≥80% si el proyecto lo permite).
  - Hooks: `pre-commit` o `husky + lint-staged`.
- **Seguridad**
  - `.gitignore` + detector de secretos (gitleaks/trufflehog).
  - `.env.example` y _mocks_ de secretos en tests.
- **CI/CD**
  - Pipeline que ejecute lint, tipos, tests, build y, si aplica, análisis SAST/Dependabot.

---

## 3) Modo Investigación en Internet (🔍 imprescindible)

- **Cuándo investigar**
  - Al evaluar librerías o versiones, al estimar impactos de breaking changes, al justificar patrones, al comparar enfoques.
- **Cómo investigar**
  1. Priorizar **documentación oficial** y **notas de versión**.
  2. Contrastar con 2–3 fuentes secundarias (issues relevantes, artículos técnicos, benchmarks serios).
  3. Extraer **hechos verificables** (versiones, flags, comportamientos) y **citar** con enlaces.
  4. Indicar **fecha de consulta** y versión evaluada cuando sea sensible.
- **Entrega de investigación**
  - En el PR/issue: sección “Referencias” con enlaces y una conclusión breve (por qué se eligió X sobre Y).
- **Límites**
  - No copiar código de fuentes con licencia incompatible.
  - No pegar contenidos largos protegidos por copyright.

---

## 4) SOP — Flujo estándar de trabajo

1. **Kickoff de tarea**
   - Issue con: objetivo, criterios de aceptación (DoD), límites de alcance, performance/seguridad, rutas a tocar, entorno de ejecución.
2. **Auditoría de contexto (por el asistente)**
   - Leer `README`, `ARCHITECTURE`, `package.json/pyproject`, scripts, `docs/`, `.env.example`.
   - Resultado: **mapa de impacto** (módulos/archivos) + **plan de 5–8 pasos**.
3. **Plan → Diff**
   - Proponer **diff unificado** aplicable, en bloques pequeños, con justificación de diseño **a alto nivel**.
4. **Pruebas y verificación local**
   - Añadir/actualizar tests (unit/integración), fixtures/mocks. Correr lint, tipos, tests, cobertura.
5. **Documentación**
   - Actualizar `docs/` y `CHANGELOG.md`. Añadir ejemplos de uso/migración si aplica.
6. **PR**
   - Pequeño, bien descrito, con checklist y evidencia (logs/capturas). Enlazar referencias externas.
7. **Autoreview del asistente**
   - Pasar el **rubric** (ver §12). Señalar riesgos/regresiones y mitigaciones.
8. **Merge o iteración**
   - CI verde + revisión humana → merge. Si no, iterar sobre el mismo PR.

---

## 5) Plantilla para encargar tareas al asistente (pegar en issue/chat)

```
Rol: Asistente de ingeniería que entrega código listo para producción.

Objetivo:
- [describe el objetivo en 1–2 líneas]

Criterios de aceptación (DoD):
- [ ] Comportamiento esperado:
- [ ] Pruebas:
- [ ] Lint/Tipos:
- [ ] Docs/Changelog:
- [ ] Perf/Seguridad (si aplica):

Contexto del repo:
- Stack: [p.ej. Node 20 + TS / Python 3.11 + FastAPI / etc.]
- Entradas clave a leer: [README.md, ARCHITECTURE.md, package.json o pyproject.toml, /src/**, /tests/**]
- Scripts útiles: [npm test, npm run lint, make build, etc.]
- Entorno: [local, docker, vercel, etc.]

Alcance y límites:
- Enfocar en [rutas/módulos]
- No tocar [rutas/módulos]
- Mantener compatibilidad [semántica/API]

Investigación web:
- Buscar y citar documentación oficial/notas de versión para [tema].
- Incluir 2–3 fuentes adicionales y fecha de consulta.

Entrega:
1) Plan de alto nivel (sin razonamiento interno).
2) Diffs pequeños y aplicables.
3) Pruebas y datos de prueba.
4) Docs y Changelog.
5) Mensaje de commit y texto de PR propuestos.   6) Recetas rápidas por tipo de tarea
A) Auditoría inicial del repo

Entrega: informe breve con mapa de directorios, calidad (lint/tipos/tests/CI), dependencias riesgosas/desactualizadas, y acciones priorizadas (impacto vs esfuerzo).

B) Nueva feature

Partir de contrato/DTO/validaciones.

Escribir tests que describan la API/UX.

Diffs por capas (router → servicio → repositorio), con feature flags si aplica.

C) Bugfix

Reproducir y escribir un test que falle.

Aplicar fix mínimo, agregar test de regresión y explicar root cause a alto nivel.

D) Refactor seguro

Mantener contrato público.

Añadir tests de caracterización si faltan.

Cambios orientados a cohesión, desacoplo y simplicidad.

E) Seguridad

Revisar entrada/validación, secretos, permisos, SSRF/SQLi/XSS, logging de PII.

Añadir pruebas de payloads maliciosos y hardening (cabeceras, límites, timeouts, rate limit).

F) Upgrade de dependencias

Leer notas de versión, listar breaking changes, plan de migración, pruebas y roll-back plan.

G) Performance/observabilidad

Definir SLOs (latencia, throughput, p95/p99).

Añadir métricas/tracing y tests de carga donde importe.

7) Definition of Done (DoD) y Quality Gates

Código

 Cambios atómicos, legibles, sin dead code.

 Sin secretos/PII; variables en .env.example.

Pruebas

 Unitarias e integración; rutas felices y de error.

 Cobertura ≥ objetivo del repo (si es razonable).

Tipos y Lint

 Type-check sin any/ignore injustificados.

 Lint y format sin warnings.

Docs

 docs/ y README actualizados; ejemplos reproducibles.

 CHANGELOG.md con entrada SemVer.

CI/CD

 Pipelines verdes (lint, tipos, tests, build, seguridad).

 PR razonable (< ~400 líneas netas cuando sea posible).

Riesgos

 Notas de performance, seguridad y compatibilidad.

8) Estándares de Git y PR

Conventional Commits

feat(scope): descripción corta en imperativo
fix(scope): corrige X
docs(scope): actualiza Y
refactor(scope): sin cambiar comportamiento
test(scope): añade/ajusta tests
chore(scope): tareas internas


Plantilla de PR

## Qué cambia
- Breve descripción

## Por qué
- Contexto/objetivo y links al issue

## Cómo se probó
- Comandos, logs, capturas
- Resultados de cobertura (si aplica)

## Riesgos y mitigaciones
- Rendimiento, seguridad, compatibilidad

## Referencias (investigación web)
- [Doc oficial ...]
- [Notas de versión ...]
- [Artículo/issue ...] (fecha de consulta: YYYY‑MM‑DD)

## Checklist
- [ ] Lint
- [ ] Tipos
- [ ] Tests (unit/integración)
- [ ] Docs + Changelog

9) Seguridad y privacidad (reglas duras)

No compartir ni commitear tokens/secretos.

Sanitizar/validar toda entrada de usuario.

Logging sin PII (o ofuscado y con retención limitada).

Revisar licencias de nuevas dependencias.

Deshabilitar trazas/errores verbosos en producción.

Revisar CORS, límites de tamaño, rate limiting y timeouts.

10) Archivos recomendados en el repo
ARCHITECTURE.md        → capas, diagramas, decisiones
CONTRIBUTING.md        → setup, estilos, hooks, CI
SECURITY.md            → reporte de vulnerabilidades, políticas
CODESTYLE.md           → nombres, patrones, anti‑patrones
docs/                  → guías de usuario/desarrollador
CHANGELOG.md           → SemVer con enlaces a PRs

11) Comandos/alias útiles (ejemplos)

JavaScript/TypeScript

npm run lint && npm run typecheck && npm test


Python

ruff check . && mypy . && pytest -q


Pre-commit (multi-lenguaje)

pre-commit run --all-files


Cobertura

npm run test:coverage   # o pytest --cov

12) Rubric de autorevisión (pásalo antes de abrir PR)

 ¿Cumple todos los criterios de aceptación?

 ¿Hay tests suficientes + cobertura aceptable?

 ¿Se manejan errores y mensajes claros?

 ¿Se respetan contratos/tipos?

 ¿Docs y changelog están al día?

 ¿Impacto en performance (complejidad, N+1, I/O bloqueante)?

 ¿Riesgos de seguridad tratados?

 ¿El diff es atómico y legible?

 ¿La investigación web está citada y es reciente?

13) Snippets de soporte

pre-commit (ejemplo cross‑stack)

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: vX.Y.Z
    hooks: [ { id: prettier } ]
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: vX.Y.Z
    hooks:
      - id: eslint
        args: ["--max-warnings=0"]
  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: vX.Y.Z
    hooks: [ { id: ruff } ]
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: vX.Y.Z
    hooks: [ { id: mypy } ]
  - repo: https://github.com/gitleaks/gitleaks
    rev: vX.Y.Z
    hooks: [ { id: gitleaks } ]


Alternativa JS (husky + lint-staged)

npx husky init
npm i -D lint-staged

// package.json
{
  "lint-staged": {
    "*.{js,ts,tsx,css,md,json}": [
      "prettier --write"
    ],
    "*.{js,ts,tsx}": [
      "eslint --max-warnings=0"
    ]
  }
}


CHANGELOG.md (SemVer)

## [1.4.0] - YYYY-MM-DD
### Added
- GET /v1/reports/:id con control de permisos (#123)

### Fixed
- Evita N+1 en ReportsService.findById (#124)

14) Cómo pedir diffs, pruebas y docs (mini‑recetas)

Diff aplicable: “Entrega unified diff en bloques ≤200 líneas; indica archivo y contexto; evita cambios colaterales.”

Tests primero: “Empieza por un test que falle; luego el fix; finalmente el test de regresión.”

Docs: “Actualiza docs/ + ejemplo runnable; enlaza desde README.”

Commits: “Propón un Conventional Commit con scope y descripción imperativa (≤72 chars).”

Sin razonamiento interno: “Explica decisiones a alto nivel; no muestres pasos internos, sólo conclusiones.”

15) Ejemplo de sesión completa (compacto)
Tarea: feat – añadir endpoint GET /v1/reports/:id

DoD:
- [ ] 200 con JSON { id, status, createdAt, ... }
- [ ] 404 para inexistentes
- [ ] Permisos: sólo ROLE_ADMIN
- [ ] Tests unit + integración (repo + http)
- [ ] Docs en docs/reports.md y CHANGELOG

Contexto:
- Stack: Node 20 + TS + Express + Prisma
- Leer: README, ARCHITECTURE, /src/api, /src/auth, /prisma/schema.prisma
- Scripts: npm run dev/test/lint/typecheck

Investigación web:
- Consultar notas de versión de Express y Prisma sobre cambios recientes.
- Citar 3 fuentes y fecha de consulta.

Entrega esperada:
1) Plan de alto nivel (archivos a tocar, contrato, validaciones, errores).
2) Diffs pequeños y aplicables (router, handler, service, tests).
3) Mensaje de commit y cuerpo de PR.
4) Autoreview: posibles regresiones, performance y seguridad.

16) Antipatrones (evítalos)

PRs gigantes y multi‑tema.

“Funciona en mi máquina” sin scripts reproducibles.

Cambiar API pública sin CHANGELOG.

Saltarse tests “temporalmente”.

Mensajes de commit vagos (fix stuff).

Subir binarios, datos sensibles o .env.

17) Cierre

Este playbook, guardado como AI_COLLAB_PLAYBOOK.md en el repo, sirve para cualquier asistente de código. Si lo sigues en cada issue: planes claros, diffs limpios, investigación con fuentes, pruebas sólidas y PRs que se revisan rápido. 🚀
```
