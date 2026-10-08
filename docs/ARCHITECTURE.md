# PaperScope architecture

The browser presents researched source descriptions and native endpoint names. Same-origin requests go through the local FastAPI service, which reads server-side credentials, validates bounded inputs and calls the selected provider. The result is shown as records, structured fields, aggregates, citation edges or available content.

The default page loads only provider status and Sciverse data-connection status. It does not load or call model settings, discovery, topic exploration or automatic guide generation. An explicit optional-AI switch exposes model settings and supported result analysis; vendor generation tasks are blocked by the UI in data mode.

Source definitions live in `frontend/src/apiResearch.ts` and `apiOperations.ts`. The documentation generator uses those same definitions. Backend mappings live in `literature.py`, `advanced.py` and `sciverse_data.py`. No single normalized paper format is claimed to preserve every provider field; Schema results remain structured objects, and metadata responses preserve additional provider fields where supported.

`settings_api.py` persists data/model settings independently. It does not construct the former Sciverse reader gateway. `semantic_access.py` implements the source-specific bounded retry/cache behavior. `model_runtime.py` is only the optional model transport; the former QueryPlanner and GuideGenerator are removed.

The original reader's components, models, graph assembly, mappings, topic routes and screenshots are deleted from the current tree. Attribution and license records remain; Git history records earlier versions.
