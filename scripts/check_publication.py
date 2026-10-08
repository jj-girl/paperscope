#!/usr/bin/env python3
"""Check publishable files without printing credential values."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path


def known_values(path: Path) -> list[bytes]:
    value = json.loads(path.read_text())
    found: list[bytes] = []

    def walk(node):
        if isinstance(node, dict):
            for key, child in node.items():
                if key.lower() in {"api_key", "api_token", "token", "model_api_key", "sciverse_api_token"} and isinstance(child, str) and len(child) >= 8:
                    found.append(child.encode())
                walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)
    walk(value)
    return found


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--secret-file", action="append", default=[], type=Path,
                        help="Optional local JSON config; values are compared in memory, never printed")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    names = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root
    ).decode().split("\0")
    paths = sorted(set(filter(None, names)))
    secrets = [value for path in args.secret_file for value in known_values(path)]
    patterns = [
        re.compile(rb"\b(?:ghp_|gho_|ghu_|ghs_|github_pat_)[A-Za-z0-9_]{25,}\b"),
        re.compile(rb"\bsk-[A-Za-z0-9_-]{20,}\b"),
        re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    ]
    failures = []
    for name in paths:
        path = root / name
        if not path.exists():
            continue
        parts = path.parts[len(root.parts):]
        private = any(part in {".runtime", ".cache", "logs", "downloads", "exports", "node_modules", ".venv"} for part in parts)
        private |= path.name.startswith("local.config") or (path.name.startswith(".env") and path.name != ".env.example")
        if private or path.is_symlink():
            failures.append((name, "private runtime file or symlink"))
            continue
        data = path.read_bytes()
        if any(secret in data for secret in secrets):
            failures.append((name, "matches a locally configured secret"))
        if any(pattern.search(data) for pattern in patterns):
            failures.append((name, "credential-shaped content"))
    if failures:
        for name, reason in failures:
            print(f"BLOCKED: {name}: {reason}")
        return 1
    print(f"Publication check passed: {len(paths)} files; no matched private files or credential values.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
