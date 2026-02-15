# Spending Caps & Budget Management System Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

Build a personal spending limit management API that enables users to set budget caps on categories, track spending in real-time, and receive alerts when approaching limits—ensuring compliance with financial data regulations.

## Mid-Level Objectives

1. **Budget Management**: Create, read, update, delete spending caps with category-based limits
2. **Real-time Tracking**: Process transactions and update remaining budget automatically
3. **Alert System**: Notify users when spending reaches configurable thresholds (70%, 90%, 100%)
4. **Category Analytics**: Generate spending reports aggregated by category and time period
5. **Compliance & Audit**: Log all financial operations with immutable audit trail
6. **Data Privacy**: Implement GDPR-compliant data handling with user consent and right-to-erasure

## Implementation Notes

### Financial Precision
- **ALWAYS** use `Decimal.js` for all monetary calculations—never JavaScript `Number` type
- Support ISO 4217 currency codes (USD, EUR, GBP, etc.)
- Store amounts as strings or Decimal to prevent floating-point errors

### Security & Compliance
- **PCI DSS**: Minimize cardholder data storage; never log full card numbers
- **GDPR**: Track user consent timestamps; implement data deletion endpoints
- **Audit Trail**: Winston logger writing structured JSON with user ID, action, timestamp, IP address
- **Input Validation**: Sanitize all user inputs; validate amounts, dates, categories

### API Design
- RESTful endpoints following CRUD patterns
- HTTP status codes: 200 (OK), 201 (Created), 400 (Validation), 404 (Not Found), 409 (Conflict), 500 (Server Error)
- Consistent error format: `{ error: string, details?: ValidationError[] }`
- Rate limiting: 100 requests/minute per user

### Testing Requirements
- Unit tests for all services and validators
- Integration tests for API endpoints
- Mock external dependencies (database, notification service)
- Target: >80% code coverage

## Context

### Beginning Context
- Empty project directory
- Node.js 18+ environment
- TypeScript 5.x installed
- npm package manager available

### Ending Context

**Repository Structure:**
```
src/
├── index.ts                      # Express app, middleware, error handlers
├── models/
│   ├── budget.ts                 # Budget, Category, Alert interfaces
│   └── transaction.ts            # Transaction interface
├── controllers/
│   ├── budgetController.ts       # Budget CRUD handlers
│   └── analyticsController.ts    # Reporting endpoints
├── services/
│   ├── budgetService.ts          # Budget business logic
│   ├── transactionService.ts     # Transaction processing
│   ├── alertService.ts           # Threshold checking & notifications
│   └── storageService.ts         # In-memory data store
├── routes/
│   ├── budgetRoutes.ts           # /api/budgets routes
│   └── analyticsRoutes.ts        # /api/analytics routes
├── validators/
│   └── budgetValidator.ts        # Input validation
├── middleware/
│   ├── auditLogger.ts            # Financial operation logging
│   └── rateLimiter.ts            # API rate limiting
└── utils/
    └── decimal.ts                # Decimal.js helper functions
tests/
├── unit/
│   ├── budgetService.test.ts
│   └── validators.test.ts
└── integration/
    └── budgetApi.test.ts
```

**Key Deliverables:**
- 6 API endpoints (budget CRUD + transaction processing + analytics)
- Comprehensive test suite (>80% coverage)
- Audit logging middleware
- GDPR-compliant data deletion endpoint

## Low-Level Tasks

### 1. Define Data Models

**What prompt would you run to complete this task?**
```
Create TypeScript interfaces for Budget, Transaction, and Alert models with the following requirements:
- Budget: id (string), userId (string), category (string), limitAmount (Decimal string), currentSpent (Decimal string), period (enum: monthly/weekly/daily), currency (ISO 4217 code), startDate (ISO 8601), endDate (ISO 8601), createdAt (timestamp), updatedAt (timestamp)
- Transaction: id (string), userId (string), budgetId (string), amount (Decimal string), currency (string), category (string), description (string), timestamp (ISO 8601), merchantName (optional string)
- Alert: id (string), budgetId (string), threshold (number: 70/90/100), triggeredAt (timestamp), notified (boolean)
- Category enum: GROCERIES, DINING, TRANSPORTATION, ENTERTAINMENT, UTILITIES, HEALTHCARE, SHOPPING, OTHER
Include JSDoc comments explaining PCI DSS and GDPR considerations.
```

