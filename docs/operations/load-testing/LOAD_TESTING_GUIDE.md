# Load Testing Guide - Brisa Cubana Clean

Comprehensive guide for running load tests against the Brisa Cubana Clean Intelligence Platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Test Scenarios](#test-scenarios)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Interpreting Results](#interpreting-results)
- [SLA Targets](#sla-targets)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## Overview

This platform uses **k6** for load testing across 5 comprehensive scenarios:

1. **Smoke Test** - Minimal load validation
2. **Load Test** - Normal traffic simulation
3. **Stress Test** - Breaking point identification
4. **Spike Test** - Traffic spike handling
5. **Soak Test** - Long-term stability

### Why Load Testing?

- Validate performance under real-world conditions
- Identify bottlenecks before production
- Ensure SLA compliance
- Detect memory leaks and degradation
- Build confidence in infrastructure scaling

---

## Prerequisites

### 1. k6 Installation

The `run-load-tests.sh` script will auto-install k6, but you can install manually:

**Linux (Ubuntu/Debian):**

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**macOS:**

```bash
brew install k6
```

**Windows:**

```powershell
choco install k6
```

**Verify installation:**

```bash
k6 version
```

### 2. Staging Environment Access

Ensure you have:

- Access to staging environment
- Valid staging URL
- Network/VPN connectivity
- Test user credentials

### 3. Test Credentials

Create test users in staging:

**Admin User:**

- Email: `admin@brisacubanaclean.com`
- Password: Set via `TEST_ADMIN_PASSWORD` env var

**Client User:**

- Email: `client@brisacubanaclean.com`
- Password: Set via `TEST_CLIENT_PASSWORD` env var

---

## Quick Start

### Run All Tests

```bash
# Export credentials (required)
export TEST_ADMIN_PASSWORD="your-admin-password"
export TEST_CLIENT_PASSWORD="your-client-password"

# Run all 5 scenarios
./scripts/run-load-tests.sh
```

### Run Single Test

```bash
# Run only smoke test
SCENARIO=smoke ./scripts/run-load-tests.sh

# Run only load test
SCENARIO=load ./scripts/run-load-tests.sh
```

### Custom Staging URL

```bash
STAGING_URL=https://my-staging.brisacubanaclean.com ./scripts/run-load-tests.sh
```

---

## Test Scenarios

### 1. Smoke Test

**Purpose:** Verify system works under minimal load.

**Configuration:**

- Virtual Users: 1
- Duration: 1 minute
- File: `tests/load/smoke.test.js`

**Thresholds:**

- p95 < 500ms
- p99 < 1s
- Error rate < 1%

**When to run:**

- After every deployment
- Before other load tests
- As part of CI/CD

**Command:**

```bash
SCENARIO=smoke ./scripts/run-load-tests.sh
```

**Manual execution:**

```bash
k6 run tests/load/smoke.test.js \
  -e API_BASE_URL=https://staging.brisacubanaclean.com/api \
  -e TEST_ADMIN_EMAIL=admin@brisacubanaclean.com \
  -e TEST_ADMIN_PASSWORD=yourpassword
```

---

### 2. Load Test

**Purpose:** Validate performance under expected normal traffic.

**Configuration:**

- Virtual Users: 10 → 30 → 50 (ramping)
- Duration: 5 minutes
- File: `tests/load/load.test.js`

**Thresholds:**

- p95 < 800ms
- p99 < 1.5s
- Error rate < 5%
- Booking creation p95 < 2s

**Traffic simulation:**

- 70% read operations (services, properties)
- 20% booking creation
- 10% other operations

**When to run:**

- Weekly performance validation
- Before major releases
- After infrastructure changes

**Command:**

```bash
SCENARIO=load ./scripts/run-load-tests.sh
```

---

### 3. Stress Test

**Purpose:** Find the breaking point of the system.

**Configuration:**

- Virtual Users: 50 → 100 → 150 → 200
- Duration: 10 minutes
- File: `tests/load/stress.test.js`

**Thresholds:**

- p95 < 2s (relaxed)
- p99 < 5s
- Error rate < 20% (tolerant)

**Metrics tracked:**

- Auth errors
- Database errors
- Timeout errors
- Degradation patterns

**When to run:**

- Capacity planning
- Infrastructure validation
- Before Black Friday / high-traffic events
- Monthly performance audits

**Command:**

```bash
SCENARIO=stress ./scripts/run-load-tests.sh
```

**What to monitor externally:**

```bash
# CPU and memory
htop

# Docker stats
docker stats

# Database connections
docker exec -it postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

---

### 4. Spike Test

**Purpose:** Validate system recovery from sudden traffic spikes.

**Configuration:**

- Virtual Users: 10 → 200 (spike) → 10
- Duration: 3 minutes
- File: `tests/load/spike.test.js`

**Thresholds:**

- p95 < 3s (during spike)
- Error rate < 15%
- System recovers after spike

**Spike pattern:**

- 30s baseline (10 VUs)
- 10s rapid spike (200 VUs)
- 30s maintain spike
- 10s rapid drop
- 1m recovery

**When to run:**

- Before marketing campaigns
- After implementing autoscaling
- Quarterly resilience testing

**Command:**

```bash
SCENARIO=spike ./scripts/run-load-tests.sh
```

---

### 5. Soak Test (Endurance)

**Purpose:** Detect memory leaks and long-term degradation.

**Configuration:**

- Virtual Users: 20 (constant)
- Duration: 30 minutes (configurable)
- File: `tests/load/soak.test.js`

**Thresholds:**

- p95 < 1s (must stay stable)
- p99 < 2s
- Error rate < 5%
- No performance degradation over time

**What to detect:**

- Memory leaks
- Connection pool exhaustion
- File descriptor leaks
- Database connection leaks
- Gradual performance degradation

**When to run:**

- Before major releases
- After code refactoring
- Monthly stability checks
- After database schema changes

**Command:**

```bash
SCENARIO=soak ./scripts/run-load-tests.sh

# Custom duration (1 hour)
SOAK_DURATION=1h SCENARIO=soak ./scripts/run-load-tests.sh

# Custom VUs
SOAK_VUS=50 SCENARIO=soak ./scripts/run-load-tests.sh
```

**External monitoring (recommended):**

```bash
# Terminal 1: Watch memory
watch -n 5 'docker stats --no-stream'

# Terminal 2: Database connections
watch -n 10 'docker exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"'

# Terminal 3: Application logs
docker logs -f api
```

---

## Configuration

### Environment Variables

| Variable               | Required | Default                                | Description                                            |
| ---------------------- | -------- | -------------------------------------- | ------------------------------------------------------ |
| `STAGING_URL`          | No       | `https://staging.brisacubanaclean.com` | Staging base URL                                       |
| `TEST_ADMIN_PASSWORD`  | Yes      | -                                      | Admin user password                                    |
| `TEST_CLIENT_PASSWORD` | Yes      | -                                      | Client user password                                   |
| `TEST_ADMIN_EMAIL`     | No       | `admin@brisacubanaclean.com`           | Admin email                                            |
| `TEST_CLIENT_EMAIL`    | No       | `client@brisacubanaclean.com`          | Client email                                           |
| `SCENARIO`             | No       | `all`                                  | Scenario to run: all\|smoke\|load\|stress\|spike\|soak |
| `RUN_ALL`              | No       | `true`                                 | Continue on failure                                    |
| `SOAK_DURATION`        | No       | `30m`                                  | Soak test duration                                     |
| `SOAK_VUS`             | No       | `20`                                   | Soak test virtual users                                |

### Configuration File

Create `.env.load-test` (gitignored):

```bash
# Staging Environment
STAGING_URL=https://staging.brisacubanaclean.com

# Test Credentials
TEST_ADMIN_EMAIL=admin@brisacubanaclean.com
TEST_ADMIN_PASSWORD=SecureAdminPass123!
TEST_CLIENT_EMAIL=client@brisacubanaclean.com
TEST_CLIENT_PASSWORD=SecureClientPass123!

# Test Configuration
SCENARIO=all
RUN_ALL=true
SOAK_DURATION=30m
SOAK_VUS=20
```

Load before running:

```bash
source .env.load-test
./scripts/run-load-tests.sh
```

---

## Running Tests

### Interactive Mode (Recommended)

```bash
./scripts/run-load-tests.sh
```

The script will:

1. Check k6 installation (install if needed)
2. Verify staging is available
3. Validate credentials
4. Show execution plan
5. Ask for confirmation
6. Run tests sequentially
7. Generate reports

### Unattended Mode (CI/CD)

```bash
# Run without prompts
yes | ./scripts/run-load-tests.sh

# Or use expect
expect <<EOF
spawn ./scripts/run-load-tests.sh
expect "Start load tests?"
send "y\r"
expect eof
EOF
```

### Custom Test Execution

Run k6 directly for advanced usage:

```bash
# Run with custom output
k6 run tests/load/load.test.js \
  --out influxdb=http://localhost:8086/k6 \
  --out json=results.json

# Run with tags
k6 run tests/load/stress.test.js \
  --tag env=staging \
  --tag version=v1.2.3

# Run with custom VUs
k6 run tests/load/spike.test.js \
  --vus 300 \
  --duration 5m
```

---

## Interpreting Results

### Terminal Output

k6 displays real-time metrics:

```
✓ http_req_duration..............: avg=234ms min=45ms med=189ms max=1.2s p(90)=421ms p(95)=534ms
✓ http_req_failed................: 0.12%  ✓ 4      ✗ 3246
✓ http_reqs......................: 3250   108.33/s
✓ iterations.....................: 812    27.07/s
```

**Key metrics to watch:**

| Metric                    | Description              | Good       | Warning | Critical   |
| ------------------------- | ------------------------ | ---------- | ------- | ---------- |
| `http_req_duration p(95)` | 95th percentile response | < 500ms    | 500-1s  | > 1s       |
| `http_req_duration p(99)` | 99th percentile response | < 1s       | 1-2s    | > 2s       |
| `http_req_failed`         | Failed request rate      | < 1%       | 1-5%    | > 5%       |
| `errors`                  | Custom error rate        | < 1%       | 1-5%    | > 5%       |
| `http_reqs`               | Throughput (RPS)         | Increasing | Stable  | Decreasing |

### Threshold Status

- ✓ Green checkmark: Threshold passed
- ✗ Red cross: Threshold failed

### Generated Reports

After test completion, check:

```bash
tests/load/results/
├── report_20250106_143022.html          # HTML summary
├── summary_20250106_143022.json         # JSON summary
├── test_results_20250106_143022.log     # Test log
├── smoke_20250106_143022.json           # Raw k6 data
├── smoke_20250106_143022_summary.txt    # Text output
└── smoke_20250106_143022_metrics.json   # Exported metrics
```

**HTML Report:**
Open in browser for visual summary:

```bash
firefox tests/load/results/report_*.html
```

**JSON Analysis:**

```bash
# View summary
cat tests/load/results/summary_*.json | jq .

# Check test results
cat tests/load/results/test_results_*.log
```

### Performance Patterns to Watch

**Degradation:**

- Response times increasing over time (soak test)
- Indicates: Memory leak, connection pool exhaustion

**Threshold Violations:**

- Specific endpoints exceeding SLA
- Indicates: N+1 queries, missing indexes, inefficient code

**Error Spikes:**

- Errors correlating with high load
- Indicates: Race conditions, timeout issues, resource limits

**Recovery Issues:**

- Slow recovery after spike test
- Indicates: Connection pooling issues, cache invalidation problems

---

## SLA Targets

### Production SLA

| Metric                | Target    | Acceptable | Critical |
| --------------------- | --------- | ---------- | -------- |
| **Availability**      | 99.9%     | 99.5%      | < 99%    |
| **p95 Response Time** | < 500ms   | < 800ms    | > 1s     |
| **p99 Response Time** | < 1s      | < 1.5s     | > 2s     |
| **Error Rate**        | < 0.1%    | < 1%       | > 5%     |
| **Throughput**        | > 100 RPS | > 50 RPS   | < 50 RPS |

### Endpoint-Specific SLAs

| Endpoint          | p95     | p99     | Notes               |
| ----------------- | ------- | ------- | ------------------- |
| `GET /health`     | < 50ms  | < 100ms | Should be instant   |
| `GET /services`   | < 300ms | < 500ms | Cached response     |
| `GET /properties` | < 400ms | < 800ms | DB query with joins |
| `POST /bookings`  | < 800ms | < 1.5s  | Complex transaction |
| `GET /bookings`   | < 500ms | < 1s    | Paginated query     |

### Load Test Pass Criteria

**Smoke Test:**

- All requests succeed (< 1% error)
- p95 < 500ms
- Duration: Complete in < 2 minutes

**Load Test:**

- < 5% error rate
- p95 < 800ms
- Throughput stable throughout test

**Stress Test:**

- System doesn't crash
- Errors recoverable (< 20%)
- Identifies capacity limit

**Spike Test:**

- < 15% error during spike
- System recovers within 1 minute
- No lasting degradation

**Soak Test:**

- No performance degradation over time
- < 5% error rate
- p95 remains stable (< 10% variance)

---

## Troubleshooting

### Common Issues

#### 1. k6 Not Installed

**Error:**

```
k6: command not found
```

**Solution:**
The script auto-installs k6. If it fails:

```bash
# Manual installation (Ubuntu)
sudo snap install k6
```

#### 2. Cannot Reach Staging

**Error:**

```
Cannot reach staging environment (timeout or connection refused)
```

**Solutions:**

- Verify staging is running: `curl https://staging.brisacubanaclean.com/api/health`
- Check VPN connection
- Verify firewall rules
- Check DNS resolution: `nslookup staging.brisacubanaclean.com`

#### 3. Authentication Failures

**Error:**

```
login successful: false
token received: false
```

**Solutions:**

- Verify credentials are correct
- Check user exists in staging database
- Ensure password meets requirements
- Verify auth service is running

```bash
# Test login manually
curl -X POST https://staging.brisacubanaclean.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"yourpassword"}'
```

#### 4. High Error Rate

**Error:**

```
✗ http_req_failed: 15.3% (threshold: < 5%)
```

**Diagnosis:**

```bash
# Check application logs
docker logs api | grep ERROR

# Check database connections
docker exec postgres psql -U postgres -c "
  SELECT count(*), state
  FROM pg_stat_activity
  GROUP BY state;
"

# Check resource usage
docker stats --no-stream
```

**Common causes:**

- Database connection pool exhausted
- Memory limit reached
- CPU throttling
- Network issues

#### 5. Slow Response Times

**Error:**

```
✗ http_req_duration p(95): 2.3s (threshold: < 800ms)
```

**Diagnosis:**

```bash
# Profile slow queries
docker exec postgres psql -U postgres -c "
  SELECT query, calls, mean_exec_time, max_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check indexes
docker exec postgres psql -U postgres -d brisa_cubana -c "
  SELECT schemaname, tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public';
"
```

**Common causes:**

- Missing database indexes
- N+1 query problems
- Unoptimized queries
- Large result sets without pagination

#### 6. Memory Leaks (Soak Test)

**Symptoms:**

- Gradual increase in response times
- Memory usage climbing over time
- Eventually crashes or becomes unresponsive

**Diagnosis:**

```bash
# Monitor memory during test
watch -n 5 'docker stats --no-stream'

# Check for connection leaks
watch -n 10 'docker exec postgres psql -U postgres -c "
  SELECT count(*) as connections, state
  FROM pg_stat_activity
  GROUP BY state;
"'

# Application heap dump (Node.js)
docker exec api node --expose-gc --heap-prof index.js
```

**Common causes:**

- Database connections not closed
- Event listeners not removed
- Large objects in memory
- Circular references
- Cache growing unbounded

---

## Best Practices

### Before Running Tests

1. **Communicate with team**
   - Notify team before load testing staging
   - Coordinate with developers who might be testing

2. **Baseline metrics**
   - Run smoke test first
   - Document current performance
   - Note any recent changes

3. **Monitor infrastructure**
   - Set up monitoring dashboards
   - Tail application logs
   - Watch database metrics

### During Tests

1. **External monitoring**

   ```bash
   # Terminal 1: Run test
   ./scripts/run-load-tests.sh

   # Terminal 2: Watch metrics
   watch -n 5 'docker stats --no-stream'

   # Terminal 3: Application logs
   docker logs -f api

   # Terminal 4: Database
   watch -n 10 'docker exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"'
   ```

2. **Document observations**
   - Note when errors spike
   - Capture interesting log entries
   - Screenshot metrics during issues

3. **Don't interrupt stress/soak tests**
   - Let them run to completion
   - Interrupting can give false results

### After Tests

1. **Analyze results immediately**
   - Review HTML report
   - Check JSON metrics
   - Identify bottlenecks

2. **Create action items**
   - Document performance issues
   - File GitHub issues for improvements
   - Prioritize optimizations

3. **Archive results**

   ```bash
   # Archive test results
   tar -czf load-test-$(date +%Y%m%d).tar.gz tests/load/results/

   # Move to archives
   mv load-test-*.tar.gz docs/operations/load-test-archives/
   ```

4. **Cleanup test data**
   ```bash
   # Remove test bookings from staging
   # (Add your cleanup script)
   ```

### Regular Testing Schedule

| Frequency                | Test           | Purpose                  |
| ------------------------ | -------------- | ------------------------ |
| **Every Deploy**         | Smoke          | Basic validation         |
| **Weekly**               | Load           | Performance regression   |
| **Monthly**              | Stress + Spike | Capacity planning        |
| **Quarterly**            | Soak           | Long-term stability      |
| **Before Major Release** | All 5          | Comprehensive validation |

---

## CI/CD Integration

### GitHub Actions

The project includes `.github/workflows/load-test.yml` for CI/CD.

**Manual trigger:**

1. Go to Actions tab
2. Select "Load Tests"
3. Click "Run workflow"
4. Select scenario (smoke, load, etc.)
5. Click "Run workflow"

**On PR (smoke test only):**

```yaml
# Automatically runs smoke test on PRs to main
on:
  pull_request:
    branches: [main]
```

**View results:**

- Check Actions run logs
- Results posted as PR comment
- Download artifacts for detailed analysis

### Local CI Simulation

```bash
# Simulate CI environment
docker run --rm -v $(pwd):/workspace -w /workspace \
  grafana/k6:latest run tests/load/smoke.test.js \
  -e API_BASE_URL=$STAGING_URL/api
```

---

## Advanced Topics

### Custom Metrics

Add custom metrics to tests:

```javascript
import { Trend, Counter } from "k6/metrics";

const customMetric = new Trend("custom_operation_duration");
const customCounter = new Counter("custom_events");

export default function () {
  const start = Date.now();
  // ... operation
  customMetric.add(Date.now() - start);
  customCounter.add(1);
}
```

### Distributed Load Testing

Run from multiple machines:

```bash
# Machine 1
k6 run --out json=results-1.json tests/load/stress.test.js

# Machine 2
k6 run --out json=results-2.json tests/load/stress.test.js

# Combine results
jq -s 'add' results-*.json > combined-results.json
```

### Cloud Integration

**k6 Cloud:**

```bash
k6 cloud tests/load/load.test.js
```

**InfluxDB + Grafana:**

```bash
k6 run tests/load/load.test.js \
  --out influxdb=http://localhost:8086/k6
```

---

## Resources

### Documentation

- [k6 Official Docs](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/introduction/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)

### Tools

- [k6 Cloud](https://k6.io/cloud/)
- [Grafana k6 Dashboard](https://grafana.com/grafana/dashboards/2587)
- [k6 Browser Extension](https://k6.io/docs/using-k6-browser/overview/)

### Support

- GitHub Issues: [Create issue](https://github.com/your-org/brisa-cubana/issues)
- Team Slack: #performance channel
- DevOps Contact: devops@brisacubanaclean.com

---

**Last Updated:** 2025-10-06
**Maintained by:** DevOps Team
**Version:** 1.0.0
