# Publication checks — 2026-10-08

- Fresh publication snapshot: runtime configuration, caches, logs, downloaded papers, generated research results and screenshots were excluded.
- Original LICENSE and NOTICE retained; modified inherited source files carry change notices.
- Source scan checked publication candidates for private runtime paths, credential-shaped strings and exact matches to locally configured secrets. Secret values were never printed or copied into the snapshot.
- Backend: 97 tests passed; Python lint passed.
- Frontend: 39 tests passed; TypeScript and production build passed.
- Development dependencies were upgraded for publication, including Vitest 5.0.3, removing the high/critical findings from the inherited development dependency audit.
- The audit at preparation time still reported four low-severity findings in the KaTeX dependency chain. The production audit at the high-severity threshold passed. Do not interpret this dated check as a guarantee against future vulnerabilities.
- CI runs tests without provider/model credentials. Live credentials and acceptance artifacts are not distributed.

Provider/model acceptance samples and their limits are described in SOURCE_CAPABILITIES.md. This is a local, single-user application; review SECURITY.md before changing its deployment boundary.
