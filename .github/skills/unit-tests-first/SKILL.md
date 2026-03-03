---
name: unit-tests-first
description: >
  Defines the FIRST principles for unit testing. Use when generating,
  reviewing, or validating unit tests to ensure they meet quality standards.
  Apply to every test file before marking tests as complete.
---

# Unit Test FIRST Principles Skill

## Purpose

This skill defines the **FIRST** principles — the five properties that every
good unit test must satisfy. Any agent that generates unit tests **must** apply
this checklist to every test it writes.

## The FIRST Principles

| Letter | Principle | Definition |
|--------|-----------|------------|
| **F** | **Fast** | The test completes in milliseconds. Slow tests discourage frequent runs. |
| **I** | **Independent** | The test does not depend on other tests or on external state. Each test can run alone or in any order. |
| **R** | **Repeatable** | The test produces the same result in every environment and every time it runs. |
| **S** | **Self-validating** | The test clearly passes or fails without manual inspection of output. |
| **T** | **Timely** | The test is written to cover the code that changed — no more, no less. |

---

## Principle Details & Rules

### F — Fast

- Each test must execute in **< 100 ms**.
- **Forbidden in unit tests**: real HTTP calls, real database queries, real file I/O,
  `setTimeout` / `sleep` with real delays.
- **Required**: mock or stub all external dependencies (HTTP clients, DB drivers,
  file system, timers).

### I — Independent

- Tests must **not share mutable state**. Use `beforeEach` / `afterEach` to
  reset state.
- A test must **not rely on the output or side-effect of another test** running first.
- Tests must be able to run in **any order** and produce the same result.
- Use fresh instances/copies of test data in each test.

### R — Repeatable

- Tests must produce the **same pass/fail outcome** on any machine, CI server,
  or local developer environment.
- **Forbidden**: relying on the current date/time (use mocked clocks), random
  numbers (use seeds or mocks), or environment variables that differ per machine.
- Use deterministic input data only.

### S — Self-validating

- Every test must end with at least one **assertion** (`expect`, `assert`, etc.)
  that clearly indicates pass or fail.
- **Forbidden**: tests that only `console.log` output and rely on a human to
  decide if it is correct.
- Assertion messages should be descriptive enough to diagnose a failure without
  reading the test body.

### T — Timely

- Tests must cover **only the code that was changed** in the current fix.
- Do **not** write tests for unrelated code.
- Write tests that would have **caught the bug** that was just fixed (regression
  tests).
- Prefer narrow, focused tests over broad integration tests.

---

## Compliance Checklist

Apply this checklist to **every individual test**:

```
Test: [test name]
- [ ] F — Fast: executes in < 100 ms, no real I/O or network calls
- [ ] I — Independent: no shared mutable state, can run alone in any order
- [ ] R — Repeatable: deterministic; same result on all environments
- [ ] S — Self-validating: uses assertions (expect/assert), not console.log
- [ ] T — Timely: covers only the changed code / regression for the fixed bug
```

---

## Required Test Cases for a Bug Fix

When generating tests for a bug fix, always include:

1. **Regression test** — Confirm the exact scenario that was broken now works.
2. **Boundary / edge cases** — Test inputs at the boundaries of the fix
   (e.g., if the fix converts a string to a number, test `"0"`, negative
   strings, non-numeric strings, `undefined`).
3. **Happy path** — Confirm existing correct behaviour still works.
4. **Error path** — Confirm error handling still returns the correct error
   response for truly invalid input.

---

## Step-by-Step Instructions for Agents

1. **Read the fix summary** — Understand exactly which function/line was changed.
2. **Identify the changed function(s)** — These are the only functions to test.
3. **Draft test cases** using the four categories above (regression, boundary,
   happy path, error path).
4. **Apply the FIRST checklist** to each drafted test. Revise if any item fails.
5. **Write the final test file** using the project's existing test framework.
6. **Run the tests** and record pass/fail for each.
7. **In `test-report.md`**, include the FIRST compliance table for each test.

---

## FIRST Compliance Table (for test-report.md)

```markdown
| Test Name | Fast | Independent | Repeatable | Self-validating | Timely |
|-----------|------|-------------|------------|-----------------|--------|
| [name]    | ✅   | ✅          | ✅         | ✅              | ✅     |
```
