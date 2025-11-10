#!/bin/bash

# Production startup script for Company News Social App

set -e

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
LOG_DIR="logs"
PID_DIR="pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create necessary directories
mkdir -p $LOG_DIR $PID_DIR

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if services are already running
check_running_services() {
    if [ -f "$PID_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat $PID_DIR/backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            error "Backend is already running (PID: $BACKEND_PID)"
        else
            rm -f $PID_DIR/backend.pid
        fi
    fi
    
    if [ -f "$PID_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat $PID_DIR/frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            error "Frontend is already running (PID: $FRONTEND_PID)"
        else
            rm -f $PID_DIR/frontend.pid
        fi
    fi
}

# Start backend service
start_backend() {
    log "Starting backend service..."
    
    cd $BACKEND_DIR
    
    # Set production environment
    export NODE_ENV=production
    
    # Start backend in background
    nohup npm run start:prod > ../$LOG_DIR/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Save PID
    echo $BACKEND_PID > ../$PID_DIR/backend.pid
    
    cd ..
    
    # Wait a moment and check if it's still running
    sleep 3
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        success "Backend started successfully (PID: $BACKEND_PID)"
    else
        error "Backend failed to start. Check logs: $LOG_DIR/backend.log"
    fi
}

# Start frontend service (using a simple HTTP server)
start_frontend() {
    log "Starting frontend service..."
    
    cd $FRONTEND_DIR
    
    # Install serve if not available
    if ! command -v serve &> /dev/null; then
        log "Installing serve globally..."
        npm install -g serve
    fi
    
    # Start frontend in background
    nohup serve -s dist -l 3000 > ../$LOG_DIR/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Save PID
    echo $FRONTEND_PID > ../$PID_DIR/frontend.pid
    
    cd ..
    
    # Wait a moment and check if it's still running
    sleep 3
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        success "Frontend started successfully (PID: $FRONTEND_PID)"
    else
        error "Frontend failed to start. Check logs: $LOG_DIR/frontend.log"
    fi
}

# Perform health checks
health_check() {
    log "Performing health checks..."
    
    # Wait for services to fully start
    sleep 5
    
    # Check backend health
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
}

# Display service status
show_status() {
    echo ""
    echo "=== SERVICE STATUS ==="
    
    if [ -f "$PID_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat $PID_DIR/backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo "Backend: Running (PID: $BACKEND_PID)"
            echo "Backend URL: http://localhost:3001"
            echo "Backend Health: http://localhost:3001/api/health"
        else
            echo "Backend: Not running"
        fi
    else
        echo "Backend: Not running"
    fi
    
    if [ -f "$PID_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat $PID_DIR/frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo "Frontend: Running (PID: $FRONTEND_PID)"
            echo "Frontend URL: http://localhost:3000"
        else
            echo "Frontend: Not running"
        fi
    else
        echo "Frontend: Not running"
    fi
    
    echo ""
    echo "Logs directory: $LOG_DIR"
    echo "PIDs directory: $PID_DIR"
    echo "======================"
}

# Main function
main() {
    log "Starting Company News Social App in production mode..."
    
    check_running_services
    start_backend
    start_frontend
    health_check
    show_status
    
    success "All services started successfully!"
    log "Use './scripts/stop-production.sh' to stop all services"
}

# Handle script arguments
case "$1" in
    "start"|"")
        main
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo "Commands:"
        echo "  start   - Start all services (default)"
        echo "  status  - Show service status"
        echo "  help    - Show this help"
        ;;
    *)
        error "Invalid command: $1. Use 'help' for usage information"
        ;;
esac