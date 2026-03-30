"""Integration tests for the full pipeline (integrator.py)."""
import json
import pytest
from pathlib import Path

from integrator import (
    _make_envelope,
    _setup_directories,
    print_summary,
    run_pipeline,
)


# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------

SAMPLE_TRANSACTIONS = [
    {
        "transaction_id": "TXN001",
        "timestamp": "2026-03-16T09:00:00Z",
        "source_account": "ACC-1001",
        "destination_account": "ACC-2001",
        "amount": "1500.00",
        "currency": "USD",
        "transaction_type": "transfer",
        "description": "Rent",
        "metadata": {"channel": "online", "country": "US"},
    },
    {
        "transaction_id": "TXN002",
        "timestamp": "2026-03-16T09:15:00Z",
        "source_account": "ACC-1002",
        "destination_account": "ACC-3001",
        "amount": "25000.00",
        "currency": "USD",
        "transaction_type": "wire_transfer",
        "description": "Equipment",
        "metadata": {"channel": "branch", "country": "US"},
    },
    {
        "transaction_id": "TXN006",
        "timestamp": "2026-03-16T10:05:00Z",
        "source_account": "ACC-1006",
        "destination_account": "ACC-7700",
        "amount": "200.00",
        "currency": "XYZ",  # invalid
        "transaction_type": "transfer",
        "description": "Test",
        "metadata": {"channel": "online", "country": "US"},
    },
    {
        "transaction_id": "TXN007",
        "timestamp": "2026-03-16T10:10:00Z",
        "source_account": "ACC-1007",
        "destination_account": "ACC-8800",
        "amount": "-100.00",  # negative
        "currency": "GBP",
        "transaction_type": "refund",
        "description": "Refund",
        "metadata": {"channel": "online", "country": "GB"},
    },
]


@pytest.fixture
def input_file(tmp_path):
    p = tmp_path / "transactions.json"
    p.write_text(json.dumps(SAMPLE_TRANSACTIONS))
    return p


@pytest.fixture
def fresh_shared(tmp_path):
    return tmp_path / "shared"  # not yet created — run_pipeline creates it


# ---------------------------------------------------------------------------
# _setup_directories
# ---------------------------------------------------------------------------

class TestSetupDirectories:
    def test_creates_all_subdirs(self, tmp_path):
        shared = tmp_path / "shared"
        _setup_directories(shared)
        for subdir in ("input", "processing", "output", "results"):
            assert (shared / subdir).is_dir()

    def test_idempotent(self, tmp_path):
        shared = tmp_path / "shared"
        _setup_directories(shared)
        _setup_directories(shared)  # second call must not raise


# ---------------------------------------------------------------------------
# _make_envelope
# ---------------------------------------------------------------------------

class TestMakeEnvelope:
    def test_envelope_has_required_keys(self):
        txn = {"transaction_id": "TXN001", "amount": "100.00"}
        env = _make_envelope(txn)
        for key in ("message_id", "timestamp", "source_agent", "target_agent",
                    "message_type", "data"):
            assert key in env

    def test_source_agent_is_integrator(self):
        env = _make_envelope({"transaction_id": "TXN001"})
        assert env["source_agent"] == "integrator"

    def test_target_agent_is_validator(self):
        env = _make_envelope({"transaction_id": "TXN001"})
        assert env["target_agent"] == "transaction_validator"

    def test_data_is_transaction(self):
        txn = {"transaction_id": "TXN001", "amount": "500.00"}
        env = _make_envelope(txn)
        assert env["data"] == txn

    def test_message_id_is_uuid(self):
        env = _make_envelope({"transaction_id": "TXN001"})
        import uuid
        uuid.UUID(env["message_id"])  # raises if not a valid UUID


# ---------------------------------------------------------------------------
# run_pipeline — basic structure
# ---------------------------------------------------------------------------

