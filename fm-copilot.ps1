# FM Copilot Docker Environment Manager - PowerShell Version
# Simplified version with improved syntax compatibility

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('start', 'stop', 'restart', 'force-stop', 'force', 'cleanup', 'logs', 'status', 'production', 'deploy', 'backup', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Mandatory=$false)]
    [string]$Service = ''
)

# Configuration
$ComposeFile = "docker-compose.yml"
$ComposeProdFile = "docker-compose.prod.yml"
$ProjectName = "fm-copilot"

# Color output functions
function Write-Status($message) {
    Write-Host "[INFO] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Write-Header($message) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

# Check if Docker is running
function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check if Docker Compose is available
function Test-DockerCompose {
    try {
        docker-compose version | Out-Null
        return "docker-compose"
    }
    catch {
        try {
            docker compose version | Out-Null
            return "docker compose"
        }
        catch {
            return $null
        }
    }
}

# Start environment
function Start-Environment {
    Write-Header "Starting FM Copilot Environment"
    
    if (-not (Test-DockerRunning)) {
        Write-Error "Docker is not running. Please start Docker Desktop first."
        exit 1
    }
    
    $ComposeCmd = Test-DockerCompose
    if (-not $ComposeCmd) {
        Write-Error "Docker Compose is not installed or not in PATH."
        exit 1
    }
    
    # Create necessary directories
    New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null
    New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null
    New-Item -ItemType Directory -Force -Path "nginx\ssl" | Out-Null
    
    # Check for .env files
    if (-not (Test-Path "backend\.env")) {
        Write-Warning "Backend .env file not found. Copying from example..."
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Status "Please edit backend\.env with your configuration before starting."
    }
    
    if (-not (Test-Path "frontend\.env")) {
        Write-Warning "Frontend .env file not found. Creating default..."
        "VITE_API_URL=http://localhost:8000/api" | Out-File -FilePath "frontend\.env" -Encoding UTF8
    }
    
    # Start services
    Write-Status "Starting all services..."
    
    if ($ComposeCmd -eq "docker-compose") {
        docker-compose -f $ComposeFile -p $ProjectName up -d
    } else {
        docker compose -f $ComposeFile -p $ProjectName up -d
    }
    
    # Wait for services to be ready
    Write-Status "Waiting for services to be ready..."
    Start-Sleep -Seconds 15
    
    # Check service status
    $runningContainers = docker ps -f "name=$ProjectName" --format "table {{.Names}}"
    if ($runningContainers.Count -lt 4) {
        Write-Error "Some services failed to start. Check logs with: .\$($MyInvocation.MyCommand.Name).ps1 logs"
        docker ps -f "name=$ProjectName"
        exit 1
    }
    
    Write-Status "Environment started successfully!"
    Write-Host ""
    Write-Host "Services available at:" -ForegroundColor Green
    Write-Host "  • Frontend: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Blue
    Write-Host "  • Backend API: " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Blue
    Write-Host "  • Health Check: " -NoNewline; Write-Host "http://localhost:8000/health" -ForegroundColor Blue
    Write-Host "  • Database: " -NoNewline; Write-Host "localhost:3306" -ForegroundColor Blue
    Write-Host "  • Redis: " -NoNewline; Write-Host "localhost:6379" -ForegroundColor Blue
    Write-Host ""
    Write-Status "View logs with: .\$($MyInvocation.MyCommand.Name).ps1 logs"
    Write-Status "Stop environment with: .\$($MyInvocation.MyCommand.Name).ps1 stop"
}

# Stop environment gracefully
function Stop-Environment {
    Write-Header "Stopping FM Copilot Environment"
    
    $ComposeCmd = Test-DockerCompose
    $runningContainers = docker ps -f "name=$ProjectName" --format "{{.Names}}"
    
    if ($runningContainers.Count -gt 0) {
        if ($ComposeCmd -eq "docker-compose") {
            docker-compose -f $ComposeFile -p $ProjectName down
        } else {
            docker compose -f $ComposeFile -p $ProjectName down
        }
        Write-Status "Environment stopped gracefully."
    } else {
        Write-Warning "No services are currently running."
    }
}

# Force shutdown (stop services and containers)
function Force-Shutdown {
    Write-Header "Performing Force Shutdown of Services"
    
    $ComposeCmd = Test-DockerCompose
    
    # Stop all services
    Write-Status "Stopping all services..."
    try {
        if ($ComposeCmd -eq "docker-compose") {
            docker-compose -f $ComposeFile -p $ProjectName down --remove-orphans
        } else {
            docker compose -f $ComposeFile -p $ProjectName down --remove-orphans
        }
    } catch {
        Write-Warning "Services stop completed with warnings."
    }
    
    # Remove containers (including stopped ones)
    Write-Status "Removing containers..."
    try {
        docker ps -a -f "name=$ProjectName" -q | ForEach-Object {
            docker rm -f $_ 2>$null
        }
    } catch {
        Write-Warning "Container removal completed with warnings."
    }
    
    # Remove any runaway threads/processes
    Write-Status "Cleaning up any runaway processes..."
    try {
        docker ps -a -f "name=$ProjectName" -q | ForEach-Object {
            docker kill $_ 2>$null
        }
    } catch {
        Write-Warning "Process cleanup completed with warnings."
    }
    
    # Remove networks
    Write-Status "Removing networks..."
    try {
        docker network ls -f "name=$ProjectName" -q | ForEach-Object {
            docker network rm $_ 2>$null
        }
    } catch {
        Write-Warning "Network removal completed with warnings."
    }
    
    Write-Status "Force shutdown completed. Services and containers removed."
}

# Delete all data (complete cleanup including volumes and data)
function Delete-All {
    Write-Header "PERFORMING COMPLETE DATA DESTRUCTION!"
    Write-Warning "WARNING: This will delete ALL data including database!"
    Write-Warning "This action cannot be undone!"
    Write-Host ""
    
    $confirm = Read-Host "Type 'DELETE ALL DATA' to confirm: "
    
    if ($confirm -ne "DELETE ALL DATA") {
        Write-Status "Data deletion cancelled."
        return 1
    }
    
    $ComposeCmd = Test-DockerCompose
    
    # First do force shutdown
    Force-Shutdown
    
    # Remove volumes (THIS DELETES ALL DATA)
    Write-Status "Removing all data volumes..."
    try {
        docker volume ls -f "name=$ProjectName" -q | ForEach-Object {
            docker volume rm -f $_ 2>$null
        }
    } catch {
        Write-Warning "Volume removal completed with warnings."
    }
    
    # Remove any remaining project-related resources
    Write-Status "Removing any remaining project resources..."
    try {
        docker ps -a -f "name=$ProjectName" -q | ForEach-Object {
            docker rm -f $_ 2>$null
        }
        docker network ls -f "name=$ProjectName" -q | ForEach-Object {
            docker network rm -f $_ 2>$null
        }
    } catch {
        Write-Warning "Resource cleanup completed with warnings."
    }
    
    # Clean up all unused Docker resources aggressively
    Write-Status "Aggressive cleanup of Docker resources..."
    try {
        docker system prune -a -f
    } catch {
        Write-Warning "System prune completed with warnings."
    }
    
    # Remove any project-specific files
    Write-Status "Removing temporary project files..."
    try {
        Remove-Item -Recurse -Force "./backend\logs" -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force "./backend\uploads" -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force "./nginx\ssl" -ErrorAction SilentlyContinue
    } catch {
        Write-Warning "File cleanup completed with warnings."
    }
    
    Write-Status "COMPLETE: All data and resources deleted for project: $ProjectName"
}

# Show logs
function Show-Logs {
    Write-Header "Service Logs"
    
    $ComposeCmd = Test-DockerCompose
    
    if ($Service) {
        Write-Status "Showing logs for service: $Service"
        if ($ComposeCmd -eq "docker-compose") {
            docker-compose -f $ComposeFile -p $ProjectName logs -f $Service
        } else {
            docker compose -f $ComposeFile -p $ProjectName logs -f $Service
        }
    } else {
        Write-Status "Showing logs for all services..."
        if ($ComposeCmd -eq "docker-compose") {
            docker-compose -f $ComposeFile -p $ProjectName logs -f
        } else {
            docker compose -f $ComposeFile -p $ProjectName logs -f
        }
    }
}

# Show status
function Show-Status {
    Write-Header "FM Copilot Environment Status"
    Write-Host ""
    
    $runningContainers = docker ps -f "name=$ProjectName" --format "table {{.Names}}\t{{.Status}}"
    
    if ($runningContainers.Count -gt 0) {
        Write-Host "Services are running:" -ForegroundColor Green
        docker ps -f "name=$ProjectName" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        Write-Host ""
        
        # Check health
        Write-Status "Service Health Check:"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 2>$null
            Write-Host "  • Backend API: " -NoNewline; Write-Host "✓ Healthy" -ForegroundColor Green
        }
        catch {
            Write-Host "  • Backend API: " -NoNewline; Write-Host "✗ Unhealthy" -ForegroundColor Red
        }
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 2>$null
            Write-Host "  • Frontend: " -NoNewline; Write-Host "✓ Running" -ForegroundColor Green
        }
        catch {
            Write-Host "  • Frontend: " -NoNewline; Write-Host "✗ Not accessible" -ForegroundColor Red
        }
        
        # Check MySQL
        try {
            $result = docker exec "${ProjectName}_mysql_1" mysqladmin ping -h localhost --silent 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  • MySQL: " -NoNewline; Write-Host "✓ Running" -ForegroundColor Green
            } else {
                Write-Host "  • MySQL: " -NoNewline; Write-Host "✗ Not running" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "  • MySQL: " -NoNewline; Write-Host "✗ Not running" -ForegroundColor Red
        }
        
        # Check Redis
        try {
            $result = docker exec "${ProjectName}_redis_1" redis-cli ping 2>$null
            if ($result -eq "PONG") {
                Write-Host "  • Redis: " -NoNewline; Write-Host "✓ Running" -ForegroundColor Green
            } else {
                Write-Host "  • Redis: " -NoNewline; Write-Host "✗ Not running" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "  • Redis: " -NoNewline; Write-Host "✗ Not running" -ForegroundColor Red
        }
    } else {
        Write-Host "No services are running." -ForegroundColor Red
        Write-Host ""
        Write-Host "Start with: .\$($MyInvocation.MyCommand.Name).ps1 start"
    }
    Write-Host ""
}

