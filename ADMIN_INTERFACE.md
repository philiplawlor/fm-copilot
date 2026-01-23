# FM Copilot - Admin Interface Guide

## Overview

FM Copilot includes a comprehensive admin interface for managing organizations, users, billing, and subscriptions in the multi-tenant SaaS platform.

## Admin Dashboard Features

### Organization Management

**Organization Administration:**
- Create and manage multiple organizations
- Configure organization settings and preferences
- Set up organization-specific branding and customization
- Manage organization-wide policies and configurations

**User Management:**
- Invite users to organizations via email
- Assign roles and permissions (Admin, Manager, Technician, Viewer)
- Bulk user operations and CSV import/export
- Password reset and account management
- User activity monitoring and audit trails

### Billing & Subscription Management

**Subscription Controls:**
- Manage subscription tiers (Starter, Professional, Enterprise)
- Process upgrades and downgrades
- Handle billing cycles and payment methods
- Generate invoices and billing reports
- Subscription pause/resume functionality

**Usage Tracking:**
- Monitor work order volumes per organization
- Track AI API usage and costs
- Generate usage reports and analytics
- Set up billing alerts and notifications

### System Administration

**Platform Management:**
- Global user and organization oversight
- System-wide analytics and reporting
- API key management for integrations
- System health monitoring and alerts
- Backup and data management controls

**Security & Compliance:**
- Audit log access and monitoring
- Security event tracking and alerts
- Compliance reporting and documentation
- Data retention and privacy controls

## Admin Interface Access

### Accessing Admin Dashboard

**Organization Admins:**
- Login to FM Copilot with admin credentials
- Access admin panel via user menu → "Organization Settings"
- Full control over their organization's users and billing

**System Admins:**
- Special admin login at `/admin` endpoint
- Platform-wide access to all organizations and users
- Advanced system configuration and monitoring

## User Roles & Permissions

### Role Hierarchy

1. **System Admin** - Platform-wide administration
2. **Organization Admin** - Organization-level management
3. **Facility Manager** - Department-level oversight
4. **Maintenance Technician** - Work order execution
5. **Viewer** - Read-only access

### Permission Matrix

| Feature | System Admin | Org Admin | Facility Mgr | Technician | Viewer |
|---------|-------------|-----------|--------------|------------|--------|
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Billing Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Work Order Creation | ✅ | ✅ | ✅ | ✅ | ❌ |
| Work Order Assignment | ✅ | ✅ | ✅ | ✅ | ❌ |
| Organization Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| System Monitoring | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ | ✅ |

## Organization Setup Flow

### New Organization Onboarding

1. **Organization Creation**
   - System admin creates new organization
   - Set up basic organization details (name, industry, size)

2. **Admin User Setup**
   - Invite initial organization admin via email
   - Admin completes profile and sets up payment method

3. **Organization Configuration**
   - Configure facilities and asset hierarchies
   - Set up user roles and permissions
   - Configure CMMS integrations if applicable

4. **User Onboarding**
   - Admin invites team members
   - Users complete registration and training
   - Initial data import and setup

## Billing Integration

### Payment Processing

**Supported Methods:**
- Credit cards (Stripe integration)
- ACH bank transfers for Enterprise customers
- Purchase orders for large organizations
- Invoice-based billing for government/non-profits

**Billing Cycles:**
- Monthly billing with auto-renewal
- Annual plans with discounts
- Usage-based billing for high-volume customers
- Custom enterprise agreements

### Subscription Management

**Plan Management:**
- Self-service plan changes
- Upgrade/downgrade workflows
- Prorated billing for mid-cycle changes
- Free trial to paid conversion

**Usage Monitoring:**
- Real-time usage tracking
- Configurable usage alerts
- Cost prediction and budget controls
- Detailed usage reports and analytics

## Security & Compliance

### Data Isolation

**Tenant Architecture:**
- Complete data isolation between organizations
- Database-level row security
- API-level tenant validation
- Secure data encryption at rest and in transit

**Audit Logging:**
- All admin actions logged with timestamps
- User activity tracking for compliance
- Data access auditing
- Security event monitoring

### Compliance Features

**GDPR/CCPA Compliance:**
- Data export capabilities
- Right to deletion workflows
- Consent management
- Privacy impact assessments

**Industry Standards:**
- SOC 2 Type II compliance
- ISO 27001 information security
- Regular security audits and penetration testing

## API Access for Admin Functions

### Organization Management API

```http
# List organizations (System Admin only)
GET /api/admin/organizations

# Create new organization
POST /api/admin/organizations

# Update organization settings
PUT /api/admin/organizations/{orgId}

# Organization user management
GET /api/admin/organizations/{orgId}/users
POST /api/admin/organizations/{orgId}/users/invite
DELETE /api/admin/organizations/{orgId}/users/{userId}
```

### Billing API

```http
# Subscription management
GET /api/admin/billing/subscriptions
POST /api/admin/billing/subscriptions/{subId}/upgrade
POST /api/admin/billing/subscriptions/{subId}/pause

# Invoice generation
POST /api/admin/billing/invoices/generate
GET /api/admin/billing/invoices/{invoiceId}/download

# Usage reporting
GET /api/admin/billing/usage/{orgId}
GET /api/admin/billing/costs/{orgId}
```

## Monitoring & Analytics

### Admin Dashboard Metrics

**System Health:**
- Server performance and uptime
- API response times and error rates
- Database performance metrics
- AI service availability

**Business Metrics:**
- MRR (Monthly Recurring Revenue)
- Churn rate and retention analytics
- Customer acquisition costs
- Lifetime value calculations

**Usage Analytics:**
- Feature adoption rates
- Work order processing volumes
- AI usage and cost tracking
- User engagement metrics

## Disaster Recovery

### Backup Procedures

**Automated Backups:**
- Daily database backups with 30-day retention
- File system backups for uploads and assets
- Cross-region backup replication
- Point-in-time recovery capabilities

**Recovery Procedures:**
- Database restoration workflows
- Application rollback procedures
- Data integrity verification
- Communication protocols for outages

## Support & Documentation

### Admin Resources

**Documentation:**
- Admin interface user guides
- API documentation for integrations
- Troubleshooting guides for common issues
- Security and compliance documentation

**Support Channels:**
- Priority email support for admins
- Dedicated Slack channel for enterprise customers
- Phone support for critical issues
- On-site training and consulting services

---

**Last Updated**: January 23, 2026
**Version**: 1.1.0