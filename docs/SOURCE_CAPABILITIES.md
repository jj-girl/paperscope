# Source capabilities and validation

The application distinguishes provider capabilities, implemented operations, and live verification. No provider's full API surface is claimed to be implemented.

The current entry point is the API Workbench, defaulting to no application-side LLM. See the [dated database-scope and endpoint reference](API_REFERENCE_RESEARCH.md), generated from the same definitions as the 67 operation buttons. The original reader components, routes, graph assembly and their exclusive tests/assets have been deleted from the current source tree.

| Provider | Implemented | Access and validation boundary |
| --- | --- | --- |
| Sciverse | Metadata catalog/search/relations, semantic evidence, text/resources, and all 18 documented Paper Schema routes through 19 operation entries | Data access does not require the model. Direct Schema search, entities/detail, relations, citations and materials passed live checks. All Schema routes have mocked dispatch tests proving no model calls. Resource availability remains item-specific. |
| PubMed | Search, abstracts, MeSH, publication types, date/type filters, ELink relations, history sets and PMID batches | Biomedical records are not full text. Core search/filter/history/batch paths were exercised without an NCBI key. |
| Europe PMC | Search, open text, annotations/context, references/citations and data links | Searchable does not mean downloadable. Open-text and annotation examples were exercised. Text-mined annotations are not verified scientific claims. |
| OpenAlex | Search, whole-query grouping, author/institution details and works, incoming/outgoing citations, PDF/TEI download | Content requires a key. Core endpoints and example PDF/TEI files were exercised. Group buckets still require paging. Expanded-corpus selection is not exposed in this version. |
| Semantic Scholar | Search, reference/citation paging, recommendations, author exploration, batches and citation diagrams | Anonymous calls may be throttled or require authentication. Successful data paths are contract-tested; anonymous live checks encountered 429. No empty-result substitution is used. |
| Elicit | Search, report/review/agent creation, sessions/status/events, messages/stop/resume, sources, artifact content and download links | Optional paid API access. Adapter and failure-path tests use mocks; no claim of a completed live Elicit workflow is made. |

## Shared model

The same optional model configuration can be used over supported result sets after explicitly enabling the AI extension. See [SHARED_AI.md](SHARED_AI.md). The former Sciverse model-guided journey is no longer part of the active UI. Elicit generation buttons expose their contracts but are disabled in pure-data mode.

## Operational limits

- Quick search reads 5/10/20 records; extended operations expose bounded paging/batches.
- Semantic Scholar reads use per-credential throttling, at most three attempts, a roughly 45-second budget, Retry-After handling, and a five-minute bounded in-memory JSON cache. Authentication failures and task/configuration writes are not retried.
- Downloads are capped at 64 MiB per response and use fixed service endpoints. The current file proxy rejects redirects rather than forwarding credentials.
- Shared screening/extraction analyzes up to eight papers and five requested fields. Other shared analyses analyze up to twenty papers.
- Source and model failures are explicit. Cache hits and successful tests do not guarantee complete coverage or continuous provider availability.

## Verification

The PaperScope cleanup revision was validated with 85 backend and 12 frontend tests, plus build/type/lint checks. Browser checks confirmed that opening the page and running Schema search did not request model, discovery, topic or shared-AI routes; the 390-pixel layout had no horizontal overflow or browser errors. Tests use synthetic credentials and mocked services; GitHub Actions needs no real API keys. These checks do not imply all 67 operations passed live validation.

Live checks were small acceptance examples, not retrieval-quality or scientific-validity benchmarks. Private run logs, downloaded articles and generated research results are excluded from the repository.

The reduced test count reflects removal of tests exclusive to the retired reader, graph assembly and automatic guide. Current data adapters, shared analysis, connection settings, credential handling, removed-route checks and pure-API behavior remain covered.
