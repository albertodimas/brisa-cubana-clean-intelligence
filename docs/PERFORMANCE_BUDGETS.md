# Performance Budgets & Thresholds

## Overview

Este documento define los budgets de performance, métricas clave y thresholds de alerta para Brisa Cubana Clean Intelligence.

## Core Web Vitals

### Objetivos (para p75 de usuarios)

| Métrica                             | Good    | Needs Improvement | Poor    |
| ----------------------------------- | ------- | ----------------- | ------- |
| **LCP** (Largest Contentful Paint)  | ≤ 2.5s  | 2.5s - 4s         | > 4s    |
| **FID** (First Input Delay)         | ≤ 100ms | 100ms - 300ms     | > 300ms |
| **CLS** (Cumulative Layout Shift)   | ≤ 0.1   | 0.1 - 0.25        | > 0.25  |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200ms - 500ms     | > 500ms |

### Configuración de Alertas

```yaml
# En Sentry Performance
LCP Alert:
  Threshold: > 3000ms (p95)
  Action: Investigate and optimize

CLS Alert:
  Threshold: > 0.15
  Action: Fix layout shifts

INP Alert:
  Threshold: > 300ms
  Action: Optimize JS execution
```

## API Performance Budgets

### Response Time Targets

| Endpoint Category         | p50   | p95    | p99    | Max    |
| ------------------------- | ----- | ------ | ------ | ------ |
| **GET** (read operations) | 150ms | 400ms  | 800ms  | 2000ms |
| **POST** (create)         | 300ms | 600ms  | 1200ms | 3000ms |
| **PATCH** (update)        | 250ms | 500ms  | 1000ms | 2500ms |
| **Complex queries**       | 500ms | 1000ms | 2000ms | 5000ms |

### Endpoint-Specific Budgets

```yaml
# Authentication
POST /api/authentication/login:
  p95: 400ms
  reason: "Critical path, users waiting"

# Services (read)
GET /api/services:
  p95: 300ms
  reason: "High frequency, dashboard load"

# Bookings (read)
GET /api/bookings:
  p95: 500ms # Allow more due to filtering
  reason: "Complex queries with joins"

# Bookings (create)
POST /api/bookings:
  p95: 600ms
  reason: "Multiple validations, notifications"

# Users (admin)
GET /api/users:
  p95: 400ms
  reason: "Admin panel, less critical"
```

### Alert Configuration

```typescript
// apps/api/src/config/performance.ts
export const PERFORMANCE_BUDGETS = {
  apiResponseTime: {
    p95: 500, // ms
    p99: 1000, // ms
    alertThreshold: 2000, // Alert if exceeded
  },
  databaseQuery: {
    p95: 200, // ms
    p99: 500, // ms
    alertThreshold: 1000,
  },
  externalApiCall: {
    p95: 1000, // ms
    p99: 2000, // ms
    alertThreshold: 5000,
  },
};
```

## Database Performance

### Query Performance Targets

| Query Type              | p95   | p99   | Max    |
| ----------------------- | ----- | ----- | ------ |
| **Simple SELECT**       | 50ms  | 100ms | 200ms  |
| **JOIN (2-3 tables)**   | 150ms | 300ms | 500ms  |
| **Complex aggregation** | 300ms | 600ms | 1000ms |
| **Full-text search**    | 200ms | 400ms | 800ms  |

### N+1 Query Detection

```yaml
Alert:
  When: Same query pattern repeated > 10 times
  Action: Investigate and add proper joins/includes
  Priority: High
```

### Slow Query Log

```yaml
Enable: production
Threshold: > 500ms
Action:
  - Log to Sentry
  - Weekly review
  - Index optimization
```

## Frontend Bundle Size Budgets

### Initial Load

| Resource Type          | Budget | Warning | Error  |
| ---------------------- | ------ | ------- | ------ |
| **JavaScript**         | 150 KB | 200 KB  | 250 KB |
| **CSS**                | 30 KB  | 40 KB   | 50 KB  |
| **Fonts**              | 50 KB  | 75 KB   | 100 KB |
| **Images (initial)**   | 200 KB | 300 KB  | 400 KB |
| **Total (First Load)** | 450 KB | 600 KB  | 800 KB |

### Page-Specific Budgets

```yaml
# Public pages (no auth)
Login Page:
  Total JS: 100 KB
  Total Load: 300 KB

# Authenticated pages
Dashboard:
  Total JS: 180 KB
  Total Load: 500 KB

Admin Panel:
  Total JS: 200 KB # More features allowed
  Total Load: 600 KB
```

### Bundle Analysis

```bash
# Run bundle analyzer
pnpm --filter @brisa/web build
pnpm --filter @brisa/web analyze

# Check bundle size
npm run size-limit
```

