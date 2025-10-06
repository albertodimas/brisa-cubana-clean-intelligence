# Sentry Error Tracking & Performance Monitoring Setup

This guide covers the complete setup and configuration of Sentry for error tracking and performance monitoring in the Brisa Cubana Clean Intelligence platform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [Production Deployment](#production-deployment)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Sentry is integrated across both the API (Hono) and Web (Next.js) applications to provide:

- **Error Tracking**: Automatic capture and reporting of application errors
- **Performance Monitoring**: Track slow requests, database queries, and API calls
- **Session Replay**: Visual reproduction of user sessions (Web only)
- **Profiling**: CPU and memory profiling for performance insights
- **Source Maps**: Readable stack traces in production
- **Breadcrumbs**: Detailed context leading up to errors

## Architecture

### API (Hono + Node.js)

- **Location**: `apps/api/src/telemetry/sentry.ts`
- **Package**: `@sentry/node` + `@sentry/profiling-node`
- **Integration**: Global error handler in `apps/api/src/app.ts`
- **Features**:
  - Error tracking with stack traces
  - Performance monitoring (5% sample rate in production)
  - CPU profiling for performance bottlenecks
  - Request context capture
  - Automatic error sanitization (removes auth headers, cookies)

### Web (Next.js)

- **Locations**:
  - Client: `apps/web/sentry.client.config.ts`
  - Server: `apps/web/sentry.server.config.ts`
  - Edge: `apps/web/sentry.edge.config.ts`
  - Instrumentation: `apps/web/instrumentation.ts`
- **Package**: `@sentry/nextjs`
- **Integration**: Automatic via Next.js instrumentation hook
- **Features**:
  - Client-side error tracking
  - Server-side error tracking
  - Session Replay (10% of sessions, 100% with errors)
  - Performance monitoring (10% sample rate in production)
  - Browser profiling
  - React component error boundaries
  - Source maps upload via webpack plugin

## Installation

### Prerequisites

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create two projects (recommended):
   - `brisa-api` for the API
   - `brisa-web` for the Web app

### Install Dependencies

Dependencies are already configured in package.json files. To install:

```bash
# Install all dependencies
pnpm install

# Or install separately
pnpm --filter=@brisa/api add @sentry/node @sentry/profiling-node
pnpm --filter=web add @sentry/nextjs
```

## Configuration

### API Configuration

The API Sentry configuration is located at `apps/api/src/telemetry/sentry.ts`:

**Key Features:**

- Environment-based sample rates (100% dev, 5% production)
- Automatic error sanitization (removes sensitive headers)
- Filters out expected errors (network errors, 4xx client errors)
- Includes server name and service identification
- Debug mode in development

### Web Configuration

The Web app has three Sentry configurations:

**1. Client (`sentry.client.config.ts`)**

- Browser error tracking
- Session Replay with privacy controls
- Browser tracing and profiling
- PII sanitization

**2. Server (`sentry.server.config.ts`)**

- Server-side error tracking
- Performance monitoring
- Request context capture

**3. Edge (`sentry.edge.config.ts`)**

- Edge runtime support
- Lower sample rates (5% production)

**4. Instrumentation (`instrumentation.ts`)**

- Automatic initialization via Next.js
- Runtime-specific loading (Node.js vs Edge)

### Error Boundary

A custom error boundary provides a user-friendly error UI:

**Location**: `apps/web/src/components/sentry-error-boundary.tsx`

**Features**:

- Graceful error UI in Spanish
- Development mode error details
- Retry functionality
- Auto-reports errors to Sentry

## Environment Variables

### API (.env)

```bash
# Required
SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"
SENTRY_ENVIRONMENT="production"  # or "development", "staging"

# Optional (for source maps upload)
SENTRY_AUTH_TOKEN="sntrys_[token]"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="brisa-api"
SENTRY_RELEASE="1.0.0"  # Usually set by CI/CD

# Service identification
SERVICE_NAME="brisa-api"
```

### Web (.env.local or .env)

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"

# Optional (for source maps upload in production builds)
SENTRY_AUTH_TOKEN="sntrys_[token]"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="brisa-web"
NEXT_PUBLIC_SENTRY_RELEASE="1.0.0"  # Usually set by CI/CD
```

### Getting Your DSN

1. Go to [Sentry Settings](https://sentry.io/settings/projects/)
2. Select your project
3. Navigate to "Client Keys (DSN)"
4. Copy the DSN value

### Creating an Auth Token (for source maps)

1. Go to [Sentry Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Click "Create New Token"
3. Select scopes: `project:releases`, `project:write`
4. Copy the token (starts with `sntrys_`)

## Features

### Error Tracking

Errors are automatically captured and sent to Sentry:

**API:**

```typescript
// Automatic capture via error handler
throw new AppError("Something went wrong", 500);

// Manual capture
import { Sentry } from "@/telemetry/sentry";
Sentry.captureException(error);
```

**Web:**

```typescript
// Automatic via Error Boundary
// Manual capture
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error);
```

### Performance Monitoring

**Sample Rates:**

- Development: 100% (all requests traced)
- Production: 5-10% (to reduce overhead)

**What's Tracked:**

- API request duration
- Database query performance
- External API calls
- Browser navigation timing
- React component render times

### Session Replay (Web Only)

Visual reproduction of user sessions with errors:

- **Privacy**: All text masked, all media blocked
- **Sample Rates**:
  - Normal sessions: 10%
  - Sessions with errors: 100%

### Profiling

CPU and memory profiling for performance insights:

- **API**: Node.js profiling via `@sentry/profiling-node`
- **Web**: Browser profiling via `@sentry/nextjs`

### Error Sanitization

Automatic removal of sensitive data:

- Authorization headers
- Cookies
- User PII (keeps only user ID)

### Ignored Errors

Common noise filtered out:

- Browser errors (ResizeObserver, hydration mismatches)
- Network errors (ECONNREFUSED, timeouts)
- Expected client errors (4xx responses)

## Production Deployment

### 1. Set Environment Variables

**Vercel (Web):**

```bash
vercel env add NEXT_PUBLIC_SENTRY_DSN
vercel env add NEXT_PUBLIC_SENTRY_ENVIRONMENT production
vercel env add SENTRY_AUTH_TOKEN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
```

**Railway (API):**

```bash
railway variables set SENTRY_DSN="https://..."
railway variables set SENTRY_ENVIRONMENT=production
railway variables set SERVICE_NAME=brisa-api
```

### 2. Enable Source Maps Upload

Source maps are automatically uploaded during production builds when:

1. `SENTRY_AUTH_TOKEN` is set
2. `NODE_ENV=production`
3. `NEXT_PUBLIC_SENTRY_DSN` is set (Web)
4. `SENTRY_DSN` is set (API)

**Web (Next.js):**

- Source maps upload via `withSentryConfig` in `next.config.ts`
- Automatic during `next build`

**API (Node.js):**

- Manual upload recommended via CI/CD
- Add to build script:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps
sentry-cli releases new "$SENTRY_RELEASE"
sentry-cli releases files "$SENTRY_RELEASE" upload-sourcemaps ./dist
sentry-cli releases finalize "$SENTRY_RELEASE"
```

