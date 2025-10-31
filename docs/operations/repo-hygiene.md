# Repo hygiene playbook

## Objetivos

- Mantener `main` siempre desplegable y con historial limpio.
- Asegurar que cada PR llegue con linting, typechecks, tests y documentación verificados.
- Evitar acumulación de ramas huérfanas y artefactos locales que oculten fallos reales.

## Checklist por PR

1. Trabaja en una rama con prefijo descriptivo (`feat/`, `fix/`, `chore/`).
2. Ejecuta los comandos mínimos antes de subir cambios:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm docs:verify`
   - `pnpm test:e2e:smoke` cuando la rama impacte UI o flujos críticos (escalar a `:critical` o `:full` según riesgo documentado).
3. Si tu rama ha acumulado builds, corre `scripts/cleanup-local-env.sh` para resetear caches y reinstalar dependencias de cero.
4. Actualiza documentación relacionada; registra el objetivo y validaciones en `docs/overview/status.md` con fecha exacta y asegúrate de que los cambios pasen `scripts/verify-doc-structure.sh`.
5. Valida el deploy preview de Vercel (`vercel --scope brisa-cubana deploy --prebuilt` si es necesario) y adjunta evidencia de salud (captura, logs, resultado de suite apuntando al preview).
6. Deja agendada la eliminación de la rama tras el merge (hay checkbox en el PR template).

## Rutina semanal

- Revisa el tablero de PRs y cierra los que lleven inactivos más de 7 días o conviértelos en draft.
- El lunes realiza `pnpm clean` o `scripts/cleanup-local-env.sh` y vuelve a correr la suite de verificación (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm docs:verify`) + `pnpm verify:versions` para detectar roturas tempranas.
- Revisa que `ops/vercel-cli.version` refleje la versión aprobada en producción y que el workflow `vercel-cli-watch.yml` no tenga issues pendientes.
- Comprueba que las variables de entorno documentadas en `docs/operations/env-sync.md` siguen vigentes en Vercel y GitHub Actions.

## Rutina mensual

- El primer lunes del mes, repasa ramas remotas con `git fetch --prune` y borra las que ya estén fusionadas.
- Recorre `docs/` buscando guías desactualizadas (`git grep TODO docs`) y registra acciones correctivas en `docs/overview/status.md`.
- Programa `pnpm test:e2e:full` y la verificación Lighthouse (`pnpm docs:verify && pnpm test:e2e:full && pnpm exec playwright show-report`) para confirmar que producción se mantiene saludable.
- Valida configuraciones protegidas en GitHub: `main` debe exigir los checks `PR Checks`, `Lint`, `Typecheck`, `Unit tests`, `Docs verify`, `Build`, `E2E critical`, `Storybook build` y `CI (Main Branch)` (el job `deploy` hereda de ellos).

## Observabilidad del repositorio

- Monitorea los workflows `pr-checks.yml`, `ci.yml`, `nightly.yml` y `monthly-bundle.yml`. Si alguno se torna rojo, crea inmediatamente una incidencia interna.
- Conserva el hábito de “auto-review”: antes de solicitar revisión, realiza un `git diff HEAD^` para detectar archivos accidentales.
- Tras cada merge a `main`, verifica rápidamente producción con `curl -I https://brisacubanacleanintelligence.com` y `curl https://api.brisacubanacleanintelligence.com/health`, revisa dashboards de Vercel y confirma que Sentry/PostHog reciben eventos (usa `pnpm sentry:test-event` y `pnpm posthog:test-event` si es necesario).

Estas prácticas, combinadas con los scripts y checklists existentes, mantienen el repositorio limpio y listo para iterar sin deuda operativa.
