# Shared AI workflows

The application implements its own AI workflows over returned literature. These do not require an Elicit subscription.

1. Choose a source and fetch papers.
2. Open **AI 研究助手 · 共用模型配置** (shared AI assistant) in the result set or paper detail.
3. Choose a mode and review the scope and input before submitting.
4. Inspect citations, evidence basis and limitations, then export if useful.

| Mode | Output |
| --- | --- |
| Reading guide | Suggested ordering, reading focus and questions |
| Comparison | Comparisons tied to the supplied paper IDs |
| Material-grounded Q&A | Answers limited to the supplied material |
| Screening | Include/exclude/uncertain suggestions against your stated criteria |
| Field extraction | Requested values, verbatim supporting quotations and material type |
| Review draft | Cited sections over the current bounded collection |

Screening and extraction use at most eight papers; extraction supports one to five unique fields. Other modes use at most twenty papers. Abstracts are limited to 3,500 characters per paper. Supplied full-text excerpts also have length limits.

The backend rejects out-of-catalog paper IDs. A nonempty extracted value must include a quotation found in the same paper's stated input material, allowing whitespace normalization only. Unsupported fields remain null. This verifies quotation presence, not the correctness of an interpretation or a scientific conclusion.

Europe PMC text and matched OpenAlex TEI text can be included after loading. Metadata/abstract-only analyses are labeled accordingly. Shared AI never silently claims to have read a PDF that was only linked or downloaded.

Outputs can be exported as JSON, CSV (screening/extraction), or Markdown (review drafts). Results remain in the browser session unless you explicitly download them. Generated reviews are drafts and do not imply a comprehensive search or completed systematic review.

Configure your own model in **Shared model settings**. The data-provider key and model key are separate. Clicking an AI operation sends the selected material to your chosen model endpoint and can incur usage charges. Calls are not automatically started when switching sources. Long operations have bounded waits and explicit errors.
