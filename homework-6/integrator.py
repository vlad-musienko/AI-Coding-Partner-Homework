"""Integrator — Orchestrates the multi-agent transaction processing pipeline.

Flow:
    sample-transactions.json
        ↓ [Integrator wraps in envelope]
    shared/input/{txn_id}.json
        ↓ [TransactionValidator]
    shared/output/{txn_id}.json  (or shared/results/ if rejected)
        ↓ [FraudDetector]
    shared/output/{txn_id}.json
        ↓ [SettlementProcessor]
    shared/results/{txn_id}.json
"""
import json
import logging
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from agents.fraud_detector import FraudDetector
from agents.settlement_processor import SettlementProcessor
from agents.transaction_validator import TransactionValidator

AGENT_NAME = "integrator"
SHARED_SUBDIRS = ("input", "processing", "output", "results")

logger = logging.getLogger(AGENT_NAME)


def _setup_directories(shared_dir: Path) -> None:
    for subdir in SHARED_SUBDIRS:
        (shared_dir / subdir).mkdir(parents=True, exist_ok=True)


def _setup_audit_logging(shared_dir: Path) -> logging.Handler:
    audit_path = shared_dir / "audit.log"
    handler = logging.FileHandler(audit_path)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s [%(name)s] %(levelname)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    logging.getLogger().addHandler(handler)
    return handler


def _make_envelope(transaction: dict) -> dict:
    return {
        "message_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_agent": AGENT_NAME,
        "target_agent": "transaction_validator",
        "message_type": "transaction",
        "data": transaction,
    }


def run_pipeline(input_path: Path, shared_dir: Path) -> list:
    """Run the full pipeline from input_path through all agents.

    Creates shared/ directory structure, processes every transaction from
    input_path through Validator → FraudDetector → SettlementProcessor
    (rejected transactions skip to results directly).

    Returns:
        List of result message dicts (one per input transaction).
    """
    _setup_directories(shared_dir)
    audit_handler = _setup_audit_logging(shared_dir)

    try:
        with open(input_path) as f:
            transactions = json.load(f)

        validator = TransactionValidator()
        fraud_detector = FraudDetector()
        settlement_processor = SettlementProcessor()

        input_dir = shared_dir / "input"
        processing_dir = shared_dir / "processing"
        output_dir = shared_dir / "output"
        results_dir = shared_dir / "results"

        results = []

        for transaction in transactions:
            txn_id = transaction.get("transaction_id", "UNKNOWN")
            envelope = _make_envelope(transaction)

            # Drop into shared/input/
            input_file = input_dir / f"{txn_id}.json"
            with open(input_file, "w") as f:
                json.dump(envelope, f, indent=2)

            # Move to processing/, run validator
            proc_file = processing_dir / f"{txn_id}.json"
            input_file.replace(proc_file)
            validated = validator.process_message(envelope)

            if validated["data"]["status"] == "rejected":
                result_file = results_dir / f"{txn_id}.json"
                with open(result_file, "w") as f:
                    json.dump(validated, f, indent=2)
                proc_file.unlink(missing_ok=True)
                results.append(validated)
                logger.info(
                    "txn=%s | PIPELINE | stage=validator outcome=rejected reason=%s",
                    txn_id,
                    validated["data"].get("rejection_reason"),
                )
                continue

            # Write validated to output/
            out_file = output_dir / f"{txn_id}.json"
            with open(out_file, "w") as f:
                json.dump(validated, f, indent=2)
            proc_file.unlink(missing_ok=True)

            # Fraud detection: move output → processing, run, write back to output
            proc_file = processing_dir / f"{txn_id}.json"
            out_file.replace(proc_file)
            fraud_scored = fraud_detector.process_message(validated)
            with open(out_file, "w") as f:
                json.dump(fraud_scored, f, indent=2)
            proc_file.unlink(missing_ok=True)

            # Settlement: move output → processing, run, write to results
            proc_file = processing_dir / f"{txn_id}.json"
            out_file.replace(proc_file)
            settled = settlement_processor.process_message(fraud_scored)
            result_file = results_dir / f"{txn_id}.json"
            with open(result_file, "w") as f:
                json.dump(settled, f, indent=2)
            proc_file.unlink(missing_ok=True)

            results.append(settled)
            logger.info(
                "txn=%s | PIPELINE | stage=complete risk=%s settlement=%s",
                txn_id,
                settled["data"].get("fraud_risk_level"),
                settled["data"].get("settlement_status"),
            )

        return results

    finally:
        logging.getLogger().removeHandler(audit_handler)
        audit_handler.close()


def print_summary(results: list) -> None:
    width = 76
    print(f"\n{'='*width}")
    print(f"{'PIPELINE SUMMARY':^{width}}")
    print(f"{'='*width}")
    print(f"{'TXN ID':<12} {'STATUS':<15} {'SETTLEMENT':<22} {'RISK':<8} REASON")
    print("-" * width)

    settled = held = rejected = 0
    for msg in results:
        data = msg.get("data", {})
        txn_id = data.get("transaction_id", "?")
        status = data.get("status", "?")
        settlement = data.get("settlement_status", "-")
        risk = data.get("fraud_risk_level", "-")
        reason = data.get("rejection_reason", "")
        print(f"{txn_id:<12} {status:<15} {settlement:<22} {risk:<8} {reason}")

        if status == "rejected":
            rejected += 1
        elif settlement == "HELD_FOR_REVIEW":
            held += 1
        else:
            settled += 1

    print("=" * width)
    print(
        f"Settled: {settled} | Held for Review: {held} | "
        f"Rejected: {rejected} | Total: {len(results)}"
    )


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
        stream=sys.stdout,
    )
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("sample-transactions.json")
    shared_dir = Path("shared")

    logger.info("Pipeline starting | input=%s", input_path)
    pipeline_results = run_pipeline(input_path, shared_dir)
    print_summary(pipeline_results)
    logger.info("Pipeline complete | processed=%d", len(pipeline_results))
