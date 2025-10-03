# Contributing to Brisa Cubana Clean Intelligence

¡Gracias por tu interés en contribuir al proyecto! Este documento proporciona guías y mejores prácticas para contribuir efectivamente.

## Código de Conducta

Este proyecto adhiere a un Código de Conducta para asegurar un ambiente positivo y profesional. Al participar, aceptas mantener estos estándares. Ver [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Cómo Contribuir

### 1. Setup del Entorno

Sigue la guía detallada en [docs/for-developers/quickstart.md](docs/for-developers/quickstart.md):

```bash
# Requisitos: Node 24.9.0, pnpm 10.17.1, Docker
nvm use
pnpm install
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Configurar secretos
# NEXTAUTH_SECRET=$(openssl rand -base64 32)
# JWT_SECRET=$(openssl rand -hex 64)

# Levantar servicios
docker compose up -d
pnpm --filter=@brisa/api db:push
pnpm --filter=@brisa/api db:seed

# Iniciar desarrollo
pnpm dev
```

### 2. Workflow de Desarrollo

#### Branching Strategy

- `main` - Rama principal protegida (requiere PR + review)
- `develop` - Rama de desarrollo (no implementada aún)
- `feature/*` - Nuevas features
- `fix/*` - Bug fixes
- `docs/*` - Cambios de documentación
- `chore/*` - Mantenimiento, refactors

#### Crear una Nueva Feature

```bash
# Desde main (o develop cuando exista)
git checkout main
git pull origin main

# Crear branch
git checkout -b feature/nombre-descriptivo

# Hacer cambios...
git add .
git commit -m "feat: descripción del cambio"

# Push y crear PR
git push -u origin feature/nombre-descriptivo
gh pr create --fill
```

### 3. Convención de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Tipos permitidos

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `docs:` - Cambios en documentación
- `style:` - Formateo, linting (sin cambios funcionales)
- `refactor:` - Refactorización de código
- `perf:` - Mejoras de performance
- `test:` - Agregar o corregir tests
- `chore:` - Configuración, dependencias, tooling
- `ci:` - Cambios en CI/CD
- `build:` - Cambios en sistema de build

#### Ejemplos

```bash
feat(api): add rate limiting middleware
fix(web): resolve dashboard loading issue
docs(setup): update Node version requirements
test(api): add bookings route tests
chore(deps): upgrade Next.js to 15.5.4
```

### 4. Estándares de Código

#### TypeScript

- **Strict mode** habilitado
- Evitar `any`, usar tipos explícitos
- Preferir interfaces sobre types para objetos públicos
- Documentar funciones complejas con JSDoc

```typescript
// ✅ Bueno
interface User {
  id: string;
  email: string;
  role: UserRole;
}

function getUserById(id: string): Promise<User | null> {
  // ...
}

// ❌ Malo
function getUserById(id: any): any {
  // ...
}
```

#### React / Next.js

- Componentes funcionales con hooks
- Server Components por defecto (Next.js App Router)
- Client Components solo cuando necesario (`'use client'`)
- Props con TypeScript interfaces

```typescript
// ✅ Bueno - Server Component
interface DashboardProps {
  userId: string;
}

export default async function Dashboard({ userId }: DashboardProps) {
  const data = await getData(userId);
  return <div>{/* ... */}</div>;
}

// Client Component cuando necesario
'use client';
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  // ...
}
```

#### API / Backend (Hono)

- Validación con Zod en todos los endpoints
- Middleware de autenticación consistente
- Manejo de errores estructurado
- Logs con context (requestId, userId)

```typescript
// ✅ Bueno
import { createBookingSchema } from "../schemas";

bookings.post("/", requireAuth(), async (c) => {
  const json = await c.req.json();
  const result = createBookingSchema.safeParse(json);

  if (!result.success) {
    return c.json(
      {
        error: "Invalid payload",
        details: result.error.flatten(),
      },
      400,
    );
  }

  // ...
});
```

### 5. Testing

#### Tests Obligatorios

- **Unit tests** para lógica de negocio
- **Integration tests** para rutas API
- **E2E tests** para flujos críticos (opcional pero recomendado)

#### Ejecutar Tests

```bash
# Unit tests (Vitest)
pnpm test

# Unit tests con coverage
pnpm test -- --coverage

# E2E tests (Playwright)
pnpm test:e2e

# Lint
pnpm lint

# Typecheck
pnpm typecheck
```

#### Escribir Tests

```typescript
// apps/api/src/routes/__tests__/bookings.test.ts
import { describe, it, expect, vi } from "vitest";
import { generateAccessToken } from "../lib/token";

describe("POST /api/bookings", () => {
  it("should create booking with valid payload", async () => {
    const token = generateAccessToken({
      sub: "user-1",
      email: "test@example.com",
      role: "CLIENT",
    });

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "user-1",
        serviceId: "service-1",
        propertyId: "property-1",
        scheduledAt: new Date().toISOString(),
      }),
    });

    expect(response.status).toBe(201);
  });
});
```

### 6. Documentación

#### Actualizar Documentación

- Cambios en features → actualizar `docs/04-arquitectura-y-stack.md`
- Decisiones técnicas → agregar ADR en `docs/operations/decision-log/decisions.md`
- Cambios de API → actualizar documentación correspondiente
- Breaking changes → actualizar `CHANGELOG.md`

#### MkDocs

```bash
# Servir docs localmente
make setup  # Primera vez
make serve  # http://localhost:8000

# O directamente
mkdocs serve
```

### 7. Pull Requests

#### Checklist antes de abrir PR

- [ ] Código cumple estándares del proyecto
- [ ] Tests agregados/actualizados y passing
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores
- [ ] Documentación actualizada si aplica
- [ ] Commit messages siguen Conventional Commits
- [ ] PR description es clara y completa

#### Template de PR

El template se completa automáticamente desde [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).

#### Proceso de Review

1. Crear PR y asignar reviewers
2. CI debe pasar (lint, typecheck, tests, build)
3. Al menos 1 aprobación requerida
4. Resolver comentarios del review
5. Merge con squash (maintainers)

### 8. Prácticas de Seguridad

#### Secrets y Variables de Entorno

- ❌ **NUNCA** commitear archivos `.env`
- ❌ **NUNCA** incluir API keys en el código
- ✅ Usar `.env.example` con valores placeholder
- ✅ Documentar variables requeridas en `docs/for-developers/environment-variables.md`

#### Dependencias

- Revisar actualizaciones semanalmente
- Evitar dependencias con vulnerabilidades conocidas
- Verificar licencias compatibles (MIT, Apache 2.0, BSD)

```bash
# Actualizar dependencias
pnpm update --interactive --latest

# Audit de seguridad
pnpm audit
```

### 9. Guías Específicas por Área

#### Frontend (apps/web)

- Componentes en `src/components/`
- Server actions en `src/server/`
- Usar `@brisa/ui` para componentes compartidos
- Optimizar imágenes con `next/image`
- Lazy load componentes pesados

#### Backend (apps/api)

- Rutas en `src/routes/`
- Middleware en `src/middleware/`
- Schemas Zod en `src/schemas.ts`
- Lógica de negocio en `src/lib/`
- Prisma client en `src/lib/db.ts`

#### UI Package (packages/ui)

- Componentes atómicos reutilizables
- Exportar desde `src/index.ts`
- Tests con Testing Library
- Storybook stories para cada componente

### 10. Recursos Útiles

#### Documentación del Proyecto

- [README.md](README.md) - Overview general
- [docs/for-developers/quickstart.md](docs/for-developers/quickstart.md) - Puesta en marcha
- [docs/for-developers/architecture.md](docs/for-developers/architecture.md) - Arquitectura high-level
- [docs/](docs/) - Documentación completa MkDocs

#### Stack Tecnológico

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Hono Docs](https://hono.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)

#### Herramientas

- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Config](https://prettier.io/docs/en/configuration.html)

## Preguntas y Soporte

### ¿Necesitas Ayuda?

- 💬 Abre un [issue](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues) con label `question`
- 📧 Contacta al equipo: albertodimasmorazaldivar@gmail.com
- 📚 Consulta la [documentación](docs/)

### Reportar Bugs

Usa el template de bug report en `.github/ISSUE_TEMPLATE/bug_report.md`:

- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Información del entorno

### Proponer Features

Usa el template de feature request:

- Descripción de la feature
- Caso de uso
- Beneficio esperado
- Propuesta de implementación (opcional)

## Licencia

Al contribuir, aceptas que tus contribuciones se licencien bajo la misma licencia del proyecto. Ver [LICENSE](LICENSE).

---

**¡Gracias por contribuir a Brisa Cubana Clean Intelligence!** 🧹✨
