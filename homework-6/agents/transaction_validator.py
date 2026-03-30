"""Transaction Validator Agent.

Validates transaction message envelopes for:
- Required fields presence
- Positive Decimal amount
- ISO 4217 currency whitelist membership
"""
import argparse
import json
import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

AGENT_NAME = "transaction_validator"

VALID_CURRENCIES: frozenset = frozenset({
    "USD", "EUR", "GBP", "JPY", "CAD", "CHF", "AUD", "CNY",
    "SEK", "NOK", "DKK", "NZD", "SGD", "HKD", "MXN", "BRL",
    "INR", "KRW", "ZAR", "TRY",
})

REQUIRED_FIELDS = (
    "transaction_id",
    "amount",
    "currency",
    "source_account",
    "destination_account",
    "timestamp",
)

logger = logging.getLogger(AGENT_NAME)


def _mask_account(account_id: str) -> str:
    """Return a PII-safe masked version of an account identifier."""
    if not account_id:
        return "***"
    parts = account_id.split("-", 1)
    if len(parts) == 2:
        return f"{parts[0]}-****"
    return "****"


class TransactionValidator:
    """Validates transaction message envelopes."""

    def process_message(self, message: dict) -> dict:
        """Validate a transaction and return an updated message envelope.

        Returns envelope with status='validated' targeting fraud_detector,
        or status='rejected' with rejection_reason targeting results.
        """
        data = message.get("data", {})
        txn_id = data.get("transaction_id", "UNKNOWN")
        src = _mask_account(data.get("source_account", ""))
        dst = _mask_account(data.get("destination_account", ""))
        log_prefix = f"txn={txn_id} src={src} dst={dst}"

        # 1. Required fields
        for field in REQUIRED_FIELDS:
            value = data.get(field)
            if value is None or value == "":
                logger.info(
                    "%s | REJECTED | reason=MISSING_FIELD field=%s",
                    log_prefix, field,
                )
                return self._build_result(
                    message, "rejected", "results",
                    rejection_reason="MISSING_FIELD",
                    rejection_detail=f"Missing required field: {field}",
                )

        # 2. Amount must be a positive Decimal
        try:
            amount = Decimal(str(data["amount"]))
        except InvalidOperation:
            logger.info("%s | REJECTED | reason=INVALID_AMOUNT", log_prefix)
            return self._build_result(
                message, "rejected", "results",
                rejection_reason="INVALID_AMOUNT",
                rejection_detail="Amount is not a valid decimal number",
            )

        if amount <= 0:
            logger.info(
                "%s | REJECTED | reason=INVALID_AMOUNT amount=%s",
                log_prefix, amount,
            )
            return self._build_result(
                message, "rejected", "results",
                rejection_reason="INVALID_AMOUNT",
                rejection_detail=f"Amount must be positive, got {amount}",
            )

        # 3. Currency must be in ISO 4217 whitelist
        currency = str(data.get("currency", "")).strip().upper()
        if currency not in VALID_CURRENCIES:
            logger.info(
                "%s | REJECTED | reason=INVALID_CURRENCY currency=%s",
                log_prefix, currency,
            )
            return self._build_result(
                message, "rejected", "results",
                rejection_reason="INVALID_CURRENCY",
                rejection_detail=f"Currency '{currency}' is not in the ISO 4217 whitelist",
            )

        logger.info(
            "%s | VALIDATED | amount=%s currency=%s", log_prefix, amount, currency,
        )
        return self._build_result(
            message, "validated", "fraud_detector",
            amount=str(amount),
        )

    def _build_result(
        self,
        message: dict,
        status: str,
        target_agent: str,
        **data_overrides,
    ) -> dict:
        result = dict(message)
        result["source_agent"] = AGENT_NAME
        result["target_agent"] = target_agent
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        result["data"] = dict(message.get("data", {}))
        result["data"]["status"] = status
        result["data"].update(data_overrides)
        return result


def _dry_run(input_path: Path) -> None:
    """Validate transactions in dry-run mode and print a summary table."""
    with open(input_path) as f:
        transactions = json.load(f)

    validator = TransactionValidator()
    rows = []
    for txn in transactions:
        message = {
            "message_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_agent": "integrator",
            "target_agent": AGENT_NAME,
            "message_type": "transaction",
            "data": txn,
        }
        result = validator.process_message(message)
        d = result["data"]
        rows.append((
            d.get("transaction_id", "?"),
            d["status"],
            d.get("rejection_reason", ""),
        ))

    valid_count = sum(1 for _, s, _ in rows if s == "validated")
    invalid_count = len(rows) - valid_count

    print(f"\n{'='*60}")
    print(f"{'Transaction Validation Dry Run':^60}")
    print(f"{'='*60}")
    print(f"{'TXN ID':<12} {'STATUS':<15} REASON")
    print("-" * 60)
    for txn_id, status, reason in rows:
        print(f"{txn_id:<12} {status:<15} {reason}")
    print("=" * 60)
    print(f"Total: {len(rows)} | Valid: {valid_count} | Invalid: {invalid_count}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    parser = argparse.ArgumentParser(description="Transaction Validator Agent")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate transactions without writing files")
    parser.add_argument("--input", default="sample-transactions.json",
                        help="Input transaction JSON file")
    args = parser.parse_args()

    if args.dry_run:
        _dry_run(Path(args.input))
