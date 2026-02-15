---
name: commiter
description: Use this skill when the user asks for a commit message, wants to commit changes, or requests a summary of staged changes. Also applicable when the user asks to "write a commit" or "summarize what I'm committing".
---

# Commit Message Generator Skill

## Purpose
This skill helps generate meaningful, well-structured commit messages based on staged changes in a git repository.

## When to Use
- User asks "write a commit message"
- User requests "summarize my staged changes"
- User says "what should I commit?"
- User asks "generate a commit message for my changes"

## Instructions

### 1. Check Git Status
First, verify there are staged changes:
```bash
git status
```

### 2. Get Staged Changes
Retrieve the diff of staged changes:
```bash
git diff --cached
```

### 3. Analyze Changes
Review the diff output and identify:
- **Type of change**: feat, fix, refactor, docs, test, chore, style
- **Scope**: affected module/component
- **Breaking changes**: yes/no
- **Key modifications**: what was added, removed, or changed

### 4. Generate Commit Message
Follow the Conventional Commits format:

```
<type>(<scope>): <short description>

<optional body with detailed explanation>

<optional footer for breaking changes or issue references>
```

**Guidelines:**
- **Subject line**: 50 chars or less, imperative mood ("add" not "added")
- **Body**: Wrap at 72 chars, explain what and why (not how)
- **Types**: feat, fix, docs, style, refactor, test, chore, perf
- **Examples**:
  - `feat(auth): add JWT token validation`
  - `fix(api): resolve null pointer in user endpoint`
  - `refactor(database): simplify query builder logic`
  - `test(services): add unit tests for ticket classification`

### 5. Present Options
Provide:
1. A concise one-line commit message (if changes are simple)
2. A detailed multi-line message (if changes are complex)
3. Brief explanation of what was changed

## Example Output Format

```
Here's a commit message for your staged changes:

**Short version:**
feat(tickets): add CSV import functionality

**Detailed version:**
feat(tickets): add CSV import functionality

- Implement csvParser to handle ticket imports
- Add validation for CSV file format
- Include error handling for malformed data
- Add unit tests for CSV parsing logic

This change enables users to import tickets from CSV files,
expanding the supported import formats beyond JSON and XML.
```

## Error Handling
- If no changes are staged: "No staged changes found. Stage your changes with `git add` first."
- If git is not initialized: "This doesn't appear to be a git repository."
- If changes are too large: Summarize by file and provide a high-level message.

## Best Practices
- Keep subject lines under 50 characters
- Use imperative mood ("add" not "adds" or "added")
- Separate subject from body with a blank line
- Focus on "what" and "why", not "how"
- Reference issue numbers when applicable (e.g., "fixes #123")
