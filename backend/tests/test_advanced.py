import json

import httpx
import pytest
import respx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.local_config import LocalConfigDocument
from app.main import create_app
from app.model_config import ModelConfigStore, ModelConnection
from app.sciverse_config import SciverseConfigStore, SciverseConnection


@pytest.fixture
def client(tmp_path, monkeypatch):
    for name in ("OPENALEX_API_KEY", "SEMANTIC_SCHOLAR_API_KEY", "ELICIT_API_KEY", "NCBI_API_KEY"):
        monkeypatch.delenv(name, raising=False)
    app = create_app()
    doc = LocalConfigDocument(tmp_path / "local.config.json")
    app.state.literature_config = doc
    app.state.sciverse_store = SciverseConfigStore(doc, SciverseConnection())
    app.state.model_store = ModelConfigStore(doc, ModelConnection())
    return TestClient(app)


def post(client, provider, operation, **body):
    return client.post(f"/api/advanced/{provider}/{operation}", json=body)


@respx.mock
def test_aggregate_is_full_query_and_passes_opaque_cursor(client):
    route = respx.get("https://api.openalex.org/works").respond(
        json={
            "meta": {"count": 12000, "next_cursor": "opaque-next"},
            "group_by": [{"key": "2024", "key_display_name": "2024", "count": 700}],
        }
    )
    response = post(
        client, "openalex", "aggregate", query="test topic", group="year", cursor="opaque"
    )
    assert response.status_code == 200
    assert response.json()["total"] == 12000
    assert response.json()["next_cursor"] == "opaque-next"
    params = route.calls.last.request.url.params
    assert params["search"] == "test topic"
    assert params["cursor"] == "opaque"
    assert params["group_by"] == "publication_year:include_unknown"


@respx.mock
def test_openalex_reference_direction_and_paging(client):
    respx.get("https://api.openalex.org/works/W1").respond(
        json={"referenced_works": ["https://openalex.org/W2", "https://openalex.org/W3"]}
    )
    route = respx.get("https://api.openalex.org/works").respond(
        json={"results": [{"id": "https://openalex.org/W2", "display_name": "Target"}]}
    )
    data = post(client, "openalex", "references", record_id="W1", size=1).json()
    assert data["edges"] == [{"source": "W1", "target": "W2", "type": "citation"}]
    assert data["next_page"] == 2
    assert route.calls.last.request.url.params["filter"] == "openalex:W2"


@respx.mock
def test_openalex_citation_direction(client):
    respx.get("https://api.openalex.org/works").respond(
        json={
            "meta": {"count": 1},
            "results": [{"id": "https://openalex.org/W2", "display_name": "Citing"}],
        }
    )
    assert post(client, "openalex", "citations", record_id="W1").json()["edges"][0] == {
        "source": "W2",
        "target": "W1",
        "type": "citation",
    }


@respx.mock
def test_pubmed_filters_and_history_are_reusable(client):
    search = respx.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi").respond(
        json={
            "esearchresult": {"count": "0", "idlist": [], "webenv": "history-id", "querykey": "1"}
        }
    )
    data = post(
        client,
        "pubmed",
        "filtered_search",
        query="cancer",
        year_from=2020,
        year_to=2025,
        publication_type="Review",
    ).json()
    assert data["webenv"] == "history-id"
    term = search.calls.last.request.url.params["term"]
    assert "2020:2025[dp]" in term and '"Review"[pt]' in term
    assert (
        post(
            client, "pubmed", "filtered_search", query="x", year_from=2025, year_to=2020
        ).status_code
        == 422
    )
    respx.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi").respond(
        text="<eFetchResult><ERROR>Expired</ERROR></eFetchResult>"
    )
    assert post(client, "pubmed", "history", webenv="expired", query_key="1").status_code == 410


@respx.mock
def test_annotations_keep_source_and_entity_uri(client):
    respx.get("https://www.ebi.ac.uk/europepmc/annotations_api/annotationsByArticleIds").respond(
        json=[
            {
                "annotations": [
                    {
                        "exact": "gene",
                        "prefix": "the",
                        "postfix": "works",
                        "id": "https://europepmc.org/article/MED/1#x",
                        "tags": [{"name": "X", "uri": "https://example.org/gene"}],
                        "type": "Gene",
                    }
                ]
            }
        ]
    )
    data = post(client, "europepmc", "annotations", record_id="MED:1").json()
    assert data["items"][0]["text"] == "the gene works"
    assert data["items"][0]["details"]["tags"][0]["uri"] == "https://example.org/gene"
    assert "不视为" in data["note"]
    assert post(client, "europepmc", "annotations", record_id="https://evil.org").status_code == 422


