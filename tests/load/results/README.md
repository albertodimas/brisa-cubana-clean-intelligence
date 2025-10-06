# Load Test Results Directory

This directory contains the results from k6 load test executions.

## Directory Structure

After running load tests, you'll find:

```
tests/load/results/
├── report_YYYYMMDD_HHMMSS.html              # HTML summary report
├── summary_YYYYMMDD_HHMMSS.json             # JSON test summary
├── test_results_YYYYMMDD_HHMMSS.log         # Test execution log
├── smoke_YYYYMMDD_HHMMSS.json               # Raw smoke test data
├── smoke_YYYYMMDD_HHMMSS_summary.txt        # Smoke test text output
├── smoke_YYYYMMDD_HHMMSS_metrics.json       # Smoke test metrics
├── load_YYYYMMDD_HHMMSS.json                # Raw load test data
├── load_YYYYMMDD_HHMMSS_summary.txt         # Load test text output
├── load_YYYYMMDD_HHMMSS_metrics.json        # Load test metrics
└── ...                                       # Other scenario results
```

## File Types

### HTML Reports

- **Purpose:** Visual summary of all tests
- **View:** Open in browser
- **Contains:** Pass/fail status, key metrics, environment info

### JSON Summary Files

- **Purpose:** Machine-readable test summary
- **Format:** JSON
- **Contains:** Overall test statistics

### Metrics JSON Files

- **Purpose:** Detailed k6 metrics export
- **Format:** JSON (k6 summary format)
- **Contains:** All metrics with percentiles, rates, counts

### Raw JSON Files

- **Purpose:** Complete k6 output stream
- **Format:** NDJSON (newline-delimited JSON)
- **Use:** Advanced analysis, custom reporting

### Summary Text Files

- **Purpose:** Human-readable terminal output
- **Format:** Plain text
- **Contains:** Real-time k6 console output

## Analyzing Results

### Quick View (HTML)

```bash
# Open latest HTML report
firefox tests/load/results/report_*.html
```

### JSON Analysis

```bash
# View summary
cat tests/load/results/summary_*.json | jq .

# Extract specific metrics
jq '.metrics.http_req_duration.values["p(95)"]' \
  tests/load/results/smoke_*_metrics.json

# Check error rate
jq '.metrics.http_req_failed.values.rate' \
  tests/load/results/load_*_metrics.json
```

### Compare Runs

```bash
# Compare p95 across runs
for file in tests/load/results/smoke_*_metrics.json; do
  echo "$file: $(jq '.metrics.http_req_duration.values["p(95)"]' $file)ms"
done
```

### Export to CSV

```bash
# Create CSV from metrics
echo "timestamp,scenario,p95,p99,error_rate" > analysis.csv

for file in tests/load/results/*_metrics.json; do
  scenario=$(basename $file | cut -d'_' -f1)
  timestamp=$(basename $file | cut -d'_' -f2-3 | sed 's/_metrics.json//')
  p95=$(jq -r '.metrics.http_req_duration.values["p(95)"]' $file)
  p99=$(jq -r '.metrics.http_req_duration.values["p(99)"]' $file)
  error=$(jq -r '.metrics.http_req_failed.values.rate' $file)

  echo "$timestamp,$scenario,$p95,$p99,$error" >> analysis.csv
done
```

## Retention Policy

- **Local results:** Keep last 30 days
- **CI/CD artifacts:** 30 days (automatic)
- **Important baselines:** Archive manually
- **Pre-release results:** Archive indefinitely

## Cleanup

```bash
# Remove results older than 30 days
find tests/load/results -name "*.json" -mtime +30 -delete
find tests/load/results -name "*.html" -mtime +30 -delete
find tests/load/results -name "*.txt" -mtime +30 -delete
find tests/load/results -name "*.log" -mtime +30 -delete

# Keep only last 10 test runs
ls -t tests/load/results/report_*.html | tail -n +11 | xargs rm -f
```

## Archive Important Results

```bash
# Archive baseline results
mkdir -p docs/operations/load-test-archives

# Archive by version
tar -czf docs/operations/load-test-archives/v1.2.3-baseline.tar.gz \
  tests/load/results/*_YYYYMMDD_HHMMSS.*

# Archive pre-release results
tar -czf docs/operations/load-test-archives/v1.3.0-pre-release.tar.gz \
  tests/load/results/*
```

## Integration with Monitoring

### InfluxDB Export

```bash
# Run test with InfluxDB output
k6 run tests/load/load.test.js \
  --out influxdb=http://localhost:8086/k6
```

### Grafana Dashboard

Import the k6 Grafana dashboard:

- Dashboard ID: 2587
- URL: https://grafana.com/grafana/dashboards/2587

### Prometheus Export

```bash
# Run test with Prometheus remote write
k6 run tests/load/load.test.js \
  --out experimental-prometheus-rw
```

## Troubleshooting

### Large Files

If result files are too large (> 100MB):

```bash
# Compress old results
gzip tests/load/results/*.json

# Split large NDJSON files
split -l 10000 tests/load/results/large_file.json results_split_
```

### Disk Space

```bash
# Check results directory size
du -sh tests/load/results

# Find largest files
du -ah tests/load/results | sort -rh | head -20
```

### Permission Issues

```bash
# Fix permissions
chmod 755 tests/load/results
chmod 644 tests/load/results/*
```

## CI/CD Artifacts

GitHub Actions automatically uploads results as artifacts:

```bash
# Download from GitHub
gh run download <run-id> -n load-test-results

# List available artifacts
gh run view <run-id>
```

## Custom Analysis Scripts

Create custom analysis scripts in `scripts/analyze-load-tests.sh`:

```bash
#!/bin/bash
# Example: Find performance regressions

BASELINE="tests/load/results/baseline_metrics.json"
CURRENT="tests/load/results/latest_metrics.json"

baseline_p95=$(jq '.metrics.http_req_duration.values["p(95)"]' $BASELINE)
current_p95=$(jq '.metrics.http_req_duration.values["p(95)"]' $CURRENT)

regression=$(echo "scale=2; ($current_p95 - $baseline_p95) / $baseline_p95 * 100" | bc)

echo "Performance change: ${regression}%"

if (( $(echo "$regression > 10" | bc -l) )); then
  echo "⚠️  Performance regression detected!"
  exit 1
fi
```

## Resources

- **k6 Docs:** https://k6.io/docs/
- **Load Testing Guide:** `docs/operations/LOAD_TESTING_GUIDE.md`
- **Test Scripts:** `tests/load/*.test.js`
- **Execution Script:** `scripts/run-load-tests.sh`

---

**Note:** All result files (except `.gitkeep` and this README) are gitignored.

**Last Updated:** 2025-10-06
