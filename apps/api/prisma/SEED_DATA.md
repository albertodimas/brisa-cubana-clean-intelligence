# Seed Data Reference

This document describes all the seed data created by `pnpm db:seed` for development and testing.

## 🔑 Test Users

Credenciales por defecto generadas por el seed:

| Email                       | Contraseña  | Rol    | Nombre          | Teléfono        | Caso de uso                                |
| --------------------------- | ----------- | ------ | --------------- | --------------- | ------------------------------------------ |
| admin@brisacubanaclean.com  | Admin123!   | ADMIN  | Admin User      | +1-305-555-0001 | Acceso completo y gestión de usuarios      |
| staff@brisacubanaclean.com  | Staff123!   | STAFF  | Staff Member    | +1-305-555-0002 | Gestión operativa y conciliaciones         |
| client@brisacubanaclean.com | Client123!  | CLIENT | Maria Rodriguez | +1-305-555-0100 | Cliente residencial                        |
| carlos.mendez@example.com   | Manager123! | CLIENT | Carlos Mendez   | +1-305-555-0200 | Property manager con múltiples propiedades |

### Login Example

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"Admin123!"}'
```

## 🏢 Properties

### 1. Brickell Luxury Apartment

- **ID**: `prop-residential-1`
- **Owner**: Maria Rodriguez (client@brisacubanaclean.com)
- **Type**: RESIDENTIAL
- **Address**: 1234 Brickell Ave, Unit 2501, Miami, FL 33131
- **Size**: 1,200 sq ft

### 2. Wynwood Vacation Rental

- **ID**: `prop-vacation-1`
- **Owner**: Carlos Mendez (carlos.mendez@example.com)
- **Type**: VACATION_RENTAL
- **Address**: 567 NW 2nd Ave, Miami, FL 33127
- **Size**: 900 sq ft

### 3. Downtown Miami Office

- **ID**: `prop-office-1`
- **Owner**: Carlos Mendez (carlos.mendez@example.com)
- **Type**: OFFICE
- **Address**: 100 SE 2nd Street, Suite 4000, Miami, FL 33131
- **Size**: 3,000 sq ft

### 4. South Beach Boutique Hotel

- **ID**: `prop-hospitality-1`
- **Owner**: Carlos Mendez (carlos.mendez@example.com)
- **Type**: HOSPITALITY
- **Address**: 1500 Ocean Drive, Miami Beach, FL 33139
- **Size**: 15,000 sq ft

## 🧹 Services

| ID                | Name                     | Price   | Duration | Description                                              |
| ----------------- | ------------------------ | ------- | -------- | -------------------------------------------------------- |
| basic-clean-1     | Limpieza Básica          | $89.99  | 2h       | Limpieza estándar de espacios residenciales y oficinas   |
| deep-clean-1      | Limpieza Profunda        | $149.99 | 3h       | Limpieza detallada incluyendo áreas difíciles            |
| move-in-out-1     | Move In/Out              | $199.99 | 4h       | Limpieza completa para mudanzas                          |
| vacation-rental-1 | Turnover Vacation Rental | $119.99 | 1.5h     | Limpieza express entre huéspedes con reporte fotográfico |

## 📅 Sample Bookings

### 1. Completed Booking

- **ID**: `booking-completed-1`
- **Client**: Maria Rodriguez
- **Property**: Brickell Luxury Apartment
- **Service**: Limpieza Básica ($89.99)
- **Scheduled**: 2 days ago
- **Status**: COMPLETED
- **Payment**: PAID

### 2. Confirmed Booking (Tomorrow)

- **ID**: `booking-confirmed-1`
- **Client**: Maria Rodriguez
- **Property**: Brickell Luxury Apartment
- **Service**: Limpieza Profunda ($149.99)
- **Scheduled**: Tomorrow
- **Status**: CONFIRMED
- **Payment**: PENDING

### 3. Pending Booking (Next Week)

- **ID**: `booking-pending-1`
- **Client**: Carlos Mendez
- **Property**: Wynwood Vacation Rental
- **Service**: Turnover Vacation Rental ($119.99)
- **Scheduled**: 7 days from now
- **Status**: PENDING
- **Payment**: PENDING

### 4. Office Booking (Next Week)

- **ID**: `booking-office-1`
- **Client**: Carlos Mendez
- **Property**: Downtown Miami Office
- **Service**: Limpieza Profunda ($299.99)
- **Scheduled**: 7 days from now
- **Status**: CONFIRMED
- **Payment**: PAID

## 🧪 Testing Scenarios

### Test User Permissions

```bash
# Admin can access all endpoints
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"Admin123!"}' \
  | jq -r '.token')

# List all bookings (admin/staff only)
curl http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

### Test Property Types

Each property type represents a different use case:

- **RESIDENTIAL**: Individual homeowners
- **VACATION_RENTAL**: Airbnb/VRBO managers
- **OFFICE**: Commercial clients
- **HOSPITALITY**: Hotels and large venues

### Test Booking Statuses

The seed data includes all booking statuses for UI testing:

- **PENDING**: Awaiting confirmation
- **CONFIRMED**: Scheduled and confirmed
- **COMPLETED**: Service completed
- Also available in code: IN_PROGRESS, CANCELLED

## 🔄 Re-seeding

To reset the database with fresh seed data:

```bash
# Reset database (⚠️ deletes all data)
pnpm --filter=@brisa/api prisma migrate reset

# Or just re-seed (idempotent with upsert)
pnpm --filter=@brisa/api db:seed
```

## 📝 Notes

- All bookings use `upsert` so running seed multiple times is safe
- Passwords are properly hashed with bcrypt
- IDs are deterministic for easier testing
- All phone numbers use +1-305-555-xxxx (Miami area, reserved for fiction)
- Dates are relative to current time for realistic testing

## 🎯 Development Tips

1. **Use Prisma Studio** to visually explore seed data:

   ```bash
   pnpm --filter=@brisa/api db:studio
   ```

2. **Test authentication flows** with different role users

3. **Test booking lifecycle**:
   - Create new booking as CLIENT
   - View all bookings as STAFF
   - Update booking status as STAFF
   - View own bookings as CLIENT

4. **Test property management**:
   - Carlos has multiple properties (multi-property manager)
   - Maria has one property (single homeowner)

---

**Last Updated**: September 30, 2025
