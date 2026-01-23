#!/bin/bash

# FM Copilot Docker Environment Manager
# Usage: ./fm-copilot.sh [start|stop|restart|clean|logs|status]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
PROJECT_NAME="fm-copilot"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FM Copilot Docker Manager${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check if docker-compose is available
check_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH."
        exit 1
    fi
}

# Get docker-compose command
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Start the environment
start_environment() {
    print_header
    print_status "Starting FM Copilot environment..."
    
    check_docker
    check_compose
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    # Create necessary directories
    mkdir -p backend/logs
    mkdir -p backend/uploads
    mkdir -p nginx/ssl
    
    # Set proper permissions
    chmod 755 backend/logs backend/uploads nginx/ssl 2>/dev/null || true
    
    # Check for .env files
    if [ ! -f "backend/.env" ]; then
        print_warning "Backend .env file not found. Copying from example..."
        cp backend/.env.example backend/.env
        print_status "Please edit backend/.env with your configuration before starting."
    fi
    
    if [ ! -f "frontend/.env" ]; then
        print_warning "Frontend .env file not found. Creating default..."
        echo "VITE_API_URL=http://localhost:8000/api" > frontend/.env
    fi
    
    # Start services with rebuild for code changes
    print_status "Building and starting all services..."
    $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service status
    FAILED_SERVICES=$($COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME ps --format "table {{.Status}}" | grep -v "Up" | grep -v "STATUS" || true)
    if [ -n "$FAILED_SERVICES" ]; then
        print_error "Some services failed to start. Check logs with: $0 logs"
        $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME ps
        exit 1
    fi
    
    print_status "Environment started successfully!"
    echo
    echo -e "${GREEN}Services available at:${NC}"
    echo -e "  • Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "  • Backend API: ${BLUE}http://localhost:8000${NC}"
    echo -e "  • Health Check: ${BLUE}http://localhost:8000/health${NC}"
    echo -e "  • Database: ${BLUE}localhost:3306${NC}"
    echo -e "  • Redis: ${BLUE}localhost:6379${NC}"
    echo
    print_status "View logs with: $0 logs"
    print_status "Stop environment with: $0 stop"
}

# Stop the environment gracefully
stop_environment() {
    print_header
    print_status "Stopping FM Copilot environment..."
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    if $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME ps -q | grep -v ""; then
        $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME down
        print_status "Environment stopped gracefully."
    else
        print_warning "No services are currently running."
    fi
}

# Force shutdown (stop services and containers)
force_shutdown() {
    print_header
    print_warning "Performing force shutdown of services..."
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    # Stop all services
    print_status "Stopping all services..."
    $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME down --remove-orphans 2>/dev/null || true
    
    # Remove containers (including stopped ones)
    print_status "Removing containers..."
    docker ps -a --filter "name=$PROJECT_NAME" -q | xargs -r docker rm -f || true
    
    # Remove any runaway threads/processes
    print_status "Cleaning up any runaway processes..."
    docker ps -a --filter "name=$PROJECT_NAME" -q | xargs -r docker kill || true
    
    # Remove networks
    print_status "Removing networks..."
    docker network ls --filter "name=$PROJECT_NAME" -q | xargs -r docker network rm || true
    
    print_status "Force shutdown completed. Services and containers removed."
}

