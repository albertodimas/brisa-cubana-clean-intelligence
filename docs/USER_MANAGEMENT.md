# User Management - Admin Panel

## Overview

El sistema de gestión de usuarios permite a los administradores crear, actualizar y gestionar usuarios de la plataforma Brisa Cubana Clean Intelligence.

**Implementado en**:

- Backend: Commit `43c799c` (9 Oct 2025)
- UI Activación: Commit `c815843` (9 Oct 2025)

## Roles de Usuario

### Jerarquía de Roles

```
ADMIN > COORDINATOR > STAFF > CLIENT
```

| Rol             | Descripción                | Permisos                                     |
| --------------- | -------------------------- | -------------------------------------------- |
| **ADMIN**       | Administrador del sistema  | Acceso completo, gestión de usuarios         |
| **COORDINATOR** | Coordinador de operaciones | Gestión de servicios, reservas y propiedades |
| **STAFF**       | Personal operativo         | Ver reservas asignadas, actualizar estado    |
| **CLIENT**      | Cliente                    | Ver sus propias reservas y propiedades       |

## Endpoints API

Base URL: `https://brisa-cubana-clean-intelligence-api.vercel.app/api/users`

### GET /api/users

Listar todos los usuarios del sistema

**Auth**: Requiere rol `ADMIN`

**Response**:

```json
{
  "data": [
    {
      "id": "cuid...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "COORDINATOR",
      "isActive": true,
      "createdAt": "2025-10-09T...",
      "updatedAt": "2025-10-09T..."
    }
  ]
}
```

### POST /api/users

Crear un nuevo usuario

**Auth**: Requiere rol `ADMIN`

**Request Body**:

```json
{
  "email": "newuser@example.com",
  "fullName": "Jane Smith",
  "password": "SecurePass123",
  "role": "STAFF"
}
```

**Validación**:

- `email`: Formato de email válido, único en el sistema
- `fullName`: 3-120 caracteres
- `password`: 8-64 caracteres (se hashea con bcrypt)
- `role`: Uno de `ADMIN`, `COORDINATOR`, `STAFF`, `CLIENT`

**Response** (201):

```json
{
  "data": {
    "id": "cuid...",
    "email": "newuser@example.com",
    "fullName": "Jane Smith",
    "role": "STAFF",
    "isActive": true,
    "createdAt": "2025-10-09T...",
    "updatedAt": "2025-10-09T..."
  }
}
```

**Errores**:

- `409`: Email ya registrado
- `400`: Datos de validación incorrectos
- `403`: No tienes permisos de ADMIN

### PATCH /api/users/:userId

Actualizar un usuario existente

**Auth**: Requiere rol `ADMIN`

**Request Body** (todos opcionales):

```json
{
  "fullName": "Jane Updated",
  "role": "COORDINATOR",
  "password": "NewPassword456",
  "isActive": false
}
```

**Validación**:

- Al menos un campo debe ser proporcionado
- `fullName`: 3-120 caracteres (opcional)
- `password`: 8-64 caracteres (opcional)
- `role`: Enum válido (opcional)
- `isActive`: Boolean (opcional)

**Protecciones de Seguridad**:

1. **No auto-cambio de rol**: Un admin no puede cambiar su propio rol
2. **No auto-desactivación**: Un admin no puede desactivarse a sí mismo

**Response** (200):

```json
{
  "data": {
    "id": "cuid...",
    "email": "user@example.com",
    "fullName": "Jane Updated",
    "role": "COORDINATOR",
    "isActive": false,
    "updatedAt": "2025-10-09T..."
  }
}
```

**Errores**:

- `400`: No puedes cambiar tu propio rol
- `400`: No puedes desactivar tu propia cuenta
- `404`: Usuario no encontrado

## Frontend - Admin Panel

### Ubicación

`apps/web/components/admin-panel.tsx`

### Features Implementadas

#### 1. Lista de Usuarios

- Tabla con todos los usuarios del sistema
- Columnas: Usuario (email), Nombre, Rol, Estado, Última actualización, Acciones
- Estado visible con badge coloreado (verde: Activo, rojo: Inactivo)
- Orden cronológico por fecha de creación

#### 2. Crear Usuario

