Run the multi-agent banking pipeline end-to-end.

Steps:
1. Check that `sample-transactions.json` exists in the project root
2. Clear the `shared/` directories (input, processing, output — keep results for reference)
3. Run the pipeline: `python integrator.py`
4. Show a summary of results from `shared/results/` — list each transaction ID, its final status, risk level, and settlement outcome
5. Report any transactions that were rejected and explain why (rejection_reason field)