# Delete all data (complete cleanup including volumes and data)
delete_all() {
    print_header
    print_warning "PERFORMING COMPLETE DATA DESTRUCTION!"
    echo -e "${RED}WARNING: This will delete ALL data including database!${NC}"
    echo -e "${RED}This action cannot be undone!${NC}"
    echo
    
    read -p "Type 'DELETE ALL DATA' to confirm: " -r
    echo
    if [[ $REPLY != "DELETE ALL DATA" ]]; then
        print_status "Data deletion cancelled."
        return 1
    fi
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    # First do force shutdown
    force_shutdown
    
    # Remove volumes (THIS DELETES ALL DATA)
    print_status "Removing all data volumes..."
    docker volume ls --filter "name=$PROJECT_NAME" -q | xargs -r docker volume rm -f || true
    
    # Remove any remaining project-related resources
    print_status "Removing any remaining project resources..."
    docker ps -a --filter "name=$PROJECT_NAME" -q | xargs -r docker rm -f || true
    docker network ls --filter "name=$PROJECT_NAME" -q | xargs -r docker network rm -f || true
    
    # Clean up all unused Docker resources aggressively
    print_status "Aggressive cleanup of Docker resources..."
    docker system prune -a -f --volumes
    
    # Remove any project-specific files
    print_status "Removing temporary project files..."
    rm -rf ./backend/logs/*
    rm -rf ./backend/uploads/*
    rm -rf ./nginx/ssl/*
    
    print_status "COMPLETE: All data and resources deleted for project: $PROJECT_NAME"
}

# Show logs
show_logs() {
    print_header
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    if [ $# -eq 0 ]; then
        print_status "Showing logs for all services..."
        $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
    else
        service=$1
        print_status "Showing logs for service: $service"
        $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME logs -f $service
    fi
}

# Show status
show_status() {
    print_header
    print_status "FM Copilot Environment Status:"
    echo
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    RUNNING_CONTAINERS=$($COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME ps -q)
    if [ -n "$RUNNING_CONTAINERS" ]; then
        echo -e "${GREEN}Services are running:${NC}"
        $COMPOSE_CMD -f $COMPOSE_FILE -p $PROJECT_NAME ps
        echo
        
        # Check health
        print_status "Service Health Check:"
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "  • Backend API: ${GREEN}✓ Healthy${NC}"
        else
            echo -e "  • Backend API: ${RED}✗ Unhealthy${NC}"
        fi
        
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "  • Frontend: ${GREEN}✓ Running${NC}"
        else
            echo -e "  • Frontend: ${RED}✗ Not accessible${NC}"
        fi
        
        if docker exec ${PROJECT_NAME}_mysql_1 mysqladmin ping -h localhost --silent 2>/dev/null; then
            echo -e "  • MySQL: ${GREEN}✓ Running${NC}"
        else
            echo -e "  • MySQL: ${RED}✗ Not running${NC}"
        fi
        
        if docker exec ${PROJECT_NAME}_redis_1 redis-cli ping 2>/dev/null | grep -q PONG; then
            echo -e "  • Redis: ${GREEN}✓ Running${NC}"
        else
            echo -e "  • Redis: ${RED}✗ Not running${NC}"
        fi
    else
        echo -e "${RED}No services are running.${NC}"
        echo
        echo -e "Start with: $0 start"
    fi
    echo
}

# Production deployment
deploy_production() {
    print_header
    print_status "Deploying FM Copilot to production..."
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    if [ ! -f "$COMPOSE_PROD_FILE" ]; then
        print_error "Production compose file not found: $COMPOSE_PROD_FILE"
        exit 1
    fi
    
    # Pull latest images
    print_status "Pulling latest images..."
    $COMPOSE_CMD -f $COMPOSE_PROD_FILE -p $PROJECT_NAME pull
    
    # Deploy with zero downtime
    print_status "Starting production deployment..."
    $COMPOSE_CMD -f $COMPOSE_PROD_FILE -p $PROJECT_NAME up -d --no-deps backend frontend
    
    print_status "Production deployment completed!"
}

# Backup data
backup_data() {
    print_header
    print_status "Creating data backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # Backup MySQL database
    print_status "Backing up MySQL database..."
    docker exec ${PROJECT_NAME}_mysql_1 mysqldump -u root -ppassword fm_copilot > $BACKUP_DIR/database.sql
    
    # Backup uploads
    if [ -d "backend/uploads" ]; then
        print_status "Backing up uploads..."
        cp -r backend/uploads $BACKUP_DIR/
    fi
    
    # Backup configuration
    if [ -f "backend/.env" ]; then
        print_status "Backing up configuration..."
        cp backend/.env $BACKUP_DIR/
    fi
    
    print_status "Backup completed: $BACKUP_DIR"
}

# Show help
show_help() {
    print_header
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
echo "Commands:"
    echo "  start           Start FM Copilot environment (rebuilds with code changes)"
    echo "  stop            Stop environment gracefully"
    echo "  restart         Restart environment (rebuilds with code changes)"
    echo "  force-stop      Force stop services and containers (preserves data)"
    echo "  delete-all      DELETE ALL DATA AND RESOURCES (DESTRUCTIVE)"
    echo "  logs [service]  Show logs for all or specific service"
    echo "  status          Show environment status"
    echo "  production     Deploy to production"
    echo "  backup          Backup all data"
    echo "  help            Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 logs backend             # Show backend logs only"
    echo "  $0 force-stop                # Force stop services and containers (preserves data)"
    echo "  $0 delete-all                # DELETE ALL DATA AND RESOURCES (DESTRUCTIVE)"
    echo
    echo "Services:"
    echo "  backend, frontend, mysql, redis, nginx"
}

# Main script logic
case "$1" in
    start)
        start_environment
        ;;
    stop)
        stop_environment
        ;;
    restart)
        stop_environment
        sleep 2
        start_environment
        ;;
    force-stop|force)
        force_shutdown
        ;;
    delete-all|destroy)
        delete_all
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
        ;;
    production|deploy)
        deploy_production
        ;;
    backup)
        backup_data
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac