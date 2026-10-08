# PaperScope release checks — 2026-10-08

- The retired reader UI, graph assembly, automatic topic/guide routes, their exclusive tests and outdated documentation/assets were removed. Current runtime and OpenAPI checks confirm that the old reader routes are absent.
- Backend: 89 tests passed; Python lint passed. Frontend: 21 tests passed; TypeScript and production build passed. Lower counts reflect deleted feature-specific tests; current adapters, shared analysis, connection settings, credential handling and pure-API behavior remain covered.
- Browser acceptance confirmed the PaperScope name, source selection, independent data settings, comparison view, a successful direct Sciverse Schema search, no automatic model calls, no browser errors and no horizontal overflow at 390 pixels.
- Retired graph/Markdown/math/icon dependencies were removed. The production dependency audit reported zero vulnerabilities at release preparation; this is a dated check, not a guarantee against future findings.
- Publication scanning found no matched local credentials or private runtime files. Configuration, logs, downloaded papers and browser screenshots are excluded.
- Original LICENSE and NOTICE attribution remain. Modified inherited files identify their changes. The current application is PaperScope; prior product names appear only in provenance/history contexts.

Automated tests use mocked services and do not need real keys. Live checks are small acceptance samples, not proof that every operation works for every account or record. See SOURCE_CAPABILITIES.md and SECURITY.md.

- Content-boundary revision: 87 backend tests and 19 frontend tests pass. Live browser checks exercised the same RSI paper as PubMed metadata and Europe PMC XML, OpenAlex TEI reading, and Sciverse marker 137 provenance. Source counts use official pages and recorded API queries; the Sciverse exact OA total remains explicitly unconfirmed. The requested glossary block was removed.

Full/segment content reading is now selectable. Backend tests verify that full mode omits both offset and limit even if stale values are supplied. A live RSI example returned 618 characters for a 700-character segment request and 166354 characters for a full request; the latter reported more=false. Browser checks confirmed stable response-mode labels, request-free toggles, comparison history and mobile layout. See CONTENT_READ_MODES.md.