@respx.mock
def test_semantic_null_citation_target_does_not_crash(client):
    pid = "a" * 40
    respx.get(f"https://api.semanticscholar.org/graph/v1/paper/{pid}/citations").respond(
        json={"data": [{"citingPaper": None}], "next": 20}
    )
    response = post(client, "semantic_scholar", "citations", record_id=pid)
    assert response.status_code == 200
    assert response.json()["next_offset"] == 20
    assert response.json()["items"] == []


@pytest.mark.parametrize(
    "operation,path,field",
    [
        ("report", "reports", "researchQuestion"),
        ("review", "systematic-reviews", "researchQuestion"),
        ("agent", "agents", "query"),
    ],
)
@respx.mock
def test_elicit_creation_requires_key_and_is_not_a_completed_report(client, operation, path, field):
    assert post(client, "elicit", operation, query="test").status_code == 503
    client.app.state.literature_config.update_section("elicit", {"api_key": "test-key"})
    route = respx.post(f"https://elicit.com/api/v2/sessions/{path}").respond(
        status_code=202, json={"sessionId": "s1", "status": "processing", "api_key": "test-key"}
    )
    response = post(client, "elicit", operation, query="test")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "processing"
    assert "test-key" not in response.text
    assert json.loads(route.calls.last.request.content)[field] == "test"
    assert route.call_count == 1


@respx.mock
def test_elicit_timeout_does_not_create_duplicate_task(client):
    client.app.state.literature_config.update_section("elicit", {"api_key": "test-key"})
    route = respx.post("https://elicit.com/api/v2/sessions/reports").mock(
        side_effect=httpx.ReadTimeout("timeout")
    )
    response = post(client, "elicit", "report", query="test")
    assert response.status_code == 504
    assert "状态未知" in response.json()["detail"]
    assert route.call_count == 1


@respx.mock
def test_content_key_stays_server_side_and_redirect_is_not_followed(client):
    assert client.get("/api/advanced/openalex/content/W1/pdf").status_code == 503
    client.app.state.literature_config.update_section("openalex", {"api_key": "download-secret"})
    route = respx.get("https://content.openalex.org/works/W1.pdf").respond(
        content=b"%PDF-1.4\nfixture", headers={"Content-Type": "application/pdf"}
    )
    response = client.get("/api/advanced/openalex/content/W1/pdf")
    assert response.status_code == 200
    assert "download-secret" not in str(response.headers)
    assert "attachment" in response.headers["content-disposition"]
    assert route.calls.last.request.url.params["api_key"] == "download-secret"
    route.respond(status_code=302, headers={"Location": "https://untrusted.example/file"})
    assert client.get("/api/advanced/openalex/content/W1/pdf").status_code == 502


@respx.mock
def test_sciverse_content_and_business_errors(client):
    client.app.state.sciverse_store = SciverseConfigStore(
        client.app.state.literature_config, SciverseConnection(api_key=SecretStr("sciverse-test"))
    )
    route = respx.get("https://api.sciverse.space/content").respond(
        json={"biz_code": 0, "text": "Source text", "more": True, "next_offset": 5000}
    )
    response = post(client, "sciverse", "content", record_id="doc1")
    assert response.json()["next_offset"] == 5000
    assert route.calls.last.request.headers["Authorization"] == "Bearer sciverse-test"
    route.respond(json={"biz_code": 1001, "message": "private-details"})
    response = post(client, "sciverse", "content", record_id="doc1")
    assert response.status_code == 502 and "private-details" not in response.text
    assert (
        client.get("/api/advanced/sciverse/resource", params={"file_name": "../secret"}).status_code
        == 422
    )


