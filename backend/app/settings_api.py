"""Independent data and optional model connection settings for PaperScope."""

import time

from fastapi import APIRouter, HTTPException, Request

from app.client import SciverseClient
from app.model_config import ModelConfigStatus, ModelConfigUpdate
from app.model_runtime import ModelRuntimeError
from app.sciverse_config import SciverseConfigStatus, SciverseConfigUpdate

router = APIRouter(prefix="/api/settings")


def require_writable(request: Request, service: str) -> None:
    if not getattr(request.app.state, f"allow_local_{service}_config"):
        raise HTTPException(403, f"local {service} configuration is disabled")


@router.get("/model", response_model=ModelConfigStatus)
async def model_settings(request: Request):
    return request.app.state.model_store.status()


@router.put("/model", response_model=ModelConfigStatus)
async def update_model_settings(body: ModelConfigUpdate, request: Request):
    require_writable(request, "model")
    return request.app.state.model_store.update(body)


@router.post("/model/test")
async def test_model_settings(body: ModelConfigUpdate, request: Request):
    require_writable(request, "model")
    connection = request.app.state.model_store.resolve(body)
    try:
        return await request.app.state.model_runtime.test_connection(connection)
    except ModelRuntimeError as exc:
        raise HTTPException(502, str(exc)) from exc


@router.get("/sciverse", response_model=SciverseConfigStatus)
async def sciverse_settings(request: Request):
    return request.app.state.sciverse_store.status()


@router.put("/sciverse", response_model=SciverseConfigStatus)
async def update_sciverse_settings(body: SciverseConfigUpdate, request: Request):
    require_writable(request, "sciverse")
    return request.app.state.sciverse_store.update(body)


@router.post("/sciverse/test")
async def test_sciverse_settings(body: SciverseConfigUpdate, request: Request):
    require_writable(request, "sciverse")
    connection = request.app.state.sciverse_store.resolve(body)
    if not connection.configured or connection.api_key is None:
        raise HTTPException(400, "Sciverse connection requires an enabled API key")
    client = SciverseClient(
        base_url=connection.base_url,
        token=connection.api_key.get_secret_value(),
        timeout_seconds=connection.timeout_seconds,
    )
    started = time.perf_counter()
    try:
        capabilities = await client.request_json(
            "GET", "/paper-schema", request_id=request.state.request_id
        )
        return {
            "ok": True,
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "contract_version": capabilities.get("contract_version"),
        }
    finally:
        await client.close()
