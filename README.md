# FM Copilot - Facilities Management AI Assistant

## 🚀 Status: Working Application

**FM Copilot is now fully operational!** All services are running and the React application is rendering successfully.

- ✅ **Frontend**: http://localhost:3000 (React app working)
- ✅ **Backend API**: http://localhost:8000 (Healthy)
- ✅ **Database**: MySQL 8.0 (Running)
- ✅ **Cache**: Redis 7 (Running)

## Overview

FM Copilot is a pragmatic AI assistant that sits on top of existing CMMS/BMS systems to reduce administrative burden, improve maintenance workflows, and help facility managers and technicians work smarter.

## Architecture

**Architectural Decisions:**
- **Multi-Tenant SaaS**: Tenant isolation with organization-based data separation
- **Containerized Deployment**: Docker Compose for local development, cloud platforms (AWS/GCP/Azure) for production
- **Technology Stack**: Node.js backend (chosen over Python for full-stack consistency), MySQL database (chosen for relational data management and cost-effectiveness)

```
fm-copilot/
├── backend/          # Node.js/TypeScript API services
├── frontend/         # React web application
├── database/         # MySQL schema and migrations
├── docs/            # Documentation and API specs
├── scripts/         # Deployment and utility scripts
└── docker-compose.yml # Container orchestration
```

## Phase 1 Features (MVP)

1. **Intelligent Work Order Intake** - AI-powered natural language processing
2. **Smart Tech & Vendor Dispatch** - Assignment recommendation engine
3. **Preventive Maintenance Auto-Setup** - Template-based PM scheduling

## Phase 1.1 Features (Multi-Tenant Foundation)

1. **Organization Management** - Multi-tenant architecture with tenant isolation
2. **User Administration** - Organization-level user management and role assignment
3. **Billing Integration** - Subscription management and payment processing
4. **Admin Interface** - Organization admin dashboard for user/billing management
5. **Audit Logging** - Comprehensive logging system for compliance and security

## Tech Stack

**Architectural Rationale:**
- **Node.js Backend**: Chosen over Python for full-stack TypeScript consistency, better JavaScript ecosystem integration, and unified development team skills
- **MySQL Database**: Selected over PostgreSQL for cost-effectiveness, widespread adoption, and sufficient relational capabilities for FM use cases
- **Multi-Tenant Design**: Built-in tenant isolation ensures data security and scalability

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL 8.0, Redis for caching
- **AI**: OpenAI GPT-4 for NLP, custom classification models
- **Deployment**: Docker Compose, Nginx reverse proxy
- **Multi-Tenant**: Organization-based data isolation and user management

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- OpenAI API key (for AI functionality)

### Installation

```bash
# Clone the repository
git clone <repo-url> fm-copilot
cd fm-copilot

# Configure environment variables
cp backend/.env.example backend/.env  # Edit with your configuration

# Start the application (auto-rebuilds with code changes)
./fm-copilot.sh start

# Or use PowerShell on Windows
.\fm-copilot.ps1 start

# Verify services are running
./fm-copilot.sh status
# Or PowerShell: .\fm-copilot.ps1 status

# View logs if needed
./fm-copilot.sh logs
# Or specific service: ./fm-copilot.sh logs backend
```

### Development Workflow

The FM Copilot scripts automatically rebuild Docker images when starting/restarting:

```bash
# Start with rebuild (default behavior)
./fm-copilot.sh start

# Restart with rebuild  
./fm-copilot.sh restart

# Stop only (preserves data)
./fm-copilot.sh stop

# Force stop (removes containers, preserves data)
./fm-copilot.sh force-stop
```

**Important**: When you make code changes, simply run `./fm-copilot.sh restart` to see your updates in the running environment.

### Development Setup

```bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development  
cd frontend
npm install
npm run dev
```

### Troubleshooting

**FM Copilot is now fully operational!** All known issues have been resolved.

**For any issues you encounter:**

```bash
# Check service status
./fm-copilot.sh status        # Verify all services are running

# View service logs
./fm-copilot.sh logs          # Check all service logs
./fm-copilot.sh logs frontend # Check frontend logs
./fm-copilot.sh logs backend  # Check backend logs

# Restart services
./fm-copilot.sh restart       # Restart all services

# If issues persist:
./fm-copilot.sh force-stop    # Clean up containers
./fm-copilot.sh start         # Fresh start
```

**Script Compatibility:**
- **Windows**: Use `.\fm-copilot.ps1` or `./fm-copilot.sh` (Git Bash/WSL)
- **Linux/macOS**: Use `./fm-copilot.sh`
- Both scripts have identical functionality

**Port Conflicts:**  
If port conflicts occur, edit `docker-compose.yml` to change ports 3000, 8000, 3306, or 6379.

## Architecture

```
fm-copilot/
├── backend/                 # Node.js API services
│   ├── src/
│   │   ├── controllers/   # API route handlers
│   │   ├── services/      # Business logic layer
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── routes/        # API route definitions
│   │   └── config/        # Database, Redis configuration
│   ├── Dockerfile          # Multi-stage Docker build
│   └── package.json        # Dependencies and scripts
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/    # React UI components
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # API client and state management
│   │   └── stores/        # Zustand state stores
│   ├── Dockerfile          # Nginx + React build
│   └── package.json        # Dependencies and scripts
├── database/               # MySQL schema and migrations
├── docs/                  # Documentation and API specs
└── docker-compose.yml      # Container orchestration
```

