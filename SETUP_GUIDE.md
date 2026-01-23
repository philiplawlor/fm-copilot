# FM Copilot - Complete Setup Guide

## 🚀 Quick Start Guide

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **MySQL 8.0+** (if not using Docker)
- **Redis 6+** (if not using Docker)
- **OpenAI API Key** (for AI features)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone <your-repo-url> fm-copilot
cd fm-copilot
```

2. **Set up environment variables**
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend environment (optional)
echo "VITE_API_URL=http://localhost:8000/api" > frontend/.env
```

3. **Start all services**
```bash
# For Linux/macOS or Git Bash on Windows
./fm-copilot.sh start

# For PowerShell on Windows
.\fm-copilot.ps1 start
```

4. **Verify the environment**
```bash
./fm-copilot.sh status
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/health

### Option 2: Local Development

1. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Set up databases**
```bash
# Start MySQL and Redis (or use existing instances)
# Import database schema
mysql -u root -p < database/init.sql
```

3. **Configure environment**
```bash
# Copy and edit environment files
cp backend/.env.example backend/.env
# Configure database connection, OpenAI API key, etc.
```

4. **Start services**
```bash
# Backend (in terminal 1)
cd backend
npm run dev

# Frontend (in terminal 2)
cd frontend
npm run dev
```

## 📋 Detailed Setup Instructions

### Environment Configuration

#### Backend Environment Variables
```bash
# Required
NODE_ENV=development
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fm_copilot
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# AI Services
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Optional CMMS Integrations
CMMS_FIIX_API_KEY=your_fiix_api_key
CMMS_UPKEEP_API_KEY=your_upkeep_api_key

# Optional
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=info
```

#### Frontend Environment Variables
```bash
# Optional
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=FM Copilot
```

### Database Setup

1. **Create MySQL database**
```sql
CREATE DATABASE fm_copilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fm_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON fm_copilot.* TO 'fm_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Import schema**
```bash
mysql -u root -p fm_copilot < database/init.sql
```

### OpenAI API Setup

1. **Get API Key**
   - Visit https://platform.openai.com/api-keys
   - Create a new API key
   - Add to your `.env` file

2. **Test AI functionality**
```bash
# Start the backend
cd backend && npm run dev

# Test AI processing
curl -X POST http://localhost:8000/api/ai/intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "description": "Chiller in Building 3 making loud noise",
    "site_id": 1
  }'
```

## 📋 Script Management

FM Copilot includes management scripts for Docker environments:

### Available Commands

**For Linux/macOS or Git Bash:**
```bash
./fm-copilot.sh [command]
```

**For PowerShell on Windows:**
```powershell
.\fm-copilot.ps1 [command]
```

### Commands Overview

| Command | Description |
|---------|-------------|
| `start` | Start all services with rebuild |
| `stop` | Stop services gracefully |
| `restart` | Stop and restart all services |
| `force-stop` | Force stop and remove containers |
| `status` | Show service status and health |
| `logs [service]` | Show logs (all or specific service) |
| `backup` | Backup all data |
| `delete-all` | ⚠️ Delete ALL data and containers |
| `help` | Show help information |

### Daily Workflow Examples

```bash
# Start your development environment
./fm-copilot.sh start

# Check if everything is running
./fm-copilot.sh status

# View backend logs if issues occur
./fm-copilot.sh logs backend

# Restart after code changes
./fm-copilot.sh restart

# Stop at end of day
./fm-copilot.sh stop
```

### Service-Specific Commands

```bash
# View only frontend logs
./fm-copilot.sh logs frontend

# View only backend logs  
./fm-copilot.sh logs backend

# View database logs
./fm-copilot.sh logs mysql

# View Redis logs
./fm-copilot.sh logs redis
```

### Production Deployment

#### Using Docker Compose
```bash
# Production environment file
cp docker-compose.yml docker-compose.prod.yml

# Edit production settings:
# - Change environment variables
# - Set up SSL certificates
# - Configure persistent volumes
# - Set up backup strategies

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### SSL/HTTPS Setup
```bash
# Generate SSL certificates (or use Let's Encrypt)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/private.key \
  -out nginx/ssl/certificate.crt

