import asyncio

import httpx
import pytest

from app.semantic_access import SemanticAccess, SourceClient


class Clock:
    def __init__(self):
        self.now = 0
        self.waits = []

    def time(self):
        return self.now

    async def sleep(self, delay):
        self.waits.append(delay)
        self.now += delay


@pytest.mark.asyncio
async def test_limited_retry_then_cache_and_credential_isolation():
    clock = Clock()
    access = SemanticAccess(clock=clock.time, sleep=clock.sleep)
    calls = []

    async def send(method, url, **kwargs):
        calls.append(clock.now)
        if len(calls) == 1:
            return httpx.Response(429, headers={"Retry-After": "6"})
        return httpx.Response(200, json={"data": [{"paperId": "1"}]})

    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    response = await access.request(send, "GET", url, params={"query": "test"})
    assert response.status_code == 200
    assert calls == [0, 6]
    cached = await access.request(send, "GET", url, params={"query": "test"})
    assert cached.headers["x-frontierlens-cache"] == "hit"
    assert len(calls) == 2
    await access.request(
        send, "GET", url, params={"query": "test"}, headers={"x-api-key": "different-account"}
    )
    assert len(calls) == 3
    clock.now += 301
    await access.request(send, "GET", url, params={"query": "test"})
    assert len(calls) == 4


@pytest.mark.asyncio
async def test_long_retry_after_is_respected_without_waiting_past_budget():
    clock = Clock()
    access = SemanticAccess(clock=clock.time, sleep=clock.sleep, budget_seconds=45)
    calls = 0

    async def send(*args, **kwargs):
        nonlocal calls
        calls += 1
        return httpx.Response(429, headers={"Retry-After": "120"})

    response = await access.request(send, "GET", "https://api.semanticscholar.org/graph/v1/paper/1")
    assert response.status_code == 429
    await access.request(send, "GET", "https://api.semanticscholar.org/graph/v1/paper/2")
    assert calls == 1
    assert clock.waits == []


@pytest.mark.asyncio
async def test_auth_failure_is_neither_retried_nor_cached():
    clock = Clock()
    access = SemanticAccess(clock=clock.time, sleep=clock.sleep)
    calls = 0

    async def send(*args, **kwargs):
        nonlocal calls
        calls += 1
        return httpx.Response(403)

    for _ in range(2):
        assert (
            await access.request(send, "GET", "https://api.semanticscholar.org/graph/v1/paper/1")
        ).status_code == 403
    assert calls == 2
    assert clock.now >= 2


@pytest.mark.asyncio
async def test_concurrent_duplicate_reads_coalesce_through_cache():
    access = SemanticAccess()
    entered, release = asyncio.Event(), asyncio.Event()
    calls = 0

    async def send(*args, **kwargs):
        nonlocal calls
        calls += 1
        entered.set()
        await release.wait()
        return httpx.Response(200, json={"paperId": "1"})

    first = asyncio.create_task(
        access.request(send, "GET", "https://api.semanticscholar.org/graph/v1/paper/1")
    )
    await entered.wait()
    second = asyncio.create_task(
        access.request(send, "GET", "https://api.semanticscholar.org/graph/v1/paper/1")
    )
    release.set()
    responses = await asyncio.gather(first, second)
    assert calls == 1
    assert all(r.status_code == 200 for r in responses)


@pytest.mark.asyncio
async def test_other_services_and_mutations_are_not_retried():
    calls = []

    async def transport(request):
        calls.append(str(request.url))
        return httpx.Response(503)

    async with SourceClient(
        semantic_access=SemanticAccess(), transport=httpx.MockTransport(transport)
    ) as client:
        await client.post(
            "https://elicit.com/api/v2/sessions/reports", json={"researchQuestion": "test"}
        )
        await client.post("https://api.semanticscholar.org/non-read-operation", json={})
    assert len(calls) == 2
