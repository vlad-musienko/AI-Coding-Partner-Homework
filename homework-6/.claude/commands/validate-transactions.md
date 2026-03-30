Validate all transactions in `sample-transactions.json` without running the full pipeline.

Steps:
1. Run the validator in dry-run mode: `python agents/transaction_validator.py --dry-run --input sample-transactions.json`
2. Report the following summary:
   - Total transaction count
   - Valid transaction count
   - Invalid transaction count
   - Reasons for each rejection
3. Display a formatted table showing Transaction ID, Status, and Rejection Reason for every transaction
