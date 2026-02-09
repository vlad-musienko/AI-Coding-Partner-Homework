---
name: Customer Support System
overview: Build a customer support ticket management system with REST API, multi-format import (CSV/JSON/XML), auto-classification, comprehensive tests (>85% coverage), and multi-level documentation -- all in Node.js/TypeScript/Express.
todos:
  - id: scaffold
    content: "Task 0: Project scaffolding -- package.json, tsconfig.json, jest.config.ts, .gitignore, .env, directory structure"
    status: completed
  - id: ticket-model
    content: "Task 1b: Ticket model -- interfaces, types, enums in src/models/ticket.ts"
    status: completed
  - id: validation
    content: "Task 1c: Validation layer -- Zod schemas in src/validators/ticketValidator.ts"
    status: completed
  - id: ticket-service
    content: "Task 1d: Ticket CRUD service -- in-memory store with filtering in src/services/ticketService.ts"
    status: completed
  - id: parsers
    content: "Task 1e: File parsers -- CSV, JSON, XML parsers in src/parsers/"
    status: completed
  - id: import-service
    content: "Task 1f: Import service -- orchestration + import result summary in src/services/importService.ts"
    status: completed
  - id: classification
    content: "Task 2: Classification service -- keyword-based categorization, priority, confidence scoring in src/services/classificationService.ts"
    status: completed
  - id: logger
    content: "Task 2 (cont): Decision logger in src/utils/logger.ts"
    status: completed
  - id: controller-routes
    content: "Task 1g+1h: Controller, routes, app.ts, index.ts -- wire everything together"
    status: completed
  - id: sample-data
    content: "Task (deliverable): Generate sample data files -- 50 CSV, 20 JSON, 30 XML tickets + invalid variants"
    status: completed
  - id: test-fixtures
    content: "Task 3 (prep): Create test fixtures in tests/fixtures/"
    status: completed
  - id: unit-tests
    content: "Task 3: Unit tests -- test_ticket_api, test_ticket_model, test_import_csv, test_import_json, test_import_xml, test_categorization"
    status: completed
  - id: integration-perf-tests
    content: "Task 5: Integration + performance tests -- test_integration.test.ts, test_performance.test.ts"
    status: completed
  - id: coverage-check
    content: "Task 3 (verify): Run tests, verify >85% coverage, capture screenshot"
    status: completed
  - id: documentation
    content: "Task 4: Documentation -- README.md, API_REFERENCE.md, ARCHITECTURE.md, TESTING_GUIDE.md with Mermaid diagrams"
    status: in_progress
isProject: false
---

# Homework 2: Intelligent Customer Support System

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express (consistent with homework-1)
- **Testing**: Jest + ts-jest + supertest
- **Coverage**: Jest built-in (`--coverage`)
- **Libraries**: `uuid`, `csv-parse`, `fast-xml-parser`, `multer` (file uploads), `zod` (validation)

## Project Structure

```
homework-2/
├── package.json
├── tsconfig.json
├── jest.config.ts
├── .env
├── .gitignore
├── README.md
├── API_REFERENCE.md
├── ARCHITECTURE.md
├── TESTING_GUIDE.md
├── PLAN.md
├── src/
│   ├── index.ts                      # Server bootstrap
│   ├── app.ts                        # Express app (exported for tests)
│   ├── models/
│   │   └── ticket.ts                 # Ticket interfaces, types, enums
│   ├── validators/
│   │   └── ticketValidator.ts        # Zod schemas + validation helpers
│   ├── services/
│   │   ├── ticketService.ts          # In-memory CRUD store
│   │   ├── classificationService.ts  # Keyword-based categorization + priority
│   │   └── importService.ts          # Orchestrates CSV/JSON/XML parsing
│   ├── parsers/
│   │   ├── csvParser.ts              # CSV -> ticket[]
│   │   ├── jsonParser.ts             # JSON -> ticket[]
│   │   └── xmlParser.ts              # XML -> ticket[]
│   ├── controllers/
│   │   └── ticketController.ts       # Request handlers
│   ├── routes/
│   │   └── ticketRoutes.ts           # Route definitions
│   └── utils/
│       └── logger.ts                 # Classification decision logger
├── tests/
│   ├── test_ticket_api.test.ts       # 11 tests - CRUD endpoints
│   ├── test_ticket_model.test.ts     # 9 tests  - Validation
│   ├── test_import_csv.test.ts       # 6 tests  - CSV parsing
│   ├── test_import_json.test.ts      # 5 tests  - JSON parsing
│   ├── test_import_xml.test.ts       # 5 tests  - XML parsing
│   ├── test_categorization.test.ts   # 10 tests - Classification
│   ├── test_integration.test.ts      # 5 tests  - E2E workflows
│   ├── test_performance.test.ts      # 5 tests  - Benchmarks
│   └── fixtures/
│       ├── sample_tickets.csv
│       ├── sample_tickets.json
│       ├── sample_tickets.xml
│       ├── invalid_tickets.csv
│       ├── invalid_tickets.json
│       └── invalid_tickets.xml
├── data/
│   ├── sample_tickets.csv            # 50 tickets
│   ├── sample_tickets.json           # 20 tickets
│   └── sample_tickets.xml            # 30 tickets
└── docs/
    └── screenshots/
        └── .gitkeep
```

