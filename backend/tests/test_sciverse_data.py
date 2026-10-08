import json
from unittest.mock import AsyncMock

import pytest
import respx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.local_config import LocalConfigDocument
from app.main import create_app
from app.model_config import ModelConfigStore, ModelConnection
from app.sciverse_config import SciverseConfigStore, SciverseConnection


@pytest.fixture
def client(tmp_path):
    app = create_app()
    config = LocalConfigDocument(tmp_path / "local.config.json")
    app.state.sciverse_store = SciverseConfigStore(
        config, SciverseConnection(api_key=SecretStr("test-data-key"))
    )
    app.state.model_store = ModelConfigStore(config, ModelConnection())
    app.state.model_runtime.complete_json = AsyncMock(
        side_effect=AssertionError("LLM must not run")
    )
    return TestClient(app)


@pytest.mark.parametrize(
    "operation,method,path,body",
    [
        ("schema_capabilities", "GET", "/paper-schema", {}),
        ("schema_search", "POST", "/paper-schema/search", {"query": "recursive self improvement"}),
        ("schema_entities_search", "POST", "/paper-schema/entities/search", {"query": "MMLU"}),
        (
            "schema_entity_papers",
            "POST",
            "/paper-schema/entities/related-papers",
            {"query": "MMLU"},
        ),
        ("schema_related", "POST", "/paper-schema/schemas/s1/related-papers", {"record_id": "s1"}),
        ("schema_entities", "GET", "/paper-schema/schemas/s1/entities", {"record_id": "s1"}),
        (
            "schema_entity",
            "GET",
            "/paper-schema/schemas/s1/entities/e1",
            {"record_id": "s1", "child_id": "e1"},
        ),
        ("schema_relations", "POST", "/paper-schema/relations/search", {"record_id": "s1"}),
        (
            "schema_relation",
            "GET",
            "/paper-schema/schemas/s1/relations/r1",
            {"record_id": "s1", "child_id": "r1"},
        ),
        (
            "schema_citation_summary",
            "GET",
            "/paper-schema/schemas/s1/citation-summary",
            {"record_id": "s1"},
        ),
        ("schema_citations", "GET", "/paper-schema/schemas/s1/citations", {"record_id": "s1"}),
        (
            "schema_citation_graph",
            "GET",
            "/paper-schema/schemas/s1/citation-graph",
            {"record_id": "s1"},
        ),
        (
            "schema_evidence",
            "POST",
            "/paper-schema/evidence/search",
            {"record_id": "s1", "options": {"groups": ["formula"]}},
        ),
        (
            "schema_evidence_item",
            "GET",
            "/paper-schema/schemas/s1/evidence/e1",
            {"record_id": "s1", "child_id": "e1"},
        ),
        (
            "schema_provenance",
            "POST",
            "/paper-schema/resolve-provenance",
            {"record_id": "s1", "markers": [12]},
        ),
        (
            "schema_provenance_ids",
            "POST",
            "/paper-schema/resolve-provenance",
            {"ids": ["paragraph1"]},
        ),
        (
            "schema_text",
            "POST",
            "/paper-schema/search-in-schema",
            {"record_id": "s1", "query": "accuracy"},
        ),
        (
            "schema_hydrate",
            "POST",
            "/paper-schema/hydrate-items",
            {"options": {"items": [{"schema_id": "s1", "paragraph_ids": ["p1"]}]}},
        ),
        ("schema_materials", "POST", "/paper-schema/materials", {"ids": ["s1"], "kind": "method"}),
    ],
)
@respx.mock
def test_schema_operations_only_call_data_endpoints(client, operation, method, path, body):
    route = respx.request(method, "https://api.sciverse.space" + path).respond(
        json={"items": [], "next_cursor": None}
    )
    response = client.post("/api/advanced/sciverse/" + operation, json=body)
    assert response.status_code == 200
    assert route.call_count == 1
    assert route.calls.last.request.headers["Authorization"] == "Bearer test-data-key"
    assert "test-data-key" not in response.text
    client.app.state.model_runtime.complete_json.assert_not_called()


@respx.mock
def test_provenance_modes_do_not_mix_and_materials_remain_a_data_pack(client):
    route = respx.post("https://api.sciverse.space/paper-schema/resolve-provenance").respond(
        json={"segments": []}
    )
    client.post(
        "/api/advanced/sciverse/schema_provenance_ids",
        json={"ids": ["p1"], "record_id": "ignored", "markers": [10]},
    )
    sent = json.loads(route.calls.last.request.content)
    assert sent["paragraph_ids"] == ["p1"]
    assert "schema_id" not in sent and "marker_nums" not in sent
    assert (
        client.post(
            "/api/advanced/sciverse/schema_materials", json={"ids": [str(i) for i in range(21)]}
        ).status_code
        == 422
    )


@respx.mock
def test_metadata_relations_use_unique_id_and_metadata_preserves_it(client):
    route = respx.post("https://api.sciverse.space/meta-paper-relations").respond(
        json={"items": [], "total_pages": 2}
    )
    response = client.post(
        "/api/advanced/sciverse/meta_relations",
        json={"record_id": "paper:doi", "kind": "CITATIONS"},
    )
    assert response.status_code == 200
    assert json.loads(route.calls.last.request.content)["unique_id"] == "paper:doi"
    assert response.json()["next_page"] == 2
    respx.post("https://api.sciverse.space/meta-search").respond(
        json={"results": [{"title": "T", "unique_id": "paper:doi"}]}
    )
    response = client.post("/api/advanced/sciverse/metadata", json={"query": "test"})
    assert response.json()["items"][0]["details"]["unique_id"] == "paper:doi"
    assert response.json()["provider_response"]["results"][0]["unique_id"] == "paper:doi"


def test_bad_filters_are_rejected_before_any_upstream_call(client):
    assert (
        client.post(
            "/api/advanced/sciverse/schema_entities_search", json={"options": {"filters": "wrong"}}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/advanced/sciverse/schema_evidence",
            json={"query": "test", "options": {"groups": "wrong"}},
        ).status_code
        == 422
    )
    client.app.state.model_runtime.complete_json.assert_not_called()
