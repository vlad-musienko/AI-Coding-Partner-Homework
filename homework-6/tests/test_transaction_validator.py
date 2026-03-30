"""Unit tests for Transaction Validator agent."""
import json
import pytest
from pathlib import Path

from agents.transaction_validator import (
    VALID_CURRENCIES,
    TransactionValidator,
    _dry_run,
    _mask_account,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _msg(transaction: dict) -> dict:
    return {
        "message_id": "test-uuid-1234",
        "timestamp": "2026-03-16T09:00:00+00:00",
        "source_agent": "integrator",
        "target_agent": "transaction_validator",
        "message_type": "transaction",
        "data": dict(transaction),
    }


def _valid_txn(**overrides) -> dict:
    base = {
        "transaction_id": "TXN001",
        "amount": "1500.00",
        "currency": "USD",
        "source_account": "ACC-1001",
        "destination_account": "ACC-2001",
        "timestamp": "2026-03-16T09:00:00Z",
        "metadata": {"channel": "online", "country": "US"},
    }
    base.update(overrides)
    return base


@pytest.fixture
def validator():
    return TransactionValidator()


# ---------------------------------------------------------------------------
# _mask_account
# ---------------------------------------------------------------------------

class TestMaskAccount:
    def test_standard_account(self):
        assert _mask_account("ACC-1001") == "ACC-****"

    def test_no_dash_returns_stars(self):
        assert _mask_account("ACCOUNT1001") == "****"

    def test_empty_string_returns_stars(self):
        assert _mask_account("") == "***"

    def test_multiple_dashes_only_first_split(self):
        # split("-", 1) → ["ACC", "1001-EXTRA"]
        assert _mask_account("ACC-1001-EXTRA") == "ACC-****"

    def test_single_char_no_dash(self):
        assert _mask_account("X") == "****"


# ---------------------------------------------------------------------------
# TransactionValidator.process_message — happy paths
# ---------------------------------------------------------------------------

class TestTransactionValidatorHappyPath:
    def test_valid_usd_transaction(self, validator):
        result = validator.process_message(_msg(_valid_txn()))
        assert result["data"]["status"] == "validated"
        assert result["target_agent"] == "fraud_detector"
        assert result["source_agent"] == "transaction_validator"

    def test_valid_eur_transaction(self, validator):
        result = validator.process_message(_msg(_valid_txn(currency="EUR")))
        assert result["data"]["status"] == "validated"

    def test_valid_gbp_transaction(self, validator):
        result = validator.process_message(_msg(_valid_txn(currency="GBP")))
        assert result["data"]["status"] == "validated"

    def test_amount_preserved_as_string(self, validator):
        result = validator.process_message(_msg(_valid_txn(amount="9999.99")))
        assert result["data"]["amount"] == "9999.99"

    def test_timestamp_updated_in_result(self, validator):
        result = validator.process_message(_msg(_valid_txn()))
        assert result["timestamp"]  # non-empty ISO 8601

    @pytest.mark.parametrize("currency", sorted(VALID_CURRENCIES))
    def test_all_whitelisted_currencies_pass(self, validator, currency):
        result = validator.process_message(_msg(_valid_txn(currency=currency)))
        assert result["data"]["status"] == "validated"


# ---------------------------------------------------------------------------
# TransactionValidator.process_message — missing field rejections
# ---------------------------------------------------------------------------

class TestMissingFieldRejections:
    @pytest.mark.parametrize("field", [
        "transaction_id", "amount", "currency",
        "source_account", "destination_account", "timestamp",
    ])
    def test_missing_field_rejected(self, validator, field):
        txn = _valid_txn()
        del txn[field]
        result = validator.process_message(_msg(txn))
        assert result["data"]["status"] == "rejected"
        assert result["data"]["rejection_reason"] == "MISSING_FIELD"
        assert result["target_agent"] == "results"

    def test_none_transaction_id_rejected(self, validator):
        result = validator.process_message(_msg(_valid_txn(transaction_id=None)))
        assert result["data"]["status"] == "rejected"
        assert result["data"]["rejection_reason"] == "MISSING_FIELD"

    def test_empty_string_transaction_id_rejected(self, validator):
        result = validator.process_message(_msg(_valid_txn(transaction_id="")))
        assert result["data"]["status"] == "rejected"
        assert result["data"]["rejection_reason"] == "MISSING_FIELD"


# ---------------------------------------------------------------------------
# TransactionValidator.process_message — amount validations
# ---------------------------------------------------------------------------

class TestAmountValidation:
    def test_negative_amount_rejected(self, validator):
        result = validator.process_message(_msg(_valid_txn(amount="-100.00")))
        assert result["data"]["status"] == "rejected"
        assert result["data"]["rejection_reason"] == "INVALID_AMOUNT"

    def test_zero_amount_rejected(self, validator):
        result = validator.process_message(_msg(_valid_txn(amount="0")))
        assert result["data"]["status"] == "rejected"
        assert result["data"]["rejection_reason"] == "INVALID_AMOUNT"

    def test_non_numeric_amount_rejected(self, validator):
        result = validator.process_message(_msg(_valid_txn(amount="abc")))
        assert result["data"]["status"] == "rejected"
        assert result["data"]["rejection_reason"] == "INVALID_AMOUNT"

    def test_large_valid_amount(self, validator):
        result = validator.process_message(_msg(_valid_txn(amount="75000.00")))
        assert result["data"]["status"] == "validated"


# ---------------------------------------------------------------------------
# TransactionValidator.process_message — currency validations
# ---------------------------------------------------------------------------

class TestCurrencyValidation:
    def test_invalid_currency_rejected(self, validator):
        result = validator.process_message(_msg(_valid_txn(currency="XYZ")))
        assert result["data"]["status"] == "rejected"
        assert result["data"]["rejection_reason"] == "INVALID_CURRENCY"

    def test_rejected_currency_targets_results(self, validator):
        result = validator.process_message(_msg(_valid_txn(currency="XYZ")))
        assert result["target_agent"] == "results"

    def test_lowercase_currency_accepted(self, validator):
        # Currency matching is case-insensitive (normalised to upper)
        result = validator.process_message(_msg(_valid_txn(currency="usd")))
        assert result["data"]["status"] == "validated"


# ---------------------------------------------------------------------------
# _dry_run
# ---------------------------------------------------------------------------

class TestDryRun:
    @pytest.fixture
    def sample_path(self):
        return Path(__file__).parent.parent / "sample-transactions.json"

    @pytest.fixture
    def minimal_input(self, tmp_path):
        data = [
            {
                "transaction_id": "T001",
                "amount": "100.00",
                "currency": "USD",
                "source_account": "ACC-1",
                "destination_account": "ACC-2",
                "timestamp": "2026-03-16T09:00:00Z",
                "metadata": {"channel": "online", "country": "US"},
            },
            {
                "transaction_id": "T002",
                "amount": "-50.00",   # invalid — negative
                "currency": "USD",
                "source_account": "ACC-3",
                "destination_account": "ACC-4",
                "timestamp": "2026-03-16T09:00:00Z",
                "metadata": {"channel": "online", "country": "US"},
            },
            {
                "transaction_id": "T003",
                "amount": "200.00",
                "currency": "XYZ",   # invalid currency
                "source_account": "ACC-5",
                "destination_account": "ACC-6",
                "timestamp": "2026-03-16T09:00:00Z",
                "metadata": {"channel": "online", "country": "US"},
            },
        ]
        p = tmp_path / "txns.json"
        p.write_text(json.dumps(data))
        return p

    def test_dry_run_prints_table_header(self, minimal_input, capsys):
        _dry_run(minimal_input)
        out = capsys.readouterr().out
        assert "Transaction Validation Dry Run" in out

    def test_dry_run_prints_totals(self, minimal_input, capsys):
        _dry_run(minimal_input)
        out = capsys.readouterr().out
        assert "Total: 3" in out
        assert "Valid: 1" in out
        assert "Invalid: 2" in out

    def test_dry_run_shows_transaction_ids(self, minimal_input, capsys):
        _dry_run(minimal_input)
        out = capsys.readouterr().out
        assert "T001" in out
        assert "T002" in out
        assert "T003" in out

    def test_dry_run_shows_rejection_reasons(self, minimal_input, capsys):
        _dry_run(minimal_input)
        out = capsys.readouterr().out
        assert "INVALID_AMOUNT" in out
        assert "INVALID_CURRENCY" in out

    def test_dry_run_does_not_write_files(self, minimal_input, tmp_path):
        _dry_run(minimal_input)
        json_files = list(tmp_path.glob("**/*.json"))
        # Only the input file itself should exist
        assert len(json_files) == 1

    def test_dry_run_full_sample(self, sample_path, capsys):
        _dry_run(sample_path)
        out = capsys.readouterr().out
        assert "Total: 8" in out
        assert "Valid: 6" in out
        assert "Invalid: 2" in out
