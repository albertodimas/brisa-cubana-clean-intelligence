#!/bin/bash
# Pre-Push Testing Script
# Ensures all code is tested and validated before pushing to remote repository
#
# Usage: ./scripts/pre-push-check.sh
# Exit code: 0 if all checks pass, 1 if any check fails

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if Docker services are running
check_docker_services() {
    print_status "Checking Docker services..."

    # Check if docker compose is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        return 1
    fi

    # Check if services are running
    if ! docker compose ps --services --filter "status=running" | grep -q "postgres"; then
        print_error "PostgreSQL service is not running. Start it with: pnpm docker:up"
        return 1
    fi

    if ! docker compose ps --services --filter "status=running" | grep -q "redis"; then
        print_error "Redis service is not running. Start it with: pnpm docker:up"
        return 1
    fi

    print_success "Docker services are running"
    return 0
}

# Function to run linting
run_lint() {
    print_status "Running linting checks..."

    if pnpm lint > /tmp/lint-output.log 2>&1; then
        print_success "Linting passed"
        return 0
    else
        print_error "Linting failed. See details below:"
        cat /tmp/lint-output.log
        return 1
    fi
}

# Function to run type checking
run_typecheck() {
    print_status "Running TypeScript type checking..."

    if pnpm typecheck > /tmp/typecheck-output.log 2>&1; then
        print_success "Type checking passed"
        return 0
    else
        print_error "Type checking failed. See details below:"
        cat /tmp/typecheck-output.log
        return 1
    fi
}

# Function to run tests
run_tests() {
    print_status "Running unit tests..."

    if pnpm test > /tmp/test-output.log 2>&1; then
        print_success "All tests passed"
        return 0
    else
        print_error "Tests failed. See details below:"
        cat /tmp/test-output.log
        return 1
    fi
}

# Function to check if there are uncommitted changes
check_uncommitted_changes() {
    print_status "Checking for uncommitted changes..."

    if [[ -n $(git status --porcelain) ]]; then
        print_warning "You have uncommitted changes:"
        git status --short
        echo ""
        read -p "Do you want to continue anyway? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Pre-push check cancelled by user"
            return 1
        fi
    else
        print_success "No uncommitted changes"
    fi
    return 0
}

# Function to run format check
run_format_check() {
    print_status "Checking code formatting..."

    if pnpm format:check > /tmp/format-output.log 2>&1; then
        print_success "Code formatting is correct"
        return 0
    else
        print_warning "Code formatting issues found. Run 'pnpm format' to fix."
        cat /tmp/format-output.log
        read -p "Do you want to auto-format now? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pnpm format
            print_success "Code formatted successfully"
            return 0
        fi
        return 1
    fi
}

# Main execution
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         Brisa Cubana - Pre-Push Quality Check             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    FAILED=0

    # Run all checks
    check_docker_services || FAILED=1
    check_uncommitted_changes || exit 1  # Exit immediately if user cancels
    run_format_check || FAILED=1
    run_lint || FAILED=1
    run_typecheck || FAILED=1
    run_tests || FAILED=1

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"

    if [ $FAILED -eq 0 ]; then
        echo "║              ✓ ALL CHECKS PASSED                          ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        print_success "Your code is ready to be pushed!"
        print_status "You can now safely run: git push"
        exit 0
    else
        echo "║              ✗ SOME CHECKS FAILED                         ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        print_error "Please fix the issues above before pushing"
        exit 1
    fi
}

# Run main function
main
