# Observability Phase 2: Advanced Monitoring

> **Distributed Tracing, Metrics, and SLO-based Alerting**
> **Implemented:** October 2, 2025
> **Status:** Production Ready

---

## 🎯 Overview

Phase 2 implements enterprise-grade observability with OpenTelemetry distributed tracing, Prometheus metrics, Grafana dashboards, and SLO-based alerting.

**Key Features:**

- ✅ **Distributed Tracing** (OpenTelemetry) with correlation IDs
- ✅ **Prometheus Metrics** (RED: Rate, Errors, Duration)
- ✅ **Grafana Dashboards** with SLO tracking
- ✅ **Automated Alerts** based on error budgets
- ✅ **Structured Logging** with correlation

---

## 📊 Architecture

```
┌─────────────┐
│   Client    │
└─────┬───────┘
      │ Request (trace-id: abc-123)
      ▼
┌─────────────────────────────────────┐
│  Hono API (Node.js + OpenTelemetry) │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Correlation ID Middleware    │  │ ← Extracts or generates trace ID
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ OpenTelemetry Tracing        │  │ ← Creates spans for requests
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Prometheus Metrics           │  │ ← Collects RED metrics
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Structured Logging           │  │ ← JSON logs with correlation IDs
│  └──────────────────────────────┘  │
└────────┬────────────┬───────────────┘
         │            │
         │            └──────┐
         ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ OTLP Exporter│    │  Prometheus  │
│ (optional)   │    │  Exporter    │
└──────┬───────┘    └──────┬───────┘
       │                   │
       ▼                   ▼
┌─────────────┐    ┌──────────────┐
│  Jaeger     │    │  Prometheus  │
│  (traces)   │    │  (metrics)   │
└─────────────┘    └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Grafana    │
                   │  (dashboards)│
                   └──────────────┘
```

---

## 🚀 Quick Start

### 1. Local Development

```bash
# API already has observability enabled
cd apps/api
pnpm dev

# Metrics available at:
# http://localhost:9464/metrics

# Structured logs in console (JSON format)
```

### 2. View Metrics (Prometheus)

```bash
# Run Prometheus locally (Docker)
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Access Prometheus UI:
# http://localhost:9090
```

### 3. View Dashboards (Grafana)

```bash
# Run Grafana locally (Docker)
docker run -d \
  --name grafana \
  -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana

# Access Grafana UI:
# http://localhost:3001 (admin/admin)

# Import dashboard:
# infra/grafana/dashboards/api-slo-dashboard.json
```

### 4. Distributed Tracing (Optional - Jaeger)

```bash
# Run Jaeger all-in-one
docker run -d \
  --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# Configure API to send traces:
export OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Access Jaeger UI:
# http://localhost:16686
```

---

## 📈 Metrics Exposed

### HTTP Metrics (Prometheus)

| Metric                          | Type      | Description                                   |
| ------------------------------- | --------- | --------------------------------------------- |
| `http_requests_total`           | Counter   | Total HTTP requests (by status, method, path) |
| `http_request_duration_seconds` | Histogram | Request duration (for latency percentiles)    |
| `http_requests_in_progress`     | Gauge     | Current in-flight requests                    |

### Database Metrics (Custom)

| Metric                      | Type      | Description                  |
| --------------------------- | --------- | ---------------------------- |
| `db_query_duration_seconds` | Histogram | Database query duration      |
| `db_connections_active`     | Gauge     | Active database connections  |
| `db_connections_max`        | Gauge     | Maximum database connections |

### Business Metrics (Custom)

| Metric                       | Type    | Description                            |
| ---------------------------- | ------- | -------------------------------------- |
| `payment_transactions_total` | Counter | Total payment transactions (by status) |
| `booking_creations_total`    | Counter | Total bookings created                 |
| `cleanscore_reports_total`   | Counter | Total CleanScore reports submitted     |

---

## 🎯 Service Level Objectives (SLOs)

### Availability SLO: 99.9%

**Target:** Service available 99.9% of the time (allows 43 min downtime/month)

**Prometheus Query:**

```promql
(1 - (rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]))) * 100
```

**Alert:** Fires if error rate > 1% for 5 minutes

### Latency SLO

**Targets:**

- p95 latency < 500ms
- p99 latency < 1000ms

**Prometheus Queries:**

```promql
# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000

# p99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) * 1000
```

**Alert:** Fires if p95 > 500ms or p99 > 1000ms for 5 minutes

### Error Rate SLO: < 1%

**Target:** Less than 1% of requests result in errors (4xx/5xx)

**Prometheus Query:**

```promql
(rate(http_requests_total{status=~"4..|5.."}[5m]) / rate(http_requests_total[5m])) * 100
```

**Alert:** Fires if error rate > 1% for 5 minutes

---

## 🔍 Distributed Tracing

### Correlation ID Flow

Every request gets a **correlation ID** (trace ID):

1. **Extract from headers:**
   - `X-Correlation-ID` (custom)
   - `X-Request-ID` (standard)
   - `traceparent` (W3C Trace Context)

2. **Generate if missing:**
   - UUID v4 format

3. **Propagate:**
   - Added to response headers
   - Included in all log entries
   - Attached to OpenTelemetry spans