def enable_model(client, response):
    class FakeRuntime:
        last = None

        async def complete_json(self, **kwargs):
            self.last = kwargs
            return response

    client.app.state.model_store = ModelConfigStore(
        client.app.state.literature_config,
        ModelConnection(api_key=SecretStr("shared-model-test"), model="test"),
    )
    client.app.state.model_runtime = FakeRuntime()


def test_shared_model_plans_without_sciverse_key(client):
    assert (
        client.post("/api/shared-ai/plan", json={"provider": "pubmed", "query": "问题"}).status_code
        == 503
    )
    enable_model(client, {"query": "retrieval augmented generation", "explanation": "检索建议"})
    response = client.post("/api/shared-ai/plan", json={"provider": "pubmed", "query": "问题"})
    assert response.status_code == 200
    assert response.json()["query"] == "retrieval augmented generation"


@pytest.mark.parametrize("bad_id", [False, True])
def test_ai_analysis_is_catalog_constrained_and_labels_abstract_basis(client, bad_id):
    enable_model(
        client,
        {
            "overview": "test",
            "items": [
                {"paper_id": "invented" if bad_id else "1", "notes": "read", "questions": []}
            ],
            "comparisons": [],
            "limitations": [],
        },
    )
    response = client.post(
        "/api/shared-ai/analyze",
        json={
            "provider": "pubmed",
            "query": "compare",
            "papers": [
                {"id": "1", "provider": "pubmed", "title": "Paper", "abstract": "source abstract"}
            ],
        },
    )
    assert response.status_code == (502 if bad_id else 200)
    if not bad_id:
        assert "未读取全文" in response.json()["basis"]
        assert "untrusted data" in client.app.state.model_runtime.last["system"]


@respx.mock
def test_elicit_resume_does_not_forward_key_to_untrusted_url(client):
    client.app.state.literature_config.update_section("elicit", {"api_key": "test-key"})
    respx.get("https://elicit.com/api/v2/sessions/reports/s1").respond(
        json={"links": {"resume": "https://untrusted.example/resume"}}
    )
    response = post(client, "elicit", "resume", record_id="s1", kind="report")
    assert response.status_code == 502
    assert "test-key" not in response.text


@respx.mock
def test_elicit_artifact_and_followup_use_existing_session(client):
    client.app.state.literature_config.update_section("elicit", {"api_key": "test-key"})
    route = respx.get("https://elicit.com/api/v2/sessions/agents/s1/artifacts/opaque-id/content")
    route.respond(json={"artifactId": "opaque-id", "rows": [{"evidence": "source"}]})
    response = post(
        client, "elicit", "artifact_content", record_id="s1", kind="agent", artifact_id="opaque-id"
    )
    assert response.status_code == 200
    assert response.json()["data"]["rows"][0]["evidence"] == "source"
    message = respx.post("https://elicit.com/api/v2/sessions/agents/s1/messages")
    message.respond(status_code=202, json={"messageId": "m1"})
    response = post(
        client, "elicit", "message", record_id="s1", kind="agent", query="Compare methods"
    )
    assert response.status_code == 200
    assert json.loads(message.calls.last.request.content) == {"message": "Compare methods"}


@pytest.mark.parametrize(
    "quote,source_kind,status",
    [
        ("We evaluate retrieval on Dataset X.", "abstract", 200),
        ("We evaluate retrieval on Dataset Y.", "abstract", 502),
        ("We evaluate retrieval on Dataset X.", "fulltext", 502),
    ],
)
def test_extraction_quote_must_match_the_correct_material(client, quote, source_kind, status):
    enable_model(
        client,
        {
            "overview": "提取结果",
            "extractions": [
                {
                    "paper_id": "1",
                    "values": {
                        "数据集": {
                            "value": "Dataset X",
                            "supporting_quote": quote,
                            "source_kind": source_kind,
                        },
                    },
                }
            ],
        },
    )
    response = client.post(
        "/api/shared-ai/analyze",
        json={
            "provider": "pubmed",
            "query": "提取数据集",
            "mode": "extract",
            "extraction_fields": ["数据集"],
            "papers": [
                {
                    "id": "1",
                    "provider": "pubmed",
                    "title": "Paper",
                    "abstract": "We evaluate retrieval on Dataset X.",
                }
            ],
        },
    )
    assert response.status_code == status
    if status == 200:
        assert response.json()["extraction_fields"] == ["数据集"]


