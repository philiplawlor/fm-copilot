# FM Copilot Docker Manager Scripts

This directory contains comprehensive scripts for managing the FM Copilot Docker environment.

## Scripts Overview

### 🐧 Linux/macOS: `fm-copilot.sh`
Full-featured bash script for Unix-like systems.

### 🪟 Windows: `fm-copilot.ps1`  
PowerShell script for Windows environments.

## 🚀 Quick Start

### Linux/macOS
```bash
# Make executable (one-time)
chmod +x fm-copilot.sh

# Start environment
./fm-copilot.sh start

# View status
./fm-copilot.sh status
```

### Windows (PowerShell)
```powershell
# Start environment
.\fm-copilot.ps1 start

# View status  
.\fm-copilot.ps1 status
```

## 📋 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start all services | `./fm-copilot.sh start` |
| `stop` | Stop gracefully | `./fm-copilot.sh stop` |
| `restart` | Restart environment | `./fm-copilot.sh restart` |
| `force-stop` | Force stop services and containers (preserves data) | `./fm-copilot.sh force-stop` |
| `delete-all` | DELETE ALL DATA AND RESOURCES (DESTRUCTIVE) | `./fm-copilot.sh delete-all` |
| `logs` | Show service logs | `./fm-copilot.sh logs` |
| `status` | Show environment status | `./fm-copilot.sh status` |
| `production` | Deploy to production | `./fm-copilot.sh production` |
| `backup` | Backup all data | `./fm-copilot.sh backup` |
| `help` | Show help | `./fm-copilot.sh help` |

## 🔧 Features

### ✅ **Smart Environment Setup**
- Automatic directory creation
- Environment file copying
- Permission fixing
- Health checks

### 🚦 **Service Management**
- Graceful startup/shutdown
- Force stop with data preservation
- Complete data destruction option
- Service-specific operations
- Health monitoring

### 📊 **Status Monitoring**
- Real-time service status
- Health check endpoints
- Resource usage tracking
- Error diagnostics

### 🛠️ **Development Tools**
- Live log streaming
- Service-specific logs
- Debug mode options
- Quick restart capabilities

### 🚀 **Production Features**
- Zero-downtime deployment
- SSL/TLS support
- Production optimizations
- Backup automation

### 💾 **Data Management**
- Automated backups
- Database exports
- Configuration backup
- Restore capabilities

## 📦 Services Managed

| Service | Port | Description |
|---------|-------|-------------|
| `frontend` | 3000 | React web application |
| `backend` | 8000 | Node.js API server |
| `nginx` | 80/443 | Reverse proxy and SSL |
| `mysql` | 3306 | MySQL database |
| `redis` | 6379 | Cache and session store |

## 🗂️ Directory Structure

```
fm-copilot/
├── fm-copilot.sh          # Linux/macOS script
├── fm-copilot.ps1         # Windows PowerShell script
├── docker-compose.yml       # Development environment
├── docker-compose.prod.yml  # Production environment
├── backend/
│   ├── .env.example       # Environment template
│   ├── logs/             # Application logs
│   └── uploads/          # File uploads
├── nginx/
│   ├── nginx.conf         # Nginx configuration
│   └── ssl/              # SSL certificates
└── backups/              # Data backups
```

## 🚨 Important Notes

### ⚠️ **Data Loss Warning**
```bash
# WARNING: force-stop stops services and containers (preserves data)
./fm-copilot.sh force-stop

# DANGER: delete-all DELETES ALL DATA!
./fm-copilot.sh delete-all
```

### 🔒 **Security**
- Scripts use non-root Docker users
- Proper file permissions
- Environment variable validation
- SSL certificate handling

### 🏥 **Health Checks**
- Backend: `GET /health`
- Frontend: HTTP response check
- Database: MySQL ping
- Redis: PING command

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep -E ':(3000|8000|3306|6379|80)'

# Stop conflicting services
./fm-copilot.sh force-stop
```

#### Permission Issues
```bash
# Linux/macOS
sudo chown -R $USER:$USER ./backend/logs
sudo chown -R $USER:$USER ./backend/uploads

# Windows (run as Administrator)
.\fm-copilot.ps1 start
```

#### Docker Issues
```bash
# Check Docker status
docker info

# Clean up Docker
docker system prune -a

# Restart Docker service
sudo systemctl restart docker  # Linux
# Restart Docker Desktop     # Windows/macOS
```

### Debug Mode

#### Enable Debug Logs
```bash
# Verbose logging
./fm-copilot.sh start 2>&1 | tee debug.log

# Container details
docker ps -a --filter "name=fm-copilot"
```

#### Check Container Logs
```bash
# All logs
./fm-copilot.sh logs

# Specific service
./fm-copilot.sh logs backend
./fm-copilot.sh logs mysql

# Live streaming
docker logs -f fm-copilot-backend-1
```

## 🔧 Customization

### Environment Variables
Edit `backend/.env` to customize:
```bash
# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fm_copilot
DB_USER=fm_user
DB_PASSWORD=your_secure_password

# API configuration
PORT=8000
JWT_SECRET=your_super_secret_key

# AI services
OPENAI_API_KEY=your_openai_api_key
```

### Production Deployment
1. Copy `docker-compose.yml` to `docker-compose.prod.yml`
2. Modify production settings:
   - Environment variables
   - SSL certificates
   - Resource limits
   - Backup strategies
3. Deploy: `./fm-copilot.sh production`

## 📞 Support

For issues with these scripts:
1. Check Docker installation and permissions
2. Verify environment files exist
3. Review log output for specific errors
4. Ensure ports 3000, 8000, 3306, 6379 are available

---

**FM Copilot** - Smart Facilities Management 🏗️✨