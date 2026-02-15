# AI Agent Configuration for Spending Caps System

## Tech Stack
- Node.js 18+, TypeScript 5.x, Express.js 4.x
- Decimal.js (NEVER use Number for money), Winston (JSON logs), Jest
- Dependencies: `express`, `decimal.js`, `winston`, `express-rate-limit`, `uuid`

---

## Banking Domain Rules

### 🚫 NEVER
1. Use `Number` for money → Use `new Decimal('100.50')`
2. Log sensitive data → Mask: `****3456`
3. Skip audit logs for financial ops
4. Allow negative amounts (validate > 0)
5. Expose internals → Return generic `'Internal server error'`

### ✅ ALWAYS
1. Use Decimal.js: `new Decimal(amount1).plus(amount2)`
2. Validate ISO 4217 currencies: `['USD', 'EUR', 'GBP', 'JPY', 'CAD']`
3. Log with structured data: `logger.info('action', { userId, budgetId, amount, timestamp })`
4. Check overlapping budgets (same category + period)
5. Return errors as data: `{ error, code }` (never throw)

---

## Architecture

**Layered:** Routes → Controllers → Services → Storage

**Structure:**
- `index.ts` — App setup, middleware, routes, error handlers
- `models/` — Interfaces & enums
- `controllers/` — HTTP handlers (void return, use `res.json`)
- `services/` — Business logic (return data or errors)
- `routes/` — Express routers
- `validators/` — Pure functions returning `ValidationError[]`
- `middleware/` — Audit, rate limit, error handler
- `utils/` — Decimal helpers, formatters

---

## Code Style

**Naming:** Files=camelCase, Classes/Interfaces=PascalCase, Enums=PascalCase/UPPERCASE, Functions=camelCase, Constants=UPPER_SNAKE_CASE

**Patterns:**
- Services: Export singletons `export const budgetService = new BudgetService(storageService);`
- Controllers: Return `void`, use `res.json()`, steps: validate → call service → return status
- Validators: Return `ValidationError[]` (never throw)
- Errors: `{ error: string, code?: string, details?: ValidationError[] }`
- HTTP Status: 200 (OK), 201 (Created), 400 (Validation), 404 (Not Found), 409 (Conflict), 500 (Server Error)

---

## Security & Compliance

**PCI DSS:** Store minimal data, mask card numbers (`****3456`), encrypt in production

**GDPR:** Consent tracking (`consentGiven`, `consentTimestamp`), cascade delete (budget → transactions → alerts), audit trail

**Audit Logging:** Every financial op logs: `{ timestamp, action, userId, resourceId, metadata, ipAddress }` → `logs/audit.log` (append-only)

---

## Testing

**Coverage:** Minimum 80% (priority: Services > Controllers > Validators)

**Structure:** `describe` blocks per service/method, separate happy path / error / edge cases

**Mock:** Storage, external APIs, date generators | **Don't Mock:** Business logic, validators, Decimal

**Critical Cases:**
1. Decimal precision: `0.1 + 0.2 = 0.3` (not `0.30000000000000004`)
2. Currency validation: Reject `'US'`, `'Dollar'`, `123`
3. Threshold boundaries: 69.9%, 70.0%, 70.1%
4. GDPR cascade delete: Budget + transactions + alerts removed
5. Rate limiting: 429 after 100 requests

---

## Code Review Checklist
✓ Decimal.js for money | ✓ Audit logs for financial ops | ✓ Errors as data (no throw) | ✓ ISO 4217 currencies | ✓ Masked sensitive data | ✓ Tests added | ✓ JSDoc on public methods | ✓ TS strict mode | ✓ Proper HTTP status | ✓ GDPR maintained
