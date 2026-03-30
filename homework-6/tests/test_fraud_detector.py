"""Unit tests for Fraud Detector agent."""
import pytest

from agents.fraud_detector import FraudDetector


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _msg(transaction: dict) -> dict:
    return {
        "message_id": "test-uuid-1234",
        "timestamp": "2026-03-16T09:00:00+00:00",
        "source_agent": "transaction_validator",
        "target_agent": "fraud_detector",
        "message_type": "transaction",
        "data": dict(transaction),
    }


def _validated_txn(**overrides) -> dict:
    base = {
        "transaction_id": "TXN001",
        "amount": "1500.00",
        "currency": "USD",
        "source_account": "ACC-1001",
        "destination_account": "ACC-2001",
        "timestamp": "2026-03-16T09:00:00Z",
        "status": "validated",
        "metadata": {"channel": "online", "country": "US"},
    }
    base.update(overrides)
    return base


@pytest.fixture
def detector():
    return FraudDetector()


# ---------------------------------------------------------------------------
# FraudDetector.process_message — envelope structure
# ---------------------------------------------------------------------------

class TestFraudDetectorEnvelope:
    def test_target_agent_is_settlement_processor(self, detector):
        result = detector.process_message(_msg(_validated_txn()))
        assert result["target_agent"] == "settlement_processor"
        assert result["source_agent"] == "fraud_detector"

    def test_fraud_score_in_data(self, detector):
        result = detector.process_message(_msg(_validated_txn()))
        assert "fraud_risk_score" in result["data"]

    def test_fraud_level_in_data(self, detector):
        result = detector.process_message(_msg(_validated_txn()))
        assert "fraud_risk_level" in result["data"]


# ---------------------------------------------------------------------------
# FraudDetector — amount-based scoring rules
# ---------------------------------------------------------------------------

class TestAmountScoring:
    def test_below_10k_no_amount_points(self, detector):
        result = detector.process_message(_msg(_validated_txn(amount="9999.99")))
        assert result["data"]["fraud_risk_score"] == 0
        assert result["data"]["fraud_risk_level"] == "LOW"

    def test_exactly_10k_no_points(self, detector):
        # threshold is strictly >, so $10,000 earns 0 amount points
        result = detector.process_message(_msg(_validated_txn(amount="10000.00")))
        assert result["data"]["fraud_risk_score"] == 0

    def test_above_10k_earns_3_points(self, detector):
        result = detector.process_message(_msg(_validated_txn(amount="25000.00")))
        assert result["data"]["fraud_risk_score"] == 3
        assert result["data"]["fraud_risk_level"] == "MEDIUM"

    def test_above_50k_earns_7_points(self, detector):
        # >$50K → +3 (high) + +4 (very high) = 7
        result = detector.process_message(_msg(_validated_txn(amount="75000.00")))
        assert result["data"]["fraud_risk_score"] == 7
        assert result["data"]["fraud_risk_level"] == "HIGH"

    def test_exactly_50k_earns_3_points(self, detector):
        # $50,000 is NOT > 50K, only the >$10K rule fires
        result = detector.process_message(_msg(_validated_txn(amount="50000.00")))
        assert result["data"]["fraud_risk_score"] == 3


# ---------------------------------------------------------------------------
# FraudDetector — unusual hour scoring
# ---------------------------------------------------------------------------

class TestUnusualHourScoring:
    def test_hour_2_earns_2_points(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(timestamp="2026-03-16T02:00:00Z"))
        )
        assert result["data"]["fraud_risk_score"] == 2

    def test_hour_247_earns_2_points(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(timestamp="2026-03-16T02:47:00Z"))
        )
        assert result["data"]["fraud_risk_score"] == 2

    def test_hour_4_earns_2_points(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(timestamp="2026-03-16T04:00:00Z"))
        )
        assert result["data"]["fraud_risk_score"] == 2

    def test_hour_459_earns_2_points(self, detector):
        # 04:59 is still within unusual window
        result = detector.process_message(
            _msg(_validated_txn(timestamp="2026-03-16T04:59:00Z"))
        )
        assert result["data"]["fraud_risk_score"] == 2

    def test_hour_5_is_not_unusual(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(timestamp="2026-03-16T05:00:00Z"))
        )
        assert result["data"]["fraud_risk_score"] == 0

    def test_hour_1_is_not_unusual(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(timestamp="2026-03-16T01:59:00Z"))
        )
        assert result["data"]["fraud_risk_score"] == 0


