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
3. Si tu rama ha acumulado builds, corre `scripts/cleanup-local-env.sh` para resetear caches y reinstalar dependencias de cero.
4. Actualiza documentación relacionada; los cambios deben pasar el script `scripts/verify-doc-structure.sh`.
5. Deja agendada la eliminación de la rama tras el merge (hay checkbox en el PR template).

## Rutina semanal

- Revisa el tablero de PRs y cierra los que lleven inactivos más de 7 días o conviértelos en draft.
- El lunes realiza `pnpm clean` o `scripts/cleanup-local-env.sh` y vuelve a correr la suite de verificación para detectar roturas tempranas.
- Verifica que `ops/vercel-cli.version` refleje la versión aprobada en producción y que el workflow `vercel-cli-watch.yml` no tenga issues pendientes.

## Rutina mensual

- El primer lunes del mes, repasa ramas remotas con `git fetch --prune` y borra las que ya estén fusionadas.
- Recorre `docs/` buscando guías desactualizadas (`git grep TODO docs`) y crea issues para refactors necesarios.
- Valida configuraciones protegidas en GitHub: `main` debe exigir los checks `PR Checks` y `CI (Main Branch)`.

## Observabilidad del repositorio

- Monitorea los workflows `pr-checks.yml`, `ci.yml`, `nightly.yml` y `monthly-bundle.yml`. Si alguno se torna rojo, crea inmediatamente una incidencia interna.
- Conserva el hábito de “auto-review”: antes de solicitar revisión, realiza un `git diff HEAD^` para detectar archivos accidentales.

Estas prácticas, combinadas con los scripts y checklists existentes, mantienen el repositorio limpio y listo para iterar sin deuda operativa.
