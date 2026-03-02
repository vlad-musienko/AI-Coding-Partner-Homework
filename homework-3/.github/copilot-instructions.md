# GitHub Copilot Instructions for Spending Caps System

## 💰 Money Handling (CRITICAL)
```typescript
// ALWAYS use Decimal.js for currency
import Decimal from 'decimal.js';
const total = new Decimal('100.50').plus('25.25');

// NEVER use Number
const total = 100.50 + 25.25; // ❌ Float precision issues
```

## Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Files | camelCase | `budgetService.ts` |
| Classes/Interfaces | PascalCase | `BudgetService`, `Budget` |
| Enums/Values | PascalCase/UPPERCASE | `Category.GROCERIES` |
| Functions/Variables | camelCase | `validateBudget()` |
| Constants | UPPER_SNAKE_CASE | `MAX_LIMIT_AMOUNT` |

## TypeScript Standards
- Strict mode enabled
- Explicit return types
- No `any` type (except Express `Request` extensions)

---

## Banking-Specific Patterns
```typescript
// ISO 4217 currencies (3-letter uppercase)
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];

// ALWAYS log financial operations
logger.info('budget_created', { userId, budgetId, amount, timestamp: new Date().toISOString() });

// ALWAYS mask sensitive data
const maskCard = (card: string) => `****${card.slice(-4)}`;
```

---

## Architecture

**Layered:** Routes → Controllers → Services → Storage

**Services:** Export singleton `export const budgetService = new BudgetService(storageService);`

**Controllers:** Return `void`, use `res.json()`. Steps: 1) Validate 2) Call service 3) Return 201/400/404/409

**Validators:** Return `ValidationError[]` (never throw)

**Error Format:** `{ error: string, code?: string, details?: ValidationError[] }`

**HTTP Status:** 200 (OK), 201 (Created), 400 (Validation), 404 (Not Found), 409 (Conflict), 500 (Server Error)

---
## 🚫 Never Do This
1. Float arithmetic: `100.10 + 200.20` ❌
2. Log sensitive data: `logger.info(cardNumber)` ❌
3. Skip audit logs for financial ops ❌
4. Generic errors: `"Bad request"` ❌ Use: `"Limit amount must be > 0"`
5. Allow overlapping budgets (check category + period) ❌
6. Throw exceptions in services ❌ Return: `{ error, code }`
7. Expose internals: `error.stack` ❌

## GDPR Compliance
**Right to Erasure:** Cascade delete budget → transactions → alerts (keep audit logs)

**Consent Tracking:** Store `consentGiven: boolean` and `consentTimestamp: string` (ISO 8601)

---

## Quick Reference
```typescript
// Decimal operations
import Decimal from 'decimal.js';
const total = new Decimal('100.50').plus('25.25');
const percent = new Decimal(spent).dividedBy(limit).times(100);

// Currency & ID
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
const id = `bgt_${uuidv4()}`;

// JSDoc required for public methods
/** Creates a budget. @param userId @param data @returns Budget | ErrorResponse */
```