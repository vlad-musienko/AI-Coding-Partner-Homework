# Implementation Plan: Bug API-404

**Bug**: GET /api/users/:id returns 404 for valid user IDs
**Planner**: Bug Planner Agent
**Date**: 2026-03-02
**Research source**: `context/bugs/API-404/research/verified-research.md`
**Status**: Ready for implementation

---

## Summary

Apply a single one-line change in `userController.js` to convert the string route
parameter to a number before the strict-equality comparison. Run a curl test to
verify the fix.

---

## Change 1 — Fix type mismatch in `getUserById`

### Target file

```
demo-bug-fix/src/controllers/userController.js
```

### Location

Function `getUserById`, line 25 (inside the `find` callback).

### Before

```javascript
  const user = users.find(u => u.id === userId);
```

### After

```javascript
  const user = users.find(u => u.id === Number(userId));
```

### Rationale

`req.params.id` is always a string in Express. The in-memory `users` array stores
IDs as JavaScript numbers. Strict equality (`===`) never coerces types, so the
lookup always fails. Wrapping `userId` in `Number()` converts `"123"` → `123`
before the comparison, making the strict equality work correctly.

`Number()` with a non-numeric string (e.g. `"abc"`) returns `NaN`, and
`id === NaN` is always `false`, so the 404 is still returned for invalid IDs.

### Full function context (after change)

```javascript
async function getUserById(req, res) {
  const userId = req.params.id;

  const user = users.find(u => u.id === Number(userId));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}
```

---

## Test Commands

### Prerequisites

```bash
cd demo-bug-fix
npm install
npm start
```

Server should log:
```
Demo API server running on http://localhost:3000
```

### Test 1 — Happy path (existing user)

```bash
curl -s http://localhost:3000/api/users/123
```

**Expected** (200 OK):
```json
{"id":123,"name":"Alice Smith","email":"alice@example.com"}
```

**Failure** (means bug not fixed):
```json
{"error":"User not found"}
```

### Test 2 — Another existing user

```bash
curl -s http://localhost:3000/api/users/456
```

**Expected**:
```json
{"id":456,"name":"Bob Johnson","email":"bob@example.com"}
```

### Test 3 — Non-existent user (should return 404)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/999
```

**Expected**: `404`

### Test 4 — Non-numeric ID (should return 404)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/abc
```

**Expected**: `404`

### Test 5 — All users endpoint still works

```bash
curl -s http://localhost:3000/api/users
```

**Expected** (200 OK): JSON array with 3 users.

---

## Verification Criteria

| # | Check | Expected result |
|---|-------|----------------|
| 1 | `GET /api/users/123` | `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` with 200 |
| 2 | `GET /api/users/456` | `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` with 200 |
| 3 | `GET /api/users/789` | `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` with 200 |
| 4 | `GET /api/users/999` | `{"error":"User not found"}` with 404 |
| 5 | `GET /api/users/abc` | `{"error":"User not found"}` with 404 |
| 6 | `GET /api/users` | Array of 3 users with 200 |

---

## Rollback

If the tests fail, revert `userController.js` line 25 to:

```javascript
const user = users.find(u => u.id === userId);
```

Then document the failure in `fix-summary.md` and stop.

---

## Files to Modify

| File | Change |
|------|--------|
| `demo-bug-fix/src/controllers/userController.js` | Line 25: wrap `userId` in `Number()` |

No other files need to change.