# Update nginx configuration for HTTPS
# See nginx/nginx.conf for SSL settings
```

## 🧪 Testing the Application

### 1. Create Account
1. Visit http://localhost:3000
2. Click "Create an account"
3. Fill in registration form
4. Verify account creation

### 2. Test AI Work Order Intake
1. Login to your account
2. Click "Create Work Order"
3. Enter natural language description: *"Chiller in Building 3 making loud noise, might be compressor"*
4. Observe AI extracting asset, issue type, priority

### 3. Test Smart Dispatch
1. Select the work order
2. Click "Get AI Recommendations"
3. Review technician and vendor assignments
4. See confidence scores and reasoning

### 4. Test PM Auto-Setup
1. Go to "Preventive Maintenance"
2. Click "Suggest PM Template"
3. Enter asset details (manufacturer, model)
4. Review AI-generated PM schedule

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -h localhost -u fm_user -p fm_copilot

# Check Docker containers
docker-compose ps
docker-compose logs mysql
```

#### API Errors
```bash
# Check backend logs
docker-compose logs backend

# Check environment variables
cat backend/.env

# Test API directly
curl http://localhost:8000/health
```

#### Frontend Issues
```bash
# Clear node modules
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install

# Check network tab in browser for API errors
# Verify CORS settings in backend
```

#### AI Features Not Working
```bash
# Verify OpenAI API key
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models

# Check backend AI service logs
docker-compose logs backend | grep "AI"

# Test AI endpoint directly
curl -X POST http://localhost:8000/api/ai/intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"description": "Test", "site_id": 1}'
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_work_orders_status ON work_orders(status, organization_id);
CREATE INDEX idx_assets_site ON assets(site_id, organization_id);
CREATE INDEX idx_pm_schedules_due ON pm_schedules(next_due_date, organization_id);
```

#### Caching
```bash
# Redis optimization
redis-cli INFO memory
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

#### Application Monitoring
```bash
# Monitor logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check resource usage
docker stats
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh

### AI Endpoints
- `POST /api/ai/intake` - Process work order requests
- `POST /api/ai/dispatch` - Get dispatch recommendations
- `POST /api/ai/pm-suggest` - Get PM template suggestions

### Work Order Endpoints
- `GET /api/work-orders` - List work orders
- `POST /api/work-orders` - Create work order
- `PUT /api/work-orders/:id` - Update work order
- `POST /api/work-orders/:id/assign` - Assign work order

### Integration Endpoints
- `GET /api/integrations` - List integrations
- `POST /api/integrations/sync/work-orders` - Sync work orders
- `POST /api/integrations/sync/assets` - Sync assets

## 🔄 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Code Quality
```bash
# Backend linting
cd backend
npm run lint
npm run lint:fix

# Frontend linting
cd frontend
npm run lint
npm run lint:fix

# Type checking
npm run build
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Integration tests
npm run test:e2e
```

## 📞 Support

### Getting Help
- **Documentation**: Check this guide and inline code comments
- **Issues**: Create GitHub issue with detailed description
- **Community**: Join our Discord/Slack channel
- **Email**: support@fmcopilot.com

### Contributing
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests
5. Submit pull request
6. Respond to code review feedback

### Security Issues
For security vulnerabilities, email security@fmcopilot.com directly.

---

**Happy building! 🚀**

## 🎯 **Phase 1 Status: COMPLETE**

### ✅ **All Core Features Implemented**
- **Authentication**: Login/register with form validation and JWT authentication
- **Dashboard**: Real-time analytics and work order overview  
- **Work Orders**: Create, view, assign, complete with AI assistance
- **Asset Management**: Search, filter, and equipment tracking
- **Preventive Maintenance**: Scheduling, templates, and AI optimization
- **User Profile**: Settings, preferences, and security management

### 📱 **Mobile-Ready UI**
- **Responsive Design**: Touch-friendly interfaces for all devices
- **Progressive Enhancement**: Core functionality available everywhere
- **Performance Optimized**: Fast loading and smooth interactions
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation

### 🤖 **AI Integration Complete**
- **Natural Language Processing**: Convert text to structured work orders
- **Smart Assignment**: AI-powered technician and vendor recommendations
- **PM Templates**: AI-suggested preventive maintenance schedules
- **Real-time Analysis**: Live feedback and confidence scoring

This guide should get you up and running with FM Copilot. For additional help, check our comprehensive documentation or reach out to our support team.