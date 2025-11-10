#!/bin/bash

# Production stop script for Company News Social App

set -e

# Configuration
PID_DIR="pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file="$PID_DIR/${service_name}.pid"
    
    if [ ! -f "$pid_file" ]; then
        warning "$service_name PID file not found"
        return 0
    fi
    
    local pid=$(cat $pid_file)
    
    if ! ps -p $pid > /dev/null 2>&1; then
        warning "$service_name is not running (stale PID file)"
        rm -f $pid_file
        return 0
    fi
    
    log "Stopping $service_name (PID: $pid)..."
    
    # Try graceful shutdown first
    kill -TERM $pid 2>/dev/null || true
    
    # Wait up to 10 seconds for graceful shutdown
    local count=0
    while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if ps -p $pid > /dev/null 2>&1; then
        warning "$service_name didn't stop gracefully, forcing shutdown..."
        kill -KILL $pid 2>/dev/null || true
        sleep 2
    fi
    
    # Check if stopped
    if ps -p $pid > /dev/null 2>&1; then
        error "Failed to stop $service_name"
        return 1
    else
        success "$service_name stopped successfully"
        rm -f $pid_file
        return 0
    fi
}

# Stop all services
stop_all_services() {
    log "Stopping all Company News Social App services..."
    
    local failed=0
    
    # Stop backend
    if ! stop_service "backend"; then
        failed=1
    fi
    
    # Stop frontend
    if ! stop_service "frontend"; then
        failed=1
    fi
    
    if [ $failed -eq 0 ]; then
        success "All services stopped successfully"
    else
        error "Some services failed to stop properly"
        exit 1
    fi
}

# Show current status
show_status() {
    echo ""
    echo "=== SERVICE STATUS ==="
    
    local backend_running=false
    local frontend_running=false
    
    if [ -f "$PID_DIR/backend.pid" ]; then
        local backend_pid=$(cat $PID_DIR/backend.pid)
        if ps -p $backend_pid > /dev/null 2>&1; then
            echo "Backend: Running (PID: $backend_pid)"
            backend_running=true
        else
            echo "Backend: Not running (stale PID file)"
            rm -f $PID_DIR/backend.pid
        fi
    else
        echo "Backend: Not running"
    fi
    
    if [ -f "$PID_DIR/frontend.pid" ]; then
        local frontend_pid=$(cat $PID_DIR/frontend.pid)
        if ps -p $frontend_pid > /dev/null 2>&1; then
            echo "Frontend: Running (PID: $frontend_pid)"
            frontend_running=true
        else
            echo "Frontend: Not running (stale PID file)"
            rm -f $PID_DIR/frontend.pid
        fi
    else
        echo "Frontend: Not running"
    fi
    
    echo "======================"
    
    if [ "$backend_running" = true ] || [ "$frontend_running" = true ]; then
        return 1  # Services are running
    else
        return 0  # No services running
    fi
}

# Force stop all processes (nuclear option)
force_stop() {
    log "Force stopping all related processes..."
    
    # Kill any node processes running our app
    pkill -f "company-news-social-app" 2>/dev/null || true
    pkill -f "serve.*dist" 2>/dev/null || true
    
    # Clean up PID files
    rm -f $PID_DIR/*.pid
    
    success "Force stop completed"
}

# Main function
main() {
    if [ ! -d "$PID_DIR" ]; then
        warning "PID directory not found. Services may not be running."
        exit 0
    fi
    
    stop_all_services
    
    # Verify all services are stopped
    if show_status > /dev/null 2>&1; then
        success "All services confirmed stopped"
    else
        warning "Some services may still be running"
        show_status
    fi
}

# Handle script arguments
case "$1" in
    "stop"|"")
        main
        ;;
    "status")
        show_status
        if [ $? -eq 0 ]; then
            log "No services are currently running"
        fi
        ;;
    "force")
        force_stop
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo "Commands:"
        echo "  stop    - Stop all services gracefully (default)"
        echo "  status  - Show service status"
        echo "  force   - Force stop all processes"
        echo "  help    - Show this help"
        ;;
    *)
        error "Invalid command: $1. Use 'help' for usage information"
        ;;
esac