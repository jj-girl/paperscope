# Modified for PaperScope: multiple data sources and shared AI workflows.
from __future__ import annotations

from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.advanced import router as advanced_router
from app.config import get_settings
from app.errors import UpstreamError
from app.literature import router as literature_router
from app.local_config import LocalConfigDocument
from app.model_config import ModelConfigStore, ModelConnection
from app.model_runtime import ModelRuntime, ModelRuntimeError
from app.sciverse_config import (
    SciverseConfigStore,
    SciverseConnection,
)
from app.semantic_access import SemanticAccess
from app.settings_api import router
from app.shared_ai import router as shared_ai_router


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="PaperScope API",
        version="0.4.0",
    )
    local_config = LocalConfigDocument(settings.local_config_path)
    application.state.semantic_access = SemanticAccess()
    application.state.literature_config = LocalConfigDocument(
        settings.local_config_path.with_name("local.config.literature.json")
    )
    application.state.allow_local_literature_config = settings.allow_local_sciverse_config
    sciverse_store = SciverseConfigStore(
        local_config,
        SciverseConnection(
            base_url=settings.sciverse_api_base_url,
            api_key=settings.sciverse_api_token,
            timeout_seconds=settings.request_timeout_seconds,
        ),
    )
    application.state.sciverse_store = sciverse_store
    application.state.allow_local_sciverse_config = settings.allow_local_sciverse_config
    model_store = ModelConfigStore(
        local_config,
        ModelConnection(
            base_url=settings.model_base_url,
            model=settings.model_name,
            api_key=settings.model_api_key,
            timeout_seconds=settings.model_timeout_seconds,
        ),
    )
    model_runtime = ModelRuntime(model_store)
    application.state.model_store = model_store
    application.state.model_runtime = model_runtime
    application.state.allow_local_model_config = settings.allow_local_model_config
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT"],
        allow_headers=["Content-Type", "X-Request-ID"],
    )

    @application.middleware("http")
    async def add_request_id(request: Request, call_next):
        rid = request.headers.get("x-request-id") or str(uuid4())
        request.state.request_id = rid
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                too_large = int(content_length) > settings.max_request_body_bytes
            except ValueError:
                too_large = True
            if too_large:
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": {
                            "code": "REQUEST_TOO_LARGE",
                            "message": "Request body exceeds the configured limit",
                            "retryable": False,
                            "request_id": rid,
                        }
                    },
                    headers={"X-Request-ID": rid},
                )
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response

    @application.exception_handler(UpstreamError)
    async def upstream_error_handler(_: Request, exc: UpstreamError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "retryable": exc.retryable,
                    "request_id": exc.request_id,
                }
            },
            headers=(
                {"Retry-After": str(exc.retry_after)} if exc.retry_after is not None else None
            ),
        )

    @application.exception_handler(ModelRuntimeError)
    async def model_error_handler(request: Request, exc: ModelRuntimeError) -> JSONResponse:
        return JSONResponse(
            status_code=502,
            content={
                "error": {
                    "code": "MODEL_REQUEST_FAILED",
                    "message": str(exc) or "The LLM request failed.",
                    "retryable": True,
                    "request_id": request.state.request_id,
                }
            },
        )

    @application.get("/healthz", include_in_schema=False)
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(router)
    application.include_router(literature_router)
    application.include_router(advanced_router)
    application.include_router(shared_ai_router)

    return application


app = create_app()
