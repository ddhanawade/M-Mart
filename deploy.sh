#!/bin/bash

###############################################################################
# Mahabaleshwer Mart - Production Deployment Script for AWS EC2
# This script automates the deployment process on Ubuntu server
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$HOME/apps/mahabaleshwer-mart"
BACKEND_DIR="$HOME/apps/mahabaleshwer-mart-backend"
COMPOSE_FILE="docker-compose.prod.yml"

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check if Docker Compose is installed
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    # Check if directories exist
    if [ ! -d "$APP_DIR" ]; then
        print_error "Frontend directory not found: $APP_DIR"
        exit 1
    fi
    print_success "Frontend directory found"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    print_success "Backend directory found"
}

create_network() {
    print_header "Creating Docker Network"
    
    if docker network inspect mahabaleshwer-mart-backend_mahabaleshwer-network &> /dev/null; then
        print_warning "Network already exists"
    else
        docker network create mahabaleshwer-mart-backend_mahabaleshwer-network
        print_success "Network created successfully"
    fi
}

pull_latest_code() {
    print_header "Pulling Latest Code"
    
    cd "$APP_DIR"
    print_info "Pulling frontend code..."
    git pull origin main || print_warning "Could not pull frontend code (might be up to date)"
    
    cd "$BACKEND_DIR"
    print_info "Pulling backend code..."
    git pull origin main || print_warning "Could not pull backend code (might be up to date)"
    
    cd "$APP_DIR"
    print_success "Code updated"
}

stop_services() {
    print_header "Stopping Existing Services"
    
    cd "$APP_DIR"
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        print_info "Stopping services..."
        docker compose -f "$COMPOSE_FILE" down
        print_success "Services stopped"
    else
        print_warning "No running services found"
    fi
}

build_and_start() {
    print_header "Building and Starting Services"
    
    cd "$APP_DIR"
    print_info "This may take 10-15 minutes for the first build..."
    
    # Build and start services
    docker compose -f "$COMPOSE_FILE" up -d --build
    
    print_success "Services started successfully"
}

wait_for_services() {
    print_header "Waiting for Services to be Healthy"
    
    print_info "Waiting for services to start (this may take 2-3 minutes)..."
    sleep 30
    
    # Check service health
    services=("config-server" "service-discovery" "api-gateway" "mysql" "redis" "kafka")
    
    for service in "${services[@]}"; do
        print_info "Checking $service..."
        max_attempts=30
        attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if docker ps | grep -q "mahabaleshwer-$service.*healthy"; then
                print_success "$service is healthy"
                break
            fi
            
            attempt=$((attempt + 1))
            if [ $attempt -eq $max_attempts ]; then
                print_warning "$service is not healthy yet (check logs)"
            else
                sleep 5
            fi
        done
    done
}

show_status() {
    print_header "Deployment Status"
    
    cd "$APP_DIR"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    print_info "Service URLs:"
    echo "  Frontend:           http://localhost:4200"
    echo "  API Gateway:        http://localhost:8080"
    echo "  Eureka Dashboard:   http://localhost:8761"
    echo "  MySQL:              localhost:3306"
    echo "  Redis:              localhost:6379"
    echo "  Kafka:              localhost:9092"
}

show_logs() {
    print_header "Recent Logs"
    
    cd "$APP_DIR"
    docker compose -f "$COMPOSE_FILE" logs --tail=20
}

cleanup() {
    print_header "Cleaning Up Docker Resources"
    
    print_info "Removing unused images..."
    docker image prune -f
    
    print_info "Removing unused volumes..."
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Main deployment flow
main() {
    print_header "Mahabaleshwer Mart - Production Deployment"
    
    check_prerequisites
    create_network
    
    # Ask if user wants to pull latest code
    read -p "Pull latest code from Git? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pull_latest_code
    fi
    
    stop_services
    build_and_start
    wait_for_services
    show_status
    
    # Ask if user wants to see logs
    read -p "Show recent logs? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
    
    # Ask if user wants to cleanup
    read -p "Clean up unused Docker resources? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
    
    print_header "Deployment Complete!"
    print_success "Application is now running"
    print_info "Access the application at: http://your-domain.com"
    print_info "To view logs: cd $APP_DIR && docker compose -f $COMPOSE_FILE logs -f"
    print_info "To stop: cd $APP_DIR && docker compose -f $COMPOSE_FILE down"
}

# Handle script arguments
case "${1:-}" in
    start)
        print_header "Starting Services"
        cd "$APP_DIR"
        docker compose -f "$COMPOSE_FILE" up -d
        print_success "Services started"
        ;;
    stop)
        print_header "Stopping Services"
        cd "$APP_DIR"
        docker compose -f "$COMPOSE_FILE" down
        print_success "Services stopped"
        ;;
    restart)
        print_header "Restarting Services"
        cd "$APP_DIR"
        docker compose -f "$COMPOSE_FILE" restart
        print_success "Services restarted"
        ;;
    logs)
        cd "$APP_DIR"
        docker compose -f "$COMPOSE_FILE" logs -f
        ;;
    status)
        cd "$APP_DIR"
        docker compose -f "$COMPOSE_FILE" ps
        ;;
    cleanup)
        cleanup
        ;;
    *)
        main
        ;;
esac