def test_extraction_missing_fields_remain_null(client):
    enable_model(
        client,
        {
            "overview": "未提取到",
            "extractions": [
                {
                    "paper_id": "1",
                    "values": {
                        "数据集": {
                            "value": None,
                            "supporting_quote": None,
                            "source_kind": "missing",
                        },
                    },
                }
            ],
        },
    )
    response = client.post(
        "/api/shared-ai/analyze",
        json={
            "provider": "pubmed",
            "query": "提取",
            "mode": "extract",
            "extraction_fields": ["数据集"],
            "papers": [{"id": "1", "provider": "pubmed", "title": "Paper"}],
        },
    )
    assert response.status_code == 200
    assert response.json()["extractions"][0]["values"]["数据集"]["value"] is None


def test_screening_requires_criteria_and_one_decision_per_paper(client):
    body = {
        "provider": "pubmed",
        "query": "筛选",
        "mode": "screen",
        "papers": [
            {"id": "1", "provider": "pubmed", "title": "Paper"},
        ],
    }
    assert client.post("/api/shared-ai/analyze", json=body).status_code == 422
    body["screening_criteria"] = "需要评估结果"
    enable_model(
        client,
        {
            "overview": "信息不足",
            "screening": [
                {"paper_id": "1", "decision": "uncertain", "reason": "没有摘要或正文"},
            ],
        },
    )
    response = client.post("/api/shared-ai/analyze", json=body)
    assert response.status_code == 200
    assert response.json()["screening"][0]["decision"] == "uncertain"


def test_review_draft_rejects_citations_outside_the_catalog(client):
    enable_model(
        client,
        {
            "overview": "草稿",
            "report_sections": [
                {"heading": "相关研究", "text": "test", "paper_ids": ["unknown"]},
            ],
        },
    )
    response = client.post(
        "/api/shared-ai/analyze",
        json={
            "provider": "pubmed",
            "query": "综述",
            "mode": "report",
            "papers": [{"id": "1", "provider": "pubmed", "title": "Paper"}],
        },
    )
    assert response.status_code == 502


@respx.mock
def test_content_full_mode_omits_slice_parameters_and_counts_unicode(client):
    client.app.state.sciverse_store = SciverseConfigStore(
        client.app.state.literature_config, SciverseConnection(api_key=SecretStr("sciverse-test"))
    )
    route = respx.get("https://api.sciverse.space/content").respond(
        json={"text": "中😀A", "more": False}
    )
    response = post(
        client,
        "sciverse",
        "content",
        record_id="doc1",
        read_mode="full",
        offset=50,
        content_limit=700,
    )
    assert response.status_code == 200
    assert dict(route.calls.last.request.url.params) == {"doc_id": "doc1"}
    assert response.json()["reading"] == {
        "mode": "full",
        "doc_id": "doc1",
        "offset": None,
        "limit": None,
        "chars_received": 3,
        "more": False,
    }
    assert response.json()["next_offset"] is None
    route.respond(json={"text": "Partial", "more": True, "next_offset": 7})
    response = post(client, "sciverse", "content", record_id="doc1", read_mode="full")
    assert response.json()["reading"]["more"] is True
    assert response.json()["next_offset"] is None


@respx.mock
def test_content_segment_mode_uses_user_range_and_validates_limits(client):
    client.app.state.sciverse_store = SciverseConfigStore(
        client.app.state.literature_config, SciverseConnection(api_key=SecretStr("sciverse-test"))
    )
    route = respx.get("https://api.sciverse.space/content").respond(
        json={"text": "segment", "more": True, "next_offset": 707}
    )
    response = post(client, "sciverse", "content", record_id="doc1", offset=7, content_limit=700)
    assert dict(route.calls.last.request.url.params) == {
        "doc_id": "doc1",
        "offset": "7",
        "limit": "700",
    }
    assert response.json()["reading"]["mode"] == "segment"
    assert response.json()["reading"]["chars_received"] == 7
    assert response.json()["next_offset"] == 707
    assert (
        post(client, "sciverse", "content", record_id="doc1", content_limit=50001).status_code
        == 422
    )
    assert (
        post(client, "sciverse", "content", record_id="doc1", read_mode="invalid").status_code
        == 422
    )
    assert route.call_count == 1
