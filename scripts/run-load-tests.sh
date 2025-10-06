#!/bin/bash
set -e

###########################################
# Run Load Tests - Brisa Cubana Clean
# Executes k6 load tests against staging
###########################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="${STAGING_URL:-https://staging.brisacubanaclean.com}"
RESULTS_DIR="tests/load/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${RESULTS_DIR}/report_${TIMESTAMP}.html"
SUMMARY_FILE="${RESULTS_DIR}/summary_${TIMESTAMP}.json"
RUN_ALL="${RUN_ALL:-true}"
SCENARIO="${SCENARIO:-all}"

# Test credentials (should be set in env vars for staging)
export API_BASE_URL="${STAGING_URL}/api"
export TEST_ADMIN_EMAIL="${TEST_ADMIN_EMAIL:-admin@brisacubanaclean.com}"
export TEST_ADMIN_PASSWORD="${TEST_ADMIN_PASSWORD}"
export TEST_CLIENT_EMAIL="${TEST_CLIENT_EMAIL:-client@brisacubanaclean.com}"
export TEST_CLIENT_PASSWORD="${TEST_CLIENT_PASSWORD}"

# Test scenarios in execution order
SCENARIOS=(
  "smoke:tests/load/smoke.test.js:1m:Smoke Test - Minimal Load"
  "load:tests/load/load.test.js:5m:Load Test - Normal Traffic"
  "stress:tests/load/stress.test.js:10m:Stress Test - Breaking Point"
  "spike:tests/load/spike.test.js:3m:Spike Test - Traffic Spikes"
  "soak:tests/load/soak.test.js:30m:Soak Test - Endurance"
)

###########################################
# Helper Functions
###########################################

print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

###########################################
# Pre-flight Checks
###########################################

check_k6_installed() {
  print_header "Checking k6 Installation"

  if command -v k6 &> /dev/null; then
    K6_VERSION=$(k6 version | head -n1)
    print_success "k6 is installed: $K6_VERSION"
    return 0
  else
    print_warning "k6 is not installed. Installing..."

    # Detect OS and install k6
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      sudo gpg -k
      sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
      echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
      sudo apt-get update
      sudo apt-get install k6 -y
      print_success "k6 installed successfully"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      brew install k6
      print_success "k6 installed successfully"
    else
      print_error "Unsupported OS for automatic k6 installation"
      print_info "Please install k6 manually: https://k6.io/docs/getting-started/installation"
      exit 1
    fi
  fi
}

check_staging_available() {
  print_header "Checking Staging Environment"

  print_info "Testing connection to: $API_BASE_URL"

  # Try to reach health endpoint
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health" --max-time 10 || echo "000")

  if [[ "$HTTP_CODE" == "200" ]]; then
    print_success "Staging is available (HTTP $HTTP_CODE)"
  elif [[ "$HTTP_CODE" == "000" ]]; then
    print_error "Cannot reach staging environment (timeout or connection refused)"
    print_info "Please check:"
    print_info "  1. STAGING_URL is correct: $STAGING_URL"
    print_info "  2. Staging environment is running"
    print_info "  3. Network/VPN connection is active"
    exit 1
  else
    print_warning "Staging returned HTTP $HTTP_CODE (expected 200)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
}

check_credentials() {
  print_header "Checking Test Credentials"

  if [[ -z "$TEST_ADMIN_PASSWORD" ]] || [[ -z "$TEST_CLIENT_PASSWORD" ]]; then
    print_error "Test credentials not set"
    print_info "Please set the following environment variables:"
    print_info "  export TEST_ADMIN_PASSWORD='your-admin-password'"
    print_info "  export TEST_CLIENT_PASSWORD='your-client-password'"
    exit 1
  fi

  print_success "Credentials are configured"
}

create_results_dir() {
  print_header "Preparing Results Directory"

  mkdir -p "$RESULTS_DIR"
  print_success "Results directory ready: $RESULTS_DIR"
}

###########################################
# Test Execution
###########################################

