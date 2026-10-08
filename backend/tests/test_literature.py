import json
import stat

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app.literature import abstract_from_index, safe_url
from app.local_config import LocalConfigDocument
from app.main import create_app
from app.semantic_access import SemanticAccess


@pytest.fixture
def client(tmp_path, monkeypatch):
    for key in ("NCBI_API_KEY", "OPENALEX_API_KEY", "SEMANTIC_SCHOLAR_API_KEY", "ELICIT_API_KEY"):
        monkeypatch.delenv(key, raising=False)
    app = create_app()
    app.state.semantic_access = SemanticAccess(max_attempts=1)
    app.state.literature_config = LocalConfigDocument(tmp_path / "keys.json")
    return TestClient(app)


def test_keys_are_local_owner_only_and_never_returned(client):
    result = client.put("/api/literature/elicit/key", json={"api_key": "test-secret"})
    assert result.json() == {"configured": True}
    status = client.get("/api/literature/providers")
    assert "test-secret" not in status.text
    path = client.app.state.literature_config.path
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    assert json.loads(path.read_text())["elicit"]["api_key"] == "test-secret"
    client.put("/api/literature/elicit/key", json={"api_key": ""})
    assert client.post("/api/literature/elicit/search", json={"query": "test"}).status_code == 503


def test_disabled_settings_and_missing_credentials(client):
    client.app.state.allow_local_literature_config = False
    assert client.put("/api/literature/openalex/key", json={"api_key": "secret"}).status_code == 403
    assert client.post("/api/literature/elicit/search", json={"query": "test"}).status_code == 503


@respx.mock
def test_pubmed_preserves_search_order_and_structured_abstract(client):
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    respx.get(base + "esearch.fcgi").respond(
        json={
            "esearchresult": {
                "idlist": ["2", "1"],
                "count": "20",
                "querytranslation": '"test"[All Fields]',
            }
        }
    )
    records = """<PubmedArticleSet>
    <PubmedArticle><MedlineCitation><PMID>1</PMID><Article>
    <ArticleTitle>Paper <i>one</i></ArticleTitle>
    <Abstract><AbstractText Label="RESULTS">Result <b>A</b>.</AbstractText></Abstract>
    <AuthorList><Author><ForeName>Jane</ForeName><LastName>Doe</LastName></Author></AuthorList>
    <Journal><Title>Journal</Title><JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue></Journal>
    </Article></MedlineCitation><PubmedData><ArticleIdList>
    <ArticleId IdType="doi">10.1/test</ArticleId><ArticleId IdType="pmc">PMC1</ArticleId>
    </ArticleIdList></PubmedData></PubmedArticle>
    <PubmedArticle><MedlineCitation><PMID>2</PMID><Article><ArticleTitle>Two</ArticleTitle>
    </Article></MedlineCitation></PubmedArticle></PubmedArticleSet>"""
    respx.get(base + "efetch.fcgi").respond(text=records)
    response = client.post("/api/literature/pubmed/search", json={"query": "test", "size": 2})
    assert response.status_code == 200
    data = response.json()
    assert [p["id"] for p in data["papers"]] == ["2", "1"]
    assert data["papers"][1]["abstract"] == "RESULTS: Result A."
    assert data["papers"][1]["authors"] == ["Jane Doe"]
    assert data["papers"][0]["abstract"] is None
    assert data["papers"][1]["fulltext_readable"] is False
    assert "schema_id" not in response.text
    assert data["total"] == 20


@respx.mock
def test_europepmc_marks_only_open_pmc_as_readable(client):
    respx.get("https://www.ebi.ac.uk/europepmc/webservices/rest/search").respond(
        json={
            "hitCount": 2,
            "resultList": {
                "result": [
                    {
                        "id": "1",
                        "source": "MED",
                        "title": "Open",
                        "pmcid": "PMC123",
                        "isOpenAccess": "Y",
                    },
                    {
                        "id": "2",
                        "source": "MED",
                        "title": "Closed",
                        "pmcid": "PMC456",
                        "isOpenAccess": "N",
                    },
                ]
            },
        }
    )
    data = client.post("/api/literature/europepmc/search", json={"query": "test"}).json()
    assert [p["fulltext_readable"] for p in data["papers"]] == [True, False]
    assert data["papers"][0]["abstract"] is None


@respx.mock
def test_openalex_reconstructs_abstract_and_allows_missing_source(client):
    respx.get("https://api.openalex.org/works").respond(
        json={
            "meta": {"count": 1},
            "results": [
                {
                    "id": "https://openalex.org/W1",
                    "display_name": "Title",
                    "abstract_inverted_index": {"world": [1], "Hello": [0, 2]},
                    "primary_location": None,
                    "best_oa_location": None,
                    "cited_by_count": 0,
                }
            ],
        }
    )
    data = client.post("/api/literature/openalex/search", json={"query": "test"}).json()
    assert data["papers"][0]["abstract"] == "Hello world Hello"
    assert data["papers"][0]["citation_count"] == 0
    assert data["papers"][0]["fulltext_url"] is None


@respx.mock
def test_rate_limit_does_not_become_empty_results_or_leak_upstream_body(client):
    route = respx.get("https://api.semanticscholar.org/graph/v1/paper/search")
    route.respond(status_code=429, json={"message": "secret-upstream-details"})
    response = client.post("/api/literature/semantic_scholar/search", json={"query": "test"})
    assert response.status_code == 429
    assert "限" in response.json()["detail"]
    assert "secret-upstream" not in response.text
    assert route.call_count == 1


