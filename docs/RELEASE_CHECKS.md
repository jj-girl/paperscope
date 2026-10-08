# Publication checks — 2026-10-08

- Fresh publication snapshot: runtime configuration, caches, logs, downloaded papers, generated research results and screenshots were excluded.
- Original LICENSE and NOTICE retained; modified inherited source files carry change notices.
- Source scan checked publication candidates for private runtime paths, credential-shaped strings and exact matches to locally configured secrets. Secret values were never printed or copied into the snapshot.
- PaperScope cleanup revision: 85 backend tests and 12 frontend tests passed; Python lint, TypeScript and production build passed.
- Browser acceptance confirmed named API buttons, direct Schema search, the database comparison view, no automatic model requests, and no horizontal overflow at 390 pixels. Direct live Schema search/entities/detail/relations/citations/materials returned successful responses.
- Development dependencies were upgraded for publication, including Vitest 5.0.3, removing the high/critical findings from the inherited development dependency audit.
- The audit at preparation time still reported four low-severity findings in the KaTeX dependency chain. The production audit at the high-severity threshold passed. Do not interpret this dated check as a guarantee against future vulnerabilities.
- CI runs tests without provider/model credentials. Live credentials and acceptance artifacts are not distributed.

Provider/model acceptance samples and their limits are described in SOURCE_CAPABILITIES.md. This is a local, single-user application; review SECURITY.md before changing its deployment boundary.

The reduced test count reflects removal of tests exclusive to the retired reader, graph assembly and automatic guide. Current data adapters, shared analysis, connection settings, credential handling, removed-route checks and pure-API behavior remain covered.
