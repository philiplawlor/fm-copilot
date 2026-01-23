# FM Copilot - Script Management Guide

## Overview

FM Copilot includes dual script support for managing the Docker environment:

- **`fm-copilot.sh`** - For Linux/macOS and Git Bash on Windows
- **`fm-copilot.ps1`** - For PowerShell on Windows

Both scripts provide identical functionality with platform-appropriate syntax.

## Quick Reference

### Command Summary

| Command | Bash Script | PowerShell Script | Description |
|---------|-------------|------------------|-------------|
| **Start Services** | `./fm-copilot.sh start` | `.\fm-copilot.ps1 start` | Start all services with rebuild |
| **Stop Services** | `./fm-copilot.sh stop` | `.\fm-copilot.ps1 stop` | Stop services gracefully |
| **Restart Services** | `./fm-copilot.sh restart` | `.\fm-copilot.ps1 restart` | Stop and restart all services |
| **Force Stop** | `./fm-copilot.sh force-stop` | `.\fm-copilot.ps1 force-stop` | Force stop and remove containers |
| **Check Status** | `./fm-copilot.sh status` | `.\fm-copilot.ps1 status` | Show service status and health |
| **View Logs** | `./fm-copilot.sh logs [service]` | `.\fm-copilot.ps1 logs [service]` | Show logs (all or specific) |
| **Backup Data** | `./fm-copilot.sh backup` | `.\fm-copilot.ps1 backup` | Backup all data |
| **Delete All** | `./fm-copilot.sh delete-all` | `.\fm-copilot.ps1 delete-all` | ⚠️ Delete ALL data |
| **Show Help** | `./fm-copilot.sh help` | `.\fm-copilot.ps1 help` | Display help information |

### Available Services for Logs

- `backend` - Node.js API server logs
- `frontend` - Nginx/web server logs  
- `mysql` - Database server logs
- `redis` - Cache server logs

## Platform-Specific Usage

### Linux & macOS

```bash
# Make script executable (first time only)
chmod +x fm-copilot.sh

# Start the environment
./fm-copilot.sh start

# Check status
./fm-copilot.sh status
```

### Windows (Git Bash/WSL)

```bash
# Start the environment
./fm-copilot.sh start

# Check status  
./fm-copilot.sh status
```

### Windows (PowerShell)

```powershell
# Start the environment
.\fm-copilot.ps1 start

# Check status
.\fm-copilot.ps1 status
```

## Common Workflows

### Development Workflow

```bash
# Morning startup
./fm-copilot.sh start

# During development - check status
./fm-copilot.sh status

# After code changes - restart to rebuild
./fm-copilot.sh restart

# If issues occur - check logs
./fm-copilot.sh logs backend

# End of day - stop services
./fm-copilot.sh stop
```

### Troubleshooting Workflow

```bash
# Check overall health
./fm-copilot.sh status

# If services aren't running
./fm-copilot.sh force-stop

# Clean start
./fm-copilot.sh start

# If build errors persist
./fm-copilot.sh logs backend    # Check backend logs
./fm-copilot.sh logs frontend   # Check frontend logs
```

### Production Workflow

```bash
# Deploy to production
./fm-copilot.sh production

# Backup before updates
./fm-copilot.sh backup

# Emergency shutdown
./fm-copilot.sh force-stop
```

## Script Features

### Automatic Environment Detection

Both scripts automatically detect:
- Docker availability and status
- Docker Compose vs `docker compose` command
- Required directory structure
- Environment file presence

### Error Handling

- Graceful handling of missing Docker
- Container startup validation
- Service health checking
- Clear error messages with suggestions

### Service Health Checks

The status command checks:
- **Backend API**: HTTP health endpoint at `/health`
- **Frontend**: HTTP accessibility at port 3000
- **MySQL**: Database connectivity via `mysqladmin ping`
- **Redis**: Cache connectivity via `redis-cli ping`

## Configuration Files

### Environment Files Created Automatically

- `backend/.env` - Copied from `backend/.env.example` if missing
- `frontend/.env` - Created with default API URL if missing

### Required Directory Structure

```
fm-copilot/
├── backend/
│   ├── .env           # Auto-generated if missing
│   ├── logs/          # Auto-created
│   └── uploads/       # Auto-created
├── frontend/
│   ├── .env           # Auto-generated if missing
│   └── dist/          # Built React app
├── nginx/
│   └── ssl/           # Auto-created for SSL certs
└── docker-compose.yml  # Main orchestration file
```

## Port Mapping

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| Frontend | 3000 | 3000 | React application |
| Backend | 8000 | 8000 | REST API |
| MySQL | 3306 | 3306 | Database |
| Redis | 6379 | 6379 | Cache layer |

## Troubleshooting

### Permission Errors (Linux/macOS)

```bash
# If script can't execute:
chmod +x fm-copilot.sh

# If Docker commands need sudo:
sudo usermod -aG docker $USER
# Then logout and login again
```

### Port Conflicts

If ports 3000, 8000, 3306, or 6379 are occupied:

1. Stop conflicting services
2. Or modify ports in `docker-compose.yml`
3. Restart with `./fm-copilot.sh restart`

### Build Failures

```bash
# Clean rebuild
./fm-copilot.sh force-stop
./fm-copilot.sh start

# Manual frontend build (if needed)
cd frontend && npm run build
cd .. && ./fm-copilot.sh start
```

### Container Issues

```bash
# View detailed container status
docker ps -a

# Inspect specific container
docker inspect fm-copilot-backend

# Remove all containers and start fresh
./fm-copilot.sh force-stop
./fm-copilot.sh start
```

## Version Compatibility

- **Docker**: 20.10+ recommended
- **Docker Compose**: 2.0+ recommended
- **Node.js**: 18+ (for local development)
- **PowerShell**: 5.1+ (Windows)
- **Bash**: 4.0+ (Linux/macOS)

Both scripts are tested and maintained for feature parity.