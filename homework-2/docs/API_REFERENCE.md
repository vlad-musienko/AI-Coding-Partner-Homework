# API Reference

Complete API documentation for the Customer Support System.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Health Check

#### GET /

Check if the API is running.

**Response:**
```json
{
  "message": "Customer Support System API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "tickets": "/tickets",
    "import": "/tickets/import",
    "autoClassify": "/tickets/:id/auto-classify"
  }
}
```

---

### Create Ticket

#### POST /tickets

Create a new support ticket.

**Request Body:**
```json
{
  "customer_id": "CUST001",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to account",
  "description": "I forgot my password and cannot access my account",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "assigned_to": null,
  "tags": ["login", "password"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome",
    "device_type": "desktop"
  },
  "auto_classify": true
}
```

**Required Fields:**
- `customer_id` (string)
- `customer_email` (valid email)
- `customer_name` (string)
- `subject` (1-200 characters)
- `description` (10-2000 characters)
- `metadata.source` (enum: web_form, email, api, chat, phone)

**Optional Fields:**
- `category` (enum: account_access, technical_issue, billing_question, feature_request, bug_report, other)
- `priority` (enum: urgent, high, medium, low)
- `status` (enum: new, in_progress, waiting_customer, resolved, closed)
- `assigned_to` (string or null)
- `tags` (array of strings)
- `metadata.browser` (string)
- `metadata.device_type` (enum: desktop, mobile, tablet)
- `auto_classify` (boolean) - If true, automatically categorize and prioritize the ticket

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to account",
  "description": "I forgot my password and cannot access my account",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "created_at": "2026-02-09T10:30:00.000Z",
  "updated_at": "2026-02-09T10:30:00.000Z",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["login", "password"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome",
    "device_type": "desktop"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "customer_email": "user@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to account",
    "description": "I forgot my password and cannot access my account",
    "metadata": {
      "source": "web_form"
    },
    "auto_classify": true
  }'
```

---

### Import Tickets

#### POST /tickets/import

Bulk import tickets from CSV, JSON, or XML file.

**Request:**
- Content-Type: `multipart/form-data`
- Form field `file`: The file to import
- Form field `auto_classify` (optional): "true" or "false"

**Supported Formats:**
- CSV (.csv)
- JSON (.json)
- XML (.xml)

**Response (200 OK):**
```json
{
  "total": 50,
  "successful": 48,
  "failed": 2,
  "errors": [
    {
      "row": 15,
      "field": "customer_email",
      "message": "Invalid email format"
    },
    {
      "row": 32,
      "field": "description",
      "message": "Description must be at least 10 characters"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@data/sample_tickets.csv" \
  -F "auto_classify=true"
```

---

### List Tickets

#### GET /tickets

Retrieve all tickets with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority
- `status` (optional): Filter by status
- `assigned_to` (optional): Filter by assignee
- `customer_id` (optional): Filter by customer ID

**Response (200 OK):**
```json
{
  "total": 2,
  "tickets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_id": "CUST001",
      "customer_email": "user@example.com",
      "customer_name": "John Doe",
      "subject": "Cannot login to account",
      "description": "I forgot my password",
      "category": "account_access",
      "priority": "high",
      "status": "new",
      "created_at": "2026-02-09T10:30:00.000Z",
      "updated_at": "2026-02-09T10:30:00.000Z",
      "resolved_at": null,
      "assigned_to": null,
      "tags": ["login"],
      "metadata": {
        "source": "web_form",
        "browser": "Chrome",
        "device_type": "desktop"
      }
    }
  ]
}
```

**cURL Examples:**
```bash
# Get all tickets
curl http://localhost:3000/tickets

# Filter by category
curl "http://localhost:3000/tickets?category=billing_question"

# Filter by multiple criteria
curl "http://localhost:3000/tickets?category=technical_issue&priority=urgent&status=new"
```

---

### Get Ticket

#### GET /tickets/:id

Retrieve a specific ticket by ID.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to account",
  "description": "I forgot my password",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "created_at": "2026-02-09T10:30:00.000Z",
  "updated_at": "2026-02-09T10:30:00.000Z",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["login"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome",
    "device_type": "desktop"
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### Update Ticket

#### PUT /tickets/:id

Update an existing ticket.

**Request Body (all fields optional):**
```json
{
  "subject": "Updated subject",
  "status": "in_progress",
  "assigned_to": "agent@example.com",
  "priority": "urgent"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "subject": "Updated subject",
  "description": "I forgot my password",
  "category": "account_access",
  "priority": "urgent",
  "status": "in_progress",
  "created_at": "2026-02-09T10:30:00.000Z",
  "updated_at": "2026-02-09T11:00:00.000Z",
  "resolved_at": null,
  "assigned_to": "agent@example.com",
  "tags": ["login"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome",
    "device_type": "desktop"
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved"
  }'
```

---

### Delete Ticket

#### DELETE /tickets/:id

Delete a ticket.

**Response (200 OK):**
```json
{
  "message": "Ticket deleted successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### Auto-Classify Ticket

#### POST /tickets/:id/auto-classify

Automatically classify a ticket's category and priority based on its subject and description.

**Response (200 OK):**
```json
{
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "CUST001",
    "customer_email": "user@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to account",
    "description": "I forgot my password",
    "category": "account_access",
    "priority": "high",
    "status": "new",
    "created_at": "2026-02-09T10:30:00.000Z",
    "updated_at": "2026-02-09T11:00:00.000Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": ["login"],
    "metadata": {
      "source": "web_form"
    }
  },
  "classification": {
    "category": "account_access",
    "priority": "high",
    "confidence": 0.85,
    "reasoning": "Categorized as 'account_access' based on keywords: login, password, access. Priority set to 'high' based on keywords: cannot, access.",
    "keywords_found": ["login", "password", "access", "cannot"]
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

---

## Error Responses

### 400 Bad Request

Validation error.

```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "customer_email",
      "message": "Invalid email format"
    },
    {
      "field": "description",
      "message": "Description must be at least 10 characters"
    }
  ]
}
```

### 404 Not Found

Resource not found.

```json
{
  "error": "Not Found",
  "details": [
    {
      "field": "id",
      "message": "Ticket with id 550e8400-e29b-41d4-a716-446655440000 not found"
    }
  ]
}
```

### 500 Internal Server Error

Server error.

```json
{
  "error": "Internal Server Error",
  "details": [
    {
      "field": "server",
      "message": "An unexpected error occurred"
    }
  ]
}
```

---

## Data Models

### Ticket

```typescript
{
  id: string;                    // UUID
  customer_id: string;
  customer_email: string;        // Valid email
  customer_name: string;
  subject: string;               // 1-200 characters
  description: string;           // 10-2000 characters
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
  assigned_to: string | null;
  tags: string[];
  metadata: TicketMetadata;
}
```

### Enums

**TicketCategory:**
- `account_access`
- `technical_issue`
- `billing_question`
- `feature_request`
- `bug_report`
- `other`

**TicketPriority:**
- `urgent`
- `high`
- `medium`
- `low`

**TicketStatus:**
- `new`
- `in_progress`
- `waiting_customer`
- `resolved`
- `closed`

**TicketSource:**
- `web_form`
- `email`
- `api`
- `chat`
- `phone`

**DeviceType:**
- `desktop`
- `mobile`
- `tablet`