### Webpack Budget Configuration

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        maxAssetSize: 250000, // 250 KB
        maxEntrypointSize: 450000, // 450 KB
        hints: "warning",
      };
    }
    return config;
  },
};
```

## Lighthouse Score Targets

### Minimum Scores

| Category           | Minimum | Target | Excellent |
| ------------------ | ------- | ------ | --------- |
| **Performance**    | 80      | 90     | 95+       |
| **Accessibility**  | 90      | 95     | 100       |
| **Best Practices** | 90      | 95     | 100       |
| **SEO**            | 90      | 95     | 100       |

### CI/CD Integration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://brisa-cubana-preview.vercel.app
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

### Budget Configuration

```json
// lighthouse-budget.json
{
  "performance": {
    "first-contentful-paint": 2000,
    "largest-contentful-paint": 2500,
    "cumulative-layout-shift": 0.1,
    "total-blocking-time": 300,
    "speed-index": 3000
  },
  "resourceSizes": [
    {
      "resourceType": "script",
      "budget": 250
    },
    {
      "resourceType": "stylesheet",
      "budget": 50
    },
    {
      "resourceType": "image",
      "budget": 300
    },
    {
      "resourceType": "total",
      "budget": 800
    }
  ]
}
```

## Memory Usage

### Targets

| Environment       | Heap Size | RSS      | Alert    |
| ----------------- | --------- | -------- | -------- |
| **API (Node.js)** | < 200 MB  | < 512 MB | > 768 MB |
| **Web (SSR)**     | < 150 MB  | < 384 MB | > 512 MB |

### Monitoring

```typescript
// apps/api/src/middleware/memory-monitor.ts
export const memoryMonitor = () => {
  const used = process.memoryUsage();
  const heapUsedMB = used.heapUsed / 1024 / 1024;

  if (heapUsedMB > 200) {
    Sentry.captureMessage("High memory usage", {
      level: "warning",
      extra: {
        heapUsed: heapUsedMB,
        heapTotal: used.heapTotal / 1024 / 1024,
        rss: used.rss / 1024 / 1024,
      },
    });
  }
};

// Run every 5 minutes
setInterval(memoryMonitor, 5 * 60 * 1000);
```

## Concurrency & Rate Limits

### API Rate Limits

```yaml
Per User:
  Requests: 100 req/min
  Burst: 10 req/sec

Per IP (anonymous):
  Requests: 20 req/min
  Burst: 5 req/sec

Critical Endpoints:
  /api/authentication/login: 5 req/min (already implemented)
  /api/bookings: 30 req/min
  /api/users: 20 req/min (admin only)
```

### Database Connection Pool

```yaml
Production:
  Min: 10
  Max: 30
  Idle Timeout: 10000ms
  Connection Timeout: 5000ms

Alert:
  When: Active connections > 25
  Action: Investigate connection leaks
```

## Monitoring & Enforcement

### Automated Checks

```yaml
Pre-deploy:
  - Lighthouse CI
  - Bundle size analysis
  - Load test (smoke)

Post-deploy:
  - Synthetic monitoring (every 5 min)
  - Real User Monitoring (RUM)
  - Error rate tracking

Weekly:
  - Performance regression analysis
  - Top slow endpoints review
  - Database query optimization
```

### Performance Budget Violations

**Process**:

1. **Violation detected** → Block PR if critical
2. **Investigate** → Profile, identify bottleneck
3. **Fix or adjust** → Optimize or update budget
4. **Document** → Add to CHANGELOG why budget changed

### Dashboard

Create Grafana/Sentry dashboard with:

- Real-time API response times (p50, p95, p99)
- Core Web Vitals trends
- Bundle size over time
- Error rate vs performance correlation
- Database query performance
- Memory usage trends

## Tools & Resources

### Performance Testing

```bash
# API Load Testing (k6)
k6 run tests/performance/api-load.js

# Web Performance (Lighthouse)
pnpm lighthouse https://brisa-cubana.vercel.app

# Bundle Analysis
pnpm --filter @brisa/web analyze

# Database Query Analysis
psql -d brisa_cubana -c "EXPLAIN ANALYZE SELECT ..."
```

### Profiling

```bash
# Node.js CPU Profiling
node --inspect apps/api/dist/index.js

# Next.js Build Analysis
ANALYZE=true pnpm --filter @brisa/web build

# Sentry Performance Profiling (already enabled at 10%)
```

## Action Plan for Performance Issues

### Response Time > Budget

1. **Identify** slow endpoint/page
2. **Profile** with Sentry performance
3. **Check**:
   - Database query time
   - External API calls
   - CPU-intensive operations
4. **Optimize**:
   - Add database indexes
   - Implement caching
   - Parallelize operations
   - Optimize algorithms
5. **Verify** improvement in staging
6. **Deploy** and monitor

### High Memory Usage

1. **Capture** heap snapshot
2. **Analyze** for memory leaks
3. **Check**:
   - Large object retention
   - Event listener leaks
   - Cache size
4. **Fix** and test
5. **Monitor** after deploy

### Poor Core Web Vitals

**LCP > 2.5s**:

- Optimize images (WebP, lazy loading)
- Reduce blocking resources
- Preload critical assets
- Implement SSR/SSG

**CLS > 0.1**:

- Reserve space for dynamic content
- Use size attributes on images
- Avoid inserting content above existing

**INP > 200ms**:

- Reduce JavaScript execution time
- Debounce/throttle event handlers
- Use Web Workers for heavy computation

## References

- [Web.dev Performance](https://web.dev/performance/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
