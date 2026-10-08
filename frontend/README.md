# PaperScope frontend

React + TypeScript + Vite. `main.tsx` mounts `ApiWorkbench`.

- `apiResearch.ts`: database scope, official references and input/output definitions.
- `apiOperations.ts`: operation buttons and parameter forms.
- `coverageProfiles.ts`, `contentAccess.ts`: dated source counts and explicit per-operation/per-record content boundaries.
- `apiExamples.ts`: RSI examples and field help, with runtime IDs left for prerequisite steps.
- `ArticleContent.tsx`: explicit XML/PDF retrieval, successful acquisition state, paragraph reading and annotation cards.
- `ServiceTools.tsx`: requests, result displays, file previews and exports.
- `SourceConnections.tsx`: independent data and optional model settings.
- `SharedAi.tsx`: explicitly enabled AI analysis for supported paper results.
- `literatureTypes.ts`: shared paper types, independent of any page component.

The former App/SourceApp reader, graph canvases, reading boards, purpose guide, translation layer and their styles/assets are deleted. Only the API workbench is shipped. Selecting an operation never starts a request; submitting its form does.

Run from the repository root with `./run.sh frontend`. Provider keys remain on the backend; the client bundle contains no saved credentials.
