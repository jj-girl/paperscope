# Source capabilities and validation

The application distinguishes provider capabilities, implemented operations, and live verification. No provider's full API surface is claimed to be implemented.

| Provider | Implemented | Access and validation boundary |
| --- | --- | --- |
| Sciverse | Original Paper Schema journey; metadata catalog/search, semantic evidence, source-text paging and resource retrieval | Data and model connections are separate. A bounded search→graph→AI guide and paragraph/provenance examples were exercised. Resource availability remains item-specific. |
| PubMed | Search, abstracts, MeSH, publication types, date/type filters, ELink relations, history sets and PMID batches | Biomedical records are not full text. Core search/filter/history/batch paths were exercised without an NCBI key. |
| Europe PMC | Search, open text, annotations/context, references/citations and data links | Searchable does not mean downloadable. Open-text and annotation examples were exercised. Text-mined annotations are not verified scientific claims. |
| OpenAlex | Search, returned-sample overview, whole-query grouping, author/institution details and works, incoming/outgoing citations, PDF/TEI download | Content requires a key. Core endpoints and example PDF/TEI files were exercised; TEI text can feed shared AI when its paper ID matches. Group buckets still require paging. |
| Semantic Scholar | Search, reference/citation paging, recommendations, author exploration, batches and citation diagrams | Anonymous calls may be throttled or require authentication. Successful data paths are contract-tested; anonymous live checks encountered 429. No empty-result substitution is used. |
| Elicit | Search, report/review/agent creation, sessions/status/events, messages/stop/resume, sources, artifact content and download links | Optional paid API access. Adapter and failure-path tests use mocks; no claim of a completed live Elicit workflow is made. |

## Shared model

The same model configuration is used across supported literature workspaces. See [SHARED_AI.md](SHARED_AI.md). Sciverse keeps its original schema-grounded guide in addition to the general source integrations.

## Operational limits

- Quick search reads 5/10/20 records; extended operations expose bounded paging/batches.
- Semantic Scholar reads use per-credential throttling, at most three attempts, a roughly 45-second budget, Retry-After handling, and a five-minute bounded in-memory JSON cache. Authentication failures and task/configuration writes are not retried.
- Downloads are capped at 64 MiB per response and use fixed service endpoints. The current file proxy rejects redirects rather than forwarding credentials.
- Shared screening/extraction analyzes up to eight papers and five requested fields. Other shared analyses analyze up to twenty papers.
- Source and model failures are explicit. Cache hits and successful tests do not guarantee complete coverage or continuous provider availability.

## Verification

The source baseline was validated with 97 backend and 39 frontend tests, plus build/type/lint checks. Public-release dependency updates are checked again before publication. Tests use synthetic credentials and mocked services; GitHub Actions needs no real API keys.

Live checks were small acceptance examples, not retrieval-quality or scientific-validity benchmarks. Private run logs, downloaded articles and generated research results are excluded from the repository.
