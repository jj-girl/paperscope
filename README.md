# PaperScope

**A literature API workbench: coverage, granularity, inputs and outputs.**

[简体中文](README.zh-CN.md) · [API reference](docs/API_REFERENCE_RESEARCH.md) · [Count audit](docs/COUNT_AUDIT.md) · [Integration status](docs/SOURCE_CAPABILITIES.md) · [Optional AI](docs/SHARED_AI.md)

PaperScope exposes **Sciverse, PubMed, Europe PMC, OpenAlex, Semantic Scholar and Elicit** through named API operation buttons. Inspect each database's scope, select an endpoint, enter parameters, run it, and inspect or export its response. A comparison view explains differences in coverage and data granularity.

The default mode does not call a user-configured LLM. There are 67 operation entries, not 67 distinct APIs or a claim to cover every vendor capability. Selection alone never triggers a request. The old FrontierLens reader, graph pages, topic exploration and guided-reading backend have been removed from the current source tree.

Every operation now has RSI parameter examples and field help. Results distinguish external links, eligible XML/PDF files, successfully fetched text, annotations and provenance passages. See [RSI examples](docs/RSI_EXAMPLES.md).

## Capabilities

| Source | Direct API operations |
| --- | --- |
| Sciverse | Metadata, snippets/text/resources, Schema entities/relations, citations, evidence, provenance and material packs |
| PubMed | Biomedical records, abstracts, MeSH, filters, linked IDs, history and PMID batches |
| Europe PMC | Life-science records, available full-text XML, annotations, references, citations and database links |
| OpenAlex | Scholarly objects, whole-query grouping, authors/institutions, citations and available PDF/TEI content |
| Semantic Scholar | Papers/authors, references, citations, recommendations and batches |
| Elicit | Search and existing task outputs; generation is disabled in default data mode |

Metadata, full text and structured extraction have different coverage. Provider-side retrieval and precomputed extraction are distinguished from generation. Missing data is not invented, and identifiers are not interchangeable.

## Quick start

Requirements: Python 3.11+ (3.12 recommended), [uv](https://docs.astral.sh/uv/), Node.js 22.12+ or 24+, npm and make.

```bash
git clone https://github.com/jj-girl/paperscope.git
cd paperscope
./run.sh setup
```

Run in separate terminals:

```bash
./run.sh backend
```

```bash
./run.sh frontend
```

Open **http://127.0.0.1:3040**. The frontend proxies the backend at port 8040; both are required. For a remote host, forward port 3040 with SSH.

## Configuration and optional AI

No API keys, accounts, runtime responses or paper datasets are distributed. Use each source's **数据连接设置** (data connection settings). PubMed and Europe PMC support anonymous access; Sciverse needs a data token, OpenAlex content needs a key, Semantic Scholar anonymous calls may be throttled, and Elicit needs paid API access.

The **启用 AI 扩展（可选）** switch is off by default. Enable it to configure a shared model and analyze supported paper result sets, or to start Elicit's own generation tasks. Shared analysis supports guides, comparison, Q&A, screening, extraction and review drafts; this is independent of the removed reader. See [SHARED_AI.md](docs/SHARED_AI.md).

Keys stay in local, Git-ignored `local.config*.json` files, with owner-only permissions where supported. Calls can incur provider charges. This is a local, single-user application; see [SECURITY.md](SECURITY.md).

## Development

```bash
./run.sh lint test build
python3 scripts/check_publication.py
node scripts/export_api_reference.mjs
```

Tests use mocked services and synthetic credentials. Small live acceptance checks do not prove complete integration coverage or retrieval quality. See [validation boundaries](docs/SOURCE_CAPABILITIES.md).

## Provenance and license

PaperScope evolved from [FrontierLens at e67f0b2](https://github.com/Shannon4Science/sciverse-frontier-lens/tree/e67f0b2a0f940bd56e1b4b3f444c21ff3210e54f), formerly named FrontierLens Multisource. Upstream attribution remains in [NOTICE](NOTICE) and [UPSTREAM.md](docs/UPSTREAM.md).

The inherited [LICENSE](LICENSE) is preserved verbatim. Its title says Apache License 2.0, but clauses 6 and 9 differ from the standard; do not assume a standard Apache-2.0 SPDX license. See [LICENSE_NOTE.md](docs/LICENSE_NOTE.md). Literature and API access rights are separate from the software license.
