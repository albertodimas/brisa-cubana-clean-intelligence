# Sesión 2025-10-06 · Seguridad FASE 2 (Nonce CSP + CORS Hardened)

**Participantes**: Codex (implementación), Claude Code (auditoría).  
**Ámbito**: apps/api, apps/web, documentación de seguridad.

## Objetivos cumplidos

- Implementación de **Content Security Policy con nonce** per-request en el middleware de Next.js.
- Eliminación de `unsafe-inline` en scripts y estilos; adición de `strict-dynamic` y cabeceras complementarias.
- Refactor de CORS en la API con lista explícita de orígenes y `originMatcher` reutilizable.
- Suite de pruebas dedicada `apps/api/src/lib/cors-origins.test.ts` con 22 casos (ambientes, normalización, duplicados, spoofing).
- Revalidación de guardias locales: `pnpm lint`, `pnpm typecheck`, `pnpm test`.

## Cambios principales

- `apps/web/middleware.ts`: generación de nonce criptográfico (128 bits) y aplicación de CSP dinámica.
- `apps/web/src/server/security/csp.ts`: helper para construir directivas CSP con soporte de Vercel Analytics y Sentry.
- `apps/web/src/server/security/csp.test.ts`: pruebas de directivas (nonce, directivas defensivas, ausencia de `unsafe-inline`).
- `apps/api/src/app.ts`: adopción de `buildAllowedOrigins` y cabecera `Vary: Origin`.
- `apps/api/src/lib/cors-origins.ts`: utilidades para orígenes por entorno.
- `apps/api/src/lib/cors-origins.test.ts`: cobertura unitaria completa.

## Documentación impactada (actualizar o validar)

1. `README.md` – reflejar eliminación de `unsafe-inline` y orígenes explícitos.
2. `docs/operations/security/README.md` – incorporar FASE 2 y política CSP.
3. `docs/for-developers/deployment.md` – nuevos requisitos de URLs y cabeceras.
4. `docs/operations/production/PRODUCTION_READINESS_REPORT.md` – estatus de seguridad actualizado.
5. `docs/for-developers/architecture.md` – describir módulos `csp.ts` y `cors-origins.ts`.
6. `docs/for-developers/testing.md` – registrar los tests de CORS/CSP.
7. `docs/for-developers/environment-variables.md` – destacar `NEXT_PUBLIC_API_URL`/`WEB_APP_URL`.

## Siguientes pasos

- Validar despliegues (staging/preview) para confirmar cabeceras CSP y CORS en entornos gestionados.
- Ejecutar `pnpm test:e2e` con inspección manual de CSP en DevTools.
- Actualizar checklist de producción (`docs/operations/production/PRODUCTION_READINESS_CHECKLIST.md`) con nuevas verificaciones de seguridad.
