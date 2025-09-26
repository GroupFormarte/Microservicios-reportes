#!/bin/bash

# ===============================================
# Formarte Reports - Automated Deployment Script
# ===============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="formarte-reports"
CONTAINER_NAME="formarte-reports-service"
IMAGE_NAME="formarte/reports-microservice"

# Default values
ENVIRONMENT="development"
PROFILE=""
BUILD_MODE="development"
SKIP_BUILD=false
SKIP_TESTS=false
FORCE_RECREATE=false
DETACHED=true
SHOW_LOGS=false

# Functions
print_header() {
    echo -e "${CYAN}"
    echo "==============================================="
    echo "🎓 FORMARTE REPORTS - DEPLOYMENT SCRIPT"
    echo "==============================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

show_usage() {
    echo -e "${CYAN}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo -e "${YELLOW}OPTIONS:${NC}"
    echo "  -e, --env ENVIRONMENT        Set environment (development|production|staging) [default: development]"
    echo "  -p, --profile PROFILE        Docker compose profile (production|monitoring|cache) [optional]"
    echo "  -b, --build-mode MODE        Build mode (development|production) [default: development]"
    echo "  --skip-build                 Skip Docker image build"
    echo "  --skip-tests                 Skip running tests"
    echo "  --force-recreate            Force recreate containers"
    echo "  --logs                       Show logs after deployment"
    echo "  --no-detach                  Don't run in detached mode"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo -e "${YELLOW}PROFILES:${NC}"
    echo "  production                   Include Nginx reverse proxy"
    echo "  monitoring                   Include Prometheus + Grafana"
    echo "  cache                        Include Redis for caching"
    echo ""
    echo -e "${YELLOW}EXAMPLES:${NC}"
    echo "  $0                                    # Development mode (basic)"
    echo "  $0 -e production -p production        # Production with Nginx"
    echo "  $0 -e production -p monitoring        # Production with monitoring"
    echo "  $0 --skip-build --logs                # Quick restart with logs"
    echo "  $0 --force-recreate                   # Force rebuild everything"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if running as root (warn)
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. Consider using a non-root user for security."
    fi
    
    print_success "Prerequisites check passed"
}

create_env_file() {
    print_step "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from template..."
        
        cat > .env << EOF
# ===============================================
# Formarte Reports - Environment Configuration
# ===============================================

# Server Configuration
NODE_ENV=${ENVIRONMENT}
PORT=3001
HOST=0.0.0.0

# Security (CHANGE THESE IN PRODUCTION!)
API_KEY=formarte-api-key-$(date +%s)-$(openssl rand -hex 8)
JWT_SECRET=jwt-secret-$(date +%s)-$(openssl rand -hex 16)

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined

# Optional Service Ports
NGINX_PORT=80
NGINX_HTTPS_PORT=443
REDIS_PORT=6379
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_PASSWORD=admin123

# Generated on: $(date)
EOF
        
        print_success "Created .env file with secure defaults"
        print_warning "Please review and update .env file for production use!"
    else
        print_info ".env file already exists, keeping current configuration"
    fi
}

create_docker_directories() {
    print_step "Creating Docker configuration directories..."
    
    # Create directory structure
    mkdir -p docker/{nginx/conf.d,nginx/ssl,redis,prometheus,grafana/provisioning}
    
    # Create Nginx configuration
    if [ ! -f "docker/nginx/nginx.conf" ]; then
        cat > docker/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream formarte_reports {
        server formarte-reports:3001;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        client_max_body_size 50M;
        
        location / {
            proxy_pass http://formarte_reports;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        location /health {
            proxy_pass http://formarte_reports/health;
            access_log off;
        }
    }
}
EOF
    fi
    
    # Create Redis configuration
    if [ ! -f "docker/redis/redis.conf" ]; then
        cat > docker/redis/redis.conf << 'EOF'
# Redis configuration for Formarte Reports
bind 0.0.0.0
port 6379
timeout 300
tcp-keepalive 60
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF
    fi
    
    # Create Prometheus configuration
    if [ ! -f "docker/prometheus/prometheus.yml" ]; then
        cat > docker/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'formarte-reports'
    static_configs:
      - targets: ['formarte-reports:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF
    fi
    
    print_success "Docker configuration directories created"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_info "Skipping tests (--skip-tests flag)"
        return
    fi
    
    print_step "Running tests..."
    
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        if npm test; then
            print_success "All tests passed"
        else
            print_error "Tests failed"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_warning "No tests found or configured"
    fi
}

build_docker_image() {
    if [ "$SKIP_BUILD" = true ]; then
        print_info "Skipping Docker build (--skip-build flag)"
        return
    fi
    
    print_step "Building Docker image..."
    
    # Build arguments based on mode
    BUILD_ARGS=""
    if [ "$BUILD_MODE" = "production" ]; then
        BUILD_ARGS="--target production"
    fi
    
    if docker build $BUILD_ARGS -t $IMAGE_NAME:latest -t $IMAGE_NAME:$(date +%Y%m%d-%H%M%S) .; then
        print_success "Docker image built successfully"
    else
        print_error "Docker build failed"
        exit 1
    fi
}

deploy_services() {
    print_step "Deploying services..."
    
    # Prepare Docker Compose command
    COMPOSE_CMD="docker-compose"
    
    # Check if docker compose (v2) is available
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    # Prepare profile arguments
    PROFILE_ARGS=""
    if [ -n "$PROFILE" ]; then
        PROFILE_ARGS="--profile $PROFILE"
    fi
    
    # Prepare additional arguments
    EXTRA_ARGS=""
    if [ "$FORCE_RECREATE" = true ]; then
        EXTRA_ARGS="$EXTRA_ARGS --force-recreate"
    fi
    
    if [ "$DETACHED" = true ]; then
        EXTRA_ARGS="$EXTRA_ARGS -d"
    fi
    
    # Stop existing containers
    print_info "Stopping existing containers..."
    $COMPOSE_CMD $PROFILE_ARGS down --remove-orphans || true
    
    # Start services
    print_info "Starting services..."
    if $COMPOSE_CMD $PROFILE_ARGS up $EXTRA_ARGS $EXTRA_ARGS; then
        print_success "Services deployed successfully"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

show_deployment_info() {
    print_step "Deployment Information"
    
    echo -e "${CYAN}📊 Service URLs:${NC}"
    echo "  🎓 Formarte Reports: http://localhost:3001"
    echo "  ❤️  Health Check:    http://localhost:3001/health"
    
    if [ "$PROFILE" = "production" ] || [ "$PROFILE" = "monitoring" ]; then
        echo "  🌐 Nginx Proxy:     http://localhost:80"
    fi
    
    if [ "$PROFILE" = "monitoring" ]; then
        echo "  📊 Prometheus:      http://localhost:9090"
        echo "  📈 Grafana:         http://localhost:3000 (admin/admin123)"
    fi
    
    if [ "$PROFILE" = "cache" ] || [ "$PROFILE" = "production" ]; then
        echo "  🗄️  Redis:           localhost:6379"
    fi
    
    echo ""
    echo -e "${CYAN}🔧 Useful Commands:${NC}"
    echo "  View logs:          docker-compose logs -f"
    echo "  Stop services:      docker-compose down"
    echo "  Restart service:    docker-compose restart formarte-reports"
    echo "  Execute shell:      docker-compose exec formarte-reports sh"
    echo "  View containers:    docker ps"
    
    echo ""
    echo -e "${CYAN}📋 API Key (save this):${NC}"
    if [ -f ".env" ]; then
        grep "API_KEY=" .env | head -1
    fi
}

show_logs() {
    if [ "$SHOW_LOGS" = true ]; then
        print_step "Showing service logs..."
        echo -e "${YELLOW}Press Ctrl+C to exit logs${NC}"
        sleep 2
        
        COMPOSE_CMD="docker-compose"
        if docker compose version &> /dev/null; then
            COMPOSE_CMD="docker compose"
        fi
        
        $COMPOSE_CMD logs -f
    fi
}

cleanup_on_exit() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed. Check the logs above for details."
        echo ""
        print_info "To troubleshoot:"
        echo "  - Check Docker logs: docker-compose logs"
        echo "  - Verify .env configuration"
        echo "  - Ensure ports are not in use"
        echo "  - Try: $0 --force-recreate"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -b|--build-mode)
            BUILD_MODE="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --force-recreate)
            FORCE_RECREATE=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --no-detach)
            DETACHED=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Trap to handle cleanup
trap cleanup_on_exit EXIT

# Main execution
main() {
    print_header
    
    print_info "Configuration:"
    print_info "  Environment: $ENVIRONMENT"
    print_info "  Profile: ${PROFILE:-none}"
    print_info "  Build Mode: $BUILD_MODE"
    print_info "  Skip Build: $SKIP_BUILD"
    print_info "  Skip Tests: $SKIP_TESTS"
    print_info "  Force Recreate: $FORCE_RECREATE"
    print_info "  Show Logs: $SHOW_LOGS"
    echo ""
    
    check_prerequisites
    create_env_file
    create_docker_directories
    run_tests
    build_docker_image
    deploy_services
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    
    show_deployment_info
    show_logs
}

# Run main function
main "$@"