"""Shared fixtures used across the test suite."""
import json
import pytest
from pathlib import Path


@pytest.fixture
def sample_transactions():
    path = Path(__file__).parent.parent / "sample-transactions.json"
    with open(path) as f:
        return json.load(f)


@pytest.fixture
def shared_dir(tmp_path):
    shared = tmp_path / "shared"
    for subdir in ("input", "processing", "output", "results"):
        (shared / subdir).mkdir(parents=True)
    return shared
