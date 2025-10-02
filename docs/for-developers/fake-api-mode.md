# Fake API Data Mode

Complete guide for running the Next.js web app with simulated API responses for development and testing without backend dependencies.

## Overview

Fake API Mode allows you to:

- ✅ Run E2E tests without real backend
- ✅ Develop frontend features independently
- ✅ Test SSR/ISR behavior in isolation
- ✅ Run CI/CD pipelines faster
- ✅ Demo features without database setup

## Activation

Set **all three** environment variables:

```bash
export DYLD_USE_FAKE_API_DATA=1
export USE_FAKE_API_DATA=1
export NEXT_PUBLIC_USE_FAKE_API_DATA=1
```

### In Different Contexts

**Local Development**:

```bash
# .env.local
DYLD_USE_FAKE_API_DATA=1
USE_FAKE_API_DATA=1
NEXT_PUBLIC_USE_FAKE_API_DATA=1
```

**E2E Tests** (already configured):

```bash
pnpm test:e2e
```

**Docker/Railway**:

```dockerfile
ENV DYLD_USE_FAKE_API_DATA=1
ENV USE_FAKE_API_DATA=1
ENV NEXT_PUBLIC_USE_FAKE_API_DATA=1
```

## How It Works

### 4 Implementation Layers

1. **Authentication Layer** (`apps/web/src/server/auth/config.ts`)
   - NextAuth Credentials provider checks fake mode
   - Uses in-memory user database from `fake.ts`
   - Generates fake JWT tokens (format: `fake.{base64url_payload}`)

2. **Dashboard Data Layer** (`apps/web/src/server/api/client.ts`)
   - `getDashboardData()` returns fake data when enabled
   - Builds realistic dashboard with bookings, properties, services
   - Role-based data (admin sees more than client)

3. **Page Components** (`apps/web/src/app/dashboard/`)
   - `page.tsx` - Dashboard overview with fake data
   - `bookings/page.tsx` - Bookings list with fake data
   - `manage-bookings.tsx` - Fixed useSession() destructuring for SSR

4. **API Client Layer** (`apps/web/src/server/utils/fake.ts`)
   - Core detection: `isFakeDataEnabled()`
   - Demo user database with hashed passwords
   - Fake token generation and validation

## Test Users

```typescript
// Admin
email: "admin@brisacubanaclean.com";
password: "Admin123!";

// Staff
email: "staff@brisacubanaclean.com";
password: "Staff123!";

// Client
email: "client@brisacubanaclean.com";
password: "Client123!";
```

## E2E Test Results

All 15 Playwright tests pass with fake mode:

```
✅ Authentication (4 tests)
   - Sign in page display
   - Successful login redirect
   - Invalid credentials validation
   - Protected route redirect

✅ Dashboard (4 tests)
   - Dashboard overview display
   - Navigate to bookings page
   - Navigate to properties page
   - User info display

✅ Booking Flow (3 tests)
   - Create property navigation
   - Bookings list page display
   - Create booking navigation

✅ Dashboard Alerts (2 tests)
   - Alerts visible for admin/staff
   - Alerts hidden for clients

✅ Home Page (2 tests)

Total: 15 passed in ~5.2s
```

## Files Modified

1. `apps/web/src/server/utils/fake.ts` - Core fake data utilities
2. `apps/web/src/server/api/fake-dashboard.ts` - Dashboard data builder
3. `apps/web/src/server/api/client.ts` - Dashboard API client
4. `apps/web/src/server/auth/config.ts` - NextAuth with fake auth
5. `apps/web/src/app/dashboard/page.tsx` - Dashboard page
6. `apps/web/src/app/dashboard/bookings/page.tsx` - Bookings page
7. `apps/web/src/app/dashboard/manage-bookings.tsx` - Fixed useSession
8. `apps/api/src/lib/token.ts` - Fake token decoding support
9. `playwright.config.ts` - Environment variables injection
10. `package.json` - test:e2e script with env vars

## Deployment with Fake Mode

### Railway Deployment

```bash
# Set environment variables in Railway dashboard
DYLD_USE_FAKE_API_DATA=1
USE_FAKE_API_DATA=1
NEXT_PUBLIC_USE_FAKE_API_DATA=1

# Or via CLI
railway variables set DYLD_USE_FAKE_API_DATA=1
railway variables set USE_FAKE_API_DATA=1
railway variables set NEXT_PUBLIC_USE_FAKE_API_DATA=1
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:24-alpine

# Enable fake mode
ENV DYLD_USE_FAKE_API_DATA=1
ENV USE_FAKE_API_DATA=1
ENV NEXT_PUBLIC_USE_FAKE_API_DATA=1

# ... rest of Dockerfile
```

## Limitations

### What Works ✅

- Authentication (login/logout)
- Dashboard data display
- Bookings list
- Properties list
- Role-based UI (admin/staff/client)
- E2E test suite

### What Doesn't Work ❌

- Creating/updating resources (no persistence)
- Real payment processing
- Email/SMS notifications
- File uploads
- Real-time features
- Integration testing with real database
- Load/performance testing
- Payment processing validation

## Troubleshooting

### Issue: Tests fail with CredentialsSignin

**Solution**: Ensure all 3 env vars are set in both build and runtime

### Issue: Dashboard shows "Application error"

**Solution**: Check that `useSession()` is not destructured directly

```typescript
// ❌ Wrong
const { data: session } = useSession();

// ✅ Correct
const sessionResult = useSession();
const session = sessionResult?.data;
```

### Issue: No bookings displayed in fake mode

**Solution**: Verify `isFakeDataEnabled()` returns true

```bash
# Check logs for:
# [fake-mode] Enabled via environment variables
```

### Issue: Build fails with type errors

**Solution**: Ensure fake data matches TypeScript interfaces exactly

## Development Tips

1. **Use for rapid frontend iteration** - No need to wait for API
2. **Combine with Storybook** - Component development + fake data
3. **Test edge cases** - Modify fake data to test empty states, errors
4. **CI/CD optimization** - Run E2E tests without database setup
5. **Demo mode** - Show features to stakeholders without backend

## Implementation Date

- **Created**: October 2, 2025
- **E2E Success Rate**: 100% (15/15 tests)
- **Implementation Time**: ~2 hours

## Related Documentation

- [Testing Guide](testing.md) - Full testing documentation
- [Environment Variables](environment-variables.md) - All env var reference
- [Local Testing Workflow](../development/local-testing-workflow.md) - Development workflows
