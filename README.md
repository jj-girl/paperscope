# FrontierLens Multisource

[简体中文](README.zh-CN.md) · [API scope and contracts](docs/API_REFERENCE_RESEARCH.md) · [Source capabilities](docs/SOURCE_CAPABILITIES.md) · [Optional AI](docs/SHARED_AI.md)

A local **Literature API Workbench** for **Sciverse, PubMed, Europe PMC, OpenAlex, Semantic Scholar, and Elicit**. The active page replaces the original question-planning and guided-reader shell with named API operation buttons, database scope, data granularity, and input/output descriptions. The default mode does not call a user-configured LLM.

Choose a source, inspect its coverage, select an API button, enter parameters, run it, and inspect or export the result. There are 67 operation entries across six providers; some entries share or combine native endpoints. This is not a claim to implement every provider API. Selecting a button alone never starts a request.

Modified and extended from [FrontierLens](https://github.com/Shannon4Science/sciverse-frontier-lens/tree/e67f0b2a0f940bd56e1b4b3f444c21ff3210e54f). The upstream license text and attribution are preserved. See [upstream provenance](docs/UPSTREAM.md).

## What you can do

| Source | Workspace |
| --- | --- |
| Sciverse | Direct metadata, evidence snippets, text/resources, Schema entities/relations, citations, provenance and material packs |
| PubMed | Biomedical search, MeSH, publication-type/year filters, linked records, history and PMID batches |
| Europe PMC | Open full-text reading, entity annotations and context, references, citations and database links |
| OpenAlex | Search, whole-query aggregates, author/institution exploration, citation graphs, PDF and TEI XML retrieval |
| Semantic Scholar | Search, references, citations, recommendations, authors and batches with bounded throttling/retries/cache |
| Elicit | Optional paid API integration for search and asynchronous screening, extraction, reports and research-agent tasks |

The optional AI extension is off by default. Enable it explicitly to analyze supported paper results with the shared model or start Elicit generation tasks. Sciverse's existing Schema structures can be read without an application-side LLM. Provider-side retrieval models and precomputed extraction are labeled separately from generation. Metadata, full text and completed Schema have different coverage; their IDs are not interchangeable.

## Quick start

Requirements: Python 3.11+ (3.12 recommended), [uv](https://docs.astral.sh/uv/), Node.js **22.12+ or 24+**, npm, and `make`.

```bash
git clone https://github.com/jj-girl/frontierlens-multisource.git
cd frontierlens-multisource
./run.sh setup
```

Run in two terminals:

```bash
./run.sh backend
```

```bash
./run.sh frontend
```

Open **http://127.0.0.1:3040**. The backend listens on `127.0.0.1:8040`; the frontend proxies API requests. Both services are needed. The wrapper keeps temporary files and package caches inside the ignored project folders.

For a remote machine, forward the frontend port:

```bash
ssh -N -L 3040:127.0.0.1:3040 USER@SERVER
```

## Credentials

**No API keys, accounts, literature datasets, or model credentials are included.**

- PubMed and Europe PMC can be tried without a key; an NCBI key is optional.
- OpenAlex basic queries can be tried anonymously; Content downloads need an OpenAlex key.
- Semantic Scholar supports many anonymous requests but may return rate limits or require authentication for particular operations.
- Sciverse requires its own data token.
- Elicit requires an API-enabled paid account; leaving it unconfigured does not block the other sources.
- Shared AI requires your own compatible model Base URL, model name and API key. It does not require a Sciverse data token.

Use **数据连接设置** (data connection settings) independently of any model. **可选模型设置** (optional model settings) appears only after enabling the AI extension. Settings are saved only in local, Git-ignored `local.config*.json` files with owner-only permissions where supported. Optional environment names are listed in `.env.example`; values are intentionally blank.

API and model calls may incur charges under your provider account. Research-task creation and model calls are user-initiated. They are not started merely by selecting another source.

## Boundaries

- Each provider has its own coverage, identifiers, access policies and rate limits. Missing data is not invented.
- Full-query aggregation is distinguished from statistics over the returned sample.
- Citations, recommendations and paper-internal relations have different meanings.
- Shared AI validates catalog IDs. Nonempty extracted fields must contain a quote matching that paper's supplied material; this does not prove the scientific interpretation is correct.
- Screening/extraction use at most eight papers per request, with up to five extraction fields; other shared-AI analyses use at most twenty. Text may be truncated, and the displayed basis states whether full-text excerpts were supplied.
- This is a **local, single-user application**. Publicly releasing its source code does not make it suitable for an unauthenticated internet deployment. See [SECURITY.md](SECURITY.md).

## Development and checks

```bash
./run.sh lint test build
python3 scripts/check_publication.py
npm --prefix frontend audit --omit=dev --audit-level=high
```

Automated tests use mocked provider/model responses and require no real credentials. Provider acceptance checks are distinct from unit tests; integrations requiring unavailable credentials are not represented as having passed live validation. Consult [capabilities and validation](docs/SOURCE_CAPABILITIES.md).

## License and contribution

The repository uses the terms in the inherited [LICENSE](LICENSE), with attribution in [NOTICE](NOTICE). Its text is labeled Apache License 2.0 but differs from the standard in clauses 6 and 9; GitHub identifies it as Other. See [the license note](docs/LICENSE_NOTE.md). Service/data licenses and API access terms remain separate. Contributions should preserve source provenance, explicit missing-data handling, and server-side credential storage. See [CONTRIBUTING.md](CONTRIBUTING.md).
