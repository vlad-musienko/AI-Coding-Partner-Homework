# AI-Powered Multi-Agent Banking Pipeline

**Created by: Vladyslav Musienko**

A Python pipeline that validates, scores for fraud risk, and settles banking transactions using a file-based JSON message protocol. Four cooperating agents process every transaction from raw input to a final audited result.

---

## What it does

The pipeline reads a batch of raw transactions from `sample-transactions.json`, validates each one for required fields, correct amounts, and ISO 4217 currencies, scores them for fraud risk using configurable rules, and then makes a settlement decision. Rejected and held transactions are flagged with machine-readable reasons. Every agent operation is written to an audit log with ISO 8601 timestamps and masked account numbers.

All agents communicate through a shared directory structure (`shared/`), passing standard JSON message envelopes between stages. A custom FastMCP server makes the results queryable over the Model Context Protocol.

---

## Agent responsibilities

- **Transaction Validator** — checks required fields, validates that amounts are positive `Decimal` values, and confirms currencies against an ISO 4217 whitelist. Rejected transactions are written directly to `shared/results/`.
- **Fraud Detector** — scores validated transactions 0–10 using additive rules (high-value amount, unusual hours, cross-border) and assigns a risk level (LOW / MEDIUM / HIGH).
- **Settlement Processor** — makes settlement decisions based on risk level: HIGH → HELD_FOR_REVIEW, MEDIUM → SETTLED with review flag, LOW → SETTLED.
- **Integrator** — orchestrates the pipeline, manages `shared/` directories, and prints a summary report.

---

## Architecture

```
sample-transactions.json
         │
   [Integrator]
    creates shared/ dirs
    wraps txns in message envelopes
         │
   shared/input/{txn}.json
         │
   [Transaction Validator]
         │
         ├── REJECTED ──────────────► shared/results/{txn}.json
         │
   shared/output/{txn}.json
         │
   [Fraud Detector]
    scores 0-10 → LOW / MEDIUM / HIGH
         │
   shared/output/{txn}.json
         │
   [Settlement Processor]
    HIGH → HELD_FOR_REVIEW
    MEDIUM → SETTLED + review_flag
    LOW → SETTLED
         │
   shared/results/{txn}.json
         │
   shared/audit.log  (all agent events, masked PII)
```

---

## Tech stack

| Technology     | Purpose                                 |
|----------------|-----------------------------------------|
| Python 3.11+   | Runtime                                 |
| decimal.Decimal| Monetary arithmetic (never float)       |
| pathlib.Path   | File-system operations                  |
| uuid4          | Message ID generation                   |
| logging        | Audit trail (ISO 8601, masked PII)      |
| FastMCP        | Custom MCP server for pipeline queries  |
| pytest         | Unit and integration testing            |
| pytest-cov     | Coverage measurement (gate ≥ 80%)       |

---

## Quick start

```bash
pip install -r requirements.txt
python integrator.py
```

See [HOWTORUN.md](HOWTORUN.md) for full step-by-step instructions.

---

## Running tests

```bash
pytest
```

The coverage report is printed automatically. The pre-push hook blocks pushes when coverage drops below 80%.

---

## MCP server

```bash
python mcp/server.py
```

Exposes `get_transaction_status`, `list_pipeline_results` tools and a `pipeline://summary` resource. Configure both context7 and this server in `mcp.json`.
