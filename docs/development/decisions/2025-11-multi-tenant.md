# ADR: Multi-tenant para Brisa OS

- **Estado**: Propuesto (noviembre 2025)
- **Autores**: Equipo fundador
- **Contexto**: Brisa OS pasa de operar una sola marca (Brisa Cubana) a ofrecer el software como servicio para múltiples empresas. Necesitamos aislar datos y permisos por compañía sin duplicar infra.

## 1. Objetivo

Habilitar un modelo multi-tenant que permita:

1. Registrar múltiples empresas con sus marcas.
2. Mantener usuarios/crews/propiedades aislados por tenant.
3. Ofrecer portal cliente white-label por empresa.
4. Preparar billing (planes Starter/Growth/Scale) y métricas de uso.

## 2. Requisitos

- **Seguridad**: cada request debe resolverse dentro de un tenant. No se permite acceso cross-tenant salvo cuentas internas (ROLE `SUPERADMIN`).
- **Compatibilidad**: migración transparente para la data actual (Brisa Cubana). Todos los registros legacy deben mapearse a un tenant inicial (`brisa-cubana`).
- **Escalabilidad**: soporte para 1-200 tenants en la misma base; posibilidad de sharding futuro.
- **DX**: helpers para scoping (`withTenant`, `requireTenant`) y seeds generados por tenant.

## 3. Diseño propuesto

### 3.1 Nuevas entidades (Prisma)

```prisma
model Tenant {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  logoUrl     String?
  plan        TenantPlan   @default(STARTER)
  status      TenantStatus @default(ACTIVE)
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       UserTenant[]
  properties  Property[]
  customers   Customer[]
  bookings    Booking[]
  leads       Lead[]
}

model UserTenant {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  role      UserRole
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id])
  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([userId, tenantId])
}
```

- `User` deja de tener `role` global; el rol vive en `UserTenant`.
- Tablas críticas (`Property`, `Booking`, `Customer`, `Lead`, `Notification`, `Service`, `Inventory`, etc.) reciben columna `tenantId` (`@index`).
- Tabla `PortalSession` también incluye `tenantId` para rutas cliente.

### 3.2 Autenticación y scoping

1. **Panel (JWT)**: token incluirá `tenantId` + `role`. Middleware `authenticateWithTenant` valida token, carga `UserTenant` y adjunta `ctx.get("tenant")`.
2. **Portal cliente**: enlaces mágicos llevan `tenantSlug` y `customerId`. Las cookies `portal_token` se firman con `tenantId`.
3. **API pública**: endpoints `/api/marketing/**` pueden exponer datos agregados por tenant (o global, según permisos).

### 3.3 Determinación del tenant

- Panel: se selecciona desde UI (dropdown) o se fija si el usuario pertenece a un solo tenant.
- Portal cliente: `customerId` → `tenantId` determinístico.
- Webhooks/Integraciones: header `x-tenant` obligatorio o `tenantSlug` en la URL (`/api/tenants/:slug/...`).

## 4. Migración

1. Crear tenant base `brisa-cubana` (slug) y migrar datos existentes (`UPDATE table SET tenantId = '...'`).
2. Poblar `UserTenant` con usuarios actuales (ADMIN → `userTenant.role = ADMIN`).
3. Actualizar seeds (`db:seed:demo`, `db:seed:operativo`) para generar tenants ficticios (`prime-clean`, `glow-rooms`).
4. Introducir feature flag `NEXT_PUBLIC_MULTI_TENANT` para liberar UI gradualmente.

## 5. Backlog técnico

- [ ] Migración Prisma (Tenant + UserTenant + columnas `tenantId`).
- [ ] Middleware scoping (`apps/api/src/middleware/tenant.ts`).
- [ ] Helpers en front (`useTenant`, selector en navbar).
- [ ] Ajustar seeds y tests (Vitest + Playwright) para incluir `tenantId`.
- [ ] Observabilidad: añadir `tenantId` en logs Pino y eventos PostHog.

## 6. Riesgos

- **Complejidad en seeds/tests**: se mitigará creando utilidades para generar data por tenant.
- **Performance**: índices por `tenantId` obligatorios; evaluar particionado a futuro si ≥200 tenants.
- **Portal cliente**: se debe validar `tenantSlug` en cada request para evitar exposición cruzada.

## 7. Próximos pasos

1. Aprobación del ADR.
2. Crear migración inicial (feature branch `feat/multi-tenant-schema`).
3. Implementar middleware y actualizar endpoints críticos (`/api/bookings`, `/api/calendar`, `/api/leads`).
4. Ajustar UI (selector de tenant, branding, portal white-label).
