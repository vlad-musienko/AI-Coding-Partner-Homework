# Research Notes — MCP context7 Queries

Documented while building the multi-agent banking pipeline (Task 2 / Agent 2).

---

## Query 1: Python `decimal` module for monetary arithmetic

- **Search**: `Python decimal module monetary arithmetic`
- **context7 library ID**: `/python/decimal`
- **Key insight applied**: Always initialize `Decimal` from a **string**, never from a float.  
  `Decimal("1500.00")` is exact; `Decimal(1500.00)` inherits IEEE 754 float imprecision.  
  For amounts comparison used: `amount > Decimal("10000")` throughout `fraud_detector.py`.
- **Code pattern applied**:
  ```python
  from decimal import Decimal, InvalidOperation

  try:
      amount = Decimal(str(raw_amount))   # safe: always via str
  except InvalidOperation:
      # reject with INVALID_AMOUNT
  ```

---

## Query 2: Python `pathlib` for file-based agent communication

- **Search**: `Python pathlib file operations rename move atomic`
- **context7 library ID**: `/python/pathlib`
- **Key insight applied**: `Path.replace()` is atomic on the same filesystem and avoids partial-write races between agents. Used in `integrator.py` to move files through `input/ → processing/ → output/ → results/` directories.
- **Code pattern applied**:
  ```python
  from pathlib import Path

  # Atomic move (same filesystem)
  input_file.replace(processing_dir / input_file.name)

  # Safe mkdir — no error if already exists
  (shared_dir / "results").mkdir(parents=True, exist_ok=True)

  # Remove if exists (Python 3.8+)
  proc_file.unlink(missing_ok=True)
  ```

---

## Query 3: FastMCP server tools and resources

- **Search**: `FastMCP Python MCP server tool resource decorator`
- **context7 library ID**: `/jlowin/fastmcp`
- **Key insight applied**: `@mcp.tool()` exposes a callable to MCP clients; `@mcp.resource("uri")` exposes read-only data. Both support sync functions — no `async` required for simple I/O. Used in `mcp/server.py` for `get_transaction_status`, `list_pipeline_results`, and the `pipeline://summary` resource.
- **Code pattern applied**:
  ```python
  from fastmcp import FastMCP

  mcp = FastMCP("pipeline-status")

  @mcp.tool()
  def get_transaction_status(transaction_id: str) -> dict:
      ...

  @mcp.resource("pipeline://summary")
  def pipeline_summary() -> str:
      ...

  if __name__ == "__main__":
      mcp.run()
  ```