### 3. Set Release Version

**CI/CD Example (GitHub Actions):**

```yaml
env:
  SENTRY_RELEASE: ${{ github.sha }}
  NEXT_PUBLIC_SENTRY_RELEASE: ${{ github.sha }}
```

**Vercel:**

```bash
# Automatically set by Vercel
NEXT_PUBLIC_SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA
```

### 4. Verify Installation

After deployment:

1. Trigger a test error
2. Check Sentry dashboard
3. Verify source maps are working (readable stack traces)

## Best Practices

### 1. Use Appropriate Sample Rates

```typescript
// Low traffic: 100%
tracesSampleRate: 1.0;

// Medium traffic: 25%
tracesSampleRate: 0.25;

// High traffic: 5-10%
tracesSampleRate: 0.05;
```

### 2. Add Context to Errors

```typescript
Sentry.captureException(error, {
  tags: {
    component: "BookingService",
    operation: "createBooking",
  },
  contexts: {
    booking: {
      id: bookingId,
      propertyId: propertyId,
    },
  },
});
```

### 3. Set User Context (without PII)

```typescript
Sentry.setUser({
  id: user.id,
  // Don't include email, name, or other PII
});
```

### 4. Use Breadcrumbs for Context

```typescript
Sentry.addBreadcrumb({
  category: "payment",
  message: "Processing Stripe payment",
  level: "info",
  data: { amount: 100, currency: "USD" },
});
```

### 5. Handle Sensitive Data

```typescript
// Good: Sanitize before capture
const sanitizedError = {
  ...error,
  request: {
    ...error.request,
    headers: undefined, // Remove headers
  },
};
Sentry.captureException(sanitizedError);
```

### 6. Monitor Performance

```typescript
// Custom transactions
const transaction = Sentry.startTransaction({
  op: "task",
  name: "Process CleanScore Report",
});

// ... do work ...

transaction.finish();
```

## Troubleshooting

### Errors Not Appearing in Sentry

**Check:**

1. DSN is correctly set
2. Environment is not "development" (errors filtered out)
3. Error is not in `ignoreErrors` list
4. Network connectivity to Sentry

**Debug:**

```bash
# Enable Sentry debug mode
SENTRY_DEBUG=true pnpm dev
```

### Source Maps Not Working

**Check:**

1. `SENTRY_AUTH_TOKEN` is set in production
2. Release version matches between build and Sentry
3. Source maps are uploaded successfully
4. File paths match between uploaded maps and errors

**Debug:**

```bash
# Verify source maps upload
sentry-cli releases files $SENTRY_RELEASE list
```

### High Event Volume

**Solutions:**

1. Reduce `tracesSampleRate`
2. Add more entries to `ignoreErrors`
3. Use `beforeSend` to filter events
4. Increase rate limits in Sentry project settings

### Session Replay Not Recording

**Check:**

1. Web app only (not available for API)
2. `replaysSessionSampleRate` > 0
3. User granted permissions (if blocked by browser)
4. Privacy settings not blocking Sentry

## Additional Resources

- [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

## Support

For issues or questions:

1. Check [Sentry Status](https://status.sentry.io/)
2. Review [Sentry Documentation](https://docs.sentry.io/)
3. Contact team lead or DevOps