---

## Task 1: Multi-Format Ticket Import API

### 1a. Project Scaffolding

- Initialize `package.json` with dependencies: `express`, `uuid`, `csv-parse`, `fast-xml-parser`, `multer`, `zod`, `dotenv`
- Dev dependencies: `typescript`, `ts-node`, `nodemon`, `jest`, `ts-jest`, `supertest`, `@types/*`
- Configure `tsconfig.json` (based on [homework-1/tsconfig.json](homework-1/tsconfig.json) patterns, relaxing `noUnusedLocals`/`noUnusedParameters` during development)
- Configure `jest.config.ts` with `ts-jest` preset, coverage thresholds, and path mappings

### 1b. Ticket Model (`src/models/ticket.ts`)

- Define TypeScript interfaces: `Ticket`, `CreateTicketDTO`, `UpdateTicketDTO`
- Define enums/unions: `TicketCategory`, `TicketPriority`, `TicketStatus`, `TicketSource`, `DeviceType`
- Include all fields from the spec: `id`, `customer_id`, `customer_email`, `customer_name`, `subject`, `description`, `category`, `priority`, `status`, `created_at`, `updated_at`, `resolved_at`, `assigned_to`, `tags`, `metadata`

### 1c. Validation (`src/validators/ticketValidator.ts`)

- Use Zod schemas for strict validation:
  - Email format validation
  - String length constraints (subject: 1-200, description: 10-2000)
  - Enum validation for category, priority, status, source, device_type
  - Required vs optional fields

### 1d. Ticket Service (`src/services/ticketService.ts`)

- In-memory `Map<string, Ticket>` storage
- Methods: `create()`, `findAll(filters)`, `findById()`, `update()`, `delete()`
- Filtering support: by `category`, `priority`, `status`, `assigned_to`
- Auto-generate UUID, `created_at`, `updated_at` timestamps

### 1e. Parsers

- `**src/parsers/csvParser.ts**`: Use `csv-parse` to stream-parse CSV; map columns to ticket fields
- `**src/parsers/jsonParser.ts**`: Parse JSON array or `{ tickets: [...] }` wrapper
- `**src/parsers/xmlParser.ts**`: Use `fast-xml-parser` to parse `<tickets><ticket>...</ticket></tickets>` structure

### 1f. Import Service (`src/services/importService.ts`)

- Detect file format from extension or content-type
- Delegate to appropriate parser
- Validate each parsed ticket
- Return `ImportResult`: `{ total, successful, failed, errors: [{ row, field, message }] }`

### 1g. Controller & Routes

- `**src/controllers/ticketController.ts**`: Request handlers for all 6 endpoints + auto-classify
- `**src/routes/ticketRoutes.ts**`: Wire routes to controller
- Use `multer` for file upload on `/tickets/import`
- Proper HTTP status codes: 201 (created), 200 (success), 400 (validation), 404 (not found), 500 (server error)

### 1h. App & Server

- `**src/app.ts**`: Create and configure Express app (JSON parsing, routes, error handling) -- exported for test use
- `**src/index.ts**`: Import app, listen on port

