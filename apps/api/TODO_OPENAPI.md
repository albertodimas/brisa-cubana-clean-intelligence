# TODO: Implementación de OpenAPI/Swagger

## Dependencias a Instalar

Ejecutar desde el root del proyecto:

```bash
pnpm --filter=@brisa/api add @hono/zod-openapi @hono/swagger-ui
```

O directamente en `apps/api/package.json`:

```json
{
  "dependencies": {
    "@hono/zod-openapi": "^0.18.0",
    "@hono/swagger-ui": "^0.4.1"
  }
}
```

Luego ejecutar: `pnpm install`

## Pasos de Implementación

### 1. ✅ Documentación Creada

- [x] Guía completa en `docs/for-developers/openapi-setup.md`
- [x] Añadida a navegación de MkDocs

### 2. ⏳ Instalar Dependencias

```bash
# Desde el root del proyecto
pnpm --filter=@brisa/api add @hono/zod-openapi @hono/swagger-ui
```

### 3. ⏳ Modificar `apps/api/src/app.ts`

- [ ] Cambiar `Hono` por `OpenAPIHono`
- [ ] Añadir endpoint `/openapi.json`
- [ ] Añadir endpoint `/api-docs` (Swagger UI)
- [ ] Añadir endpoint `/api-docs/redoc` (opcional)

Ver ejemplo completo en `docs/for-developers/openapi-setup.md` sección "Paso 1"

### 4. ⏳ Migrar Rutas a OpenAPI

Archivos a modificar:

- [ ] `apps/api/src/routes/auth.ts`
- [ ] `apps/api/src/routes/users.ts`
- [ ] `apps/api/src/routes/services.ts`
- [ ] `apps/api/src/routes/bookings.ts`
- [ ] `apps/api/src/routes/properties.ts`
- [ ] `apps/api/src/routes/payments.ts`

Para cada archivo:

1. Importar `createRoute` de `@hono/zod-openapi`
2. Definir schemas de request/response con Zod
3. Crear rutas con `createRoute()`
4. Cambiar `app.get/post/put/delete` por `app.openapi()`

Ver ejemplos en `docs/for-developers/openapi-setup.md` sección "Paso 2"

### 5. ⏳ Añadir Autenticación a OpenAPI

- [ ] Configurar `securitySchemes` en OpenAPI metadata
- [ ] Añadir `security: [{ bearerAuth: [] }]` a rutas protegidas

Ver ejemplo en `docs/for-developers/openapi-setup.md` sección "Paso 3"

### 6. ⏳ Testing

- [ ] Iniciar servidor: `pnpm dev:api`
- [ ] Verificar http://localhost:3001/openapi.json
- [ ] Verificar http://localhost:3001/api-docs (Swagger UI)
- [ ] Probar autenticación en Swagger UI
- [ ] Probar cada endpoint desde Swagger UI

### 7. ⏳ CI/CD (Opcional)

- [ ] Crear workflow `.github/workflows/openapi.yml`
- [ ] Generar spec automáticamente en cada push
- [ ] Commitear `docs/reference/openapi.json`

Ver ejemplo en `docs/for-developers/openapi-setup.md` sección "Integración con CI/CD"

## Estimación de Tiempo

- Instalación de dependencias: 5 min
- Modificar app.ts: 30 min
- Migrar rutas (23 endpoints): 3-4 horas
- Testing: 1 hora
- **Total:** ~5-6 horas

## Beneficios Esperados

- ✅ Documentación siempre actualizada
- ✅ Playground interactivo para testing
- ✅ Generación automática de clientes TypeScript/Python
- ✅ Validación de contratos API
- ✅ Onboarding más rápido para nuevos desarrolladores

## Referencias

- Guía completa: `docs/for-developers/openapi-setup.md`
- Hono OpenAPI: https://hono.dev/examples/zod-openapi
- OpenAPI 3.1: https://spec.openapis.org/oas/v3.1.0

---

**Creado:** 2025-10-04
**Estado:** Pendiente de implementación
