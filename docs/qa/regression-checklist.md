# Checklist de Regresiones

**Última actualización:** 8 de octubre de 2025

Este documento define los escenarios críticos que deben verificarse antes de cada despliegue a producción para prevenir regresiones.

---

## 1. Autenticación y Autorización

### 1.1 Login Exitoso

- [ ] Usuario ADMIN puede iniciar sesión
- [ ] Usuario COORDINATOR puede iniciar sesión
- [ ] Usuario CLIENT puede iniciar sesión
- [ ] Usuario STAFF puede iniciar sesión (si implementado)
- [ ] Sesión persiste después de recargar página
- [ ] Cookie HttpOnly `auth_token` se establece correctamente

### 1.2 Login Fallido

- [ ] Credenciales incorrectas muestran error apropiado
- [ ] Email inválido es rechazado por validación
- [ ] Password vacío es rechazado
- [ ] Usuario no existente muestra error genérico (sin revelar existencia)

### 1.3 Rate Limiting

- [ ] 5 intentos fallidos de login activan rate limit
- [ ] Rate limit muestra mensaje claro al usuario
- [ ] Rate limit se resetea después de 60 segundos
- [ ] Rate limit no afecta usuarios diferentes (por IP)

### 1.4 Logout

- [ ] Botón de logout es visible cuando hay sesión activa
- [ ] Logout limpia cookie `auth_token`
- [ ] Logout redirige a página de login o home público
- [ ] No se puede acceder a operaciones protegidas después de logout

### 1.5 Permisos por Rol

- [ ] ADMIN puede crear/editar/eliminar todos los recursos
- [ ] COORDINATOR puede crear/editar servicios, propiedades, reservas
- [ ] CLIENT no puede crear servicios ni propiedades
- [ ] CLIENT puede ver sus propias reservas (scope futuro)
- [ ] Endpoints protegidos retornan 401 sin autenticación
- [ ] Endpoints con permisos insuficientes retornan 403

---

## 2. API de Servicios

### 2.1 Listar Servicios (Público)

- [ ] `/api/services` retorna lista de servicios sin autenticación
- [ ] Servicios ordenados por `name ASC`
- [ ] Incluye campos: id, name, description, basePrice, durationMin, active, createdAt, updatedAt
- [ ] Servicios inactivos (`active: false`) también se retornan

### 2.2 Crear Servicio (ADMIN/COORDINATOR)

- [ ] POST `/api/services` crea servicio con datos válidos
- [ ] Requiere autenticación (JWT o API_TOKEN)
- [ ] Requiere rol ADMIN o COORDINATOR
- [ ] Valida que `name` no esté vacío
- [ ] Valida que `basePrice` sea numérico positivo
- [ ] Valida que `durationMin` sea numérico positivo
- [ ] Retorna 201 con servicio creado

### 2.3 Actualizar Servicio (ADMIN/COORDINATOR)

- [ ] PATCH `/api/services/:id` actualiza servicio existente
- [ ] Requiere autenticación y permisos
- [ ] Permite actualización parcial de campos
- [ ] Valida datos igual que creación
- [ ] Retorna 404 si servicio no existe
- [ ] Retorna servicio actualizado

---

## 3. API de Propiedades

### 3.1 Listar Propiedades (Público)

- [ ] `/api/properties` retorna lista de propiedades sin autenticación
- [ ] Incluye relación con `owner` (User)
- [ ] Ordenadas por `id ASC`

### 3.2 Crear Propiedad (ADMIN/COORDINATOR)

- [ ] POST `/api/properties` crea propiedad con datos válidos
- [ ] Requiere autenticación y permisos
- [ ] Valida que `address` no esté vacío
- [ ] Valida que `ownerId` sea UUID válido
- [ ] Valida que `ownerId` corresponda a usuario existente
- [ ] Retorna 201 con propiedad creada

### 3.3 Actualizar Propiedad (ADMIN/COORDINATOR)

- [ ] PATCH `/api/properties/:id` actualiza propiedad
- [ ] Permite actualización parcial
- [ ] Retorna 404 si propiedad no existe

---

## 4. API de Reservas (Bookings)

### 4.1 Listar Reservas (Público con filtros)

