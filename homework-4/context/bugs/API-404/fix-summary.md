# Fix Summary: Bug API-404

**Implementer**: Bug Implementer Agent
**Date**: 2026-03-02
**Bug**: GET /api/users/:id returns 404 for valid user IDs

## Overall Status

**Status**: SUCCESS

## Changes Made

### Change 1 — Fixed type mismatch in getUserById

**File**: `demo-bug-fix/src/controllers/userController.js`
**Type**: Bug fix — type coercion

**Before**:
```javascript
const user = users.find(u => u.id === userId);
```

**After**:
```javascript
const user = users.find(u => u.id === Number(userId));
```

**Explanation**: `req.params.id` is always a string in Express. The in-memory users array stores IDs as numbers. Wrapping `userId` in `Number()` converts "123" → 123 before the strict equality comparison, making the lookup work correctly.

## Verification

**Change verified**: YES — file was re-read after the edit and confirmed to contain `users.find(u => u.id === Number(userId))` on line 22. The bug comment lines were also removed as they described the now-fixed behaviour.

## Manual Verification Steps

To verify the fix works:
1. `cd /Users/vlad/IdeaProjects/aipcp/AI-Coding-Partner-Homework/homework-4/demo-bug-fix`
2. `npm install && npm start`
3. In another terminal: `curl -s http://localhost:3000/api/users/123`
4. Expected: `{"id":123,"name":"Alice Smith","email":"alice@example.com"}`
5. Test 404 for invalid ID: `curl -s http://localhost:3000/api/users/999`
6. Expected: `{"error":"User not found"}`
