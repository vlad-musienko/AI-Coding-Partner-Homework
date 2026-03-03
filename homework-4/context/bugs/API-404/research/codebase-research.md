# Codebase Research: Bug API-404

**Bug**: GET /api/users/:id returns 404 for valid user IDs
**Researcher**: Bug Researcher Agent
**Date**: 2026-03-02
**Status**: Complete

---

## 1. Executive Summary

The `GET /api/users/:id` endpoint always returns a 404 response, even when the
requested user ID exists in the data store. The root cause is a **type mismatch**
in the `getUserById` function: Express route parameters are always strings, but
the in-memory `users` array stores IDs as JavaScript numbers. The strict equality
operator (`===`) never coerces types, so `"123" === 123` evaluates to `false` for
every lookup, causing every request to fall through to the 404 branch.

**Root Cause**: `req.params.id` (string) compared with `===` to numeric `user.id`
in `demo-bug-fix/src/controllers/userController.js` at line 25.

---

## 2. Request Execution Path

```
HTTP GET /api/users/:id
  → server.js:16         app.use(userRoutes)
  → src/routes/users.js:13   router.get('/api/users/:id', userController.getUserById)
  → src/controllers/userController.js:19  getUserById(req, res)
  → src/controllers/userController.js:22  const userId = req.params.id   // STRING
  → src/controllers/userController.js:25  users.find(u => u.id === userId) // ALWAYS false
  → src/controllers/userController.js:27  return res.status(404).json({ error: 'User not found' })
```

---

## 3. File-by-File Analysis

### 3.1 `demo-bug-fix/server.js`

**Lines of interest**:

- **Line 7** — imports the user routes module:
  ```javascript
  const userRoutes = require('./src/routes/users');
  ```
- **Line 16** — mounts user routes on the Express app:
  ```javascript
  app.use(userRoutes);
  ```

No bug here. The routes are correctly mounted without a prefix, meaning the
path registered in `users.js` (`/api/users/:id`) is handled directly.

---

### 3.2 `demo-bug-fix/src/routes/users.js`

**Lines of interest**:

- **Line 4** — imports Express Router:
  ```javascript
  const router = express.Router();
  ```
- **Line 10** — GET /api/users route (works):
  ```javascript
  router.get('/api/users', userController.getAllUsers);
  ```
- **Line 13** — GET /api/users/:id route (broken):
  ```javascript
  router.get('/api/users/:id', userController.getUserById);
  ```

The route definition is correct. The `:id` parameter is captured by Express and
made available as `req.params.id`. No bug here — the issue is downstream in the
controller.

---

### 3.3 `demo-bug-fix/src/controllers/userController.js` ⚠️ **BUG IS HERE**

**In-memory data store — Lines 7–11** (numeric IDs):
```javascript
const users = [
  { id: 123, name: 'Alice Smith', email: 'alice@example.com' },
  { id: 456, name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 789, name: 'Charlie Brown', email: 'charlie@example.com' }
];
```

User IDs are stored as JavaScript **numbers** (`123`, `456`, `789`).

**`getUserById` function — Lines 19–31**:

```javascript
async function getUserById(req, res) {
  const userId = req.params.id;

  // BUG: req.params.id returns a string, but users array uses numeric IDs
  // Strict equality (===) comparison will always fail: "123" !== 123
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}
```

- **Line 22**: `const userId = req.params.id;`
  → `userId` is a **string** (e.g., `"123"`) because Express always parses URL
  parameters as strings.
- **Line 25**: `const user = users.find(u => u.id === userId);`
  → `u.id` is a **number** (`123`), `userId` is a **string** (`"123"`).
  → `123 === "123"` is `false` in JavaScript (strict equality, no coercion).
  → `Array.prototype.find` returns `undefined`.
- **Lines 27–29**: The `if (!user)` branch is always entered → always 404.

**`getAllUsers` — Lines 38–40** (no bug):
```javascript
async function getAllUsers(req, res) {
  res.json(users);
}
```
This endpoint works because it returns the full array without any lookup.

---

## 4. Root Cause Analysis

| Aspect | Detail |
|--------|--------|
| **Type of bug** | Type coercion / strict equality mismatch |
| **Location** | `demo-bug-fix/src/controllers/userController.js`, line 25 |
| **Mechanism** | `req.params.id` → string; `users[n].id` → number; `===` never coerces |
| **Always fails** | Yes — 100% of lookups fail because the type never matches |
| **Regression** | Likely introduced when IDs were changed from strings to numbers, or when the comparison operator was changed from `==` to `===` |

### Why `GET /api/users` works but `GET /api/users/:id` does not

`getAllUsers` simply calls `res.json(users)` with no lookup — no type comparison
involved. Only `getUserById` performs a `find` with strict equality, exposing the
type mismatch.

---

## 5. Fix Hypothesis

Convert the string parameter to a number before comparison:

```javascript
// Before (line 25)
const user = users.find(u => u.id === userId);

// After
const user = users.find(u => u.id === Number(userId));
```

`Number("123")` returns `123` (number), so `123 === 123` is `true`.

Edge cases to consider:
- `Number("abc")` → `NaN`; `123 === NaN` is `false` → will return 404 (correct)
- `Number("")` → `0`; `123 === 0` is `false` → will return 404 (correct)
- `Number("123.5")` → `123.5`; `123 === 123.5` is `false` → will return 404 (correct, IDs are integers)

Alternative fix using loose equality (`==`) would also work but is not
recommended — `Number(userId)` with strict equality is safer and more explicit.

---

## 6. Files Examined

| File | Status | Relevance |
|------|--------|-----------|
| `demo-bug-fix/server.js` | ✅ No bug | Mounts routes |
| `demo-bug-fix/src/routes/users.js` | ✅ No bug | Defines route |
| `demo-bug-fix/src/controllers/userController.js` | ⚠️ **BUG** | Contains type mismatch on line 25 |
| `demo-bug-fix/package.json` | ✅ No bug | Dependencies OK |