**What file do you want to CREATE or UPDATE?**
- `src/models/budget.ts`
- `src/models/transaction.ts`

**What function do you want to CREATE or UPDATE?**
- Interfaces: `Budget`, `Transaction`, `Alert`, `ValidationError`
- Enums: `Category`, `Period`

**What are details you want to add to drive the code changes?**
- All monetary amounts stored as strings (Decimal-compatible)
- Timestamps in ISO 8601 format
- Immutable IDs (UUID v4 format)
- Include GDPR consent tracking fields (consentGiven: boolean, consentTimestamp: timestamp)

---

### 2. Implement Budget Service

**What prompt would you run to complete this task?**
```
Create BudgetService class with methods: createBudget, getBudgetById, getBudgetsByUser, updateBudget, deleteBudget (GDPR), checkThresholds. Use Decimal.js for all amount calculations. Include audit logging for each operation. Implement overlapping period detection (prevent multiple budgets for same category+period). Return error objects for validation failures.
```

**What file do you want to CREATE or UPDATE?**
- `src/services/budgetService.ts`

**What function do you want to CREATE or UPDATE?**
- Class: `BudgetService`
- Methods: `createBudget`, `getBudgetById`, `getBudgetsByUser`, `updateBudget`, `deleteBudget`, `checkThresholds`

**What are details you want to add to drive the code changes?**
- Use `storageService` singleton for data persistence
- Use `alertService` for threshold checks
- Validate no overlapping budgets (same user + category + overlapping dates)
- Log all operations with: `{ action, userId, budgetId, timestamp, metadata }`
- Use Decimal.js methods: `.plus()`, `.minus()`, `.lessThanOrEqualTo()`, `.greaterThan()`

---

### 3. Implement Transaction Processing

**What prompt would you run to complete this task?**
```
Create TransactionService class that processes transactions and updates budget currentSpent. Methods: recordTransaction, getTransactionsByBudget, getTransactionsByUser. When recording transaction: 1) Find matching budget by category, 2) Add amount to currentSpent using Decimal, 3) Trigger alertService.checkThreshold, 4) Audit log the operation. Include validation for currency matching.
```

**What file do you want to CREATE or UPDATE?**
- `src/services/transactionService.ts`

**What function do you want to CREATE or UPDATE?**
- Class: `TransactionService`
- Methods: `recordTransaction`, `getTransactionsByBudget`, `getTransactionsByUser`

**What are details you want to add to drive the code changes?**
- Atomic operation: transaction record + budget update must succeed together
- Validate transaction.currency matches budget.currency
- Auto-categorize if category not provided (use merchantName heuristics)
- Never log full card numbers—mask if present in merchantName
- Return `{ transaction, budgetUpdated, alertTriggered }` object

---

### 4. Implement Alert Service

**What prompt would you run to complete this task?**
```
Create AlertService class that monitors budget thresholds (70%, 90%, 100%). Method: checkThreshold(budget). Compare currentSpent to limitAmount using Decimal calculations. If threshold crossed, create Alert record and return notification payload. Support configurable thresholds per budget. Include deduplication (don't alert twice for same threshold).
```

**What file do you want to CREATE or UPDATE?**
- `src/services/alertService.ts`

**What function do you want to CREATE or UPDATE?**
- Class: `AlertService`
- Methods: `checkThreshold`, `getAlertsByBudget`, `markNotified`

**What are details you want to add to drive the code changes?**
- Calculate percentage: `currentSpent.dividedBy(limitAmount).times(100)`
- Check thresholds: 70%, 90%, 100%
- Return notification object: `{ budgetId, category, percentUsed, amountRemaining, message }`
- Store alert in storage before returning
- Dedupe: Check if alert already exists for budgetId + threshold

---

### 5. Create Validators

**What prompt would you run to complete this task?**
```
Create validation functions: validateBudget (limitAmount > 0, valid currency code, startDate < endDate, category in enum), validateTransaction (amount > 0, valid currency, required fields present), validateDateRange (for analytics queries). Return array of ValidationError objects with field name and error message. Never throw exceptions—return errors as data.
```

**What file do you want to CREATE or UPDATE?**
- `src/validators/budgetValidator.ts`

**What function do you want to CREATE or UPDATE?**
- Functions: `validateBudget`, `validateTransaction`, `validateDateRange`, `validateCurrency`

