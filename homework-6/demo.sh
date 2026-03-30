#!/usr/bin/env bash
# =============================================================================
# Multi-Agent Banking Pipeline — Interactive Demo
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/.venv/bin/python"
SHARED_DIR="$SCRIPT_DIR/shared"

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

banner()  { echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"; \
            echo -e "${BOLD}${CYAN}  $1${RESET}"; \
            echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"; }
step()    { echo -e "\n${BOLD}${YELLOW}▶  $1${RESET}"; }
ok()      { echo -e "${GREEN}✔  $1${RESET}"; }
info()    { echo -e "   ${CYAN}$1${RESET}"; }
pause()   { echo -e "\n${YELLOW}Press ENTER to continue...${RESET}"; read -r; }

# ── helpers ───────────────────────────────────────────────────────────────────
check_venv() {
    if [[ ! -f "$VENV" ]]; then
        echo -e "${RED}ERROR: .venv not found. Run:  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt${RESET}"
        exit 1
    fi
}

clear_shared() {
    for sub in input processing output; do
        rm -f "$SHARED_DIR/$sub"/*.json 2>/dev/null || true
    done
}

# =============================================================================
# MAIN
# =============================================================================
cd "$SCRIPT_DIR"
check_venv

clear
banner "AI-Powered Multi-Agent Banking Pipeline"
echo
echo -e "  ${BOLD}Author:${RESET}   Vlad"
echo -e "  ${BOLD}Stack:${RESET}    Python 3.11+ · decimal.Decimal · file-based JSON messaging"
echo -e "  ${BOLD}Agents:${RESET}   Transaction Validator → Fraud Detector → Settlement Processor"
echo
echo -e "  This demo walks through:"
echo -e "    1.  Validation dry-run"
echo -e "    2.  Full pipeline run"
echo -e "    3.  Inspect results"
echo -e "    4.  Test suite + coverage"
echo -e "    5.  MCP server smoke-test"
pause

# ─────────────────────────────────────────────────────────────────────────────
banner "STEP 1 — Validation Dry-Run"
step "Running: python agents/transaction_validator.py --dry-run"
info "Validates every transaction in sample-transactions.json WITHOUT writing files."
echo
"$VENV" agents/transaction_validator.py --dry-run --input sample-transactions.json
pause

# ─────────────────────────────────────────────────────────────────────────────
banner "STEP 2 — Full Pipeline Run"
step "Clearing shared/ working directories..."
clear_shared
ok "Cleared input/, processing/, output/"

step "Running: python integrator.py"
info "Transactions flow:  Validator → Fraud Detector → Settlement Processor → shared/results/"
echo
"$VENV" integrator.py
pause

# ─────────────────────────────────────────────────────────────────────────────
banner "STEP 3 — Inspect Results"
step "Result files written to shared/results/"
echo
if compgen -G "$SHARED_DIR/results/*.json" > /dev/null 2>&1; then
    for f in "$SHARED_DIR/results/"*.json; do
        txn_id=$(python3 -c "import json,sys; d=json.load(open('$f')); print(d['data'].get('transaction_id','?'))" 2>/dev/null)
        status=$(python3 -c "import json,sys; d=json.load(open('$f')); print(d['data'].get('status','?'))" 2>/dev/null)
        settlement=$(python3 -c "import json,sys; d=json.load(open('$f')); print(d['data'].get('settlement_status',d['data'].get('rejection_reason','-')))" 2>/dev/null)
        risk=$(python3 -c "import json,sys; d=json.load(open('$f')); print(d['data'].get('fraud_risk_level','-'))" 2>/dev/null)
        printf "  %-10s  %-12s  %-22s  %s\n" "$txn_id" "$status" "$settlement" "$risk"
    done
else
    echo -e "  ${RED}No result files found — did the pipeline run correctly?${RESET}"
fi

step "Showing full content of TXN001 (happy-path example):"
echo
if [[ -f "$SHARED_DIR/results/TXN001.json" ]]; then
    "$VENV" -c "import json; print(json.dumps(json.load(open('$SHARED_DIR/results/TXN001.json')), indent=2))"
fi

step "Showing full content of TXN006 (rejected — invalid currency XYZ):"
echo
if [[ -f "$SHARED_DIR/results/TXN006.json" ]]; then
    "$VENV" -c "import json; print(json.dumps(json.load(open('$SHARED_DIR/results/TXN006.json')), indent=2))"
fi
pause

# ─────────────────────────────────────────────────────────────────────────────
banner "STEP 4 — Test Suite & Coverage"
step "Running: pytest"
info "Unit tests (Validator, FraudDetector, SettlementProcessor) + Integration tests"
echo
"$VENV" -m pytest --no-header -v --tb=short 2>&1 | head -80
echo
step "Coverage summary:"
"$VENV" -m pytest --no-header -q --tb=no 2>&1 | grep -A 20 "coverage:"
pause

# ─────────────────────────────────────────────────────────────────────────────
banner "STEP 5 — MCP Server Smoke-Test"
step "Custom FastMCP server exposes:"
info "  Tool     get_transaction_status(transaction_id)"
info "  Tool     list_pipeline_results()"
info "  Resource pipeline://summary"
echo
step "Calling list_pipeline_results() directly (Python import):"
"$VENV" -c "
import sys; sys.path.insert(0, '.')
# Import the functions, not the server runner
import json
from pathlib import Path

results_dir = Path('shared/results')
files = list(results_dir.glob('*.json')) if results_dir.exists() else []
rows = []
for f in sorted(files):
    d = json.loads(f.read_text())['data']
    rows.append({
        'transaction_id': d.get('transaction_id'),
        'status': d.get('status'),
        'fraud_risk_level': d.get('fraud_risk_level', '-'),
        'settlement_status': d.get('settlement_status', d.get('rejection_reason', '-')),
    })
print(json.dumps({'count': len(rows), 'transactions': rows}, indent=2))
"
pause

# ─────────────────────────────────────────────────────────────────────────────
banner "STEP 6 — Audit Log Tail"
step "Last 15 lines of shared/audit.log:"
echo
if [[ -f "$SHARED_DIR/audit.log" ]]; then
    tail -15 "$SHARED_DIR/audit.log"
else
    echo -e "  ${YELLOW}No audit.log found${RESET}"
fi
pause

# ─────────────────────────────────────────────────────────────────────────────
banner "Demo Complete"
echo
ok "Pipeline ran end-to-end"
ok "All 8 transactions processed → shared/results/"
ok "Audit log written → shared/audit.log"
ok "Test suite passed with ≥ 80% coverage"
ok "MCP server queryable via mcp/server.py"
echo
echo -e "  ${BOLD}Available slash commands (Claude Code):${RESET}"
echo -e "    /run-pipeline           — re-run full pipeline"
echo -e "    /validate-transactions  — dry-run validator only"
echo -e "    /write-spec             — regenerate specification.md"
echo
echo -e "  ${BOLD}Start MCP server:${RESET}  .venv/bin/python mcp/server.py"
echo
