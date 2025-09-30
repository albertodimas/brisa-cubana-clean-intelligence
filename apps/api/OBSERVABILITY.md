# Observability & Monitoring

This document describes the observability stack and monitoring capabilities of the Brisa Cubana API.

## Overview

The API includes comprehensive observability features:

- **Structured Logging** - JSON logs with Pino
- **Metrics** - Prometheus-compatible metrics
- **Health Checks** - Liveness and readiness probes
- **Error Tracking** - Sentry integration
- **Request Tracing** - Request ID propagation

## Endpoints

### Health Checks

#### `GET /health`

Basic liveness probe - returns 200 if service is running.

```json
{
  "status": "healthy",
  "service": "brisa-cubana-api",
  "version": "0.1.0",
  "timestamp": "2025-09-30T19:00:00.000Z"
}
```

#### `GET /health/ready`

Comprehensive readiness probe - checks all dependencies.

```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T19:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "pass",
      "responseTime": 15,
      "message": "Connected"
    },
    "memory": {
      "status": "pass",
      "message": "Heap: 85MB / 512MB (16%)",
      "details": {
        "rss": 120,
        "heapTotal": 512,
        "heapUsed": 85,
        "external": 5
      }
    }
  }
}
```

Returns:

- `200` - All checks passed (healthy)
- `503` - One or more checks failed (unhealthy)

#### `GET /health/info`

Runtime information about the service.

```json
{
  "service": "brisa-cubana-api",
  "version": "0.1.0",
  "environment": "production",
  "process": {
    "uptime": 3600,
    "uptimeFormatted": "1h 0m 0s",
    "pid": 1234,
    "nodeVersion": "v24.9.0",
    "platform": "linux",
    "arch": "x64"
  },
  "memory": {
    "rss": "120MB",
    "heapTotal": "512MB",
    "heapUsed": "85MB",
    "external": "5MB"
  },
  "timestamp": "2025-09-30T19:00:00.000Z"
}
```

### Metrics

#### `GET /metrics`

Prometheus-compatible metrics endpoint.

Returns metrics in Prometheus text format:

```prometheus
# HELP brisa_api_http_requests_total Total number of HTTP requests
# TYPE brisa_api_http_requests_total counter
brisa_api_http_requests_total{method="GET",route="/api/bookings",status_code="200"} 1543

# HELP brisa_api_http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE brisa_api_http_request_duration_seconds histogram
brisa_api_http_request_duration_seconds_bucket{method="GET",route="/api/bookings",status_code="200",le="0.005"} 1234
brisa_api_http_request_duration_seconds_bucket{method="GET",route="/api/bookings",status_code="200",le="0.01"} 1456
...
```

## Available Metrics

### HTTP Metrics

- `brisa_api_http_requests_total` - Total number of HTTP requests
  - Labels: `method`, `route`, `status_code`
- `brisa_api_http_request_duration_seconds` - Request duration histogram
  - Labels: `method`, `route`, `status_code`
  - Buckets: 1ms, 10ms, 50ms, 100ms, 500ms, 1s, 2s, 5s, 10s
- `brisa_api_http_requests_in_flight` - Current in-flight requests
  - Labels: `method`, `route`

### Business Metrics

- `brisa_api_bookings_created_total` - Total bookings created
  - Labels: `status`
- `brisa_api_bookings_active` - Current active bookings gauge
- `brisa_api_users_registered_total` - Total users registered
  - Labels: `role`
- `brisa_api_users_active` - Current active users gauge
  - Labels: `role`
- `brisa_api_payments_processed_total` - Total payments processed
  - Labels: `status`
- `brisa_api_payments_amount_total_cents` - Total payment amount in cents
  - Labels: `status`

### Error Metrics

- `brisa_api_errors_total` - Total errors
  - Labels: `type`, `code`

### Rate Limiting Metrics

- `brisa_api_rate_limit_hits_total` - Total rate limit hits
  - Labels: `endpoint`
- `brisa_api_rate_limit_exceeded_total` - Total rate limit exceeded
  - Labels: `endpoint`

### System Metrics (Default)

All system metrics are prefixed with `brisa_api_`:

- `process_cpu_user_seconds_total` - User CPU time
- `process_cpu_system_seconds_total` - System CPU time
- `process_heap_bytes` - Process heap size
- `process_resident_memory_bytes` - Resident memory size
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Active handles
- `nodejs_active_requests_total` - Active requests
- `nodejs_heap_size_total_bytes` - Total heap size
- `nodejs_heap_size_used_bytes` - Used heap size
- `nodejs_external_memory_bytes` - External memory

## Logging

### Structure

All logs are structured JSON (production) or pretty-printed (development):