---

## Task 2: Auto-Classification

### Classification Service (`src/services/classificationService.ts`)

- **Category detection** via keyword matching on `subject` + `description`:
  - `account_access`: "login", "password", "2FA", "sign in", "locked out", "authentication"
  - `technical_issue`: "error", "crash", "bug", "not working", "broken", "slow"
  - `billing_question`: "payment", "invoice", "refund", "charge", "subscription", "billing"
  - `feature_request`: "feature", "suggest", "enhance", "wish", "would be nice", "add support"
  - `bug_report`: "reproduce", "steps to reproduce", "defect", "regression"
  - `other`: fallback
- **Priority detection** via keyword matching:
  - `urgent`: "can't access", "critical", "production down", "security", "data loss", "outage"
  - `high`: "important", "blocking", "asap", "urgent" (when not already classified)
  - `low`: "minor", "cosmetic", "suggestion", "nice to have"
  - `medium`: default
- **Confidence score**: Based on number of keyword matches (more matches = higher confidence)
- **Response**: `{ category, priority, confidence, reasoning, keywords_found }`
- **Decision logging**: via `src/utils/logger.ts`, store classification decisions in memory for auditing
- **Integration with ticket creation**: Optional `auto_classify` flag on `POST /tickets`

---

## Task 3: Test Suite (>85% Coverage)

All tests use `jest` + `supertest` against the exported Express `app`.


| Test File                     | Count | Focus                                                         |
| ----------------------------- | ----- | ------------------------------------------------------------- |
| `test_ticket_api.test.ts`     | 11    | CRUD endpoints, status codes, error responses                 |
| `test_ticket_model.test.ts`   | 9     | Zod validation: valid/invalid emails, lengths, enums          |
| `test_import_csv.test.ts`     | 6     | Valid CSV, malformed rows, missing columns, empty file        |
| `test_import_json.test.ts`    | 5     | Valid JSON array, wrapper object, invalid JSON, schema errors |
| `test_import_xml.test.ts`     | 5     | Valid XML, malformed XML, missing elements                    |
| `test_categorization.test.ts` | 10    | Each category keyword set, priority rules, confidence scores  |
| `test_integration.test.ts`    | 5     | Full lifecycle, bulk import + classify, filtering combos      |
| `test_performance.test.ts`    | 5     | 1000-ticket import, concurrent requests, response times       |


### Fixtures (`tests/fixtures/`)

- Valid sample files for CSV/JSON/XML (subset of data/ files)
- Invalid/malformed files for negative test cases

---

## Task 4: Documentation

### 4 documentation files, each targeting a different audience:

1. `**README.md**` (Developers) -- project overview, architecture mermaid diagram, setup instructions, how to run tests, project structure tree
2. `**API_REFERENCE.md**` (API Consumers) -- all endpoints with request/response JSON examples, data model schemas, error formats, cURL examples
3. `**ARCHITECTURE.md**` (Technical Leads) -- high-level architecture mermaid diagram, component descriptions, data flow sequence diagrams (mermaid), design decisions, security/performance notes
4. `**TESTING_GUIDE.md**` (QA Engineers) -- test pyramid mermaid diagram, how to run tests, fixture locations, manual testing checklist, performance benchmarks

Requirement: at least 3 Mermaid diagrams across all docs.

---

## Task 5: Integration & Performance Tests

Covered in `test_integration.test.ts` and `test_performance.test.ts`:

- **Integration**: Complete ticket lifecycle (create -> classify -> update -> resolve -> close), bulk import with auto-classification, combined filtering (category + priority + status), error recovery workflows
- **Performance**: Concurrent 20+ simultaneous requests using `Promise.all`, bulk import of 1000 tickets, response time assertions (< 200ms for single ops)

---

## Sample Data (Deliverables)

- `data/sample_tickets.csv` -- 50 realistic support tickets
- `data/sample_tickets.json` -- 20 realistic support tickets
- `data/sample_tickets.xml` -- 30 realistic support tickets
- Invalid variants in `tests/fixtures/` for negative testing

---

## Execution Order

Implementation follows dependency order: scaffolding -> model -> service -> parsers -> classification -> routes -> tests -> docs.