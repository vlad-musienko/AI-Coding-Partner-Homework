#!/usr/bin/env python3
"""Coverage gate hook — reads Bash tool input from stdin and blocks git push
if pytest coverage is below 80%.

Exit codes (Claude Code hook contract):
  0  — allow the tool call to proceed
  2  — block the tool call and show stdout as the error message
"""
import json
import subprocess
import sys


def main() -> None:
    try:
        tool_input = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    command = tool_input.get("command", "")

    # Only intercept git push commands
    if "git push" not in command:
        sys.exit(0)

    print("[coverage-gate] Detected git push — running coverage check...", flush=True)

    result = subprocess.run(
        [
            sys.executable, "-m", "pytest",
            "--cov=agents",
            "--cov=integrator",
            "--cov-fail-under=80",
            "--cov-report=term-missing",
            "-q",
            "--tb=no",
        ],
        capture_output=True,
        text=True,
    )

    output = (result.stdout + result.stderr).strip()
    # Show last 25 lines of coverage output
    lines = output.splitlines()
    print("\n".join(lines[-25:]))

    if result.returncode != 0:
        print(
            "\n[coverage-gate] BLOCKED: Test coverage is below 80%. "
            "Fix tests before pushing.",
            flush=True,
        )
        sys.exit(2)

    print("\n[coverage-gate] Coverage check passed.", flush=True)
    sys.exit(0)


if __name__ == "__main__":
    main()
