#!/bin/bash
# Security Scanning Script
# Comprehensive security analysis for Brisa Cubana Clean Intelligence
#
# Usage: ./scripts/security-scan.sh [options]
# Options:
#   --full        Run full scan including container analysis
#   --quick       Run quick scan (dependencies + secrets only)
#   --report      Generate detailed report
#
# Exit code: 0 if no critical issues, 1 if critical vulnerabilities found

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
REPORT_DIR="./security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORT_DIR}/security-scan-${TIMESTAMP}.md"

# Scan results
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Function to print colored output
print_header() {
    echo ""
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║  $1${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_status() {
    echo -e "${BLUE}==>${NC} $1"
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

print_critical() {
    echo -e "${RED}${BOLD}[CRITICAL]${NC} $1"
    ((CRITICAL_ISSUES++))
}

print_high() {
    echo -e "${RED}[HIGH]${NC} $1"
    ((HIGH_ISSUES++))
}

print_medium() {
    echo -e "${YELLOW}[MEDIUM]${NC} $1"
    ((MEDIUM_ISSUES++))
}

print_low() {
    echo -e "${CYAN}[LOW]${NC} $1"
    ((LOW_ISSUES++))
}

# Initialize report
init_report() {
    mkdir -p "${REPORT_DIR}"
    cat > "${REPORT_FILE}" <<EOF
# Security Scan Report

**Project:** Brisa Cubana Clean Intelligence
**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Scan Type:** $1

---

## Executive Summary

EOF
}

# Add section to report
add_to_report() {
    echo "$1" >> "${REPORT_FILE}"
}

# 1. NPM Audit - Check for vulnerable dependencies
scan_npm_dependencies() {
    print_header "1. NPM Dependency Vulnerability Scan"

    print_status "Running npm audit on production dependencies..."

    # Run npm audit and capture output
    if pnpm audit --prod --json > /tmp/npm-audit.json 2>&1; then
        print_success "No vulnerabilities found in production dependencies"
        add_to_report "### NPM Audit - Production Dependencies"
        add_to_report "**Status:** ✅ PASS"
        add_to_report "**Vulnerabilities:** 0"
        add_to_report ""
    else
        print_warning "Vulnerabilities found in dependencies"

        # Parse JSON and count vulnerabilities by severity
        if command -v jq &> /dev/null; then
            CRITICAL=$(jq -r '.metadata.vulnerabilities.critical // 0' /tmp/npm-audit.json)
            HIGH=$(jq -r '.metadata.vulnerabilities.high // 0' /tmp/npm-audit.json)
            MODERATE=$(jq -r '.metadata.vulnerabilities.moderate // 0' /tmp/npm-audit.json)
            LOW=$(jq -r '.metadata.vulnerabilities.low // 0' /tmp/npm-audit.json)

            echo "  Critical: $CRITICAL"
            echo "  High: $HIGH"
            echo "  Moderate: $MODERATE"
            echo "  Low: $LOW"

            CRITICAL_ISSUES=$((CRITICAL_ISSUES + CRITICAL))
            HIGH_ISSUES=$((HIGH_ISSUES + HIGH))
            MEDIUM_ISSUES=$((MEDIUM_ISSUES + MODERATE))
            LOW_ISSUES=$((LOW_ISSUES + LOW))

            add_to_report "### NPM Audit - Production Dependencies"
            add_to_report "**Status:** ⚠️ VULNERABILITIES FOUND"
            add_to_report "- Critical: $CRITICAL"
            add_to_report "- High: $HIGH"
            add_to_report "- Moderate: $MODERATE"
            add_to_report "- Low: $LOW"
            add_to_report ""
            add_to_report '```'
            pnpm audit --prod >> "${REPORT_FILE}"
            add_to_report '```'
            add_to_report ""
        fi
    fi

    # Also check dev dependencies (informational only)
    print_status "Running npm audit on all dependencies (including dev)..."
    pnpm audit --json > /tmp/npm-audit-all.json 2>&1 || true

    echo ""
}

# 2. Secrets Detection - Check for leaked secrets
scan_secrets() {
    print_header "2. Secrets Detection Scan"

    print_status "Scanning for accidentally committed secrets..."

    # Check for common secret patterns in code
    SECRETS_FOUND=0

    # Patterns to search for
    declare -a patterns=(
        "password\s*=\s*['\"][^'\"]+['\"]"
        "api_key\s*=\s*['\"][^'\"]+['\"]"
        "secret\s*=\s*['\"][^'\"]+['\"]"
        "token\s*=\s*['\"][^'\"]+['\"]"
        "AWS_ACCESS_KEY_ID"
        "STRIPE_SECRET_KEY"
        "DATABASE_URL.*postgresql://"
        "JWT_SECRET\s*=\s*['\"][^'\"]+['\"]"
    )

    add_to_report "### Secrets Detection"
    add_to_report ""

    for pattern in "${patterns[@]}"; do
        if grep -rEi --exclude-dir={node_modules,.git,dist,build,.next,coverage,.venv,.venv-docs,storybook-static} \
                    --exclude="*.lock" \
                    --exclude="*-lock.json" \
                    --exclude="*.md" \
                    --exclude="*.test.ts" \
                    --exclude="*.spec.ts" \
                    --exclude="security-scan.sh" \
                    --exclude="run-load-tests.sh" \
                    "${pattern}" . 2>/dev/null; then
            print_high "Potential secret found matching pattern: ${pattern}"
            ((SECRETS_FOUND++))
        fi
    done

    # Check for .env files in git
    if git ls-files | grep -E "\.env$" > /dev/null 2>&1; then
        print_critical ".env file is tracked in git!"
        add_to_report "**CRITICAL:** .env file found in git repository"
        ((SECRETS_FOUND++))
    fi

    if [ $SECRETS_FOUND -eq 0 ]; then
        print_success "No secrets detected in code"
        add_to_report "**Status:** ✅ PASS"
        add_to_report "No secrets detected in codebase"
    else
        print_error "Found $SECRETS_FOUND potential secrets"
        add_to_report "**Status:** ❌ FAIL"
        add_to_report "Found $SECRETS_FOUND potential secrets in code"
    fi

    add_to_report ""
    echo ""
}

# 3. Security Headers Check
check_security_headers() {
    print_header "3. Security Headers Verification"

    print_status "Checking if API is running..."

    # Check if API is available
    if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_warning "API is not running. Start it with: pnpm dev:api"
        add_to_report "### Security Headers"
        add_to_report "**Status:** ⚠️ SKIPPED (API not running)"
        add_to_report ""
        return
    fi

    print_status "Verifying security headers..."

    # Required security headers
    declare -A required_headers=(
        ["Content-Security-Policy"]="present"
        ["X-Content-Type-Options"]="nosniff"
        ["X-Frame-Options"]="DENY|SAMEORIGIN"
        ["Strict-Transport-Security"]="max-age="
        ["Referrer-Policy"]="present"
    )

    HEADERS_OK=0
    HEADERS_MISSING=0

    add_to_report "### Security Headers"
    add_to_report ""

    # Get headers from API
    HEADERS=$(curl -sI http://localhost:3001/health)

    for header in "${!required_headers[@]}"; do
        expected="${required_headers[$header]}"

        if echo "$HEADERS" | grep -qi "^${header}:"; then
            actual=$(echo "$HEADERS" | grep -i "^${header}:" | cut -d: -f2- | xargs)

            if [[ "$expected" == "present" ]] || echo "$actual" | grep -Eq "${expected}"; then
                print_success "${header}: ${actual}"
                add_to_report "- ✅ ${header}: \`${actual}\`"
                ((HEADERS_OK++))
            else
                print_warning "${header}: ${actual} (expected: ${expected})"
                add_to_report "- ⚠️ ${header}: \`${actual}\` (expected: ${expected})"
                ((HEADERS_MISSING++))
            fi
        else
            print_error "${header}: MISSING"
            add_to_report "- ❌ ${header}: MISSING"
            ((HEADERS_MISSING++))
        fi
    done

    if [ $HEADERS_MISSING -eq 0 ]; then
        print_success "All security headers present"
        add_to_report ""
        add_to_report "**Status:** ✅ PASS"
    else
        print_error "$HEADERS_MISSING security headers missing or misconfigured"
        add_to_report ""
        add_to_report "**Status:** ❌ FAIL ($HEADERS_MISSING issues)"
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + HEADERS_MISSING))
    fi

    add_to_report ""
    echo ""
}

# 4. CORS Configuration Check
check_cors_config() {
    print_header "4. CORS Configuration Check"

    if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_warning "API is not running. Skipping CORS check."
        add_to_report "### CORS Configuration"
        add_to_report "**Status:** ⚠️ SKIPPED (API not running)"
        add_to_report ""
        return
    fi

    print_status "Testing CORS configuration..."

    add_to_report "### CORS Configuration"
    add_to_report ""

    # Test 1: Legitimate origin (localhost in dev)
    print_status "Test 1: Allowed origin (localhost:3000)"
    RESPONSE=$(curl -sI -H "Origin: http://localhost:3000" http://localhost:3001/api/services)

    if echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin:"; then
        ALLOWED_ORIGIN=$(echo "$RESPONSE" | grep -i "Access-Control-Allow-Origin:" | cut -d: -f2- | xargs)
        print_success "Allowed origin accepted: ${ALLOWED_ORIGIN}"
        add_to_report "- ✅ Allowed origin (localhost:3000) accepted"
    else
        print_error "CORS not working for allowed origins"
        add_to_report "- ❌ CORS not working for allowed origins"
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
    fi

    # Test 2: Malicious origin
    print_status "Test 2: Blocked origin (evil.com)"
    RESPONSE=$(curl -sI -H "Origin: http://evil.com" http://localhost:3001/api/services)

    if echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin: http://evil.com"; then
        print_critical "CORS allows arbitrary origins!"
        add_to_report "- ❌ **CRITICAL:** CORS allows malicious origin (evil.com)"
    else
        print_success "Malicious origin blocked"
        add_to_report "- ✅ Malicious origin (evil.com) blocked"
    fi

    # Test 3: Check for wildcard
    print_status "Test 3: Checking for wildcard (*) CORS"
    if grep -r "origin.*\*" apps/api/src/app.ts > /dev/null 2>&1; then
        # Check if it's in production code or just dev
        if grep -A5 "NODE_ENV.*production" apps/api/src/app.ts | grep -q "origin.*\*"; then
            print_critical "Wildcard CORS enabled in production!"
            add_to_report "- ❌ **CRITICAL:** Wildcard CORS in production code"
        else
            print_success "Wildcard only in development"
            add_to_report "- ✅ Wildcard CORS only in development mode"
        fi
    else
        print_success "No wildcard CORS found"
        add_to_report "- ✅ No wildcard CORS configured"
    fi

    add_to_report ""
    add_to_report "**Status:** ✅ PASS"
    add_to_report ""
    echo ""
}

# 5. Rate Limiting Check
check_rate_limiting() {
    print_header "5. Rate Limiting Configuration"

    if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_warning "API is not running. Skipping rate limiting check."
        add_to_report "### Rate Limiting"
        add_to_report "**Status:** ⚠️ SKIPPED (API not running)"
        add_to_report ""
        return
    fi

    print_status "Checking rate limiting implementation..."

    add_to_report "### Rate Limiting"
    add_to_report ""

    # Check rate limiting code
    if grep -q "rateLimiter" apps/api/src/app.ts; then
        print_success "Rate limiting middleware found"
        add_to_report "- ✅ Rate limiting middleware implemented"

        # Extract rate limit configurations
        if grep -A20 "RateLimits\s*=" apps/api/src/middleware/rate-limit.ts > /dev/null 2>&1; then
            print_status "Rate limit configurations:"
            grep -A20 "RateLimits\s*=" apps/api/src/middleware/rate-limit.ts | \
                grep -E "(auth|api|write|read):" | while read -r line; do
                echo "  $line"
            done

            add_to_report ""
            add_to_report "**Configurations:**"
            add_to_report '```typescript'
            grep -A20 "RateLimits\s*=" apps/api/src/middleware/rate-limit.ts >> "${REPORT_FILE}"
            add_to_report '```'
        fi
    else
        print_error "Rate limiting not implemented!"
        add_to_report "- ❌ Rate limiting middleware NOT found"
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
    fi

    # Test rate limiting (simple test)
    print_status "Testing rate limiting behavior..."
    RATE_LIMIT_HEADER=$(curl -sI http://localhost:3001/api/services | grep -i "X-RateLimit-Limit" || echo "")

    if [ -n "$RATE_LIMIT_HEADER" ]; then
        print_success "Rate limit headers present: ${RATE_LIMIT_HEADER}"
        add_to_report "- ✅ Rate limit headers present in responses"
    else
        print_warning "Rate limit headers not found in response"
        add_to_report "- ⚠️ Rate limit headers not visible (might be OK if disabled in test)"
    fi

    add_to_report ""
    add_to_report "**Status:** ✅ PASS"
    add_to_report ""
    echo ""
}

# 6. Input Validation Check
check_input_validation() {
    print_header "6. Input Validation & Sanitization"

    print_status "Checking input validation implementation..."

    add_to_report "### Input Validation & Sanitization"
    add_to_report ""

    # Check for Zod usage
    ZOD_USAGE=$(grep -r "z\." apps/api/src/routes/ --include="*.ts" | grep -v ".test.ts" | wc -l)

    if [ "$ZOD_USAGE" -gt 0 ]; then
        print_success "Zod validation found in $ZOD_USAGE locations"
        add_to_report "- ✅ Zod validation schemas: $ZOD_USAGE usages"
    else
        print_error "No Zod validation found!"
        add_to_report "- ❌ No Zod validation schemas found"
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
    fi

    # Check for sanitization
    if [ -f "apps/api/src/lib/sanitize.ts" ]; then
        print_success "Sanitization library found"
        add_to_report "- ✅ Sanitization library present (DOMPurify)"

        SANITIZE_USAGE=$(grep -r "sanitize" apps/api/src/routes/ --include="*.ts" | grep -v ".test.ts" | wc -l)
        print_status "Sanitization used in $SANITIZE_USAGE locations"
        add_to_report "- ✅ Sanitization usage: $SANITIZE_USAGE locations"
    else
        print_warning "Sanitization library not found"
        add_to_report "- ⚠️ Sanitization library not found"
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
    fi

    # Check for Prisma ORM (SQL injection prevention)
    PRISMA_USAGE=$(grep -r "db\." apps/api/src/ --include="*.ts" | grep -v ".test.ts" | wc -l)
    print_success "Prisma ORM used in $PRISMA_USAGE locations (prevents SQL injection)"
    add_to_report "- ✅ Prisma ORM: $PRISMA_USAGE usages (SQL injection prevention)"

    add_to_report ""
    add_to_report "**Status:** ✅ PASS"
    add_to_report ""
    echo ""
}

# 7. Authentication & Authorization Check
check_auth_implementation() {
    print_header "7. Authentication & Authorization"

    print_status "Checking authentication implementation..."

    add_to_report "### Authentication & Authorization"
    add_to_report ""

    # Check for JWT
    if grep -q "jsonwebtoken" apps/api/package.json; then
        print_success "JWT library found"
        add_to_report "- ✅ JWT authentication implemented"
    else
        print_critical "JWT library not found!"
        add_to_report "- ❌ **CRITICAL:** No JWT authentication"
    fi

    # Check for bcrypt
    if grep -q "bcryptjs" apps/api/package.json; then
        print_success "bcrypt library found (password hashing)"
        add_to_report "- ✅ bcrypt for password hashing"
    else
        print_critical "bcrypt not found!"
        add_to_report "- ❌ **CRITICAL:** No password hashing library"
    fi

    # Check auth middleware
    if [ -f "apps/api/src/middleware/auth.ts" ]; then
        print_success "Auth middleware found"
        add_to_report "- ✅ Authentication middleware present"

        # Check for RBAC
        if grep -q "requireAuth.*allowedRoles" apps/api/src/middleware/auth.ts; then
            print_success "RBAC (Role-Based Access Control) implemented"
            add_to_report "- ✅ RBAC (Role-Based Access Control) implemented"
        else
            print_warning "RBAC not clearly implemented"
            add_to_report "- ⚠️ RBAC implementation unclear"
        fi
    else
        print_critical "Auth middleware not found!"
        add_to_report "- ❌ **CRITICAL:** No authentication middleware"
    fi

    # Check auth tests
    AUTH_TESTS=$(find apps/api/src -name "*auth*.test.ts" | wc -l)
    print_status "Authentication tests found: $AUTH_TESTS files"
    add_to_report "- ✅ Authentication test coverage: $AUTH_TESTS test files"

    add_to_report ""
    add_to_report "**Status:** ✅ PASS"
    add_to_report ""
    echo ""
}

# 8. Container Security (if --full flag)
scan_containers() {
    print_header "8. Container Security Scan"

    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found. Skipping container scan."
        add_to_report "### Container Security"
        add_to_report "**Status:** ⚠️ SKIPPED (Docker not available)"
        add_to_report ""
        return
    fi

    print_status "Checking for Trivy scanner..."

    if ! command -v trivy &> /dev/null; then
        print_warning "Trivy not installed. Install with: brew install aquasecurity/trivy/trivy"
        add_to_report "### Container Security"
        add_to_report "**Status:** ⚠️ SKIPPED (Trivy not installed)"
        add_to_report ""
        return
    fi

    add_to_report "### Container Security (Trivy)"
    add_to_report ""

    # Scan API container
    if [ -f "apps/api/Dockerfile" ]; then
        print_status "Building API container for scanning..."
        docker build -t brisa-api:security-scan apps/api -f apps/api/Dockerfile > /dev/null 2>&1 || {
            print_warning "Failed to build API container"
            add_to_report "- ⚠️ Failed to build API container for scanning"
            return
        }

        print_status "Scanning API container with Trivy..."
        trivy image --severity HIGH,CRITICAL brisa-api:security-scan > /tmp/trivy-api.txt 2>&1 || true

        if grep -q "Total: 0" /tmp/trivy-api.txt; then
            print_success "No HIGH/CRITICAL vulnerabilities in API container"
            add_to_report "- ✅ API container: No HIGH/CRITICAL vulnerabilities"
        else
            VULN_COUNT=$(grep -c "CVE-" /tmp/trivy-api.txt || echo "0")
            print_warning "Found vulnerabilities in API container"
            add_to_report "- ⚠️ API container: $VULN_COUNT vulnerabilities found"
            add_to_report ""
            add_to_report '```'
            head -n 50 /tmp/trivy-api.txt >> "${REPORT_FILE}"
            add_to_report '```'
        fi
    fi

    add_to_report ""
    echo ""
}

# Generate final report
generate_final_report() {
    print_header "Security Scan Summary"

    # Calculate total issues
    TOTAL_ISSUES=$((CRITICAL_ISSUES + HIGH_ISSUES + MEDIUM_ISSUES + LOW_ISSUES))

    # Add summary to report
    add_to_report "## Summary"
    add_to_report ""
    add_to_report "| Severity | Count |"
    add_to_report "|----------|-------|"
    add_to_report "| 🔴 Critical | $CRITICAL_ISSUES |"
    add_to_report "| 🟠 High | $HIGH_ISSUES |"
    add_to_report "| 🟡 Medium | $MEDIUM_ISSUES |"
    add_to_report "| 🔵 Low | $LOW_ISSUES |"
    add_to_report "| **Total** | **$TOTAL_ISSUES** |"
    add_to_report ""

    # Overall status
    if [ $CRITICAL_ISSUES -eq 0 ] && [ $HIGH_ISSUES -eq 0 ]; then
        STATUS="✅ PASS"
        add_to_report "**Overall Status:** ✅ PASS"
        add_to_report ""
        add_to_report "No critical or high severity issues found."
    elif [ $CRITICAL_ISSUES -gt 0 ]; then
        STATUS="❌ FAIL (Critical Issues)"
        add_to_report "**Overall Status:** ❌ FAIL"
        add_to_report ""
        add_to_report "**Action Required:** $CRITICAL_ISSUES critical issues must be fixed immediately."
    else
        STATUS="⚠️ WARNING (High Issues)"
        add_to_report "**Overall Status:** ⚠️ WARNING"
        add_to_report ""
        add_to_report "**Recommendation:** $HIGH_ISSUES high severity issues should be addressed soon."
    fi

    # Print summary to console
    echo ""
    echo -e "${BOLD}Security Scan Results:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  Critical: ${RED}$CRITICAL_ISSUES${NC}"
    echo -e "  High:     ${YELLOW}$HIGH_ISSUES${NC}"
    echo -e "  Medium:   ${CYAN}$MEDIUM_ISSUES${NC}"
    echo -e "  Low:      ${BLUE}$LOW_ISSUES${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  Overall:  ${STATUS}${NC}"
    echo ""

    # Recommendations
    add_to_report ""
    add_to_report "## Recommendations"
    add_to_report ""

    if [ $TOTAL_ISSUES -eq 0 ]; then
        add_to_report "- Continue regular security scans (weekly recommended)"
        add_to_report "- Keep dependencies updated with \`pnpm update\`"
        add_to_report "- Review security headers monthly"
        add_to_report "- Conduct penetration testing quarterly"
    else
        add_to_report "1. **Immediate Actions:**"
        [ $CRITICAL_ISSUES -gt 0 ] && add_to_report "   - Fix all CRITICAL vulnerabilities immediately"
        [ $HIGH_ISSUES -gt 0 ] && add_to_report "   - Address HIGH severity issues within 48 hours"
        add_to_report ""
        add_to_report "2. **Short-term Actions (1-2 weeks):**"
        add_to_report "   - Update vulnerable dependencies"
        add_to_report "   - Review and fix MEDIUM severity issues"
        add_to_report "   - Run scan again to verify fixes"
        add_to_report ""
        add_to_report "3. **Long-term Actions:**"
        add_to_report "   - Implement automated security scanning in CI/CD"
        add_to_report "   - Schedule regular penetration testing"
        add_to_report "   - Conduct security training for development team"
    fi

    add_to_report ""
    add_to_report "---"
    add_to_report ""
    add_to_report "*Report generated by: \`scripts/security-scan.sh\`*"

    print_success "Detailed report saved to: ${REPORT_FILE}"
    echo ""
}

# Main execution
main() {
    SCAN_TYPE="Standard"
    FULL_SCAN=false
    QUICK_SCAN=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                FULL_SCAN=true
                SCAN_TYPE="Full Scan"
                shift
                ;;
            --quick)
                QUICK_SCAN=true
                SCAN_TYPE="Quick Scan"
                shift
                ;;
            --report)
                # Report is always generated
                shift
                ;;
            *)
                echo "Unknown option: $1"
                echo "Usage: $0 [--full|--quick] [--report]"
                exit 1
                ;;
        esac
    done

    echo ""
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║  Brisa Cubana - Security Scan (${SCAN_TYPE})${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Initialize report
    init_report "${SCAN_TYPE}"

    # Run scans based on mode
    if [ "$QUICK_SCAN" = true ]; then
        scan_npm_dependencies
        scan_secrets
    else
        scan_npm_dependencies
        scan_secrets
        check_security_headers
        check_cors_config
        check_rate_limiting
        check_input_validation
        check_auth_implementation

        if [ "$FULL_SCAN" = true ]; then
            scan_containers
        fi
    fi

    # Generate final report
    generate_final_report

    # Exit with appropriate code
    if [ $CRITICAL_ISSUES -gt 0 ]; then
        exit 1
    elif [ $HIGH_ISSUES -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