**What are details you want to add to drive the code changes?**
- Use regex for currency validation: `/^[A-Z]{3}$/` (ISO 4217)
- Check amount strings parse to valid Decimal: `new Decimal(amount)` in try-catch
- Validate dates are ISO 8601 format and parseable
- Return format: `ValidationError[] = [{ field: 'limitAmount', message: 'Must be greater than zero' }]`

---

### 6. Build Controllers & Routes

**What prompt would you run to complete this task?**
```
Create BudgetController and AnalyticsController classes. Budget endpoints: POST /api/budgets (create), GET /api/budgets/:id (read), PUT /api/budgets/:id (update), DELETE /api/budgets/:id (delete), POST /api/budgets/:id/transactions (record transaction). Analytics endpoints: GET /api/analytics/spending (aggregated by category), GET /api/analytics/budgets/:id/history (spending over time). Include request validation, error handling, audit logging middleware.
```

**What file do you want to CREATE or UPDATE?**
- `src/controllers/budgetController.ts`
- `src/controllers/analyticsController.ts`
- `src/routes/budgetRoutes.ts`
- `src/routes/analyticsRoutes.ts`
- `src/middleware/auditLogger.ts`

**What function do you want to CREATE or UPDATE?**
- BudgetController methods: `create`, `getById`, `update`, `delete`, `recordTransaction`
- AnalyticsController methods: `getSpendingReport`, `getBudgetHistory`
- Express Router configurations

**What are details you want to add to drive the code changes?**
- Extract userId from request headers: `req.headers['x-user-id']` (mock auth)
- Call validators before service methods
- Return 400 with validation errors if validation fails
- Return 404 if budget not found
- Return 409 if overlapping budget detected
- Audit middleware: log method, path, userId, statusCode, duration
- Use Winston for structured JSON logging

---

### 7. Implement Testing Suite

**What prompt would you run to complete this task?**
```
Create comprehensive test suite using Jest. Unit tests: budgetService (all CRUD operations, threshold detection, GDPR deletion), transactionService (amount calculations, currency validation), validators (edge cases). Integration tests: full API flows (create budget → record transaction → check alert → view analytics). Mock storageService and alertService. Achieve >80% coverage. Include test cases for: Decimal precision, overlapping budgets, threshold boundaries, invalid currencies.
```

**What file do you want to CREATE or UPDATE?**
- `tests/unit/budgetService.test.ts`
- `tests/unit/transactionService.test.ts`
- `tests/unit/validators.test.ts`
- `tests/integration/budgetApi.test.ts`

**What function do you want to CREATE or UPDATE?**
- Test suites for each service and controller
- Mock factories for test data

**What are details you want to add to drive the code changes?**
- Use Jest `describe` blocks per service/method
- Separate test cases: happy path, validation errors, edge cases, error conditions
- Mock external dependencies using `jest.fn()`
- Test Decimal arithmetic: `0.1 + 0.2` scenarios, large numbers, negative amounts
- Test GDPR deletion: verify budget and related transactions/alerts fully removed
- Test rate limiting: verify 429 status after 100 requests
- Use `supertest` for integration tests with Express app

---

### 8. Setup Application Entry Point

**What prompt would you run to complete this task?**
```
Create Express application in index.ts with: JSON body parser, CORS middleware, audit logger middleware, rate limiter (100 req/min per user), error handling middleware, health check endpoint (GET /health). Mount routes: /api/budgets, /api/analytics. Configure Winston logger writing to console (dev) and files (prod). Include graceful shutdown handler. Set up environment variables for: PORT, LOG_LEVEL, NODE_ENV.
```

**What file do you want to CREATE or UPDATE?**
- `src/index.ts`
- `src/middleware/rateLimiter.ts`

**What function do you want to CREATE or UPDATE?**
- Express app configuration
- Error handler middleware
- Rate limiter middleware (using `express-rate-limit`)

**What are details you want to add to drive the code changes?**
- Rate limit config: `windowMs: 60000, max: 100, keyGenerator: (req) => req.headers['x-user-id']`
- Error handler: catch unhandled errors, log with Winston, return 500 with generic message (don't expose internals)
- CORS: allow all origins in dev, configure whitelist in prod
- Winston format: `winston.format.combine(timestamp(), json())`
- Audit log path: `logs/audit.log`, error log path: `logs/error.log`
- Health check response: `{ status: 'ok', timestamp: new Date().toISOString() }`
