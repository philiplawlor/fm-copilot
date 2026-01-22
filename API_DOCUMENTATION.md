# FM Copilot API Documentation

## Overview

The FM Copilot API provides RESTful endpoints for managing facilities, work orders, assets, and AI-powered automation. This document serves as a comprehensive guide for developers integrating with the platform.

**Base URL**: `http://localhost:8000/api` (development) or your production URL  
**API Version**: v0.1.0  
**Authentication**: JWT Bearer Token required for most endpoints

**Base URL**: `http://localhost:8000/api` (development)  
**Production URL**: `https://yourdomain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer your_jwt_token_here
```

### Authentication Flow

1. **Register User**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "facility_manager",
  "organization_name": "Example Corp"
}
```

2. **Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "facility_manager",
      "organization": {
        "id": 1,
        "name": "Example Corp"
      }
    },
    "tokens": {
      "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "expires_in": 86400
    }
  }
}
```

3. **Refresh Token**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Work Orders API

### Get Work Orders

```http
GET /work-orders?page=1&limit=20&status=open&priority=high
Authorization: Bearer your_token
```

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status (open, assigned, in_progress, completed, cancelled)
- `priority` (string): Filter by priority (low, medium, high, critical)
- `site_id` (number): Filter by site ID
- `assigned_technician_id` (number): Filter by technician ID
- `date_from` (string): Filter by created date (ISO format)
- `date_to` (string): Filter by created date (ISO format)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "HVAC Unit Not Cooling",
      "description": "Main HVAC unit in Building A is not cooling properly",
      "status": "open",
      "priority": "high",
      "type": "corrective",
      "site_id": 1,
      "asset_id": 1,
      "requested_by_user_id": 1,
      "assigned_technician_id": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "site_name": "Main Office",
      "asset_name": "Main HVAC Unit",
      "requested_by_first_name": "John",
      "requested_by_last_name": "Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Create Work Order

```http
POST /work-orders
Authorization: Bearer your_token
Content-Type: application/json

{
  "title": "Leaking Pipe in Restroom",
  "description": "Water leaking from pipe under sink in men's restroom",
  "priority": "medium",
  "type": "corrective",
  "site_id": 1,
  "asset_id": 15,
  "estimated_duration_minutes": 60
}
```

### Update Work Order

```http
PUT /work-orders/1
Authorization: Bearer your_token
Content-Type: application/json

{
  "priority": "high",
  "assigned_technician_id": 3
}
```

### Assign Work Order

```http
POST /work-orders/1/assign
Authorization: Bearer your_token
Content-Type: application/json

{
  "technician_id": 3,
  "notes": "Experienced plumber, best choice for this issue"
}
```

### Complete Work Order

```http
POST /work-orders/1/complete
Authorization: Bearer your_token
Content-Type: application/json

{
  "resolution_notes": "Replaced worn washers and tightened connections",
  "actual_duration_minutes": 45,
  "parts_used": [
    {
      "name": "Washer Set",
      "quantity": 2,
      "cost": 5.99
    }
  ]
}
```

## AI API

### Process Work Order Intake

This endpoint uses AI to extract structured information from natural language descriptions.

```http
POST /ai/intake
Authorization: Bearer your_token
Content-Type: application/json

{
  "description": "Chiller in Building 3 making loud noise, seems like it might be the compressor",
  "site_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "extracted_info": {
      "asset": {
        "name": "Chiller",
        "location": "Building 3",
        "components": ["compressor"]
      },
      "issue_type": "Abnormal Noise",
      "urgency": "high",
      "description": "Chiller making loud noise, possibly compressor issue"
    },
    "confidence_score": 0.85,
    "suggested_work_order": {
      "title": "Chiller: Abnormal Noise",
      "description": "Chiller in Building 3 making loud noise, possibly compressor issue",
      "priority": "high",
      "type": "corrective"
    },
    "similar_work_orders": [
      {
        "id": 123,
        "title": "Chiller Noise Investigation",
        "resolution": "Replaced compressor fan belt",
        "created_at": "2024-01-10T14:30:00Z"
      }
    ]
  }
}
```

### Get Dispatch Recommendations

```http
POST /ai/dispatch
Authorization: Bearer your_token
Content-Type: application/json

{
  "work_order_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "technicians": [
      {
        "id": 3,
        "name": "Sarah Johnson",
        "skills": ["HVAC", "Electrical"],
        "current_location": "Building 3",
        "distance_km": 0.1,
        "current_workload": 2,
        "estimated_arrival": "5 minutes",
        "confidence_score": 0.92
      }
    ],
    "vendors": [
      {
        "id": 1,
        "name": "ABC Mechanical",
        "specialty": "HVAC Services",
        "average_rating": 4.5,
        "estimated_cost": 180.00,
        "response_time_hours": 2,
        "confidence_score": 0.78
      }
    ],
    "recommended_assignment": {
      "type": "technician",
      "id": 3,
      "name": "Sarah Johnson", 
      "reason": "Strong skills match, on-site location, low current workload"
    }
  }
}
```