- Formulario modal/inline
- Campos requeridos:
  - Email
  - Nombre completo
  - Contraseña
  - Rol (dropdown)
- Validación client-side y server-side
- Feedback inmediato en caso de error

#### 3. Editar Usuario

- Modal/inline editing
- Campos editables:
  - Nombre completo
  - Rol
  - Contraseña (opcional)
  - Estado activo/inactivo
- Validaciones en tiempo real
- Protecciones visuales contra auto-modificación

#### 4. Activar/Desactivar Usuario

- Checkbox toggle en cada fila de usuario
- Cambio instantáneo con feedback visual
- Impide auto-desactivación con alert y checkbox deshabilitado
- Actualización automática del badge de estado al cambiar

#### 5. Indicadores Visuales

- Badge de rol con colores (Chip component)
- Badge de estado con colores:
  - 🟢 **Activo**: Fondo verde claro (`rgba(34, 197, 94, 0.2)`), texto verde (`#22c55e`)
  - 🔴 **Inactivo**: Fondo rojo claro (`rgba(239, 68, 68, 0.2)`), texto rojo (`#ef4444`)
- Checkbox de activación:
  - Habilitado para otros usuarios
  - Deshabilitado y semi-transparente para el usuario actual (opacidad 50%)
- Validación visual de campos en formularios

### Server Actions

Implementadas en `apps/web/app/actions.ts`:

```typescript
// Crear usuario
export async function createUserAction(
  formData: FormData,
): Promise<ActionResult>;

// Actualizar usuario
export async function updateUserAction(
  userId: string,
  formData: FormData,
): Promise<ActionResult>;

// Toggle activo/inactivo
export async function toggleUserActiveAction(
  userId: string,
  active: boolean,
): Promise<ActionResult>;
```

**Características**:

- Validación de sesión (requiere token de ADMIN)
- Revalidación automática de página después de cambios
- Manejo de errores con mensajes descriptivos
- Type-safe con TypeScript

## Base de Datos

### Schema (Prisma)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  fullName     String
  role         UserRole
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relaciones
  ownedProperties Property[] @relation("PropertyOwner")
  bookings        Booking[]  @relation("BookingCustomer")

  @@index([email])
  @@index([role])
  @@index([isActive])
}

enum UserRole {
  ADMIN
  COORDINATOR
  STAFF
  CLIENT
}
```

**Nuevo Campo**: `isActive` (agregado en commit `43c799c`)

### Migraciones

```bash
# Aplicar migración de isActive
pnpm --filter @brisa/api db:push

# Seed con usuarios de prueba
pnpm --filter @brisa/api db:seed
```

## Testing

### Unit Tests

Archivo: `apps/api/src/app.test.ts`

**Tests Implementados** (24 total):

#### User Management Tests:

1. ✅ `lists all users (admin only)` - Verifica que ADMIN pueda listar usuarios
2. ✅ `non-admins cannot list users` - Verifica que COORDINATOR no pueda listar
3. ✅ `creates new user` - Crea usuario con datos válidos
4. ✅ `rejects duplicate user emails` - Error 409 si email existe
5. ✅ `prevents admins from deactivating themselves` - Error 400 en auto-desactivación
6. ✅ `prevents admins from changing own role` - Error 400 en auto-cambio de rol
7. ✅ `updates user role and password` - Actualiza datos correctamente

**Cobertura**: 100% de los endpoints de usuarios

### E2E Tests

No implementados aún. Recomendación:

```typescript
// tests/e2e/user-management.spec.ts
test("Admin can create new user", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /crear usuario/i }).click();
  await page.fill('[name="newUserEmail"]', "test@example.com");
  await page.fill('[name="newUserFullName"]', "Test User");
  await page.fill('[name="newUserPassword"]', "TestPass123");
  await page.selectOption('[name="newUserRole"]', "STAFF");
  await page.getByRole("button", { name: /guardar/i }).click();

  await expect(page.getByText("test@example.com")).toBeVisible();
});
```

## Seguridad

### Medidas Implementadas

1. **Autenticación**: JWT token requerido en todos los endpoints
2. **Autorización**: Solo `ADMIN` puede gestionar usuarios
3. **Password Hashing**: bcrypt con salt rounds = 10
4. **Validación**: Zod schemas en API y formularios
5. **Protecciones contra auto-modificación**:
   - No cambio de propio rol
   - No auto-desactivación
6. **Rate Limiting**: Heredado del sistema global de auth
7. **Error Handling**: Mensajes genéricos para evitar enumeration attacks

### Best Practices

- ✅ Nunca exponer `passwordHash` en responses
- ✅ Logs de auditoría para cambios de usuarios (recomendado)
- ✅ 2FA para admins (futuro)
- ✅ Password policies enforcement
- ✅ Session timeout después de inactividad

## UI/UX

### Componentes UI

Nuevos componentes creados:

```
apps/web/components/ui/
├── button.tsx      # Botones reutilizables
├── card.tsx        # Cards para layouts
├── chip.tsx        # Badges para roles/estado
└── table.tsx       # Tabla de datos
```

### Design System

**Colores de Roles**:

```css
.role-admin {
  background: #ef4444;
} /* Rojo */
.role-coordinator {
  background: #f59e0b;
} /* Naranja */
.role-staff {
  background: #10b981;
} /* Verde */
.role-client {
  background: #3b82f6;
} /* Azul */
```

**Estados**:

```css
.status-active {
  color: #10b981;
}
.status-inactive {
  color: #ef4444;
  opacity: 0.6;
}
```

### Responsive Design

- Tabla scrollable en móviles
- Modales adaptables a pantalla
- Touch-friendly buttons (min 44x44px)

## Casos de Uso

### 1. Onboarding de Nuevo Coordinador

```
Pasos:
1. Admin → Panel de usuarios → Crear usuario
2. Llenar formulario:
   - Email: ops-nuevo@brisacubanaclean.com
   - Nombre: María Rodríguez
   - Password: (temporal, cambiar en primer login)
   - Rol: COORDINATOR
