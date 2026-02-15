# Homework 3: Spending Caps & Budget Management System Specification

**Student:** Vladyslav Musiienko  
**Submission Date:** February 15, 2026

---

## 📋 Task Summary

Specification package (no implementation) for a personal spending caps and budget management system:
- [specification.md](specification.md) — High/mid/low-level objectives (1 high, 6 mid, 8 low-level tasks)
- [agents.md](agents.md) — AI guidelines: tech stack, domain rules, code style, testing, compliance
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — Editor rules for GitHub Copilot
- [README.md](README.md) — Rationale and best practices (this file)

**Feature:** Spending caps & budgeting (real-time tracking, threshold alerts, analytics)  
**Scope:** Medium — 6 API endpoints (budget CRUD, transaction processing, reporting)  
**Tech:** Node.js, TypeScript, Express.js (consistent with homework-1/2)

---

## 🎯 Rationale

**Why Spending Caps?**
- User need: Proactive expense control
- Compliance sweet spot: Real requirements (audit, GDPR, validation) without card issuance complexity
- Rich business logic: Threshold detection, period validation, currency handling

**Why Medium Scope?**
- Focused (6 endpoints, ~2 week implementation)
- Real-world constraints (Decimal arithmetic, compliance, testing)
- Extendable (push notifications, ML predictions, multi-currency)

**Architectural Choices:**
- **Layered (Routes → Controllers → Services → Storage)**: Separation of concerns, testability, matches homework-1/2
- **Decimal.js**: Binary floating-point (`0.1 + 0.2 ≠ 0.3`) unacceptable in finance; regulatory requirement
- **In-Memory Storage**: Specification focus (not production); faster tests

---

## 🏦 Industry Best Practices

| # | Practice | Location | Impact |
|---|----------|----------|--------|
| 1 | Decimal Arithmetic | spec Tasks 2-4, agents NEVER, copilot Money | `0.1+0.2≠0.3` accumulates errors. Auditors need penny accuracy. |
| 2 | PCI DSS Minimization | spec Security, agents Compliance | Mask cards (`****3456`). Avoids $50K-200K audit. |
| 3 | Audit Trails | spec Task 6, agents Logging | SOX/GDPR require tamper-proof logs. "Who changed X at Y time?" |
| 4 | GDPR Erasure | spec Obj 6 & Task 2, agents GDPR | Cascade delete. Fine: €20M or 4% revenue. |
| 5 | Input Validation | spec Task 5, agents ALWAYS | Prevents injection, exploits, currency confusion. |
| 6 | Rate Limiting | spec Task 8 | Blocks brute force/DoS. 100 req/min for humans. |
| 7 | ISO Standards | All files | ISO 4217 currencies, ISO 8601 timestamps prevent ambiguity. |
| 8 | Errors as Data | agents, copilot Architecture | Return `{error,code}`. Atomicity, i18n support. |
| 9 | Test Coverage >80% | spec Task 7, agents Testing | Decimal precision, thresholds, GDPR cascade, currency. |

---

## 📚 Specification Structure

**High → Mid → Low:** Executive summary (1) → Testable requirements (6) → Dev prompts (8 tasks, ~2-4hr each). Aligns with Agile Epic → Features → Tasks.

**Implementation Notes:** Cross-cutting concerns (security, logging, testing) stated once to avoid repetition.

**Context:** Beginning (empty dir + Node.js) → Ending (file structure, coverage, deliverables) = "Definition of Done"

---

## 🔄 Usage

**AI:** Read spec → Follow agents.md (constraints) → Apply copilot rules (patterns) → Execute tasks (models→services→controllers→tests) → Verify objectives

**Review:** Check completeness, verify practices (table above), assess feasibility

**v2 Features:** Push notifications, multi-currency, ML, PostgreSQL, JWT, OpenAPI, GraphQL

---

## 📦 Deliverables

- [x] [specification.md](specification.md) — 1 high, 6 mid, 8 low-level objectives
- [x] [agents.md](agents.md) — Domain rules, tech, architecture, security, testing  
- [x] [.github/copilot-instructions.md](.github/copilot-instructions.md) — Editor rules
- [x] [README.md](README.md) — Rationale & best practices

---

## ✅ Conclusion

Production-ready specification encoding fintech best practices into AI guidelines. Structured approach (High→Mid→Low + constraints) provides clarity for AI, traceability for review.

**Key:** Well-crafted spec = AI force multiplier. Clear constraints + domain knowledge = quality code, minimal iteration.

**Use:** Solo dev (AI assistants), team onboarding (understand "why"), compliance audits (due diligence)

<div align="center">

**Homework 3 Complete — Specification Ready** 🎯

</div>

</div>