# Security Report: Bug API-404

**Reviewer**: Security Verifier Agent
**Date**: 2026-03-02
**Fix reviewed**: Type coercion fix in getUserById (userController.js)

## Overall Risk

**Overall Risk**: HIGH

The `Number()` type-coercion fix itself is safe. However, the surrounding codebase has significant security gaps — most critically a complete absence of authentication and authorization, combined with PII (email addresses) exposed on unauthenticated endpoints. These pre-existing issues are elevated to HIGH by the fact that the endpoints are publicly reachable with no access control of any kind.

---

## Findings

### Finding 1 — No Authentication or Authorization
**Severity**: HIGH  
**Category**: Authorization / Access Control  
**Location**: `src/routes/users.js` — all routes; `src/controllers/userController.js` — `getAllUsers`, `getUserById`  
**Description**: Both `/api/users` and `/api/users/:id` are fully public. Any unauthenticated caller can enumerate all users or retrieve any individual user record. There is no middleware performing identity verification (JWT, session, API key, etc.) before the controller logic runs.  
**Evidence**:
```javascript
// users.js — no auth middleware on either route
router.get('/api/users', userController.getAllUsers);
router.get('/api/users/:id', userController.getUserById);
```
**Recommendation**: Apply an authentication middleware (e.g. `passport`, a JWT-validation middleware, or a session check) to all `/api/users` routes before they reach the controller. Example: `router.get('/api/users/:id', requireAuth, userController.getUserById);`

---

### Finding 2 — PII Exposed Without Access Control
**Severity**: HIGH  
**Category**: Information Disclosure / Privacy  
**Location**: `src/controllers/userController.js` — `getUserById`, `getAllUsers`  
**Description**: User records contain email addresses (PII). Both endpoints return this data in the JSON response without any form of access control, consent check, or field-level filtering. `getAllUsers` additionally exposes the complete user roster in a single unauthenticated call, enabling trivial harvesting of all stored email addresses.  
**Evidence**:
```javascript
const users = [
  { id: 123, name: 'Alice Smith', email: 'alice@example.com' },
  ...
];
// getAllUsers returns the entire array; getUserById returns the full record including email
res.json(users);       // getAllUsers
res.json(user);        // getUserById
```
**Recommendation**: (a) Restrict both endpoints behind authentication (see Finding 1). (b) Evaluate whether all fields — specifically `email` — need to be returned to the calling client; if not, project only the needed fields before responding. (c) For `getAllUsers`, add pagination to limit bulk data extraction.

---

### Finding 3 — Missing Input Validation on the ID Parameter
**Severity**: MEDIUM  
**Category**: Input Validation  
**Location**: `src/controllers/userController.js` — `getUserById`  
**Description**: The raw route parameter is passed directly to `Number()` with no prior validation. `Number()` silently accepts several unexpected forms that could mask logic errors or be used to probe application behaviour:
- Hex strings: `Number('0x1F')` → `31` — requests to `/api/users/0x7b` resolve to user ID 123.
- Float strings: `Number('123.9')` → `123.9` — no match, but the intent is ambiguous.
- Whitespace-only strings: `Number('   ')` → `0` — resolves to a valid (if unlikely) ID.
- Very large strings (e.g. `'9'.repeat(10000)`) — unlikely to bypass server URL limits, but no explicit ceiling is enforced.

None of these currently produce a security breach against the in-memory dataset, but the lack of validation means the code makes silent assumptions about the input shape.  
**Evidence**:
```javascript
const userId = req.params.id;
const user = users.find(u => u.id === Number(userId));
// No check that userId is a finite, positive integer string before conversion
```
**Recommendation**: Add an explicit guard before the lookup:
```javascript
const userId = req.params.id;
const numericId = parseInt(userId, 10);
if (!Number.isFinite(numericId) || numericId <= 0 || String(numericId) !== userId) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
const user = users.find(u => u.id === numericId);
```
This rejects hex, floats, negative values, and non-numeric strings before the lookup runs, and makes the validation intent explicit.

