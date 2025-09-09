#!/bin/bash

# BRIRoom Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
}

# Function to build and start production environment
start_production() {
    print_status "Starting BRIRoom in production mode..."
    check_docker
    check_docker_compose
    
    print_status "Building and starting services..."
    docker-compose -f docker-compose.yml up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    if docker-compose -f docker-compose.yml ps | grep -q "healthy\|Up"; then
        print_success "BRIRoom is running in production mode!"
        print_success "Frontend: http://localhost"
        print_success "Backend API: http://localhost:5001"
        print_success "Database: localhost:5432"
    else
        print_error "Some services failed to start. Check logs with: ./docker-run.sh logs"
    fi
}

# Function to build and start development environment
start_development() {
    print_status "Starting BRIRoom in development mode..."
    check_docker
    check_docker_compose
    
    print_status "Building and starting services..."
    docker-compose -f docker-compose.dev.yml up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    print_success "BRIRoom is running in development mode!"
    print_success "Frontend: http://localhost:3000"
    print_success "Backend API: http://localhost:5001"
    print_success "Database: localhost:5432"
}

# Function to stop services
stop_services() {
    print_status "Stopping BRIRoom services..."
    docker-compose -f docker-compose.yml down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    print_success "Services stopped."
}

# Function to view logs
view_logs() {
    if [ -f "docker-compose.yml" ] && docker-compose -f docker-compose.yml ps -q >/dev/null 2>&1; then
        docker-compose -f docker-compose.yml logs -f --tail=100
    elif [ -f "docker-compose.dev.yml" ] && docker-compose -f docker-compose.dev.yml ps -q >/dev/null 2>&1; then
        docker-compose -f docker-compose.dev.yml logs -f --tail=100
    else
        print_error "No running services found."
    fi
}

# Function to clean up Docker resources
cleanup() {
    print_warning "This will remove all containers, images, and volumes related to BRIRoom."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up Docker resources..."
        
        # Stop and remove containers
        docker-compose -f docker-compose.yml down -v --remove-orphans 2>/dev/null || true
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
        
        # Remove images
        docker images | grep briroom | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true
        
        # Remove volumes
        docker volume ls | grep briroom | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true
        
        print_success "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show status
show_status() {
    print_status "BRIRoom Docker Services Status:"
    echo
    
    print_status "Production services:"
    if docker-compose -f docker-compose.yml ps 2>/dev/null; then
        docker-compose -f docker-compose.yml ps
    else
        echo "No production services running."
    fi
    
    echo
    print_status "Development services:"
    if docker-compose -f docker-compose.dev.yml ps 2>/dev/null; then
        docker-compose -f docker-compose.dev.yml ps
    else
        echo "No development services running."
    fi
}

# Function to show help
show_help() {
    echo "BRIRoom Docker Management Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  prod, production    Start production environment"
    echo "  dev, development    Start development environment"
    echo "  stop               Stop all services"
    echo "  status             Show status of services"
    echo "  logs               View logs"
    echo "  cleanup            Remove all Docker resources"
    echo "  help               Show this help message"
    echo
    echo "Examples:"
    echo "  $0 prod            # Start production environment"
    echo "  $0 dev             # Start development environment"
    echo "  $0 logs            # View logs"
    echo "  $0 stop            # Stop all services"
}

# Main script logic
case "${1:-help}" in
    "prod"|"production")
        start_production
        ;;
    "dev"|"development")
        start_development
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        view_logs
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
