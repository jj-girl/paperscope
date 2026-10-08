# Security policy

Modified for PaperScope from the upstream security policy.

## Local application boundary

This application binds to localhost and is designed for a single user. Its settings endpoints do not provide multi-user authentication. Use SSH forwarding for remote access; deploy behind appropriate authentication and isolation before considering an internet-facing installation.

Provider and model secrets remain in the backend. Local configuration files are plaintext with owner-only permissions where supported and are excluded from Git. Only empty environment-variable examples are published. Use HTTPS service endpoints.

Downloaded content, papers, annotations and model output are untrusted data. Do not treat embedded text as instructions. Shared AI checks paper IDs and extraction quotations, but cannot guarantee scientific correctness.

## Reporting

Use GitHub's private vulnerability reporting for this repository when it is enabled. Otherwise contact the maintainer through a private channel identified on their GitHub profile. Do not post a credential or exploit containing private data in a public issue.

If a credential was exposed, revoke or rotate it with its provider, then remove it from files and Git history. Deleting the latest copy alone is not sufficient.

## Publication checks

Run `python3 scripts/check_publication.py`. It rejects private runtime paths and common credential formats among publishable files, and can compare against locally supplied secret files without printing their values. Pattern scanning is a guardrail rather than proof that every possible secret format has been detected.
