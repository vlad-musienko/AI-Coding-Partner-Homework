# Specification: AI-Powered Multi-Agent Banking Pipeline

## 1. High-Level Objective

Build a 3-agent Python pipeline that validates, scores for fraud risk, and settles banking transactions using file-based JSON message passing.

## 2. Mid-Level Objectives

- Transactions with invalid currency codes (not in ISO 4217 whitelist) are rejected with reason `INVALID_CURRENCY`
- Transactions with non-positive amounts are rejected with reason `INVALID_AMOUNT`
- Transactions with missing required fields are rejected with reason `MISSING_FIELD`
- Transactions above $10,000 receive `fraud_risk_score >= 3`; above $50,000 receive `fraud_risk_score >= 7` (HIGH risk)
- Transactions at unusual hours (2:00–4:59 AM UTC) receive +2 fraud risk points
- Cross-border transactions (country != US) receive +1 fraud risk point
- HIGH-risk transactions are held for review; MEDIUM-risk are settled with a review flag; LOW-risk are settled normally
- All 8 sample transactions produce result files in `shared/results/` with final status
- All agent operations log to an audit trail with ISO 8601 timestamps and masked account numbers

## 3. Implementation Notes

- **Monetary calculations**: `decimal.Decimal` only, never `float`
- **Currency validation**: ISO 4217 whitelist — USD, EUR, GBP, JPY, CAD, CHF, AUD, CNY at minimum
- **Logging**: Audit trail with timestamp, agent name, transaction_id, and outcome written to `shared/audit.log`
- **PII**: Mask account numbers in all log output (e.g., `ACC-1001` → `ACC-****`)
- **Message format**: Standard JSON envelope with `message_id` (uuid4), `timestamp` (ISO 8601), `source_agent`, `target_agent`, `message_type`, and `data`
- **File naming**: `{transaction_id}.json` in each shared/ subdirectory
- **Error handling**: Agents must never crash on malformed input — reject with a reason instead
- **Decimal serialization**: Convert `Decimal` to `str` before JSON serialization

## 4. Context

- **Beginning state**: `sample-transactions.json` exists with 8 raw transaction records. No agents exist. No `shared/` directories exist.
- **Ending state**: All transactions processed. Results in `shared/results/` (8 JSON files). Test coverage >= 90%. README and HOWTORUN complete. MCP server queryable for transaction status.

## 5. Low-Level Tasks

### Task: Transaction Validator
**Prompt**: "Build a Transaction Validator agent in Python. It reads a JSON message envelope from the integrator, extracts transaction data, and validates: (1) all required fields are present (transaction_id, amount, currency, source_account, destination_account, timestamp), (2) amount is a positive Decimal, (3) currency is in an ISO 4217 whitelist. If valid, set status='validated' and target_agent='fraud_detector'. If invalid, set status='rejected' with a reason field and target_agent='results'. Use decimal.Decimal for all amount parsing. Mask account numbers in audit log entries. Support a --dry-run CLI flag that validates sample-transactions.json and prints a summary table without writing files."
**File to CREATE**: `agents/transaction_validator.py`
**Function to CREATE**: `process_message(self, message: dict) -> dict`
**Details**:
- Check required fields: transaction_id, amount, currency, source_account, destination_account, timestamp
- Parse amount with `decimal.Decimal` — reject on `InvalidOperation`
- Validate amount > 0 — reject with `INVALID_AMOUNT`
- Validate currency in whitelist — reject with `INVALID_CURRENCY`
- Return message envelope with updated status and target_agent

### Task: Fraud Detector
**Prompt**: "Build a Fraud Detector agent in Python. It receives validated transaction messages and calculates a fraud risk score (0–10 integer scale). Scoring rules: amount > $10,000 adds +3 points, amount > $50,000 adds +4 additional points, transaction timestamp between 2:00–4:59 AM UTC adds +2 points, cross-border transaction (metadata.country != 'US') adds +1 point. Risk levels: LOW (0–2), MEDIUM (3–6), HIGH (7–10). Add fraud_risk_score, fraud_risk_level to the message data. Set target_agent='settlement_processor'. Use decimal.Decimal for amount comparisons. Log operations with masked PII."
**File to CREATE**: `agents/fraud_detector.py`
**Function to CREATE**: `process_message(self, message: dict) -> dict`
**Details**:
- Only process messages with `status == "validated"`
- Calculate fraud risk score using additive point system
- Amount > $10,000: +3 points
- Amount > $50,000: +4 additional points (total +7 for amounts over $50K)
- Unusual hour (2:00–4:59 AM UTC): +2 points
- Cross-border (metadata.country != "US"): +1 point
- Cap score at 10
- Determine risk level: LOW (0–2), MEDIUM (3–6), HIGH (7–10)

### Task: Settlement Processor
**Prompt**: "Build a Settlement Processor agent in Python. It receives fraud-scored transaction messages and makes settlement decisions. If fraud_risk_level is HIGH, set settlement_status='HELD_FOR_REVIEW' and do not auto-settle. If MEDIUM, set settlement_status='SETTLED' with review_flag=True. If LOW, set settlement_status='SETTLED'. Add a settlement_timestamp (ISO 8601). Set status='processed' and target_agent='results'. Log operations with masked PII."
**File to CREATE**: `agents/settlement_processor.py`
**Function to CREATE**: `process_message(self, message: dict) -> dict`
**Details**:
- HIGH risk → `settlement_status = "HELD_FOR_REVIEW"`
- MEDIUM risk → `settlement_status = "SETTLED"`, `review_flag = True`
- LOW risk → `settlement_status = "SETTLED"`
- Add `settlement_timestamp` as ISO 8601 string
- Set final `status = "processed"` and `target_agent = "results"`

### Task: Integrator/Orchestrator
**Prompt**: "Build an integrator script that orchestrates the 3-agent pipeline. It creates shared/{input,processing,output,results} directories, loads sample-transactions.json, wraps each transaction in a standard message envelope, and runs them through TransactionValidator → FraudDetector → SettlementProcessor sequentially. Rejected transactions go directly to shared/results/. Print a summary at the end showing totals (settled, held, rejected) and per-transaction status. Expose a run_pipeline(input_path, shared_dir) function for testing."
**File to CREATE**: `integrator.py`
**Function to CREATE**: `run_pipeline(input_path: Path, shared_dir: Path) -> list[dict]`
**Details**:
- Create shared/ directory structure
- Load and wrap transactions in message envelopes
- Run 3-stage sequential pipeline
- Move files through input → processing → output → results
- Print summary report