run_test() {
  local name=$1
  local file=$2
  local duration=$3
  local description=$4

  print_header "Running: $description"
  print_info "Test file: $file"
  print_info "Expected duration: ~$duration"
  print_info "Started at: $(date +"%H:%M:%S")"
  echo ""

  local result_json="${RESULTS_DIR}/${name}_${TIMESTAMP}.json"
  local result_summary="${RESULTS_DIR}/${name}_${TIMESTAMP}_summary.txt"

  # Run k6 test with JSON output
  if k6 run "$file" \
    --out "json=${result_json}" \
    --summary-export="${RESULTS_DIR}/${name}_${TIMESTAMP}_metrics.json" \
    2>&1 | tee "$result_summary"; then

    print_success "$description completed successfully"
    echo "$name:PASS:$(date +"%Y-%m-%d %H:%M:%S")" >> "${RESULTS_DIR}/test_results_${TIMESTAMP}.log"
    return 0
  else
    print_error "$description failed"
    echo "$name:FAIL:$(date +"%Y-%m-%d %H:%M:%S")" >> "${RESULTS_DIR}/test_results_${TIMESTAMP}.log"

    # Ask if we should continue
    if [[ "$RUN_ALL" == "true" ]]; then
      read -p "Continue with remaining tests? (Y/n): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Nn]$ ]]; then
        return 1
      fi
    else
      return 1
    fi

    return 0
  fi
}

run_all_tests() {
  print_header "Load Test Execution Plan"
  print_info "Target: $STAGING_URL"
  print_info "Total scenarios: ${#SCENARIOS[@]}"
  echo ""

  for scenario in "${SCENARIOS[@]}"; do
    IFS=':' read -r name file duration description <<< "$scenario"
    echo -e "  ${CYAN}→${NC} $description ($duration)"
  done

  echo ""
  read -p "Start load tests? (Y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_warning "Load tests cancelled"
    exit 0
  fi

  local start_time=$(date +%s)
  local tests_passed=0
  local tests_failed=0

  for scenario in "${SCENARIOS[@]}"; do
    IFS=':' read -r name file duration description <<< "$scenario"

    if run_test "$name" "$file" "$duration" "$description"; then
      ((tests_passed++))
    else
      ((tests_failed++))
      if [[ "$RUN_ALL" != "true" ]]; then
        break
      fi
    fi

    # Brief pause between tests
    if [[ "$name" != "soak" ]]; then
      print_info "Cooling down for 30 seconds..."
      sleep 30
    fi
  done

  local end_time=$(date +%s)
  local total_duration=$((end_time - start_time))

  # Generate summary
  generate_summary "$tests_passed" "$tests_failed" "$total_duration"
}

run_single_test() {
  local scenario_name=$1

  for scenario in "${SCENARIOS[@]}"; do
    IFS=':' read -r name file duration description <<< "$scenario"

    if [[ "$name" == "$scenario_name" ]]; then
      print_info "Running single test: $description"
      run_test "$name" "$file" "$duration" "$description"
      return $?
    fi
  done

  print_error "Unknown scenario: $scenario_name"
  print_info "Available scenarios: smoke, load, stress, spike, soak"
  exit 1
}

###########################################
# Report Generation
###########################################

generate_summary() {
  local passed=$1
  local failed=$2
  local duration=$3

  print_header "Test Execution Summary"

  local total=$((passed + failed))
  local duration_min=$((duration / 60))
  local duration_sec=$((duration % 60))

  echo -e "${CYAN}Total Tests:${NC} $total"
  echo -e "${GREEN}Passed:${NC} $passed"
  echo -e "${RED}Failed:${NC} $failed"
  echo -e "${BLUE}Duration:${NC} ${duration_min}m ${duration_sec}s"
  echo -e "${BLUE}Timestamp:${NC} $TIMESTAMP"
  echo ""

  # Generate HTML report
  generate_html_report "$passed" "$failed" "$total" "$duration"

  # Generate JSON summary
  cat > "$SUMMARY_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "staging_url": "$STAGING_URL",
  "total_tests": $total,
  "passed": $passed,
  "failed": $failed,
  "duration_seconds": $duration,
  "test_results_file": "test_results_${TIMESTAMP}.log"
}
EOF

  print_success "Summary saved to: $SUMMARY_FILE"
  print_info "View detailed results in: $RESULTS_DIR"

  if [[ $failed -eq 0 ]]; then
    print_success "All tests passed! 🎉"
    return 0
  else
    print_error "$failed test(s) failed"
    return 1
  fi
}

