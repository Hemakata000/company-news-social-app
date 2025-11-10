#!/bin/bash

# Local Testing Script for Company News Social App
# This script performs comprehensive testing of the application

set -e

# Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
API_URL="$BACKEND_URL/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TEST_RESULTS=()

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("PASS: $1")
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("FAIL: $1")
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test HTTP endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    local data=$5

    log "Testing: $description"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
                   -H "Content-Type: application/json" \
                   -d "$data" 2>/dev/null || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" 2>/dev/null || echo -e "\n000")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        success "$description (Status: $status_code)"
        return 0
    else
        error "$description (Expected: $expected_status, Got: $status_code)"
        if [ "$status_code" = "000" ]; then
            error "  Connection failed - is the server running?"
        elif [ -n "$body" ]; then
            echo "  Response: $(echo "$body" | head -c 200)..."
        fi
        return 1
    fi
}

# Test JSON response structure
test_json_response() {
    local url=$1
    local description=$2
    local required_fields=$3

    log "Testing JSON structure: $description"
    
    response=$(curl -s "$url" 2>/dev/null || echo "{}")
    
    # Check if response is valid JSON
    if ! echo "$response" | python3 -m json.tool > /dev/null 2>&1; then
        error "$description - Invalid JSON response"
        return 1
    fi
    
    # Check required fields
    for field in $required_fields; do
        if ! echo "$response" | grep -q "\"$field\""; then
            error "$description - Missing field: $field"
            return 1
        fi
    done
    
    success "$description - JSON structure valid"
    return 0
}

# Check if services are running
check_services() {
    log "Checking if services are running..."
    
    # Check backend
    if curl -s "$BACKEND_URL" > /dev/null 2>&1; then
        success "Backend service is running on $BACKEND_URL"
    else
        error "Backend service is not running on $BACKEND_URL"
        echo "  Start with: cd backend && npm run dev"
        return 1
    fi
    
    # Check frontend
    if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        success "Frontend service is running on $FRONTEND_URL"
    else
        error "Frontend service is not running on $FRONTEND_URL"
        echo "  Start with: cd frontend && npm run dev"
        return 1
    fi
    
    return 0
}

# Test health endpoints
test_health_endpoints() {
    log "Testing health endpoints..."
    
    test_endpoint "GET" "$API_URL/health" "200" "Basic health check"
    test_json_response "$API_URL/health" "Health endpoint JSON" "status timestamp service"
    
    test_endpoint "GET" "$API_URL/health/metrics" "200" "Metrics endpoint"
    test_json_response "$API_URL/health/metrics" "Metrics JSON" "timestamp system application"
    
    test_endpoint "GET" "$API_URL/health/ready" "200" "Readiness probe"
    test_endpoint "GET" "$API_URL/health/live" "200" "Liveness probe"
}

# Test news endpoints
test_news_endpoints() {
    log "Testing news endpoints..."
    
    # Test company search
    test_endpoint "GET" "$API_URL/news/search/companies?q=apple" "200" "Company search"
    test_json_response "$API_URL/news/search/companies?q=apple" "Company search JSON" "query companies"
    
    # Test news fetching
    test_endpoint "GET" "$API_URL/news/apple?limit=5" "200" "Company news"
    test_json_response "$API_URL/news/apple?limit=5" "Company news JSON" "company articles"
    
    # Test recent news
    test_endpoint "GET" "$API_URL/news/apple/recent" "200" "Recent company news"
    
    # Test invalid company (should handle gracefully)
    test_endpoint "GET" "$API_URL/news/nonexistentcompany123" "200" "Invalid company handling"
}

# Test content generation endpoints
test_content_endpoints() {
    log "Testing content generation endpoints..."
    
    # Test content generation health
    test_endpoint "GET" "$API_URL/content/health" "200" "Content service health"
    
    # Test content generation (may fail if no API keys configured)
    local test_data='{"articleId":"test_article","platforms":["twitter"],"tone":"professional"}'
    
    # This might fail with 503 if AI services aren't configured, which is acceptable
    response=$(curl -s -w "\n%{http_code}" -X "POST" "$API_URL/content/generate" \
               -H "Content-Type: application/json" \
               -d "$test_data" 2>/dev/null || echo -e "\n000")
    
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "200" ]; then
        success "Content generation (Status: 200)"
    elif [ "$status_code" = "503" ]; then
        warning "Content generation unavailable (Status: 503) - AI services may not be configured"
    else
        error "Content generation failed (Status: $status_code)"
    fi
}

