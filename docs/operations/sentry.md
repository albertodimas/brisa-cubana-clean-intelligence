# Sentry Integration - Error Tracking & Monitoring

## Overview

Brisa Cubana Clean Intelligence uses Sentry for error tracking, performance monitoring, and observability across both the Next.js web application and the Hono API.

## Architecture

### Frontend (Next.js 15)

- **@sentry/nextjs** v10.18.0
- **Environments**: Client-side, Server-side, Edge runtime
- **Features**:
  - Automatic error capture
  - Session Replay (10% sample rate, 100% on errors)
  - Performance tracing (10% in production)
  - React Server Components error tracking via `onRequestError`

### Backend (Hono API)

- **@sentry/node** + **@sentry/profiling-node**
- **Features**:
  - Server error capture (HTTP 500+)
  - Performance profiling (10% in production)
  - Request context capture
  - Automatic PII detection

## Configuration

### Environment Variables

Add these environment variables to your Vercel project:

#### Web Application

```bash
NEXT_PUBLIC_SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/789012"
```

#### API

```bash
SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/789012"
```

**Note**: Leave these empty for local development. Sentry will not initialize if DSN is not provided.

### Sample Rates

#### Production

- **Traces**: 10% (configurable via `tracesSampleRate`)
- **Profiles**: 10% (configurable via `profilesSampleRate`)
- **Session Replay**: 10% of sessions, 100% on errors

#### Development

- **Traces**: 100%
- **Profiles**: 100%
- **Session Replay**: 10% of sessions, 100% on errors

## Files and Structure

### Web Application (`apps/web/`)

```
apps/web/
├── sentry.client.config.ts     # Client-side Sentry init
├── sentry.server.config.ts     # Server-side Sentry init
├── sentry.edge.config.ts       # Edge runtime Sentry init
└── instrumentation.ts          # Next.js instrumentation hooks
```

**instrumentation.ts** includes:

- `register()`: Loads Sentry config based on runtime (nodejs/edge)
- `onRequestError()`: Captures errors from React Server Components with full context

### API (`apps/api/`)

```
apps/api/
└── src/
    ├── lib/
    │   └── sentry.ts          # Sentry initialization
    └── app.ts                 # Global error handler integration
```

**Error Handling Strategy**:

- Only captures errors with HTTP status >= 500 (server errors)
- Includes request method, URL, and headers in context
- 4xx errors (client errors) are logged but not sent to Sentry

## Setup Instructions

### 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project:
   - **Platform**: Next.js (for web)
   - **Platform**: Node.js (for API)
3. Copy the DSN from each project

### 2. Configure Vercel Environment Variables

Add the environment variables to all three Vercel environments:

```bash
# Via Vercel Dashboard
Production, Preview, Development:
  NEXT_PUBLIC_SENTRY_DSN = "https://..." (from Sentry web project)
  SENTRY_DSN = "https://..." (from Sentry API project)
```

Or via CLI:

```bash
# Web DSN (public)
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add NEXT_PUBLIC_SENTRY_DSN preview
vercel env add NEXT_PUBLIC_SENTRY_DSN development

# API DSN (secret)
vercel env add SENTRY_DSN production
vercel env add SENTRY_DSN preview
vercel env add SENTRY_DSN development
```

### 3. Deploy and Verify

1. Push code to GitHub (triggers CI/CD)
2. Verify deployment on Vercel
3. Trigger test errors:
   - Web: Visit `/sentry-example-page` (if implemented)
   - API: Call `/api/health` with invalid database (causes 500 error)
4. Check Sentry dashboard for captured errors

## Testing Locally

**Recommended**: Do not configure Sentry DSN for local development. The application will log a warning and continue without Sentry:

```
SENTRY_DSN not configured, Sentry will not be initialized
```

If you want to test Sentry locally:

1. Create a `.env.local` file (never commit this):

   ```bash
   NEXT_PUBLIC_SENTRY_DSN="https://your-dev-key@..."
   SENTRY_DSN="https://your-dev-key@..."
   ```

2. Start development servers:

   ```bash
   pnpm dev
   ```

3. Trigger test errors and verify in Sentry dashboard

## Captured Data

### Error Events

Every error captured includes:

- **Error message and stack trace**
- **User context** (if authenticated):
  - User ID
  - Email (if `sendDefaultPii` is enabled)
- **Request context**:
  - HTTP method and URL
  - Headers (referer, user-agent)
  - Request body (if `sendDefaultPii` is enabled)
- **Environment**:
  - `production`, `preview`, or `development`
- **Next.js specific** (web only):
  - Router kind (App Router / Pages Router)
  - Route path
  - Route type (render / route / action / middleware)

### Performance Traces

Sampled at 10% in production:

- API response times
- Database query durations
- External API calls
- React component render times (client-side)

### Session Replay (Web Only)

Captures user session recordings:

- Mouse movements, clicks, scrolls
- Form inputs (masked by default)
- Console logs
- Network requests
- **Privacy**: All text and media are masked by default

## Privacy and PII

### Current Configuration

- **sendDefaultPii**: `true` on API (captures request headers and IPs)
- **maskAllText**: `true` in Session Replay (protects user privacy)
- **blockAllMedia**: `true` in Session Replay (no images/videos captured)

### Sensitive Data

Sentry automatically scrubs:

- Passwords
- Credit card numbers
- Social security numbers
- API keys in headers (Authorization, etc.)

**Important**: Never log sensitive business data (customer emails, addresses, etc.) in error messages.

## Performance Impact

- **Client bundle size**: +66KB gzipped (@sentry/nextjs)
- **API overhead**: ~1-2ms per request (when sampling is disabled)
- **Memory**: ~10-15MB per process

## Troubleshooting

### Errors not appearing in Sentry

1. Check DSN is correctly set in Vercel environment variables
2. Verify environment variables are available at runtime:

   ```bash
   # In Web container
   echo $NEXT_PUBLIC_SENTRY_DSN

   # In API container
   echo $SENTRY_DSN
   ```

3. Check Sentry project status (may be disabled or over quota)
4. Verify error is >= 500 status (4xx errors are not captured)

### Too many events / over quota

1. Reduce `tracesSampleRate` to 0.05 (5%) or 0.01 (1%)
2. Reduce `profilesSampleRate` to 0.05 (5%) or 0.01 (1%)
3. Add error filters in Sentry dashboard (Inbound Filters)
4. Upgrade Sentry plan if needed

### Session Replay not working

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set (client-side only)
2. Check browser console for Sentry SDK errors
3. Verify Session Replay is enabled in Sentry project settings
4. Note: Session Replay only captures 10% of sessions by default

## Next Steps

1. **Set up Alerts**: Configure alerts in Sentry for critical errors
2. **Add Performance Budgets**: Set thresholds for acceptable performance
3. **Create Dashboards**: Build custom dashboards for key metrics
4. **Integrate with Slack**: Get notifications for new errors in Slack
5. **Set up Releases**: Track errors by deployment (requires additional config)

## References

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Node.js Docs](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
