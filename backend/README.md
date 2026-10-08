# PaperScope backend

FastAPI adapters for six literature services, direct Sciverse Paper Schema data operations, independent connection settings, and optional shared-model analysis.

- `main.py`: application setup, request limits and error handling.
- `settings_api.py`: data/model settings and explicit connection tests.
- `literature.py`, `advanced.py`, `sciverse_data.py`: source-specific retrieval and data operations.
- `semantic_access.py`: bounded Semantic Scholar throttling, retries and cache.
- `shared_ai.py`, `model_runtime.py`: optional analysis over supplied records.

The original reader's discovery map, topic graph/exploration, paper guide, graph assembly, gateway and reader-specific contracts have been removed. Current routes are documented by the running `/docs` and `/openapi.json` endpoints.

Run from the repository root with `./run.sh backend`. See the root README and SECURITY.md for credentials and deployment boundaries.
