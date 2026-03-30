# How to Run — Multi-Agent Banking Pipeline

## Prerequisites

- Python 3.11 or later
- `pip` package manager

---

## 1. Install dependencies

```bash
cd homework-6
pip install -r requirements.txt
```

---

## 2. Run the full pipeline

```bash
python integrator.py
```

This processes all 8 transactions in `sample-transactions.json` and:
- Creates `shared/input/`, `shared/processing/`, `shared/output/`, `shared/results/`
- Writes one result JSON per transaction to `shared/results/`
- Appends every agent event to `shared/audit.log`
- Prints a summary table to stdout

To use a different input file:
```bash
python integrator.py path/to/transactions.json
```

---

## 3. Validate transactions only (dry-run)

```bash
python agents/transaction_validator.py --dry-run --input sample-transactions.json
```

Prints a summary table without writing any files. Use this to quickly check an input file before running the full pipeline.

---

## 4. Run tests

```bash
pytest
```

Coverage is reported automatically against `agents/` and `integrator.py`. A full summary table is printed at the end.

To run with an explicit coverage threshold:
```bash
pytest --cov-fail-under=90
```

---

## 5. Query results via MCP server

Start the custom MCP server:
```bash
python mcp/server.py
```

Once running, MCP clients can call:
- `get_transaction_status("TXN001")` — look up one result
- `list_pipeline_results()` — summary of all results
- Read resource `pipeline://summary` — plain-text report

Both servers (context7 + pipeline-status) are configured in `mcp.json`.

---

## 6. Use slash commands (Claude Code)

Inside Claude Code with this project open:

| Command                    | What it does                                              |
|----------------------------|-----------------------------------------------------------|
| `/run-pipeline`            | Clears shared dirs and runs the full pipeline             |
| `/validate-transactions`   | Runs the validator in dry-run mode and shows a table      |
| `/write-spec`              | Re-generates `specification.md` from the template         |

---

## 7. Coverage gate hook

The pre-push gate in `.claude/settings.json` runs `scripts/coverage_gate.py` before any `git push` command. If coverage is below 80% the push is blocked:

```
[coverage-gate] Detected git push — running coverage check...
...
[coverage-gate] BLOCKED: Test coverage is below 80%. Fix tests before pushing.
```

---

## Expected output (sample run)

```
============================================================================
                            PIPELINE SUMMARY
============================================================================
TXN ID       STATUS          SETTLEMENT             RISK     REASON
----------------------------------------------------------------------------
TXN001       processed       SETTLED                LOW
TXN002       processed       SETTLED                MEDIUM
TXN003       processed       SETTLED                LOW
TXN004       processed       SETTLED                MEDIUM
TXN005       processed       HELD_FOR_REVIEW        HIGH
TXN006       rejected        -                      -        INVALID_CURRENCY
TXN007       rejected        -                      -        INVALID_AMOUNT
TXN008       processed       SETTLED                LOW
============================================================================
Settled: 5 | Held for Review: 1 | Rejected: 2 | Total: 8
```
