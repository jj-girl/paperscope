from unittest.mock import AsyncMock

import pytest
import respx
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import create_app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("LOCAL_CONFIG_PATH", str(tmp_path / "settings.json"))
    monkeypatch.delenv("SCIVERSE_API_TOKEN", raising=False)
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    get_settings.cache_clear()
    app = create_app()
    app.state.model_runtime.complete_json = AsyncMock(
        side_effect=AssertionError("unexpected model")
    )
    with TestClient(app) as client:
        yield client
    get_settings.cache_clear()


def test_settings_persist_without_model_or_old_gateway(client):
    assert client.get("/healthz").json() == {"status": "ok"}
    response = client.put(
        "/api/settings/sciverse",
        json={"base_url": "https://data.example", "api_key": "data-test-credential"},
    )
    assert response.status_code == 200
    assert response.json()["configured"] is True
    assert "data-test-credential" not in response.text
    assert (
        client.app.state.sciverse_store.load().api_key.get_secret_value() == "data-test-credential"
    )
    assert not hasattr(client.app.state, "gateway")
    client.app.state.model_runtime.complete_json.assert_not_called()
    response = client.put(
        "/api/settings/model",
        json={
            "base_url": "https://model.example/v1",
            "model": "test",
            "api_key": "model-test-credential",
        },
    )
    assert response.status_code == 200
    assert "model-test-credential" not in response.text
    client.app.state.model_runtime.complete_json.assert_not_called()


@respx.mock
def test_connection_draft_is_read_only_and_preserves_saved_settings(client):
    store = client.app.state.sciverse_store
    before = store.load().model_dump()
    respx.get("https://draft.example/paper-schema").respond(json={"contract_version": "test"})
    response = client.post(
        "/api/settings/sciverse/test",
        json={"base_url": "https://draft.example", "api_key": "draft-test-credential"},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert store.load().model_dump() == before
    assert not store.path.exists()
    client.app.state.model_runtime.complete_json.assert_not_called()


def test_removed_reader_routes_are_absent_from_runtime_and_openapi(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert "/api/settings/sciverse" in paths
    assert "/api/advanced/{provider}/{operation}" in paths
    for path in [
        "/api/capabilities",
        "/api/discovery-map",
        "/api/topic-explore",
        "/api/topic-explore/stream",
        "/api/topic-graph",
        "/api/topic-guide",
        "/api/search",
        "/api/provenance",
        "/api/papers/s1/overview",
    ]:
        assert path not in paths
        assert client.get(path).status_code == 404


def test_settings_write_policy_and_request_limit_remain_enforced(client):
    client.app.state.allow_local_sciverse_config = False
    response = client.put("/api/settings/sciverse", json={"base_url": "https://data.example"})
    assert response.status_code == 403
    response = client.post("/api/advanced/sciverse/schema_search", content="x" * 262145)
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "REQUEST_TOO_LARGE"