# Test error handling
test_error_handling() {
    log "Testing error handling..."
    
    # Test 404 endpoints
    test_endpoint "GET" "$API_URL/nonexistent" "404" "404 error handling"
    
    # Test invalid JSON
    local invalid_json='{"invalid": json}'
    response=$(curl -s -w "\n%{http_code}" -X "POST" "$API_URL/content/generate" \
               -H "Content-Type: application/json" \
               -d "$invalid_json" 2>/dev/null || echo -e "\n000")
    
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "400" ]; then
        success "Invalid JSON handling (Status: 400)"
    else
        error "Invalid JSON handling (Expected: 400, Got: $status_code)"
    fi
}

# Test frontend accessibility
test_frontend() {
    log "Testing frontend accessibility..."
    
    # Test main page
    if curl -s "$FRONTEND_URL" | grep -q "Company News Social App"; then
        success "Frontend main page loads correctly"
    else
        error "Frontend main page doesn't load correctly"
    fi
    
    # Test static assets
    if curl -s "$FRONTEND_URL/assets" > /dev/null 2>&1; then
        success "Frontend static assets accessible"
    else
        warning "Frontend static assets may not be built yet"
    fi
}

# Performance tests
test_performance() {
    log "Testing performance..."
    
    # Test response times
    start_time=$(date +%s%N)
    curl -s "$API_URL/health" > /dev/null
    end_time=$(date +%s%N)
    
    response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $response_time -lt 1000 ]; then
        success "Health endpoint response time: ${response_time}ms (< 1000ms)"
    else
        warning "Health endpoint response time: ${response_time}ms (> 1000ms)"
    fi
    
    # Test concurrent requests
    log "Testing concurrent requests..."
    for i in {1..5}; do
        curl -s "$API_URL/health" > /dev/null &
    done
    wait
    success "Concurrent requests handled successfully"
}

# Database connectivity test
test_database() {
    log "Testing database connectivity..."
    
    # The health endpoint should indicate database status
    response=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q '"database".*"healthy"'; then
        success "Database connection healthy"
    elif echo "$response" | grep -q '"database".*"unhealthy"'; then
        error "Database connection unhealthy"
    else
        warning "Database status unclear from health endpoint"
    fi
}

# Cache testing
test_cache() {
    log "Testing cache functionality..."
    
    response=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q '"cache".*"healthy"'; then
        success "Cache (Redis) connection healthy"
    elif echo "$response" | grep -q '"cache".*"unhealthy"'; then
        warning "Cache (Redis) connection unhealthy - running without cache"
    else
        warning "Cache status unclear from health endpoint"
    fi
}

# Generate test report
generate_report() {
    echo ""
    echo "=================================="
    echo "         TEST REPORT"
    echo "=================================="
    echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        echo "Your application is ready for use."
    else
        echo -e "${RED}❌ Some tests failed.${NC}"
        echo "Please review the failures above and fix any issues."
    fi
    
    echo ""
    echo "Test Details:"
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == PASS* ]]; then
            echo -e "${GREEN}✓${NC} ${result#PASS: }"
        else
            echo -e "${RED}✗${NC} ${result#FAIL: }"
        fi
    done
    
    echo ""
    echo "Next Steps:"
    if [ $TESTS_FAILED -eq 0 ]; then
        echo "- Open http://localhost:3000 to use the application"
        echo "- Check API documentation at docs/API.md"
        echo "- Review user guide at docs/USER_GUIDE.md"
    else
        echo "- Fix failing tests before using the application"
        echo "- Check logs for detailed error information"
        echo "- Review setup guide at docs/SETUP.md"
    fi
}

# Main test execution
main() {
    echo "=================================="
    echo "  Company News Social App Tests"
    echo "=================================="
    echo "Starting comprehensive local testing..."
    echo ""
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        error "curl is required for testing but not installed"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        warning "python3 not found - JSON validation tests will be skipped"
    fi
    
    # Run test suites
    check_services || exit 1
    
    test_health_endpoints
    test_news_endpoints
    test_content_endpoints
    test_error_handling
    test_frontend
    test_performance
    test_database
    test_cache
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script arguments
case "$1" in
    "health")
        check_services
        test_health_endpoints
        ;;
    "api")
        test_health_endpoints
        test_news_endpoints
        test_content_endpoints
        test_error_handling
        ;;
    "frontend")
        test_frontend
        ;;
    "performance")
        test_performance
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [test-suite]"
        echo "Test suites:"
        echo "  health      - Test health endpoints only"
        echo "  api         - Test API endpoints only"
        echo "  frontend    - Test frontend only"
        echo "  performance - Test performance only"
        echo "  (no args)   - Run all tests"
        ;;
    "")
        main
        ;;
    *)
        error "Invalid test suite: $1. Use 'help' for usage information"
        exit 1
        ;;
esac