class TestRunPipelineStructure:
    def test_creates_results_directory(self, input_file, fresh_shared):
        run_pipeline(input_file, fresh_shared)
        assert (fresh_shared / "results").is_dir()

    def test_returns_list_of_results(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        assert isinstance(results, list)

    def test_result_count_matches_input(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        assert len(results) == len(SAMPLE_TRANSACTIONS)

    def test_result_files_created(self, input_file, fresh_shared):
        run_pipeline(input_file, fresh_shared)
        result_files = list((fresh_shared / "results").glob("*.json"))
        assert len(result_files) == len(SAMPLE_TRANSACTIONS)

    def test_result_files_are_valid_json(self, input_file, fresh_shared):
        run_pipeline(input_file, fresh_shared)
        for f in (fresh_shared / "results").glob("*.json"):
            data = json.loads(f.read_text())
            assert "data" in data and "transaction_id" in data["data"]

    def test_audit_log_created(self, input_file, fresh_shared):
        run_pipeline(input_file, fresh_shared)
        assert (fresh_shared / "audit.log").exists()


# ---------------------------------------------------------------------------
# run_pipeline — per-transaction outcomes
# ---------------------------------------------------------------------------

class TestRunPipelineOutcomes:
    def test_valid_txn_status_processed(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        txn1 = next(r for r in results if r["data"]["transaction_id"] == "TXN001")
        assert txn1["data"]["status"] == "processed"

    def test_valid_txn_has_settlement_status(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        txn1 = next(r for r in results if r["data"]["transaction_id"] == "TXN001")
        assert "settlement_status" in txn1["data"]

    def test_low_risk_txn_settled(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        txn1 = next(r for r in results if r["data"]["transaction_id"] == "TXN001")
        assert txn1["data"]["settlement_status"] == "SETTLED"
        assert txn1["data"]["review_flag"] is False

    def test_medium_risk_txn_settled_with_review(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        txn2 = next(r for r in results if r["data"]["transaction_id"] == "TXN002")
        assert txn2["data"]["settlement_status"] == "SETTLED"
        assert txn2["data"]["review_flag"] is True

    def test_invalid_currency_rejected(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        txn6 = next(r for r in results if r["data"]["transaction_id"] == "TXN006")
        assert txn6["data"]["status"] == "rejected"
        assert txn6["data"]["rejection_reason"] == "INVALID_CURRENCY"

    def test_negative_amount_rejected(self, input_file, fresh_shared):
        results = run_pipeline(input_file, fresh_shared)
        txn7 = next(r for r in results if r["data"]["transaction_id"] == "TXN007")
        assert txn7["data"]["status"] == "rejected"
        assert txn7["data"]["rejection_reason"] == "INVALID_AMOUNT"


# ---------------------------------------------------------------------------
# run_pipeline — full sample dataset
# ---------------------------------------------------------------------------

class TestFullSampleData:
    @pytest.fixture
    def full_results(self, tmp_path):
        input_path = Path(__file__).parent.parent / "sample-transactions.json"
        shared = tmp_path / "shared"
        return run_pipeline(input_path, shared)

    def test_all_8_transactions_processed(self, full_results):
        assert len(full_results) == 8

    def test_exactly_2_rejected(self, full_results):
        rejected = [r for r in full_results if r["data"]["status"] == "rejected"]
        assert len(rejected) == 2

    def test_txn005_high_risk_held(self, full_results):
        txn5 = next(r for r in full_results if r["data"]["transaction_id"] == "TXN005")
        assert txn5["data"]["fraud_risk_level"] == "HIGH"
        assert txn5["data"]["settlement_status"] == "HELD_FOR_REVIEW"

    def test_txn004_medium_risk(self, full_results):
        txn4 = next(r for r in full_results if r["data"]["transaction_id"] == "TXN004")
        assert txn4["data"]["fraud_risk_level"] == "MEDIUM"

    def test_txn006_invalid_currency(self, full_results):
        txn6 = next(r for r in full_results if r["data"]["transaction_id"] == "TXN006")
        assert txn6["data"]["rejection_reason"] == "INVALID_CURRENCY"

    def test_txn007_invalid_amount(self, full_results):
        txn7 = next(r for r in full_results if r["data"]["transaction_id"] == "TXN007")
        assert txn7["data"]["rejection_reason"] == "INVALID_AMOUNT"


# ---------------------------------------------------------------------------
# print_summary
# ---------------------------------------------------------------------------

class TestPrintSummary:
    def test_no_crash_with_all_outcomes(self, tmp_path, capsys):
        input_path = Path(__file__).parent.parent / "sample-transactions.json"
        shared = tmp_path / "shared"
        results = run_pipeline(input_path, shared)
        print_summary(results)
        out = capsys.readouterr().out
        assert "PIPELINE SUMMARY" in out
        assert "Settled:" in out

    def test_counts_shown(self, tmp_path, capsys):
        input_path = Path(__file__).parent.parent / "sample-transactions.json"
        shared = tmp_path / "shared"
        results = run_pipeline(input_path, shared)
        print_summary(results)
        out = capsys.readouterr().out
        assert "Rejected:" in out
        assert "Total:" in out
