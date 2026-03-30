"""Settlement Processor Agent.

Makes settlement decisions based on fraud risk level:
  - HIGH   → HELD_FOR_REVIEW     (no auto-settlement)
  - MEDIUM → SETTLED + review_flag=True
  - LOW    → SETTLED
"""
import logging
from datetime import datetime, timezone

AGENT_NAME = "settlement_processor"

logger = logging.getLogger(AGENT_NAME)


def _mask_account(account_id: str) -> str:
    if not account_id:
        return "***"
    parts = account_id.split("-", 1)
    return f"{parts[0]}-****" if len(parts) == 2 else "****"


class SettlementProcessor:
    """Processes validated, fraud-scored transactions for settlement."""

    def process_message(self, message: dict) -> dict:
        """Decide settlement outcome based on fraud risk level.

        Returns envelope with settlement_status, review_flag, settlement_timestamp,
        and status='processed', targeting results.
        """
        data = message.get("data", {})
        txn_id = data.get("transaction_id", "UNKNOWN")
        src = _mask_account(data.get("source_account", ""))
        risk_level = data.get("fraud_risk_level", "LOW")
        log_prefix = f"txn={txn_id} src={src}"

        settlement_status, review_flag = self._decide_settlement(risk_level)

        logger.info(
            "%s | SETTLEMENT | risk=%s status=%s review_flag=%s",
            log_prefix, risk_level, settlement_status, review_flag,
        )

        result = dict(message)
        result["source_agent"] = AGENT_NAME
        result["target_agent"] = "results"
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        result["data"] = dict(data)
        result["data"]["settlement_status"] = settlement_status
        result["data"]["review_flag"] = review_flag
        result["data"]["settlement_timestamp"] = datetime.now(timezone.utc).isoformat()
        result["data"]["status"] = "processed"
        return result

    @staticmethod
    def _decide_settlement(risk_level: str) -> tuple:
        if risk_level == "HIGH":
            return "HELD_FOR_REVIEW", False
        if risk_level == "MEDIUM":
            return "SETTLED", True
        return "SETTLED", False