# ---------------------------------------------------------------------------
# FraudDetector — cross-border scoring
# ---------------------------------------------------------------------------

class TestCrossBorderScoring:
    def test_domestic_us_no_points(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(metadata={"country": "US"}))
        )
        assert result["data"]["fraud_risk_score"] == 0

    def test_cross_border_germany_earns_1_point(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(metadata={"channel": "api", "country": "DE"}))
        )
        assert result["data"]["fraud_risk_score"] == 1

    def test_cross_border_gb_earns_1_point(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(metadata={"country": "GB"}))
        )
        assert result["data"]["fraud_risk_score"] == 1


# ---------------------------------------------------------------------------
# FraudDetector — combined scenarios (sample transactions)
# ---------------------------------------------------------------------------

class TestCombinedScenarios:
    def test_txn004_medium_risk(self, detector):
        """TXN004: EUR 500, Germany, 02:47 → unusual hour (+2) + cross-border (+1) = 3 MEDIUM."""
        result = detector.process_message(
            _msg(_validated_txn(
                transaction_id="TXN004",
                amount="500.00",
                currency="EUR",
                timestamp="2026-03-16T02:47:00Z",
                metadata={"channel": "api", "country": "DE"},
            ))
        )
        assert result["data"]["fraud_risk_score"] == 3
        assert result["data"]["fraud_risk_level"] == "MEDIUM"

    def test_txn005_high_risk(self, detector):
        """TXN005: $75,000 → +3 + +4 = 7 HIGH."""
        result = detector.process_message(
            _msg(_validated_txn(
                transaction_id="TXN005",
                amount="75000.00",
            ))
        )
        assert result["data"]["fraud_risk_score"] == 7
        assert result["data"]["fraud_risk_level"] == "HIGH"

    def test_score_capped_at_10(self, detector):
        result = detector.process_message(
            _msg(_validated_txn(
                amount="100000.00",
                timestamp="2026-03-16T02:00:00Z",
                metadata={"country": "DE"},
            ))
        )
        # +3 + +4 + +2 + +1 = 10
        assert result["data"]["fraud_risk_score"] == 10

    def test_score_cannot_exceed_10(self, detector):
        # Even with all triggers the cap holds
        result = detector.process_message(
            _msg(_validated_txn(
                amount="999999.00",
                timestamp="2026-03-16T02:00:00Z",
                metadata={"country": "CN"},
            ))
        )
        assert result["data"]["fraud_risk_score"] <= 10


# ---------------------------------------------------------------------------
# FraudDetector — edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_invalid_timestamp_no_crash(self, detector):
        result = detector.process_message(_msg(_validated_txn(timestamp="not-a-date")))
        assert "fraud_risk_score" in result["data"]

    def test_missing_metadata_defaults_to_us(self, detector):
        txn = _validated_txn()
        del txn["metadata"]
        result = detector.process_message(_msg(txn))
        assert result["data"]["fraud_risk_score"] == 0

    def test_malformed_amount_scores_zero(self, detector):
        # Validator should have caught this, but fraud detector must not crash
        result = detector.process_message(_msg(_validated_txn(amount="not-a-number")))
        assert isinstance(result["data"]["fraud_risk_score"], int)

    @pytest.mark.parametrize("score,expected", [
        (0, "LOW"), (1, "LOW"), (2, "LOW"),
        (3, "MEDIUM"), (4, "MEDIUM"), (6, "MEDIUM"),
        (7, "HIGH"), (9, "HIGH"), (10, "HIGH"),
    ])
    def test_risk_level_boundaries(self, detector, score, expected):
        assert detector._risk_level(score) == expected
