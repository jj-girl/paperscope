"""Rate-aware read access; no retries of research-task creation or credential writes."""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
from collections import OrderedDict
from email.utils import parsedate_to_datetime

import httpx


class SemanticAccess:
    def __init__(
        self,
        *,
        clock=time.monotonic,
        sleep=asyncio.sleep,
        max_attempts=3,
        anonymous_interval=2.0,
        key_interval=1.1,
        budget_seconds=45.0,
        ttl_seconds=300.0,
        max_entries=128,
    ):
        self.clock, self.sleep = clock, sleep
        self.max_attempts = max_attempts
        self.anonymous_interval, self.key_interval = anonymous_interval, key_interval
        self.budget_seconds, self.ttl_seconds, self.max_entries = (
            budget_seconds,
            ttl_seconds,
            max_entries,
        )
        self.next_allowed: dict[str, float] = {}
        self.cache: OrderedDict[str, tuple[float, bytes, str]] = OrderedDict()
        self.gate = asyncio.Lock()
        self.serial: dict[str, asyncio.Lock] = {}

    @staticmethod
    def retry_after(value: str | None, fallback: float) -> float:
        if value:
            try:
                return max(0, float(value))
            except ValueError:
                try:
                    return max(0, parsedate_to_datetime(value).timestamp() - time.time())
                except (ValueError, TypeError, OverflowError):
                    pass
        return fallback

    async def request(self, send, method, url, **kwargs):
        headers = httpx.Headers(kwargs.get("headers") or {})
        key = headers.get("x-api-key", "")
        identity = hashlib.sha256(key.encode()).hexdigest() if key else "anonymous"
        digest = hashlib.sha256(
            json.dumps(
                [identity, method, str(url), kwargs.get("params"), kwargs.get("json")],
                sort_keys=True,
                default=str,
            ).encode()
        ).hexdigest()
        deadline = self.clock() + self.budget_seconds
        lock = self.serial.setdefault(identity, asyncio.Lock())
        try:
            await asyncio.wait_for(lock.acquire(), timeout=self.budget_seconds)
        except TimeoutError:
            return httpx.Response(429, headers={"Retry-After": "5"})
        try:
            return await self._execute(
                send, method, url, kwargs, identity, digest, deadline, bool(key)
            )
        finally:
            lock.release()

    async def _execute(self, send, method, url, kwargs, identity, digest, deadline, authenticated):
        cached = self.cache.get(digest)
        if cached and cached[0] > self.clock():
            self.cache.move_to_end(digest)
            return httpx.Response(
                200,
                content=cached[1],
                headers={
                    "content-type": cached[2],
                    "x-frontierlens-cache": "hit",
                },
            )
        self.cache.pop(digest, None)
        interval = self.key_interval if authenticated else self.anonymous_interval
        last = None
        for attempt in range(self.max_attempts):
            async with self.gate:
                delay = max(0, self.next_allowed.get(identity, 0) - self.clock())
                if self.clock() + delay >= deadline:
                    return (
                        last
                        if last is not None
                        else httpx.Response(429, headers={"Retry-After": str(int(delay) + 1)})
                    )
                self.next_allowed[identity] = self.clock() + delay + interval
            if delay:
                await self.sleep(delay)
            remaining = deadline - self.clock()
            if remaining <= 0:
                return last if last is not None else httpx.Response(429)
            # All caller paths here are read operations, including paper/batch.
            response = await send(method, url, **{**kwargs, "timeout": min(30, remaining)})
            response.headers["x-frontierlens-attempts"] = str(attempt + 1)
            if response.status_code not in {429, 502, 503, 504}:
                mime = response.headers.get("content-type", "")
                if (
                    response.status_code == 200
                    and "json" in mime
                    and len(response.content) <= 2 * 1024 * 1024
                ):
                    try:
                        response.json()
                    except ValueError:
                        return response
                    self.cache[digest] = (self.clock() + self.ttl_seconds, response.content, mime)
                    while len(self.cache) > self.max_entries:
                        self.cache.popitem(last=False)
                return response
            last = response
            wait = self.retry_after(response.headers.get("retry-after"), min(4 * 2**attempt, 30))
            async with self.gate:
                self.next_allowed[identity] = max(
                    self.next_allowed.get(identity, 0), self.clock() + wait
                )
            if attempt + 1 >= self.max_attempts or self.clock() + wait >= deadline:
                return response
        return last


class SourceClient(httpx.AsyncClient):
    def __init__(self, *, semantic_access: SemanticAccess, **kwargs):
        super().__init__(**kwargs)
        self.semantic_access = semantic_access

    async def request(self, method, url, **kwargs):
        target = httpx.URL(url)
        safe_post = target.path in {"/graph/v1/paper/batch", "/recommendations/v1/papers"}
        if target.host == "api.semanticscholar.org" and (
            method.upper() == "GET" or method.upper() == "POST" and safe_post
        ):
            return await self.semantic_access.request(super().request, method, url, **kwargs)
        return await super().request(method, url, **kwargs)


def source_client(request, *, timeout=30):
    return SourceClient(
        semantic_access=request.app.state.semantic_access, timeout=timeout, follow_redirects=False
    )
