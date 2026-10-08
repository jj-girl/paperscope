# Contributing

Modified for PaperScope from the upstream contribution guide.

1. Install with `./run.sh setup`.
2. Keep source-specific identifiers and capability boundaries explicit.
3. Add focused tests for behavior changes. Mock external services in unit tests; never require a real key in CI.
4. Run `./run.sh lint test build` and `python3 scripts/check_publication.py`.
5. Describe the behavior change, validation and any live-testing limitations in the pull request.

Never commit credentials, local configuration, provider responses, downloads, browser profiles or private prompts. Do not include keys in screenshots, issues, PRs, logs or test fixtures. Use short fictional placeholders in tests.

Sciverse internal relations, paper citations and related suggestions are separate semantics. Other sources must not be mapped to invented Paper Schema facts. AI additions must stay within the returned catalog, preserve source basis, and expose missing evidence.

Keep upstream copyright/license notices and mark modifications to inherited files. Keep documentation aligned with the current API workbench; do not reintroduce retired reader flows.
