"""Fraud Detector Agent.

Scores validated transactions for fraud risk using an additive point system:
  - amount > $10,000        → +3 points
  - amount > $50,000        → +4 additional points (cumulative with above)
  - hour 02:00–04:59 UTC    → +2 points (unusual transaction hours)
  - country != "US"         → +1 point  (cross-border transaction)

Risk levels:  LOW (0-2) | MEDIUM (3-6) | HIGH (7-10)
Score is capped at 10.
"""
import logging
from datetime import datetime, timezone
from decimal import Decimal

AGENT_NAME = "fraud_detector"

THRESHOLD_HIGH_VALUE = Decimal("10000")
THRESHOLD_VERY_HIGH_VALUE = Decimal("50000")
UNUSUAL_HOUR_START = 2
UNUSUAL_HOUR_END = 4  # inclusive: 2:00–4:59

logger = logging.getLogger(AGENT_NAME)


def _mask_account(account_id: str) -> str:
    if not account_id:
        return "***"
    parts = account_id.split("-", 1)
    return f"{parts[0]}-****" if len(parts) == 2 else "****"


class FraudDetector:
    """Calculates fraud risk scores for validated transactions."""

    def process_message(self, message: dict) -> dict:
        """Score a validated transaction for fraud risk.

        Returns envelope with fraud_risk_score (int) and fraud_risk_level (str)
        added to data, targeting settlement_processor.
        """
        data = message.get("data", {})
        txn_id = data.get("transaction_id", "UNKNOWN")
        src = _mask_account(data.get("source_account", ""))
        log_prefix = f"txn={txn_id} src={src}"

        score = self._calculate_score(data)
        risk_level = self._risk_level(score)

        logger.info(
            "%s | SCORED | score=%d level=%s", log_prefix, score, risk_level,
        )

        result = dict(message)
        result["source_agent"] = AGENT_NAME
        result["target_agent"] = "settlement_processor"
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        result["data"] = dict(data)
        result["data"]["fraud_risk_score"] = score
        result["data"]["fraud_risk_level"] = risk_level
        return result

    def _calculate_score(self, data: dict) -> int:
        score = 0

        # Amount-based scoring (use Decimal for precision)
        try:
            amount = Decimal(str(data.get("amount", "0")))
        except Exception:
            amount = Decimal("0")

        if amount > THRESHOLD_HIGH_VALUE:
            score += 3
        if amount > THRESHOLD_VERY_HIGH_VALUE:
            score += 4  # additional — cumulative with the +3 above

        # Unusual hours: 02:00–04:59 AM UTC
        timestamp = data.get("timestamp", "")
        try:
            dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            if UNUSUAL_HOUR_START <= dt.hour <= UNUSUAL_HOUR_END:
                score += 2
        except (ValueError, AttributeError):
            pass

        # Cross-border: country != "US"
        metadata = data.get("metadata", {})
        if metadata.get("country", "US") != "US":
            score += 1

        return min(score, 10)

    @staticmethod
    def _risk_level(score: int) -> str:
        if score <= 2:
            return "LOW"
        if score <= 6:
            return "MEDIUM"
        return "HIGH"
