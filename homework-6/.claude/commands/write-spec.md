Generate a project specification for the multi-agent banking pipeline.

Steps:
1. Read `specification-TEMPLATE-hint.md` for the required structure and formatting
2. Read `sample-transactions.json` to understand the transaction data and edge cases (invalid currency, negative amounts, high-value, unusual hours, cross-border)
3. Generate `specification.md` with all 5 required sections:
   - **High-Level Objective**: One sentence describing the pipeline
   - **Mid-Level Objectives**: 5+ testable requirements
   - **Implementation Notes**: Decimal, ISO 4217, logging, PII masking constraints
   - **Context**: Beginning state (raw JSON) and ending state (processed results, coverage, docs)
   - **Low-Level Tasks**: One entry per agent with Prompt, File to CREATE, Function to CREATE, and Details
4. Ensure each Low-Level Task entry includes an exact prompt suitable for giving to Claude Code
5. Verify the specification covers all 3 pipeline agents (Transaction Validator, Fraud Detector, Settlement Processor) plus the Integrator
