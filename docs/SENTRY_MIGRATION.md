# Sentry Migration Guide

This guide helps migrate from the old SentryInit component to the new Next.js instrumentation-based Sentry setup.

## What Changed

### Old Setup (Previous)

- Manual initialization via `<SentryInit />` component
- Client-side only initialization
- Limited configuration options
- No server-side monitoring
- No source maps upload
- Using `@sentry/react` package

### New Setup (Current)

- Automatic initialization via Next.js instrumentation hook
- Client and server-side monitoring
- Enhanced configuration with profiling and session replay
- Automatic source maps upload in production
- Using `@sentry/nextjs` package
- Error boundary with custom UI

## Migration Steps

### 1. Update Dependencies

**Old package.json:**

```json
{
  "dependencies": {
    "@sentry/react": "10.17.0"
  }
}
```

**New package.json:**

```json
{
  "dependencies": {
    "@sentry/nextjs": "10.17.0"
  }
}
```

**Action:**

```bash
# Already updated in package.json
pnpm install
```

### 2. Remove Old Component

**Old file (REMOVED):**

- `apps/web/src/components/sentry-init.tsx`

**New files (CREATED):**

- `apps/web/sentry.client.config.ts`
- `apps/web/sentry.server.config.ts`
- `apps/web/sentry.edge.config.ts`
- `apps/web/instrumentation.ts`
- `apps/web/src/components/sentry-error-boundary.tsx`

**Action:**

```bash
# The old file can be safely deleted
rm apps/web/src/components/sentry-init.tsx
```

### 3. Update Layout

**Old layout.tsx:**

```tsx
import { SentryInit } from "@/components/sentry-init";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SentryInit />
        {children}
      </body>
    </html>
  );
}
```

**New layout.tsx:**

```tsx
import { SentryErrorBoundary } from "@/components/sentry-error-boundary";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SentryErrorBoundary>{children}</SentryErrorBoundary>
      </body>
    </html>
  );
}
```

**Action:**
✅ Already updated in `apps/web/src/app/layout.tsx`

### 4. Update Next.js Config

**Old next.config.ts:**

```typescript
const nextConfig: NextConfig = {
  // ... config
};

export default nextConfig;
```

**New next.config.ts:**

```typescript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    instrumentationHook: true, // Enable instrumentation
  },
  // ... config
};

export default process.env.NODE_ENV === "production" &&
process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      hideSourceMaps: true,
    })
  : nextConfig;
```

**Action:**
✅ Already updated in `apps/web/next.config.ts`

### 5. Update Environment Variables

**Old .env:**

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
```

**New .env:**

```bash
# Client & Server
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development

# Source Maps (Production only)
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org
SENTRY_PROJECT=brisa-web
```

**Action:**

1. Add missing variables to your `.env.local`
2. Get auth token from: https://sentry.io/settings/account/api/auth-tokens/
3. Add to production environment (Vercel/Railway)

### 6. API Updates

**Enhanced API Configuration:**

- Added profiling support
- Enhanced error sanitization
- Better filtering of noise
- Added beforeSend hook

**Action:**
✅ Already updated in `apps/api/src/telemetry/sentry.ts`

**New dependency:**

```bash
# Already added to package.json
pnpm --filter=@brisa/api add @sentry/profiling-node
```

## Testing Migration

### 1. Test Client-Side Errors

```tsx
// Add to any page
<button
  onClick={() => {
    throw new Error("Test error");
  }}
>
  Test Sentry
</button>
```

### 2. Test Server-Side Errors

**API:**

```bash
curl http://localhost:3001/api/sentry/test-error
```

**Web Server Action:**

```typescript
// In a server action
export async function testServerError() {
  "use server";
  throw new Error("Server test error");
}
```

### 3. Test Error Boundary

Trigger an error and verify the custom error UI appears with:

- Spanish error message
- Retry button
- Go to home button

### 4. Verify Source Maps (Production)

1. Deploy to production
2. Trigger an error
3. Check Sentry dashboard
4. Stack traces should show original source code (not minified)

## Rollback Plan

If you need to rollback to the old setup:

```bash
# 1. Restore old package
pnpm --filter=web remove @sentry/nextjs
pnpm --filter=web add @sentry/react@10.17.0

# 2. Restore old component
git restore apps/web/src/components/sentry-init.tsx

# 3. Restore old layout
git restore apps/web/src/app/layout.tsx

# 4. Remove new files
rm apps/web/sentry.*.config.ts
rm apps/web/instrumentation.ts
rm apps/web/src/components/sentry-error-boundary.tsx

# 5. Restore old next.config
git restore apps/web/next.config.ts
```

## Benefits of New Setup

1. **Better Performance Monitoring**
   - Server-side tracing
   - Database query monitoring
   - API call tracking

2. **Session Replay**
   - Visual reproduction of user sessions
   - See what users did before errors

3. **Enhanced Privacy**
   - Automatic PII sanitization
   - Configurable data masking

4. **Source Maps**
   - Automatic upload in production
   - Readable stack traces

5. **Better Error Grouping**
   - React component annotations
   - Enhanced error context

6. **Custom Error UI**
   - User-friendly error messages
   - Retry functionality
   - Better UX

## Support

For questions or issues:

- Check: [Sentry Setup Guide](./SENTRY_SETUP.md)
- Check: [Quick Start](./SENTRY_QUICKSTART.md)
- Contact: Team lead or DevOps
