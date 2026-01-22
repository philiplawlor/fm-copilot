# FM Copilot Installation Guide

This guide will help you set up FM Copilot in various environments.

## Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows (with WSL2)
- **Docker**: Version 20.10+ and Docker Compose v2.0+
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 10GB available disk space
- **Network**: Internet connection for AI services

### API Keys Required
- **OpenAI API Key**: For AI-powered work order processing
  - Get yours at: https://platform.openai.com/api-keys
  - Required models: GPT-4 or GPT-3.5-turbo

## Quick Start (Production)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/fm-copilot.git
cd fm-copilot
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the environment file with your settings
nano backend/.env
```

**Required Environment Variables:**
```bash
# Database Configuration
DB_HOST=mysql                    # Docker service name
DB_PORT=3306
DB_NAME=fm_copilot
DB_USER=fm_user
DB_PASSWORD=fm_password

# Redis Configuration  
REDIS_HOST=redis                 # Docker service name
REDIS_PORT=6379

# AI Services (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# Application
NODE_ENV=production
PORT=8000
```

### 3. Start the Application
```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs if needed
docker-compose logs -f
```

### 4. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs

## Development Setup

### Local Development with Docker
```bash
# Start with development environment
NODE_ENV=development docker-compose up -d

# Watch logs for real-time feedback
docker-compose logs -f
```

### Local Development without Docker

#### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# The API will be available at http://localhost:8000
```

#### Frontend Development
```bash
cd frontend

# Install dependencies  
npm install

# Start development server
npm run dev

# The frontend will be available at http://localhost:3000
# Hot reload is enabled for development
```

## Database Setup

### Using Docker (Recommended)
The MySQL database is automatically initialized when you run `docker-compose up -d`.

### Manual Database Setup
If you prefer to use an external MySQL instance:

```sql
-- Create database
CREATE DATABASE fm_copilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, can use root)
CREATE USER 'fm_user'@'%' IDENTIFIED BY 'fm_password';
GRANT ALL PRIVILEGES ON fm_copilot.* TO 'fm_user'@'%';
FLUSH PRIVILEGES;
```

### Import Schema
```bash
# After database creation, import the schema
mysql -u fm_user -p -h localhost fm_copilot < database/init.sql
```

## Configuration Options

### Production Environment
```bash
# Set production mode
export NODE_ENV=production

# Use production database
export DB_HOST=your-production-db-host

# Configure Redis cluster
export REDIS_HOST=your-redis-cluster-host
```

### Development Environment
```bash
# Enable debug logging
export LOG_LEVEL=debug

# Use local database
export DB_HOST=localhost

# Enable hot reload
export NODE_ENV=development
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
netstat -tulpn | grep :3306

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. Database Connection Errors
```bash
# Check database container logs
docker-compose logs mysql

# Test database connection
docker exec fm-copilot-backend npm run test-db

# Reset database if needed
docker-compose down -v
docker-compose up -d
```

#### 3. OpenAI API Issues
```bash
# Verify API key is valid
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check rate limits
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "OpenAI-Organization: YOUR_ORG_ID" \
     https://api.openai.com/v1/usage
```

#### 4. Frontend Build Issues
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run build

# Verify build output
ls -la dist/
```

#### 5. Backend Build Issues
```bash
# Check TypeScript compilation
cd backend
npx tsc --noEmit

# Install missing dependencies
npm install

# Fix import issues
npx eslint src/**/*.ts --fix
```

### Health Checks

#### Application Health
```bash
# Check backend health
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-22T01:37:59.464Z",
  "version": "0.1.0",
  "environment": "production"
}
```

#### Database Health
```bash
# Test database connection
docker exec fm-copilot-mysql mysql -u fm_user -p$DB_PASSWORD -e "SELECT 1"

# Check database size
docker exec fm-copilot-mysql mysql -u fm_user -p$DB_PASSWORD -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'fm_copilot'"
```

#### Redis Health
```bash
# Test Redis connection
docker exec fm-copilot-redis redis-cli ping

# Expected response: PONG
```

## Performance Optimization

### Production Tuning
```bash
# Increase MySQL performance
# Add to my.cnf:
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200

# Optimize Redis
# Add to redis.conf:
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### Frontend Optimization
```bash
# Enable production optimizations
npm run build:production

# Analyze bundle size
npm run analyze

# Enable compression in nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Security Configuration

### SSL/TLS Setup
```bash
# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/private.key -out nginx/certificate.crt

# Update nginx configuration
listen 443 ssl;
ssl_certificate /etc/nginx/ssl/certificate.crt;
ssl_certificate_key /etc/nginx/ssl/private.key;
```

### Environment Security
```bash
# Use secrets management
# Docker secrets or external secret manager
docker secret create db_password your-secure-password

# Environment variable best practices
# Never commit .env files to version control
# Use different keys for development/production
# Rotate API keys regularly
```

## Monitoring and Logging

### Application Monitoring
```bash
# View real-time logs
docker-compose logs -f --tail=100

# Check container resource usage
docker stats

# Monitor database queries
docker exec fm-copilot-mysql mysqladmin processlist
```

### Log Analysis
```bash
# Backend logs
docker-compose exec backend tail -f logs/app.log

# Nginx access logs
docker-compose exec frontend tail -f /var/log/nginx/access.log

# Error logs
docker-compose logs | grep ERROR
```

## Backup and Recovery

### Database Backups
```bash
# Create automatic backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec fm-copilot-mysql mysqldump -u fm_user -p$DB_PASSWORD fm_copilot > backup_$DATE.sql
EOF

# Schedule daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### Application Recovery
```bash
# Full application restore
docker-compose down -v
docker-compose up -d

# Data-only restore
docker-compose down
docker volume rm fm-copilot_mysql_data
docker-compose up -d
```

## Next Steps

After successful installation:

1. **Create Admin Account**: Register the first user account
2. **Configure Organization**: Set up your organizational structure
3. **Add Assets**: Import existing asset data or create new assets
4. **Configure AI**: Test AI processing with sample work orders
5. **Set Up Teams**: Add technicians and vendors to the system
6. **Configure Integrations**: Connect existing CMMS if applicable

## Support

- **Documentation**: Full API documentation at `/docs`
- **Issues**: Report bugs at [GitHub Issues](https://github.com/your-org/fm-copilot/issues)
- **Community**: Join discussions at [GitHub Discussions](https://github.com/your-org/fm-copilot/discussions)
- **Email**: Support@your-company.com

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.