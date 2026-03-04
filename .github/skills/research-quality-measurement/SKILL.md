---
name: research-quality-measurement
description: >
  Defines quality levels for bug research assessment. Use when verifying
  research documents, measuring research completeness, or rating the quality
  of codebase analysis reports produced by a Bug Researcher agent.
---

# Research Quality Measurement Skill

## Purpose

This skill defines a standardised framework for measuring the quality of bug
research documents. It must be applied by any agent that reads, verifies, or
scores a `codebase-research.md` file.

## Scoring Dimensions

Each dimension is scored 0–25. Sum the four dimensions to get a **total score
out of 100**.

| # | Dimension | 0–25 pts | What to measure |
|---|-----------|----------|-----------------|
| 1 | **Reference Accuracy** | 25 | Each file:line citation opens the correct file and the code at that line matches the claim in the research. |
| 2 | **Snippet Fidelity** | 25 | Each code snippet quoted in the research is character-for-character identical to the actual source (modulo trailing whitespace). |
| 3 | **Root Cause Analysis** | 25 | The stated root cause correctly explains the failure mechanism with evidence. Partial credit if cause is partially correct. |
| 4 | **Completeness** | 25 | All files, functions, and execution paths relevant to the bug are covered. No important file or code path is missing. |

### Dimension Scoring Guide

**Reference Accuracy**
- 25 – All references verified; every file:line points to correct code
- 19 – ≥ 90 % references correct; 1–2 minor off-by-one line numbers
- 13 – 70–89 % references correct; several wrong lines or wrong files
- 7  – 50–69 % references correct; many references unverifiable
- 0  – < 50 % references correct or no references provided

**Snippet Fidelity**
- 25 – All snippets match source exactly
- 19 – ≥ 90 % of snippets match; minor whitespace/comment differences only
- 13 – 70–89 % match; some snippets paraphrased or outdated
- 7  – 50–69 % match; snippets inconsistent with source
- 0  – < 50 % match or no snippets provided

**Root Cause Analysis**
- 25 – Root cause identified correctly with full mechanism explanation and evidence
- 19 – Root cause correct but explanation lacks some detail
- 13 – Root cause partially correct; one contributing factor missed
- 7  – Root cause vague or misleading; symptom described instead of cause
- 0  – Root cause wrong or absent

**Completeness**
- 25 – All relevant files and execution paths documented
- 19 – ≥ 90 % of relevant code covered; 1–2 minor paths missing
- 13 – 70–89 % covered; one important file or function missing
- 7  – 50–69 % covered; key files omitted
- 0  – < 50 % covered or only the symptom file examined

---

## Quality Levels

Map the **total score** to a quality level:

| Level | Label | Score Range | Meaning |
|-------|-------|-------------|---------|
| 5 | **Excellent** | 90–100 | Research is thorough, fully verified, and ready to drive implementation |
| 4 | **Good** | 75–89 | Research is reliable with minor gaps; usable with noted caveats |
| 3 | **Adequate** | 55–74 | Research is usable but requires verification of flagged items |
| 2 | **Poor** | 35–54 | Research has significant errors; do not use without re-investigation |
| 1 | **Inadequate** | 0–34 | Research is unreliable; a full re-investigation is required |

---

## Output Format

When writing a Research Quality Assessment section, use exactly this structure:

```markdown
## Research Quality Assessment

**Quality Level**: [1–5] – [Label]
**Total Score**: [N]/100

| Dimension | Score | Notes |
|-----------|-------|-------|
| Reference Accuracy | [N]/25 | [brief justification] |
| Snippet Fidelity | [N]/25 | [brief justification] |
| Root Cause Analysis | [N]/25 | [brief justification] |
| Completeness | [N]/25 | [brief justification] |

**Reasoning**: [2–4 sentences explaining the overall assessment]
```

---

## Step-by-Step Instructions

1. **Load source files** — Read every file mentioned in the research document.
2. **Check each reference** — Open the file at the cited line; confirm the code is as described.
3. **Compare snippets** — Compare each quoted snippet character-by-character against the loaded file content.
4. **Evaluate root cause** — Trace the execution path to verify whether the stated root cause would actually produce the reported symptom.
5. **Check completeness** — List all files/functions in the call chain; verify each one is mentioned.
6. **Score each dimension** — Using the guide above, assign 0/7/13/19/25 to each dimension.
7. **Sum and classify** — Add the four scores; map to a quality level using the table above.
8. **Write output** — Populate the output format template.