**Example Request:**

```bash
curl -H "X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000" \
  https://api.brisacubana.com/api/bookings
```

**Example Log Output:**

```json
{
  "timestamp": "2025-10-02T13:45:23.123Z",
  "level": "info",
  "message": "HTTP Request",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/bookings",
  "status": 200,
  "duration": 123,
  "userId": "usr_abc123",
  "service": "brisa-api",
  "environment": "production"
}
```

---

## 🚨 Alerting Rules

### Critical Alerts (PagerDuty)

1. **ServiceDown**
   - **Trigger:** API unreachable for 1 minute
   - **Severity:** Critical
   - **Action:** Page on-call engineer

2. **HighErrorRate**
   - **Trigger:** Error rate > 1% for 5 minutes
   - **Severity:** Critical
   - **Action:** Page on-call engineer

3. **PaymentProcessingFailures**
   - **Trigger:** Payment failure rate > 5% for 2 minutes
   - **Severity:** Critical
   - **Business Impact:** High (revenue loss)
   - **Action:** Immediate investigation

### Warning Alerts (Slack)

1. **HighLatencyP95**
   - **Trigger:** p95 latency > 500ms for 5 minutes
   - **Severity:** Warning
   - **Action:** Notify #engineering

2. **SlowDatabaseQueries**
   - **Trigger:** p95 query time > 100ms for 5 minutes
   - **Severity:** Warning
   - **Action:** Investigate slow queries

### Error Budget Alerts

1. **ErrorBudgetExhausted**
   - **Trigger:** 30-day error budget consumed
   - **Severity:** Warning
   - **Action:** Freeze non-critical deployments

---

## 📊 Grafana Dashboards

### API SLO Dashboard

**Location:** `infra/grafana/dashboards/api-slo-dashboard.json`

**Panels:**

1. **Availability** - Real-time availability percentage
2. **Error Rate** - Current error rate vs SLO
3. **Latency p95** - p95 latency vs SLO (500ms)
4. **Latency p99** - p99 latency vs SLO (1000ms)
5. **Request Rate** - Requests/second by endpoint
6. **Error Breakdown** - Errors by status code
7. **Request Duration Heatmap** - Latency distribution
8. **Database Query Time** - p95 query latency
9. **Active DB Connections** - Connection pool usage

**Import to Grafana:**

1. Navigate to Dashboards → Import
2. Upload `infra/grafana/dashboards/api-slo-dashboard.json`
3. Select Prometheus data source
4. Click Import

---

## 🛠️ Configuration

### Environment Variables

```bash
# OpenTelemetry
OTLP_ENDPOINT=http://localhost:4318/v1/traces  # Optional: external trace collector
OTLP_HEADERS='{"Authorization":"Bearer token"}'  # Optional: auth headers
SERVICE_NAME=brisa-api  # Service name for traces
PROMETHEUS_PORT=9464  # Metrics port (default: 9464)

# Logging
NODE_ENV=production  # Enables structured JSON logging
```

### Production Deployment

**Railway (API):**

```bash
# Set environment variables in Railway dashboard
OTLP_ENDPOINT=https://your-jaeger-instance.com/v1/traces
SERVICE_NAME=brisa-api
NODE_ENV=production
```

**Vercel (Web):**

- Vercel provides built-in analytics
- For custom metrics, deploy a separate metrics endpoint

---

## 🔬 Testing Observability

### 1. Test Correlation IDs

```bash
# Send request with correlation ID
curl -H "X-Correlation-ID: test-123" http://localhost:3001/api/bookings

# Check logs for correlation ID
docker logs brisa-api | grep "test-123"
```

### 2. Test Metrics

```bash
# Generate traffic
for i in {1..100}; do
  curl http://localhost:3001/api/services
  sleep 0.1
done

# Check Prometheus metrics
curl http://localhost:9464/metrics | grep http_requests_total
```

### 3. Test Slow Request Detection

```bash
# Simulate slow endpoint (if implemented)
curl http://localhost:3001/api/slow-endpoint

# Check logs for slow request warning
docker logs brisa-api | grep "Slow Request Detected"
```

---

## 📚 References

All documentation consulted on **October 2, 2025**:

- **OpenTelemetry Hono:** https://www.npmjs.com/package/@hono/otel
- **Prometheus Hono:** https://www.npmjs.com/package/@hono/prometheus
- **OpenTelemetry Node.js:** https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
- **Prometheus Best Practices:** https://prometheus.io/docs/practices/instrumentation/
- **SLO Alerting:** https://sre.google/workbook/alerting-on-slos/

---

## 🚀 Next Steps (Phase 3)

1. **Canary Analysis Integration**
   - Automated canary rollout with Flagger
   - Metrics-based promotion/rollback

2. **Chaos Engineering**
   - Chaos Monkey integration
   - Fault injection testing

3. **FinOps Monitoring**
   - Cost dashboards (Railway, Vercel, Neon)
   - Budget alerts
   - Rightsizing recommendations

4. **Advanced Tracing**
   - Service mesh (Istio/Linkerd)
   - Cross-service tracing
   - Database query tracing

---

**Maintained By:** Platform Engineering Team

**Questions?** Slack `#platform-team` or platform@brisacubana.com
