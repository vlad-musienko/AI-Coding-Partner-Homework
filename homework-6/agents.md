# Agents Configuration — Multi-Agent Banking Pipeline

## Tech Stack

| Technology | Purpose |
|---|---|
| Python 3.11+ | Runtime |
| decimal.Decimal | Monetary arithmetic (never float) |
| pytest + pytest-cov | Testing and coverage |
| FastMCP | Custom MCP server |
| pathlib.Path | File system operations |
| uuid4 | Message ID generation |
| logging | Audit trail |

## Banking Domain Rules

- **NEVER** use `float` for monetary values — always `decimal.Decimal`
- **NEVER** log plaintext account numbers — always mask PII (e.g., `ACC-1001` → `ACC-****`)
- **ALWAYS** validate currency codes against ISO 4217 whitelist
- **ALWAYS** include ISO 8601 timestamps in audit log entries
- **ALWAYS** include `transaction_id` and `agent_name` in every log entry

## Architecture

```
sample-transactions.json
        │
   [Integrator]
        │
   shared/input/
        │
   [Transaction Validator] ──rejected──► shared/results/
        │
   shared/output/
        │
   [Fraud Detector]
        │
   shared/output/
        │
   [Settlement Processor]
        │
   shared/results/
```

### Agent Communication Protocol

Agents communicate via JSON files in shared directories:
- `shared/input/` — Integrator drops initial messages
- `shared/processing/` — Agent moves message here while working
- `shared/output/` — Agent writes result for next agent
- `shared/results/` — Final outcomes

### Standard Message Envelope

```json
{
  "message_id": "uuid4-string",
  "timestamp": "ISO-8601",
  "source_agent": "agent_name",
  "target_agent": "next_agent_name",
  "message_type": "transaction",
  "data": { ... }
}
```

## Code Style

- snake_case for functions and variables
- PascalCase for classes
- Type hints on all public functions
- No global mutable state
- Each agent is a class inheriting from `BaseAgent`

## Testing Strategy

- **Minimum coverage**: 80% (hook-enforced gate)
- **Target coverage**: 90%+
- **Isolation**: All tests use `tmp_path` — never touch real `shared/` directory
- **Unit tests**: One test file per agent
- **Integration test**: Full pipeline end-to-end with all 8 transactions
