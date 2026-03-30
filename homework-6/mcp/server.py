"""Custom FastMCP server — makes the banking pipeline queryable via MCP.

Exposed tools:
  get_transaction_status(transaction_id)  — lookup a result by transaction ID
  list_pipeline_results()                 — summary of all processed transactions

Exposed resource:
  pipeline://summary                      — latest run summary as plain text
"""
import json
from pathlib import Path

from fastmcp import FastMCP

mcp = FastMCP("pipeline-status")

SHARED_RESULTS = Path("shared/results")


@mcp.tool()
def get_transaction_status(transaction_id: str) -> dict:
    """Get the current status of a transaction from shared/results/.

    Args:
        transaction_id: The transaction identifier (e.g. "TXN001").

    Returns:
        Dict with found flag, status, risk level, settlement outcome.
    """
    result_file = SHARED_RESULTS / f"{transaction_id}.json"
    if not result_file.exists():
        return {
            "found": False,
            "transaction_id": transaction_id,
            "message": "Transaction not found in results. Run the pipeline first.",
        }

    with open(result_file) as f:
        msg = json.load(f)

    data = msg.get("data", {})
    return {
        "found": True,
        "transaction_id": transaction_id,
        "status": data.get("status"),
        "rejection_reason": data.get("rejection_reason"),
        "fraud_risk_score": data.get("fraud_risk_score"),
        "fraud_risk_level": data.get("fraud_risk_level"),
        "settlement_status": data.get("settlement_status"),
        "review_flag": data.get("review_flag"),
        "settlement_timestamp": data.get("settlement_timestamp"),
    }


@mcp.tool()
def list_pipeline_results() -> dict:
    """Return a summary of all processed transactions from shared/results/."""
    if not SHARED_RESULTS.exists():
        return {
            "count": 0,
            "transactions": [],
            "message": "No results directory found. Run the pipeline first.",
        }

    transactions = []
    for f in sorted(SHARED_RESULTS.glob("*.json")):
        with open(f) as fp:
            msg = json.load(fp)
        data = msg.get("data", {})
        transactions.append({
            "transaction_id": data.get("transaction_id"),
            "status": data.get("status"),
            "rejection_reason": data.get("rejection_reason"),
            "fraud_risk_level": data.get("fraud_risk_level"),
            "settlement_status": data.get("settlement_status"),
            "review_flag": data.get("review_flag"),
        })

    return {"count": len(transactions), "transactions": transactions}


@mcp.resource("pipeline://summary")
def pipeline_summary() -> str:
    """Return the latest pipeline run summary as plain text."""
    if not SHARED_RESULTS.exists():
        return "No pipeline results found. Run the pipeline first:\n  python integrator.py"

    files = list(SHARED_RESULTS.glob("*.json"))
    settled = held = rejected = 0

    for f in files:
        with open(f) as fp:
            msg = json.load(fp)
        data = msg.get("data", {})
        if data.get("status") == "rejected":
            rejected += 1
        elif data.get("settlement_status") == "HELD_FOR_REVIEW":
            held += 1
        else:
            settled += 1

    lines = [
        "Pipeline Run Summary",
        "=" * 40,
        f"Total processed:   {len(files)}",
        f"Settled:           {settled}",
        f"Held for review:   {held}",
        f"Rejected:          {rejected}",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