# Production deployment
function Deploy-Production {
    Write-Header "Deploying FM Copilot to Production"
    
    if (-not (Test-Path $ComposeProdFile)) {
        Write-Error "Production compose file not found: $ComposeProdFile"
        exit 1
    }
    
    $ComposeCmd = Test-DockerCompose
    
    # Pull latest images
    Write-Status "Pulling latest images..."
    if ($ComposeCmd -eq "docker-compose") {
        docker-compose -f $ComposeProdFile -p $ProjectName pull
    } else {
        docker compose -f $ComposeProdFile -p $ProjectName pull
    }
    
    # Deploy with zero downtime
    Write-Status "Starting production deployment..."
    if ($ComposeCmd -eq "docker-compose") {
        docker-compose -f $ComposeProdFile -p $ProjectName up -d --no-deps backend frontend
    } else {
        docker compose -f $ComposeProdFile -p $ProjectName up -d --no-deps backend frontend
    }
    
    Write-Status "Production deployment completed!"
}

# Backup data
function Backup-Data {
    Write-Header "Creating Data Backup"
    
    $backupDir = "backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    
    # Backup MySQL database
    Write-Status "Backing up MySQL database..."
    try {
        docker exec "${ProjectName}_mysql_1" mysqldump -u root -ppassword fm_copilot > "$backupDir\database.sql"
    } catch {
        Write-Warning "Database backup completed with warnings."
    }
    
    # Backup uploads
    if (Test-Path "backend\uploads") {
        Write-Status "Backing up uploads..."
        Copy-Item "backend\uploads" "$backupDir\" -Recurse
    }
    
    # Backup configuration
    if (Test-Path "backend\.env") {
        Write-Status "Backing up configuration..."
        Copy-Item "backend\.env" "$backupDir\"
    }
    
    Write-Status "Backup completed: $backupDir"
}

