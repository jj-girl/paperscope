# Modified for PaperScope: multiple data sources and shared AI workflows.
from __future__ import annotations

import pytest
import respx
from httpx import ConnectError, ReadTimeout, Response
from pydantic import SecretStr

from app.model_config import ModelConfigStore, ModelConfigUpdate, ModelConnection
from app.model_runtime import ModelRuntime, ModelRuntimeError


def test_model_config_is_owner_only_and_never_returns_secret(tmp_path) -> None:
    path = tmp_path / "nested" / "model.json"
    store = ModelConfigStore(
        path,
        ModelConnection(base_url="https://models.example/v1", model="demo"),
    )
    status = store.update(
        ModelConfigUpdate(
            base_url="https://models.example/v1",
            model="demo",
            api_key="unit-test-secret",
            timeout_seconds=12,
        )
    )

    assert status.configured is True
    assert status.api_key_set is True
    assert status.api_key_hint == "••••cret"
    assert "super-secret" not in status.model_dump_json()
    assert path.stat().st_mode & 0o777 == 0o600


@pytest.mark.asyncio
@respx.mock
async def test_model_draft_can_be_tested_without_persisting(tmp_path) -> None:
    path = tmp_path / "model.json"
    store = ModelConfigStore(
        path,
        ModelConnection(base_url="https://models.example/v1", model="stored"),
    )
    store.update(
        ModelConfigUpdate(
            base_url="https://models.example/v1",
            model="stored",
            api_key="stored-test-secret",
        )
    )
    saved_before_test = path.read_text()
    draft = store.resolve(
        ModelConfigUpdate(
            base_url="https://draft.example/v1",
            model="draft-model",
        )
    )
    respx.post("https://draft.example/v1/chat/completions").mock(
        return_value=Response(
            200,
            json={"choices": [{"message": {"content": '{"status":"ok"}'}}]},
        )
    )

    result = await ModelRuntime(store).test_connection(draft)

    assert result["ok"] is True
    assert result["model"] == "draft-model"
    assert draft.api_key is not None
    assert draft.api_key.get_secret_value() == "stored-test-secret"
    assert path.read_text() == saved_before_test
    assert store.status().model == "stored"


@pytest.mark.asyncio
@respx.mock
async def test_reasoning_only_length_response_has_clear_error(tmp_path) -> None:
    store = ModelConfigStore(
        tmp_path / "model.json",
        ModelConnection(
            base_url="https://models.example/v1",
            model="reasoning-model",
            api_key=SecretStr("test-value"),
        ),
    )
    respx.post("https://models.example/v1/chat/completions").mock(
        return_value=Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": "",
                            "reasoning_content": "unfinished reasoning",
                        },
                        "finish_reason": "length",
                    }
                ]
            },
        )
    )

    with pytest.raises(
        RuntimeError,
        match="exhausted max_tokens before returning final content",
    ):
        await ModelRuntime(store).complete_json(
            system="Return JSON only.",
            user="Plan this query.",
            max_tokens=32,
        )


@pytest.mark.asyncio
@respx.mock
async def test_model_retries_without_thinking_for_compatible_endpoint(tmp_path) -> None:
    store = ModelConfigStore(
        tmp_path / "model.json",
        ModelConnection(
            base_url="https://models.example/v1",
            model="standard-model",
            api_key=SecretStr("test-value"),
        ),
    )
    route = respx.post("https://models.example/v1/chat/completions").mock(
        side_effect=[
            Response(
                400,
                json={"error": {"message": "unknown field: thinking"}},
            ),
            Response(
                200,
                json={"choices": [{"message": {"content": '{"status":"ok"}'}}]},
            ),
        ]
    )

    result = await ModelRuntime(store).complete_json(
        system="Return JSON only.",
        user='Return exactly {"status":"ok"}.',
        max_tokens=32,
    )

    assert result == {"status": "ok"}
    assert route.call_count == 2
    first_body = route.calls[0].request.content
    second_body = route.calls[1].request.content
    assert b'"thinking"' in first_body
    assert b'"thinking"' not in second_body


def test_remote_plain_http_is_allowed_for_local_application() -> None:
    update = ModelConfigUpdate(
        base_url="http://models.example/v1",
        model="demo",
        api_key="test-key",
    )
    assert update.base_url == "http://models.example/v1"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "message"),
    [
        (ReadTimeout("timed out"), "等待上限"),
        (ConnectError("connect failed"), "无法连接模型服务"),
    ],
)
@respx.mock
async def test_timeout_is_distinct_from_connection_failure(tmp_path, error, message) -> None:
    store = ModelConfigStore(
        tmp_path / "model.json",
        ModelConnection(
            base_url="https://models.example/v1",
            model="test",
            api_key=SecretStr("test-only"),
        ),
    )
    route = respx.post("https://models.example/v1/chat/completions").mock(side_effect=error)
    with pytest.raises(ModelRuntimeError, match=message):
        await ModelRuntime(store).complete_json(system="Return JSON", user="Test", max_tokens=32)
    assert route.call_count == 1
