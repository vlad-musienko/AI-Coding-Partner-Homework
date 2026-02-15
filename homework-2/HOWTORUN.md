# How to Run - Customer Support System API

This guide provides step-by-step instructions to set up and run the Customer Support System API.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

1. **Navigate to the project directory:**

```bash
cd homework-2
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

## Environment Setup

Create a `.env` file in the `homework-2` directory:

```env
PORT=3000
NODE_ENV=development
```

## Running the Application

### Development Mode

Run with hot-reload enabled:

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Production Mode

Build and run the compiled version:

```bash
npm run build
npm start
```

## Testing the Application

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## Quick Start Examples

### 1. Create a Ticket

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
      "source": "web_form",
      "browser": "Chrome",
      "device_type": "desktop"
    },
    "auto_classify": true
  }'
```

### 2. Import Tickets from CSV

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@demo/sample_tickets.csv" \
  -F "auto_classify=true"
```

### 3. Import Tickets from JSON

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@demo/sample_tickets.json" \
  -F "auto_classify=true"
```

### 4. Import Tickets from XML

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@demo/sample_tickets.xml" \
  -F "auto_classify=true"
```

### 5. List All Tickets

```bash
curl http://localhost:3000/tickets
```

### 6. Get a Specific Ticket

```bash
curl http://localhost:3000/tickets/{ticket_id}
```

### 7. Filter Tickets

Filter by category and priority:

```bash
curl "http://localhost:3000/tickets?category=billing_question&priority=high"
```

Filter by status:

```bash
curl "http://localhost:3000/tickets?status=open"
```

### 8. Update a Ticket

```bash
curl -X PUT http://localhost:3000/tickets/{ticket_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "priority": "high"
  }'
```

### 9. Delete a Ticket

```bash
curl -X DELETE http://localhost:3000/tickets/{ticket_id}
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change the `PORT` in your `.env` file:

```env
PORT=3001
```

### Module Not Found Errors

Ensure all dependencies are installed:

```bash
npm install
```

### Build Errors

Clean the build directory and rebuild:

```bash
rm -rf dist
npm run build
```

## API Documentation

For detailed API documentation, see [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