@respx.mock
def test_elicit_search_only_does_not_create_a_research_session(client):
    client.put("/api/literature/elicit/key", json={"api_key": "local-key"})
    route = respx.post("https://elicit.com/api/v2/search/papers").respond(
        json={
            "papers": [
                {
                    "elicitId": "p1",
                    "title": "T",
                    "authors": ["A"],
                    "doi": "10.1/test",
                    "abstract": None,
                    "fullTextUrl": "javascript:alert(1)",
                    "citedByCount": None,
                }
            ],
            "warnings": ["internal account detail"],
        }
    )
    response = client.post("/api/literature/elicit/search", json={"query": "test", "size": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] is None
    assert data["papers"][0]["fulltext_url"] is None
    assert "internal account detail" not in response.text
    assert route.calls.last.request.headers["Authorization"] == "Bearer local-key"
    assert json.loads(route.calls.last.request.content) == {"query": "test", "maxResults": 5}


@respx.mock
def test_fulltext_is_ordered_but_not_claimed_as_schema_provenance(client):
    respx.get("https://www.ebi.ac.uk/europepmc/webservices/rest/PMC123/fullTextXML").respond(
        text=(
            "<article><body><sec><title>Methods</title>"
            "<p>Use <italic>X</italic>.</p></sec></body></article>"
        )
    )
    response = client.get("/api/literature/europepmc/fulltext/PMC123")
    assert response.status_code == 200
    assert response.json()["paragraphs"] == [
        {"kind": "title", "text": "Methods"},
        {"kind": "p", "text": "Use X."},
    ]
    assert "尚未" in response.json()["note"]
    assert "marker_num" not in response.text
    assert client.get("/api/literature/europepmc/fulltext/not-an-id").status_code == 422


@respx.mock
def test_invalid_upstream_response_and_empty_search_are_distinct(client):
    route = respx.get("https://api.openalex.org/works")
    route.respond(text="not-json")
    assert client.post("/api/literature/openalex/search", json={"query": "test"}).status_code == 502
    route.respond(json={"results": [], "meta": {"count": 0}})
    response = client.post("/api/literature/openalex/search", json={"query": "test"})
    assert response.status_code == 200
    assert response.json()["papers"] == []


@respx.mock
def test_timeout_is_reported_and_query_limits_are_enforced(client):
    respx.get("https://api.openalex.org/works").mock(side_effect=httpx.ReadTimeout("upstream"))
    assert client.post("/api/literature/openalex/search", json={"query": "test"}).status_code == 504
    assert client.post("/api/literature/pubmed/search", json={"query": " "}).status_code == 422
    assert (
        client.post(
            "/api/literature/pubmed/search", json={"query": "test", "size": 100}
        ).status_code
        == 422
    )
    assert client.post("/api/literature/unknown/search", json={"query": "test"}).status_code == 422


def test_missing_abstract_and_unsafe_links_are_not_fabricated():
    assert abstract_from_index(None) is None
    assert safe_url("javascript:alert(1)") is None
    assert safe_url("https://user:secret@example.org") is None
    assert safe_url("https://[invalid") is None


@pytest.mark.parametrize("kind", ["references", "recommendations"])
@respx.mock
def test_semantic_neighbors_keep_reference_and_recommendation_semantics_distinct(client, kind):
    seed = "a" * 40
    paper = {"paperId": "b" * 40, "title": "Neighbor", "authors": [], "externalIds": {}}
    if kind == "references":
        url = f"https://api.semanticscholar.org/graph/v1/paper/{seed}/references"
        payload = {"data": [{"citedPaper": paper}, {"citedPaper": None}]}
    else:
        url = f"https://api.semanticscholar.org/recommendations/v1/papers/forpaper/{seed}"
        payload = {"recommendedPapers": [paper]}
    route = respx.get(url).respond(json=payload)
    response = client.get(f"/api/literature/semantic_scholar/papers/{seed}/{kind}")
    assert response.status_code == 200
    assert response.json()["kind"] == kind
    assert len(response.json()["papers"]) == 1
    assert route.calls.last.request.url.params["limit"] == "20"
    assert (
        client.get(f"/api/literature/semantic_scholar/papers/not-an-id/{kind}").status_code == 422
    )


def test_oa_status_is_independent_of_available_content_formats():
    from app.literature import openalex_paper

    paper = openalex_paper(
        {
            "id": "https://openalex.org/W1",
            "open_access": {"is_oa": True},
            "best_oa_location": {"pdf_url": "https://publisher.example/paper.pdf"},
            "has_content": {"pdf": False, "grobid_xml": False},
        }
    )
    assert paper.is_open_access is True
    assert paper.content_status_known is True
    assert paper.content_formats == []
    assert paper.fulltext_readable is False
    unknown = openalex_paper({"id": "https://openalex.org/W2"})
    assert unknown.is_open_access is None
    assert unknown.content_status_known is False


@respx.mock
def test_fulltext_can_download_actual_xml_without_changing_paragraph_contract(client):
    xml = "<article><body><sec><title>Methods</title><p>RSI body.</p></sec></body></article>"
    route = respx.get(
        "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC123/fullTextXML"
    ).respond(text=xml, headers={"Content-Type": "application/xml"})
    downloaded = client.get("/api/literature/europepmc/fulltext/PMC123?format=xml")
    assert downloaded.status_code == 200
    assert downloaded.text == xml
    assert "application/xml" in downloaded.headers["content-type"]
    assert 'filename="PMC123.xml"' in downloaded.headers["content-disposition"]
    rendered = client.get("/api/literature/europepmc/fulltext/PMC123").json()
    assert rendered["paragraphs"][-1]["text"] == "RSI body."
    assert route.call_count == 2
    assert client.get("/api/literature/europepmc/fulltext/123?format=xml").status_code == 422