---

### Finding 4 — No Rate Limiting
**Severity**: LOW  
**Category**: Denial of Service  
**Location**: `server.js` — middleware configuration  
**Description**: There is no rate-limiting middleware (e.g. `express-rate-limit`) on the API. A caller can make an unlimited number of requests per second. For the current in-memory dataset this poses minimal computational risk, but if the data source is ever replaced with a database or an expensive lookup, the endpoint becomes a trivial DoS target. The `getAllUsers` endpoint is particularly at risk as it returns the full dataset on every call.  
**Evidence**: `server.js` applies only `express.json()` as middleware before routing — no rate limiter is present.  
**Recommendation**: Add `express-rate-limit` (or equivalent) at the application level:
```javascript
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({ windowMs: 60_000, max: 100 }));
```

---

### Finding 5 — Verbose Server Startup Logging
**Severity**: INFO  
**Category**: Information Disclosure  
**Location**: `server.js` — startup `console.log` block  
**Description**: On startup the server prints example URLs including the full host and port to stdout. In a containerised or cloud environment where logs are aggregated, this reveals the internal address and available endpoint structure. It is low risk in isolation but constitutes unnecessary information disclosure.  
**Evidence**:
```javascript
console.log(`  GET http://localhost:${PORT}/api/users`);
console.log(`  GET http://localhost:${PORT}/api/users/123`);
```
**Recommendation**: Remove or gate these messages behind a `NODE_ENV !== 'production'` check.

---

## Fix-Specific Analysis

### The Number() Conversion
`Number(userId)` is a safe choice for this specific problem. It does not invoke `eval`, does not interact with any parser or database layer, and produces a primitive numeric value used only for strict equality comparison against another number. There is no injection surface — the conversion cannot be crafted to execute code, modify data, or escape the array `find()` context.

The one concern is that `Number()` is more permissive than necessary (accepting hex, floats, whitespace, etc.) — see Finding 3. Using `parseInt(userId, 10)` with an `isFinite` guard would express the intent more precisely. This is a code-quality / defence-in-depth concern rather than an active vulnerability given the current codebase.

### NaN Handling
When a non-numeric string such as `"abc"` is passed, `Number('abc')` returns `NaN`. The strict equality check `u.id === NaN` always evaluates to `false` (NaN is never equal to itself or anything else), so `find()` returns `undefined`, and the existing `if (!user)` guard correctly returns a `404`. **The NaN case is fully neutralised by the existing control flow and introduces no security risk.**

### Error Response
The 404 response `{ "error": "User not found" }` is appropriately minimal. It:
- Does not reveal whether the ID format was valid or invalid (no enumeration difference between "bad format" and "valid format, no match").
- Does not include a stack trace, internal path, or database error message.
- Does not confirm which IDs *do* exist.

This is good defensive practice. The only improvement would be returning a `400 Bad Request` for structurally invalid IDs (e.g. `"abc"`) rather than `404`, which would add semantic clarity without disclosing anything new (see Finding 3 recommendation).

---

## Positive Security Observations

- **No injection vector introduced**: `Number()` is a pure type conversion with no side effects, eval, or query construction — the fix does not open any injection path.
- **No stack trace leakage**: The error response is deliberately minimal and never exposes internal state.
- **NaN safely handled**: The combination of `Number()` and the `if (!user)` null-check forms an implicit NaN guard that correctly returns 404 for non-numeric inputs.
- **No sensitive data written to logs**: The controller does not log user data or request parameters.

---

## Summary

The `Number(userId)` fix is itself benign and does not introduce any new security vulnerabilities; the NaN and type-coercion edge cases are handled safely by the existing null-check guard. The HIGH overall risk rating comes entirely from pre-existing gaps in the surrounding code: there is no authentication or authorization on any user endpoint, and email addresses (PII) are returned to any unauthenticated caller. These issues should be addressed before this service is used in any non-demo context. Input validation and rate limiting are secondary improvements that would harden the service against abuse and unintended behaviour.
