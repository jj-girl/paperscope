# FrontierLens Multisource backend

Modified from the upstream Sciverse backend. FastAPI routes retain the original Paper Schema contracts and add bounded adapters for PubMed, Europe PMC, OpenAlex, Semantic Scholar and Elicit, plus shared model workflows.

Provider keys stay server-side. Source identity, citations, recommendations, annotations and generated text remain distinct. See the root README, docs/SOURCE_CAPABILITIES.md and SECURITY.md.