- [ ] `/api/bookings` retorna todas las reservas sin filtros
- [ ] Filtro `status` funciona (ej. `?status=CONFIRMED`)
- [ ] Filtro `from` funciona (fecha inicio)
- [ ] Filtro `to` funciona (fecha fin)
- [ ] Filtro `propertyId` funciona
- [ ] Filtro `serviceId` funciona
- [ ] Filtro `customerId` funciona
- [ ] Combinación de filtros funciona
- [ ] Incluye relaciones: service, property, customer

### 4.2 Crear Reserva (ADMIN/COORDINATOR)

- [ ] POST `/api/bookings` crea reserva con datos válidos
- [ ] Genera código único formato BRISA-XXXX
- [ ] Copia `finalPrice` desde `service.basePrice`
- [ ] Copia `durationMin` desde `service.durationMin`
- [ ] Valida que `scheduledFor` sea fecha válida
- [ ] Valida que `serviceId`, `propertyId`, `customerId` existan
- [ ] Retorna 201 con reserva creada

### 4.3 Actualizar Reserva (ADMIN/COORDINATOR)

- [ ] PATCH `/api/bookings/:id` actualiza reserva
- [ ] Permite cambiar `status` (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- [ ] Permite cambiar `scheduledFor`
- [ ] Permite cambiar `finalPrice`
- [ ] Retorna reserva actualizada

---

## 5. API de Clientes

### 5.1 Listar Clientes (ADMIN/COORDINATOR)

- [ ] `/api/customers` retorna usuarios con rol CLIENT
- [ ] Requiere autenticación y permisos ADMIN/COORDINATOR
- [ ] Retorna solo: id, email, fullName
- [ ] No expone password hash ni otros datos sensibles

---

## 6. Frontend Web

### 6.1 Landing Page

- [ ] Página principal (`/`) muestra estado del proyecto
- [ ] Muestra reportes en vivo (servicios, reservas, propiedades, clientes)
- [ ] Botón "Ingresar" redirige a `/login`
- [ ] Muestra sesión activa si usuario está logueado

### 6.2 Panel Operativo

- [ ] Panel se muestra solo a usuarios ADMIN/COORDINATOR
- [ ] Muestra secciones: Crear servicio, Crear propiedad, Crear reserva
- [ ] Formularios tienen validación cliente (HTML5)
- [ ] Formularios muestran mensajes de éxito/error
- [ ] Filtros de reservas funcionan (selector de estado, rango de fechas)
- [ ] Lista de reservas se actualiza después de crear/actualizar

### 6.3 Formularios

- [ ] Crear servicio: muestra mensaje "Servicio creado" al éxito
- [ ] Crear propiedad: muestra mensaje apropiado
- [ ] Crear reserva: muestra mensaje apropiado
- [ ] Actualizar servicio (toggle active): actualiza sin recargar
- [ ] Actualizar reserva (cambiar estado): persiste cambio
- [ ] Errores de servidor se muestran al usuario

### 6.4 Proxy API

- [ ] Llamadas `/api/*` desde frontend se enrutan a API Hono
- [ ] CORS está configurado correctamente
- [ ] Cookies HttpOnly se preservan
- [ ] Query strings se preservan
- [ ] Headers sensibles (`content-length`, `content-encoding`) se limpian

---

## 7. Base de Datos

### 7.1 Schema Prisma

- [ ] `prisma db push` ejecuta sin errores
- [ ] Todas las tablas se crean correctamente
- [ ] Foreign keys están definidas
- [ ] Índices están aplicados
- [ ] Constraints (UNIQUE, NOT NULL) funcionan

### 7.2 Seed

- [ ] `pnpm db:seed` crea usuarios demo
- [ ] Usuarios demo tienen passwords hasheados con bcrypt
- [ ] Se crean servicios demo (Deep Clean, Turnover)
- [ ] Se crea propiedad demo (Brickell Loft)
- [ ] Se crean reservas demo (BRISA-0001, BRISA-0002)
- [ ] Seed es idempotente (no falla si datos existen)

---

## 8. Seguridad

### 8.1 Credenciales

- [ ] No hay archivos `.env` commiteados en Git
- [ ] `.env.example` tiene valores placeholder
- [ ] `.gitignore` incluye `.env*` (excepto `.env.example`)
- [ ] Pre-commit hook verifica ausencia de secretos
- [ ] Variables de entorno en Vercel están encriptadas

### 8.2 JWT

- [ ] Token JWT se firma con `JWT_SECRET`
- [ ] Token incluye: userId, email, role, fullName
- [ ] Token se valida en middleware `authenticate`
- [ ] Token expirado retorna 401

### 8.3 Passwords

- [ ] Passwords se hashean con bcrypt (10 rounds)
- [ ] Password hash nunca se retorna en API
- [ ] Comparación de passwords usa `bcrypt.compare`

### 8.4 Rate Limiting

- [ ] Login tiene rate limit (5 intentos / 60 segundos)
- [ ] Rate limit configurable vía env vars
- [ ] Rate limit se aplica por IP (o session si implementado)

---

## 9. Deployment

### 9.1 Build

- [ ] `pnpm turbo run build` ejecuta sin errores
- [ ] Build de API incluye `prisma generate`
- [ ] Build de Web no tiene errores de TypeScript
- [ ] Build no tiene warnings críticos

### 9.2 Vercel

- [ ] Deployment a producción se completa sin errores
- [ ] Variables de entorno están configuradas en Production
- [ ] Variables de entorno están configuradas en Preview
- [ ] Logs no muestran errores de conexión a base de datos
- [ ] Favicon se carga correctamente (no 404)

### 9.3 CI/CD

- [ ] GitHub Actions CI pasa (lint, typecheck, test, e2e, build)
- [ ] Tests unitarios pasan (18/18 en `apps/api`)
- [ ] Tests E2E pasan (3/3 en `tests/e2e`)
- [ ] Pre-commit hooks se ejecutan correctamente
- [ ] Verificación de secretos pasa

---

## 10. Performance

### 10.1 API

- [ ] Endpoint `/api/services` responde en < 500ms
- [ ] Endpoint `/api/bookings` con filtros responde en < 1s
- [ ] Login responde en < 800ms (incluyendo bcrypt)
- [ ] No hay queries N+1 (verificar con Prisma logs)

### 10.2 Web

- [ ] Página principal carga en < 3s (First Contentful Paint)
- [ ] Panel operativo es interactivo en < 2s (Time to Interactive)
- [ ] No hay errores en consola del navegador
- [ ] Assets (favicon, images) se cargan correctamente

---

## 11. Monitoreo

### 11.1 Logs

- [ ] Logs de Vercel no muestran errores no manejados
- [ ] Logs estructurados incluyen timestamps
- [ ] Errores incluyen stack traces (en desarrollo)
- [ ] No se loguean datos sensibles (passwords, tokens)

### 11.2 Alertas (cuando implementado)

- [ ] Alerta en tasa de error > 5%
- [ ] Alerta en latencia p99 > 2s
- [ ] Alerta en tasa de login fallido > 20%
- [ ] Alerta en uso de base de datos > 90%

---

## 12. Documentación

### 12.1 Consistencia

- [ ] README.md tiene instrucciones actualizadas
- [ ] docs/guides/quickstart.md es consistente con setup actual
- [ ] docs/overview/status.md refleja estado real del proyecto
- [ ] docs/operations/security.md tiene procedimientos vigentes
- [ ] CHANGELOG.md tiene últimos cambios (si implementado)

### 12.2 API Docs (futuro)

- [ ] OpenAPI/Swagger disponible
- [ ] Ejemplos de requests funcionan
- [ ] Ejemplos de responses son actuales

---

## Uso del Checklist

### Antes de cada PR

- Ejecutar checklist completo en branch de desarrollo
- Marcar items que fueron afectados por el PR
- Ejecutar tests E2E localmente

### Antes de deployment a producción

- Ejecutar checklist completo
- Verificar que CI está en verde
- Confirmar con stakeholder cambios funcionales

### Después de deployment

- Verificar logs de Vercel
- Ejecutar smoke tests en producción
- Verificar métricas clave (latencia, errores)

---

## Automatización Futura

Estos checks deben automatizarse progresivamente:

- [ ] Script de smoke tests post-deployment
- [ ] Dashboard de métricas en tiempo real
- [ ] Alertas automáticas en Slack/Email
- [ ] Tests de carga periódicos
- [ ] Auditoría de seguridad mensual

---

**Nota:** Este checklist es un documento vivo. Añadir nuevos items conforme se descubran regresiones o se añadan funcionalidades.