# Show help
function Show-Help {
    Write-Header "FM Copilot Docker Manager"
    Write-Host "Usage: .\$($MyInvocation.MyCommand.Name).ps1 [COMMAND] [OPTIONS]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start           Start FM Copilot environment"
    Write-Host "  stop            Stop environment gracefully"
    Write-Host "  restart         Restart environment"
    Write-Host "  force-stop      Force stop services and containers (preserves data)"
    Write-Host "  delete-all      DELETE ALL DATA AND RESOURCES (DESTRUCTIVE)"
    Write-Host "  logs [service]  Show logs for all or specific service"
    Write-Host "  status          Show environment status"
    Write-Host "  production     Deploy to production"
    Write-Host "  backup          Backup all data"
    Write-Host "  help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\$($MyInvocation.MyCommand.Name).ps1 start                    # Start all services"
    Write-Host "  .\$($MyInvocation.MyCommand.Name).ps1 logs backend             # Show backend logs only"
    Write-Host "  .\$($MyInvocation.MyCommand.Name).ps1 force-stop                # Force stop services and containers (preserves data)"
    Write-Host "  .\$($MyInvocation.MyCommand.Name).ps1 delete-all                # DELETE ALL DATA AND RESOURCES (DESTRUCTIVE)"
    Write-Host ""
    Write-Host "Services:"
    Write-Host "  backend, frontend, mysql, redis, nginx"
}

# Main script logic
switch ($Command) {
    "start" {
        Start-Environment
    }
    "stop" {
        Stop-Environment
    }
    "restart" {
        Stop-Environment
        Start-Sleep -Seconds 2
        Start-Environment
    }
    "force-stop" {
        Force-Shutdown
    }
    "force" {
        Force-Shutdown
    }
    "cleanup" {
        Force-Shutdown
    }
    "delete-all" {
        Delete-All
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "production" {
        Deploy-Production
    }
    "deploy" {
        Deploy-Production
    }
    "backup" {
        Backup-Data
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}