3. Guardar → Usuario creado
4. Enviar credenciales por canal seguro
5. Usuario inicia sesión y cambia password
```

### 2. Desactivar Usuario que Deja la Empresa

```
Pasos:
1. Admin → Panel de usuarios
2. Buscar usuario por email/nombre
3. Click en toggle "Activo/Inactivo"
4. Confirmar desactivación
5. Usuario no puede iniciar sesión
6. Datos históricos preservados
```

### 3. Promoción de STAFF a COORDINATOR

```
Pasos:
1. Admin → Panel de usuarios
2. Click en "Editar" del usuario
3. Cambiar rol de STAFF a COORDINATOR
4. Guardar cambios
5. Usuario obtiene nuevos permisos al reautenticarse
```

## Troubleshooting

### Error: "Email ya registrado"

**Causa**: Email duplicado en la base de datos

**Solución**:

```sql
-- Verificar emails duplicados
SELECT email, COUNT(*)
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;
```

### Error: "No puedes cambiar tu propio rol"

**Causa**: Admin intentando modificar su propio rol

**Solución**: Solicitar a otro admin que haga el cambio

### Usuario inactivo puede iniciar sesión

**Causa**: Middleware de auth no valida `isActive`

**Solución**: Agregar validación en middleware:

```typescript
if (!user.isActive) {
  return c.json({ error: "Cuenta desactivada" }, 403);
}
```

## Roadmap

### Futuras Mejoras

- [ ] **Auditoría completa**: Log de todos los cambios de usuarios
- [ ] **Búsqueda y filtros**: Por rol, estado, fecha de creación
- [ ] **Paginación**: Para sistemas con muchos usuarios
- [ ] **Exportar usuarios**: CSV/Excel con datos de usuarios
- [ ] **Invitaciones por email**: Sistema de invites con links únicos
- [ ] **2FA obligatorio**: Para admins y coordinadores
- [ ] **Password reset**: Link de recuperación por email
- [ ] **Historial de sesiones**: Ver últimos logins por usuario
- [ ] **Bulk operations**: Activar/desactivar múltiples usuarios
- [ ] **Permisos granulares**: Más allá de roles (RBAC completo)

## Referencias

- [Prisma User Model](../apps/api/prisma/schema.prisma)
- [API Routes](../apps/api/src/routes/users.ts)
- [Frontend Actions](../apps/web/app/actions.ts)
- [Admin Panel UI](../apps/web/components/admin-panel.tsx)
- [API Tests](../apps/api/src/app.test.ts)