```json
{
  "level": 30,
  "time": 1696089600000,
  "pid": 1234,
  "hostname": "api-server-1",
  "requestId": "req_1696089600000_abc123",
  "method": "GET",
  "url": "/api/bookings",
  "status": 200,
  "duration": "45ms",
  "msg": "Request completed"
}
```

### Log Levels

- `trace` (10) - Very detailed debugging
- `debug` (20) - Detailed debugging information
- `info` (30) - General informational messages
- `warn` (40) - Warning messages
- `error` (50) - Error events
- `fatal` (60) - Very severe errors

### PII Redaction

Sensitive fields are automatically redacted:

- `req.headers.authorization`
- `req.headers.cookie`
- `req.body.password`
- `*.passwordHash`
- `*.token`
- `*.accessToken`
- `*.refreshToken`

### Request ID Tracking

Every request gets a unique ID for distributed tracing:

- Generated automatically or from `x-request-id` header
- Format: `req_<timestamp>_<random>`
- Propagated through all logs for that request

## Error Tracking

### Sentry Integration

Server errors (5xx) are automatically sent to Sentry:

- Environment: `production`, `staging`, `development`
- Release: Set via `SENTRY_RELEASE` env var
- Sample rate: 100% (configurable via `SENTRY_SAMPLE_RATE`)

Client errors (4xx) are NOT sent to Sentry to avoid noise.

### Configuration

```bash
# Required
SENTRY_DSN=https://xxx@sentry.io/yyy

# Optional
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
SENTRY_SAMPLE_RATE=1.0
```

## Kubernetes/Docker Integration

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Prometheus Scraping

```yaml
apiVersion: v1
kind: Service
metadata:
  name: brisa-api
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
    prometheus.io/path: "/metrics"
spec:
  ports:
    - name: http
      port: 8080
      targetPort: 8080
```

## Grafana Dashboards

### Recommended Queries

**Request Rate**

```promql
rate(brisa_api_http_requests_total[5m])
```

**Request Latency (p95)**

```promql
histogram_quantile(0.95, rate(brisa_api_http_request_duration_seconds_bucket[5m]))
```

**Error Rate**

```promql
rate(brisa_api_http_requests_total{status_code=~"5.."}[5m])
```

**Active Bookings**

```promql
brisa_api_bookings_active
```

**Rate Limit Exceeded**

```promql
rate(brisa_api_rate_limit_exceeded_total[5m])
```

## Alerting Rules

### Example Alerts

**High Error Rate**

```yaml
- alert: HighErrorRate
  expr: rate(brisa_api_http_requests_total{status_code=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value | humanizePercentage }}"
```

**High Latency**

```yaml
- alert: HighLatency
  expr: histogram_quantile(0.95, rate(brisa_api_http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High request latency detected"
    description: "P95 latency is {{ $value }}s"
```

**Database Down**

```yaml
- alert: DatabaseDown
  expr: up{job="brisa-api"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "API is down"
    description: "Health check is failing"
```

## Local Development

### View Metrics Locally

```bash
# Start the API
pnpm dev

# View metrics
curl http://localhost:8080/metrics

# View health
curl http://localhost:8080/health/ready

# View info
curl http://localhost:8080/health/info
```

### Run Prometheus Locally

```bash
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'brisa-api'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'

# Run Prometheus
docker run -p 9090:9090 -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

### Run Grafana Locally

```bash
# Run Grafana
docker run -p 3000:3000 grafana/grafana

# Add Prometheus data source: http://host.docker.internal:9090
# Import dashboard or create custom queries
```

## Best Practices

1. **Monitor the metrics endpoint** - Ensure Prometheus can scrape it
2. **Set up alerts** - Don't wait for users to report issues
3. **Track business metrics** - Not just system metrics
4. **Use structured logging** - Makes searching/filtering easier
5. **Request ID propagation** - Essential for debugging distributed systems
6. **Health check dependencies** - Database, cache, external services
7. **Set appropriate thresholds** - Avoid alert fatigue
8. **Test your alerts** - Make sure they fire correctly

## Troubleshooting

### High Memory Usage

Check `/health/info` for memory stats. If heap is > 90%, investigate:

```bash
# Get heap snapshot
curl http://localhost:8080/metrics | grep nodejs_heap

# Check for memory leaks
NODE_OPTIONS=--max-old-space-size=4096 pnpm dev
```

### Slow Database Queries

Check `/health/ready` for database response time:

```bash
curl http://localhost:8080/health/ready | jq '.checks.database'
```

### Missing Metrics

1. Verify Prometheus can reach `/metrics`
2. Check firewall/security groups
3. Verify scrape configuration
4. Check Prometheus logs

### High Error Rate

1. Check `/metrics` for `brisa_api_errors_total`
2. Check logs for error details
3. Check Sentry for stack traces
4. Verify database connectivity

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Pino Documentation](https://getpino.io/)
- [Sentry Documentation](https://docs.sentry.io/)
