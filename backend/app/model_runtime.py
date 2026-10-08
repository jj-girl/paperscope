# Modified for PaperScope: multiple data sources and shared AI workflows.
from __future__ import annotations

import json
import re
import time
from typing import Any

import httpx

from app.model_config import ModelConfigStore, ModelConnection


class ModelRuntimeError(RuntimeError):
    pass


class ModelRuntime:
    def __init__(self, store: ModelConfigStore) -> None:
        self.store = store

    async def complete_json(
        self,
        *,
        system: str,
        user: str,
        max_tokens: int,
        connection: ModelConnection | None = None,
        request_timeout_seconds: float | None = None,
    ) -> dict[str, Any]:
        active_connection = connection or self.store.load()
        if not active_connection.configured or active_connection.api_key is None:
            raise ModelRuntimeError("model is not configured")
        url = f"{active_connection.base_url}/chat/completions"
        request_body: dict[str, Any] = {
            "model": active_connection.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0,
            "max_tokens": max_tokens,
            "thinking": {"type": "disabled"},
        }
        timeout_seconds = (
            request_timeout_seconds
            if request_timeout_seconds is not None
            else active_connection.timeout_seconds
        )
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(timeout_seconds),
                limits=httpx.Limits(max_connections=4, max_keepalive_connections=2),
            ) as client:
                response = await client.post(
                    url,
                    headers={
                        "Authorization": (f"Bearer {active_connection.api_key.get_secret_value()}"),
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    json=request_body,
                )
                if response.status_code == 400 and _rejects_thinking_option(response):
                    request_body.pop("thinking")
                    response = await client.post(
                        url,
                        headers={
                            "Authorization": (
                                f"Bearer {active_connection.api_key.get_secret_value()}"
                            ),
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                        },
                        json=request_body,
                    )
        except httpx.TimeoutException as exc:
            raise ModelRuntimeError(
                f"模型请求超过 {timeout_seconds:g} 秒等待上限；"
                "请减少本次材料或稍后重试。此错误不表示密钥无效。"
            ) from exc
        except httpx.NetworkError as exc:
            raise ModelRuntimeError("无法连接模型服务，请检查网络、代理和模型地址。") from exc
        if response.is_error:
            raise ModelRuntimeError(f"model endpoint returned HTTP {response.status_code}")
        try:
            payload = response.json()
            choice = payload["choices"][0]
            content = choice["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ModelRuntimeError("model endpoint returned an invalid response") from exc
        if not isinstance(content, str):
            raise ModelRuntimeError("model response did not contain text")
        if not content.strip() and choice.get("finish_reason") == "length":
            raise ModelRuntimeError("model exhausted max_tokens before returning final content")
        return _parse_json_object(content)

    async def test_connection(
        self,
        connection: ModelConnection | None = None,
    ) -> dict[str, object]:
        started = time.perf_counter()
        active_connection = connection or self.store.load()
        payload = await self.complete_json(
            system="Return JSON only.",
            user='Return exactly {"status":"ok"}.',
            max_tokens=32,
            connection=active_connection,
        )
        if payload.get("status") != "ok":
            raise ModelRuntimeError("model test returned an unexpected payload")
        return {
            "ok": True,
            "model": active_connection.model,
            "latency_ms": round((time.perf_counter() - started) * 1000),
        }


def _parse_json_object(content: str) -> dict[str, Any]:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\s*```$", "", stripped)
    try:
        value = json.loads(stripped)
    except ValueError:
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start < 0 or end <= start:
            raise ModelRuntimeError("model did not return JSON") from None
        try:
            value = json.loads(stripped[start : end + 1])
        except ValueError as exc:
            raise ModelRuntimeError("model returned malformed JSON") from exc
    if not isinstance(value, dict):
        raise ModelRuntimeError("model JSON must be an object")
    return value


def _rejects_thinking_option(response: httpx.Response) -> bool:
    message = response.text.lower()
    return "thinking" in message and any(
        marker in message
        for marker in ("unknown", "unsupported", "unrecognized", "extra", "unexpected")
    )
