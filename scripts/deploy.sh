#!/bin/bash

# Company News Social App Deployment Script
# This script handles the deployment of both frontend and backend

set -e  # Exit on any error

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DEPLOY_ENV=${1:-production}
BUILD_DIR="build"
LOG_FILE="deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check PostgreSQL client (for database checks)
    if ! command -v psql &> /dev/null; then
        warning "PostgreSQL client not found - database checks will be skipped"
    fi
    
    # Check Redis client (for cache checks)
    if ! command -v redis-cli &> /dev/null; then
        warning "Redis client not found - cache checks will be skipped"
    fi
    
    success "Prerequisites check completed"
}

# Environment validation
validate_environment() {
    log "Validating environment variables for $DEPLOY_ENV..."
    
    # Required environment variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "REDIS_URL"
        "NEWS_API_KEY"
        "OPENAI_API_KEY"
        "JWT_SECRET"
    )
    
    # Check if .env file exists
    if [ ! -f "$BACKEND_DIR/.env.$DEPLOY_ENV" ]; then
        error "Environment file $BACKEND_DIR/.env.$DEPLOY_ENV not found"
    fi
    
    # Source the environment file
    source "$BACKEND_DIR/.env.$DEPLOY_ENV"
    
    # Check required variables
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    success "Environment validation completed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Backend dependencies
    log "Installing backend dependencies..."
    cd $BACKEND_DIR
    npm ci --only=production
    cd ..
    
    # Frontend dependencies
    log "Installing frontend dependencies..."
    cd $FRONTEND_DIR
    npm ci
    cd ..
    
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests (if they exist)
    if [ -f "$BACKEND_DIR/package.json" ] && grep -q '"test"' "$BACKEND_DIR/package.json"; then
        log "Running backend tests..."
        cd $BACKEND_DIR
        npm test || warning "Backend tests failed"
        cd ..
    fi
    
    # Frontend tests (if they exist)
    if [ -f "$FRONTEND_DIR/package.json" ] && grep -q '"test"' "$FRONTEND_DIR/package.json"; then
        log "Running frontend tests..."
        cd $FRONTEND_DIR
        npm test || warning "Frontend tests failed"
        cd ..
    fi
    
    success "Tests completed"
}

# Build applications
build_applications() {
    log "Building applications..."
    
    # Build backend
    log "Building backend..."
    cd $BACKEND_DIR
    npm run build:prod
    cd ..
    
    # Build frontend
    log "Building frontend..."
    cd $FRONTEND_DIR
    export VITE_BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export VITE_GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    npm run build:prod
    cd ..
    
    success "Applications built successfully"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    cd $BACKEND_DIR
    npm run migrate || error "Database migration failed"
    cd ..
    
    success "Database migrations completed"
}

# Health checks
perform_health_checks() {
    log "Performing health checks..."
    
    # Start backend temporarily for health check
    cd $BACKEND_DIR
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 10
    
    # Health check
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        warning "Backend health check failed"
    fi
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
}

# Create deployment package
create_deployment_package() {
    log "Creating deployment package..."
    
    # Create build directory
    mkdir -p $BUILD_DIR
    
    # Copy backend build
    cp -r $BACKEND_DIR/dist $BUILD_DIR/backend
    cp $BACKEND_DIR/package.json $BUILD_DIR/backend/
    cp $BACKEND_DIR/.env.$DEPLOY_ENV $BUILD_DIR/backend/.env
    
    # Copy frontend build
    cp -r $FRONTEND_DIR/dist $BUILD_DIR/frontend
    
    # Copy deployment scripts
    cp -r scripts $BUILD_DIR/
    
    # Create deployment info
    cat > $BUILD_DIR/deployment-info.json << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "$DEPLOY_ENV",
    "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")",
    "version": "1.0.0",
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)"
}
EOF
    
    success "Deployment package created in $BUILD_DIR"
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    
    # Remove node_modules from build directory to save space
    find $BUILD_DIR -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment for environment: $DEPLOY_ENV"
    log "Deployment started at $(date)"
    
    # Create log file
    touch $LOG_FILE
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    install_dependencies
    run_tests
    build_applications
    run_migrations
    perform_health_checks
    create_deployment_package
    cleanup
    
    success "Deployment completed successfully!"
    log "Deployment finished at $(date)"
    log "Deployment package available in: $BUILD_DIR"
    
    # Display deployment summary
    echo ""
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Environment: $DEPLOY_ENV"
    echo "Build Directory: $BUILD_DIR"
    echo "Log File: $LOG_FILE"
    echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
    echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "=========================="
}

# Handle script arguments
case "$1" in
    "production"|"staging"|"development")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [environment]"
        echo "Environments: production, staging, development"
        echo "Default: production"
        ;;
    *)
        if [ -z "$1" ]; then
            main
        else
            error "Invalid environment: $1. Use production, staging, or development"
        fi
        ;;
esac