generate_html_report() {
  local passed=$1
  local failed=$2
  local total=$3
  local duration=$4

  cat > "$REPORT_FILE" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 30px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
    h2 { color: #34495e; margin-top: 30px; margin-bottom: 15px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric { background: #ecf0f1; padding: 20px; border-radius: 6px; text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
    .metric-label { color: #7f8c8d; font-size: 0.9em; }
    .passed { color: #27ae60; }
    .failed { color: #e74c3c; }
    .total { color: #3498db; }
    .info { color: #95a5a6; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; }
    th { background: #34495e; color: white; }
    tr:hover { background: #f8f9fa; }
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: bold; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1; color: #95a5a6; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Load Test Report - Brisa Cubana Clean</h1>

    <div class="summary">
      <div class="metric">
        <div class="metric-value total">TOTAL_TESTS</div>
        <div class="metric-label">Total Tests</div>
      </div>
      <div class="metric">
        <div class="metric-value passed">PASSED_TESTS</div>
        <div class="metric-label">Passed</div>
      </div>
      <div class="metric">
        <div class="metric-value failed">FAILED_TESTS</div>
        <div class="metric-label">Failed</div>
      </div>
      <div class="metric">
        <div class="metric-value info">DURATION_MIN</div>
        <div class="metric-label">Duration (minutes)</div>
      </div>
    </div>

    <h2>Test Environment</h2>
    <table>
      <tr><th>Property</th><th>Value</th></tr>
      <tr><td>Staging URL</td><td>STAGING_URL</td></tr>
      <tr><td>Test Date</td><td>TEST_DATE</td></tr>
      <tr><td>Test Time</td><td>TEST_TIME</td></tr>
      <tr><td>k6 Version</td><td>K6_VERSION</td></tr>
    </table>

    <h2>Test Results</h2>
    <p>Detailed test results are available in the <code>tests/load/results/</code> directory.</p>
    <p>Each test generates JSON metrics that can be analyzed with k6 Cloud or custom dashboards.</p>

    <div class="footer">
      <p>Generated by run-load-tests.sh | Brisa Cubana Clean Intelligence Platform</p>
    </div>
  </div>
</body>
</html>
EOF

  # Replace placeholders
  local duration_min=$((duration / 60))
  local k6_ver=$(k6 version | head -n1)

  sed -i "s|TOTAL_TESTS|$total|g" "$REPORT_FILE"
  sed -i "s|PASSED_TESTS|$passed|g" "$REPORT_FILE"
  sed -i "s|FAILED_TESTS|$failed|g" "$REPORT_FILE"
  sed -i "s|DURATION_MIN|$duration_min|g" "$REPORT_FILE"
  sed -i "s|STAGING_URL|$STAGING_URL|g" "$REPORT_FILE"
  sed -i "s|TEST_DATE|$(date +"%Y-%m-%d")|g" "$REPORT_FILE"
  sed -i "s|TEST_TIME|$(date +"%H:%M:%S")|g" "$REPORT_FILE"
  sed -i "s|K6_VERSION|$k6_ver|g" "$REPORT_FILE"

  print_success "HTML report generated: $REPORT_FILE"
}

###########################################
# Main Execution
###########################################

main() {
  print_header "Brisa Cubana Clean - Load Testing Suite"
  print_info "Timestamp: $(date)"
  echo ""

  # Pre-flight checks
  check_k6_installed
  check_staging_available
  check_credentials
  create_results_dir

  # Run tests
  if [[ "$SCENARIO" == "all" ]]; then
    run_all_tests
  else
    run_single_test "$SCENARIO"
  fi

  exit $?
}

# Show usage if --help
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  cat <<EOF
Usage: $0 [OPTIONS]

Run k6 load tests against staging environment.

Environment Variables:
  STAGING_URL              Staging URL (default: https://staging.brisacubanaclean.com)
  TEST_ADMIN_PASSWORD      Admin password for tests (required)
  TEST_CLIENT_PASSWORD     Client password for tests (required)
  SCENARIO                 Run specific scenario: smoke|load|stress|spike|soak (default: all)
  RUN_ALL                  Continue on failure (default: true)

Examples:
  # Run all tests
  ./scripts/run-load-tests.sh

  # Run only smoke test
  SCENARIO=smoke ./scripts/run-load-tests.sh

  # Run against custom staging
  STAGING_URL=https://my-staging.com ./scripts/run-load-tests.sh

Results:
  All results are saved to tests/load/results/ with timestamp.

EOF
  exit 0
fi

main