### Suggest PM Template

```http
POST /ai/pm-suggest
Authorization: Bearer your_token
Content-Type: application/json

{
  "asset_id": 5,
  "asset_type": "HVAC",
  "manufacturer": "Carrier",
  "model": "50TC-12"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "name": "Quarterly HVAC Maintenance",
        "frequency_type": "quarterly",
        "frequency_interval": 3,
        "estimated_duration_minutes": 120,
        "task_list": [
          "Check and clean filters",
          "Inspect refrigerant levels",
          "Test safety controls",
          "Clean coils"
        ],
        "required_tools": ["Screwdriver set", "Pressure gauge", "Cleaning supplies"],
        "confidence_score": 0.88,
        "reasoning": "Perfect match for Carrier 50TC series"
      }
    ],
    "assets_similar": [
      {
        "id": 8,
        "name": "Secondary Chiller",
        "location": "Building 2",
        "pm_schedule": "Quarterly maintenance due in 15 days"
      }
    ]
  }
}
```

### Submit AI Feedback

```http
POST /ai/feedback
Authorization: Bearer your_token
Content-Type: application/json

{
  "processing_log_id": 123,
  "feedback": "positive",
  "corrections": {
    "priority": "should have been critical",
    "components": ["compressor", "fan_motor"]
  }
}
```

## Preventive Maintenance API

### Get Upcoming PM

```http
GET /pm/upcoming?days_ahead=30
Authorization: Bearer your_token
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "asset_name": "Main Chiller",
      "asset_tag": "CHILL-001",
      "site_name": "Main Office",
      "template_name": "Quarterly HVAC Maintenance",
      "next_due_date": "2024-02-15",
      "days_until_due": 15
    }
  ]
}
```

### Create PM Schedule

```http
POST /pm/schedules
Authorization: Bearer your_token
Content-Type: application/json

{
  "asset_id": 5,
  "pm_template_id": 3,
  "next_due_date": "2024-02-15"
}
```

## Integrations API

### Sync Work Orders from CMMS

```http
POST /integrations/sync/work-orders
Authorization: Bearer your_token
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": {
      "fiix": [
        {
          "id": "fiix_wo_001",
          "title": "HVAC Unit Not Cooling",
          "status": "open"
        }
      ]
    },
    "summary": {
      "total_integrations": 1,
      "total_work_orders": 1,
      "integrations_with_work_orders": 1
    }
  }
}
```

### Handle Webhooks

```http
POST /integrations/webhook/fiix
Content-Type: application/json
X-Signature: webhook_signature

{
  "event_type": "work_order.created",
  "work_order_id": "fiix_12345",
  "data": {
    "title": "New Work Order",
    "description": "Created in external CMMS"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated users**: 500 requests per minute
- **Premium tier**: 1000 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## Pagination

List endpoints support pagination with these parameters:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

Pagination information is included in responses:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

## Webhooks

Configure webhooks in your CMMS integration settings to receive real-time updates:

### Supported Events

**Work Orders**:
- `work_order.created`
- `work_order.updated`
- `work_order.assigned`
- `work_order.completed`

**Assets**:
- `asset.created`
- `asset.updated`
- `asset.maintenance_due`

### Webhook Security

- All webhooks include `X-Signature` header
- Verify signature using your webhook secret
- Implement retry logic for failed deliveries

## SDK Examples

### JavaScript/Node.js

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Process work order intake
const result = await api.post('/ai/intake', {
  description: 'Chiller making loud noise',
  site_id: 1
});

console.log(result.data.extracted_info);
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get dispatch recommendations
response = requests.post(
    'http://localhost:8000/api/ai/dispatch',
    json={'work_order_id': 1},
    headers=headers
)

recommendations = response.json()['data']
print(f"Recommended: {recommendations['recommended_assignment']}")
```

## Changelog

### v0.01.0 (Current)
- Initial API release
- AI-powered work order intake
- Smart dispatch recommendations
- PM template suggestions
- Basic CMMS integrations

### Coming Soon
- Real-time WebSocket support
- Advanced analytics endpoints
- Mobile app APIs
- Enhanced CMMS integrations

## Support

For API support:
- **Documentation**: https://docs.fmcopilot.com
- **Issues**: https://github.com/fmcopilot/api/issues
- **Email**: api-support@fmcopilot.com

---

**© 2024 FM Copilot. All rights reserved.**