## Core Features

### 🤖 AI-Powered Work Order Management
- **Natural Language Intake**: Convert plain text descriptions into structured work orders
- **Smart Assignment**: AI recommends optimal technicians based on skills, availability, and location
- **Priority Prediction**: Automatic priority assessment based on issue type and asset criticality
- **Historical Learning**: System improves recommendations over time

### 📋 Preventive Maintenance Automation
- **Template Library**: Standardized PM procedures for different asset types
- **Auto-Scheduling**: Intelligent PM scheduling based on usage patterns and manufacturer recommendations
- **Compliance Tracking**: Ensure regulatory requirements are met
- **Cost Optimization**: Bundle PM tasks to reduce operational costs

### 📊 Real-Time Dashboard
- **Operational Overview**: Live status of all work orders and PM tasks
- **Performance Metrics**: Technician utilization, completion rates, response times
- **Asset Health**: Equipment status and maintenance history
- **Cost Analytics**: Maintenance spend analysis and budget tracking

### 🔧 Integration & Extensibility
- **CMMS Connectivity**: RESTful APIs for existing system integration
- **Webhook Support**: Real-time data synchronization
- **Custom Fields**: Configurable properties to match organizational needs
- **Audit Trail**: Complete change tracking and compliance logging

### 🏢 Multi-Tenant Administration
- **Organization Management**: Tenant isolation and data security
- **User Administration**: Role-based access control and user management
- **Billing & Subscriptions**: Payment processing and subscription management
- **Admin Dashboard**: Organization-level controls and analytics
- **Compliance Logging**: Audit trails for regulatory requirements

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Zustand for global state
- **Routing**: React Router v6 for navigation
- **Build Tool**: Vite for fast development and building
- **HTTP Client**: Axios for API communication

### Backend
- **Runtime**: Node.js 18 with TypeScript
- **Framework**: Express.js for REST API
- **Database**: MySQL 8.0 with connection pooling
- **Caching**: Redis for session storage and caching
- **Authentication**: JWT with bcrypt password hashing
- **Multi-Tenant**: Organization-based data isolation and user management
- **AI Integration**: OpenAI GPT-4 for natural language processing
- **Admin Interface**: Organization management and billing controls

### DevOps
- **Containerization**: Docker multi-stage builds
- **Orchestration**: Docker Compose for development, Docker for production deployment
- **Reverse Proxy**: Nginx for production deployment
- **Security**: Rate limiting, CORS, security headers
- **Monitoring**: Health checks and structured logging
- **Multi-Tenant**: Tenant-aware logging and monitoring

## API Documentation

### Authentication
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
POST /api/auth/refresh     # Token refresh
```

### Work Orders
```http
GET    /api/work-orders        # List work orders
POST   /api/work-orders        # Create work order
GET    /api/work-orders/:id    # Get work order details
PUT    /api/work-orders/:id    # Update work order
DELETE /api/work-orders/:id # Delete work order
```

### AI Processing
```http
POST   /api/ai/intake          # Process natural language work order
POST   /api/ai/dispatch        # Get dispatch recommendations
POST   /api/ai/priority        # Suggest work order priority
POST   /api/ai/pm-template      # Suggest PM template
```

## Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fm_copilot
DB_USER=fm_user
DB_PASSWORD=fm_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# AI Services
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# Application
NODE_ENV=production
PORT=8000
```

## Pricing Model

**SaaS Tiers:**
- **Starter**: $500/month - Up to 5 users, 1,000 work orders/month, core features
- **Professional**: $1,500/month - Up to 25 users, 5,000 work orders/month, all Phase 1-2 features
- **Enterprise**: Custom pricing - Unlimited users, volume discounts, dedicated support, custom integrations

**Free Trial**: 14-day full-feature trial with demo data pre-loaded

## Security Features

- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access control with multi-tenant isolation
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive request validation
- **Security Headers**: XSS protection, content security policy
- **Data Encryption**: Secure password storage and data transmission
- **Tenant Isolation**: Organization-level data security and privacy

## Monitoring & Logging

- **Health Checks**: `/health` endpoint for service monitoring
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Error Tracking**: Comprehensive error reporting and alerting
- **Performance Metrics**: Request timing and database query monitoring
- **Audit Logging**: Full audit trail for compliance

## Version: v0.1.0 (Production Ready)

### 🎉 **What's New in v0.1.0**
- Complete FM Copilot platform with AI-powered work order management
- Intelligent technician dispatch and routing optimization
- Automated preventive maintenance scheduling
- Real-time dashboard with analytics and reporting
- Full containerization with production-ready deployment
- Comprehensive security and monitoring capabilities

## 🌿 **Git Branch Structure**

### Branch Organization
- **`master`** - Production-ready stable code
- **`dev`** - Development branch for new features
- **`test`** - Integration testing and QA
- **`prod`** - Production deployment configurations
- **`0.1.0`** - Version-specific release branch

### Branch Usage
```bash
# Development work
git checkout dev
git add .
git commit -m "feat: new feature"
git push origin dev

# Create version branch
git checkout -b 0.2.0 dev

# Merge to master when ready
git checkout master
git merge dev
git tag v0.2.0
git push origin master --tags
```