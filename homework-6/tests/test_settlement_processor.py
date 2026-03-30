"""Unit tests for Settlement Processor agent."""
import pytest
from datetime import datetime

from agents.settlement_processor import SettlementProcessor


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _msg(transaction: dict) -> dict:
    return {
        "message_id": "test-uuid-1234",
        "timestamp": "2026-03-16T09:00:00+00:00",
        "source_agent": "fraud_detector",
        "target_agent": "settlement_processor",
        "message_type": "transaction",
        "data": dict(transaction),
    }


def _scored_txn(risk_level: str = "LOW", **overrides) -> dict:
    base = {
        "transaction_id": "TXN001",
        "amount": "1500.00",
        "currency": "USD",
        "source_account": "ACC-1001",
        "destination_account": "ACC-2001",
        "timestamp": "2026-03-16T09:00:00Z",
        "status": "validated",
        "fraud_risk_score": 0,
        "fraud_risk_level": risk_level,
        "metadata": {"channel": "online", "country": "US"},
    }
    base.update(overrides)
    return base


@pytest.fixture
def processor():
    return SettlementProcessor()


# ---------------------------------------------------------------------------
# SettlementProcessor.process_message — settlement decisions
# ---------------------------------------------------------------------------

class TestSettlementDecisions:
    def test_low_risk_settled_no_review(self, processor):
        result = processor.process_message(_msg(_scored_txn("LOW")))
        data = result["data"]
        assert data["settlement_status"] == "SETTLED"
        assert data["review_flag"] is False

    def test_medium_risk_settled_with_review(self, processor):
        result = processor.process_message(_msg(_scored_txn("MEDIUM")))
        data = result["data"]
        assert data["settlement_status"] == "SETTLED"
        assert data["review_flag"] is True

    def test_high_risk_held_for_review(self, processor):
        result = processor.process_message(_msg(_scored_txn("HIGH")))
        data = result["data"]
        assert data["settlement_status"] == "HELD_FOR_REVIEW"
        assert data["review_flag"] is False

    def test_unknown_risk_defaults_to_settled(self, processor):
        result = processor.process_message(_msg(_scored_txn("UNKNOWN")))
        assert result["data"]["settlement_status"] == "SETTLED"


# ---------------------------------------------------------------------------
# SettlementProcessor.process_message — envelope fields
# ---------------------------------------------------------------------------

class TestSettlementEnvelope:
    def test_status_is_processed(self, processor):
        result = processor.process_message(_msg(_scored_txn("LOW")))
        assert result["data"]["status"] == "processed"

    def test_target_agent_is_results(self, processor):
        result = processor.process_message(_msg(_scored_txn("LOW")))
        assert result["target_agent"] == "results"
        assert result["source_agent"] == "settlement_processor"

    def test_settlement_timestamp_is_iso8601(self, processor):
        result = processor.process_message(_msg(_scored_txn("LOW")))
        ts = result["data"]["settlement_timestamp"]
        dt = datetime.fromisoformat(ts)  # raises if not ISO 8601
        assert dt is not None

    def test_original_fields_preserved(self, processor):
        result = processor.process_message(_msg(_scored_txn("LOW")))
        assert result["data"]["transaction_id"] == "TXN001"
        assert result["data"]["amount"] == "1500.00"

    def test_fraud_score_preserved(self, processor):
        result = processor.process_message(_msg(_scored_txn("MEDIUM", fraud_risk_score=3)))
        assert result["data"]["fraud_risk_score"] == 3


# ---------------------------------------------------------------------------
# SettlementProcessor._decide_settlement — static logic
# ---------------------------------------------------------------------------

class TestDecideSettlement:
    def test_low_returns_settled_no_flag(self, processor):
        assert processor._decide_settlement("LOW") == ("SETTLED", False)

    def test_medium_returns_settled_with_flag(self, processor):
        assert processor._decide_settlement("MEDIUM") == ("SETTLED", True)

    def test_high_returns_held(self, processor):
        assert processor._decide_settlement("HIGH") == ("HELD_FOR_REVIEW", False)
