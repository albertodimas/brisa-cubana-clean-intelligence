# Sentry Quick Start Guide

## 1. Setup (5 minutes)

### Get Your DSN

1. Go to [sentry.io](https://sentry.io) and create/login to your account
2. Create projects: `brisa-api` and `brisa-web`
3. Get DSN from: Settings → Projects → [Your Project] → Client Keys (DSN)

### Configure Environment Variables

**API (`.env` in `apps/api/`):**

```bash
SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"
SENTRY_ENVIRONMENT="development"
SERVICE_NAME="brisa-api"
```

**Web (`.env.local` in `apps/web/`):**

```bash
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="development"
```

### Install Dependencies

```bash
pnpm install
```

That's it! Sentry is now active.

## 2. Common Usage

### Manual Error Capture

**API:**

```typescript
import { Sentry } from "@/telemetry/sentry";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "BookingService" },
    contexts: { booking: { id: "123" } },
  });
  throw error;
}
```

**Web:**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.captureException(error);
```

### Add User Context

```typescript
Sentry.setUser({ id: user.id });
```

### Add Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: "payment",
  message: "Processing payment",
  level: "info",
});
```

### Custom Transactions

```typescript
const transaction = Sentry.startTransaction({
  op: "task",
  name: "Generate CleanScore",
});

// ... do work ...

transaction.finish();
```

## 3. Testing

### Test Error Capture

**API:**

```bash
curl http://localhost:3001/api/test-error
```

**Web:**
Add a button that throws an error:

```typescript
<button onClick={() => { throw new Error('Test error'); }}>
  Test Sentry
</button>
```

### Verify in Sentry

1. Go to sentry.io
2. Navigate to Issues
3. See your test error appear

## 4. Production Setup

### Required Variables

**Vercel (Web):**

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=sntrys_...  # For source maps
SENTRY_ORG=your-org
SENTRY_PROJECT=brisa-web
```

**Railway (API):**

```bash
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
SERVICE_NAME=brisa-api
```

### Get Auth Token (for source maps)

1. Go to [Sentry Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Create token with `project:releases` and `project:write` scopes
3. Copy token (starts with `sntrys_`)

## 5. Monitoring Dashboard

### Key Metrics

- **Error Rate**: Issues → Overview
- **Performance**: Performance → Overview
- **Session Replay**: Replays (Web only)

### Alert Rules

1. Go to Alerts → Create Alert Rule
2. Select: "When an issue is first seen"
3. Configure notification (Slack, Email)

## 6. Troubleshooting

### Errors not showing?

```bash
# Enable debug mode
SENTRY_DEBUG=true pnpm dev
```

### Source maps not working?

Check:

- `SENTRY_AUTH_TOKEN` is set
- Release version matches
- Files uploaded successfully

### Too many events?

Reduce sample rate in config files:

```typescript
tracesSampleRate: 0.05; // 5% instead of 100%
```

## Quick Links

- [Full Setup Guide](./SENTRY_SETUP.md)
- [Sentry Dashboard](https://sentry.io)
- [Sentry Docs](https://docs.sentry.io)
- [API Config](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/api/src/telemetry/sentry.ts)
- [Web Config](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/web/sentry.client.config.ts)
