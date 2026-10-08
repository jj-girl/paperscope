"""Bounded, source-specific operations used by the extended workspaces."""

from __future__ import annotations

import asyncio
import re
from typing import Literal
from urllib.parse import quote, urlsplit

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field

from app.literature import (
    fetch,
    json_body,
    key_for,
    openalex_paper,
    plain,
    pubmed_papers,
    safe_url,
    semantic_paper,
    xml_body,
)
from app.semantic_access import source_client

router = APIRouter(prefix="/api/advanced", tags=["Extended source workspaces"])


class ToolInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    query: str = Field(default="", max_length=2000)
    record_id: str = Field(default="", max_length=1000)
    ids: list[str] = Field(default_factory=list, max_length=100)
    cursor: str | None = Field(default=None, max_length=4096)
    page: int = Field(default=1, ge=1, le=500)
    size: int = Field(default=20, ge=1, le=100)
    year_from: int | None = Field(default=None, ge=1800, le=2200)
    year_to: int | None = Field(default=None, ge=1800, le=2200)
    publication_type: str = Field(default="", max_length=100)
    group: Literal["year", "type", "institution", "topic"] = "year"
    kind: str = Field(default="", max_length=60)
    offset: int = Field(default=0, ge=0, le=10000000)
    options: dict = Field(default_factory=dict)
    webenv: str = Field(default="", max_length=4096)
    query_key: str = Field(default="", max_length=100)
    artifact_id: str = Field(default="", max_length=2000)
    format: Literal["original", "json", "csv", "xlsx", "md"] = "original"


def identifier(value: str, pattern: str, description: str) -> str:
    value = value.rstrip("/").rsplit("/", 1)[-1]
    if not re.fullmatch(pattern, value):
        raise HTTPException(422, f"需要有效的 {description}。")
    return value


def required(value: str, name: str) -> str:
    if not value.strip():
        raise HTTPException(422, f"请填写{name}。")
    return value


def result(view: str, items=None, **extra) -> dict:
    return {"view": view, "items": items or [], **extra}


def row(title, text="", url=None, **details) -> dict:
    return {"title": plain(title), "text": plain(text), "url": safe_url(url), "details": details}


async def get_json(client, url, **kwargs):
    return json_body(await fetch(client, url, **kwargs))


async def oa(client, path, key, **params):
    return await get_json(
        client,
        "https://api.openalex.org/" + path,
        params=params,
        headers={"Authorization": f"Bearer {key}"} if key else {},
    )


async def openalex_tool(operation, body, request, client):
    key = key_for(request, "openalex")
    if operation == "aggregate":
        fields = {
            "year": "publication_year",
            "type": "type",
            "institution": "authorships.institutions.id",
            "topic": "primary_topic.id",
        }
        data = await oa(
            client,
            "works",
            key,
            search=required(body.query, "检索词"),
            group_by=fields[body.group] + ":include_unknown",
            per_page=100,
            cursor=body.cursor or "*",
        )
        if "group_by" not in data:
            raise HTTPException(502, "OpenAlex 未返回聚合结果。")
        return result(
            "groups",
            [
                {
                    "key": str(g.get("key", "unknown")),
                    "title": str(g.get("key_display_name") or "未知"),
                    "count": g.get("count", 0),
                }
                for g in data["group_by"]
            ],
            total=data.get("meta", {}).get("count"),
            next_cursor=data.get("meta", {}).get("next_cursor"),
            query=body.query,
            note="计数覆盖完整查询集合；当前显示一页分组，按键分页而非排名。多机构论文可重复归组。",
        )
    if operation in {"author", "institution"}:
        code = identifier(
            body.record_id, r"A\d+" if operation == "author" else r"I\d+", "OpenAlex ID"
        )
        kind = "authors" if operation == "author" else "institutions"
        data = await oa(client, f"{kind}/{code}", key)
        affiliations = data.get("last_known_institutions") or []
        return result(
            "entity",
            [row(x.get("display_name"), url=x.get("id")) for x in affiliations],
            title=data.get("display_name"),
            url=safe_url(data.get("id")),
            details={
                k: data.get(k)
                for k in (
                    "works_count",
                    "cited_by_count",
                    "summary_stats",
                    "orcid",
                    "ror",
                    "country_code",
                    "type",
                    "geo",
                    "counts_by_year",
                )
            },
            note="数值来自 OpenAlex 当前记录；作者身份、归属与指标可能存在数据误差。",
        )
    if operation in {"author_works", "institution_works"}:
        author = operation == "author_works"
        code = identifier(body.record_id, r"A\d+" if author else r"I\d+", "OpenAlex ID")
        field = "authorships.author.id" if author else "authorships.institutions.id"
        data = await oa(
            client,
            "works",
            key,
            filter=f"{field}:{code}",
            per_page=body.size,
            cursor=body.cursor or "*",
        )
        return result(
            "papers",
            [openalex_paper(p).model_dump() for p in data.get("results", [])],
            total=data.get("meta", {}).get("count"),
            next_cursor=data.get("meta", {}).get("next_cursor"),
        )
    if operation in {"references", "citations"}:
        code = identifier(body.record_id, r"W\d+", "OpenAlex 论文 ID")
        if operation == "citations":
            data = await oa(
                client,
                "works",
                key,
                filter=f"cites:{code}",
                per_page=body.size,
                cursor=body.cursor or "*",
            )
            papers, total, next_cursor = (
                data.get("results", []),
                data.get("meta", {}).get("count"),
                data.get("meta", {}).get("next_cursor"),
            )
        else:
            seed = await oa(client, f"works/{code}", key)
            ids = [identifier(x, r"W\d+", "论文 ID") for x in seed.get("referenced_works", [])]
            start = (body.page - 1) * body.size
            batch = ids[start : start + body.size]
            data = (
                await oa(
                    client, "works", key, filter="openalex:" + "|".join(batch), per_page=body.size
                )
                if batch
                else {"results": []}
            )
            papers, total, next_cursor = data.get("results", []), len(ids), None
        return result(
            "papers",
            [openalex_paper(p).model_dump() for p in papers],
            total=total,
            next_cursor=next_cursor,
            next_page=body.page + 1
            if operation == "references" and body.page * body.size < total
            else None,
            edges=[
                {
                    "source": code if operation == "references" else p["id"].rsplit("/", 1)[-1],
                    "target": p["id"].rsplit("/", 1)[-1] if operation == "references" else code,
                    "type": "citation",
                }
                for p in papers
            ],
            note="仅为 OpenAlex 已解析的引用关系；不等于论文印刷参考文献的完整集合。",
        )
    raise HTTPException(404, "未定义的 OpenAlex 操作。")


def ncbi_params(key):
    return {"db": "pubmed", "tool": "frontierlens_multisource", **({"api_key": key} if key else {})}


async def ncbi_fetch(client, key, ids=None, **params):
    data = await fetch(
        client,
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
        params={
            **ncbi_params(key),
            "retmode": "xml",
            **({"id": ",".join(ids)} if ids else {}),
            **params,
        },
    )
    root = xml_body(data)
    if root.tag.lower() == "error" or root.find(".//ERROR") is not None:
        raise HTTPException(410, "PubMed 历史集合或记录请求失效，请重新检索。")
    return [p.model_dump() for p in pubmed_papers(root)]


async def pubmed_tool(operation, body, request, client):
    key = key_for(request, "pubmed")
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    if operation == "filtered_search":
        terms = [f"({required(body.query, '检索式')})"]
        if body.year_from and body.year_to and body.year_from > body.year_to:
            raise HTTPException(422, "起始年份不能晚于结束年份。")
        if body.year_from or body.year_to:
            terms.append(f"({body.year_from or 1800}:{body.year_to or 2200}[dp])")
        if body.publication_type:
            allowed = {
                "Review",
                "Systematic Review",
                "Meta-Analysis",
                "Randomized Controlled Trial",
                "Clinical Trial",
            }
            if body.publication_type not in allowed:
                raise HTTPException(422, "不支持的文献类型。")
            terms.append(f'"{body.publication_type}"[pt]')
        data = await get_json(
            client,
            base + "esearch.fcgi",
            params={
                **ncbi_params(key),
                "term": " AND ".join(terms),
                "retmode": "json",
                "usehistory": "y",
                "retmax": body.size,
                "retstart": (body.page - 1) * body.size,
                "sort": "relevance",
            },
        )
        found = data.get("esearchresult")
        if not isinstance(found, dict) or "ERROR" in found:
            raise HTTPException(502, "PubMed 检索失败。")
        ids = found.get("idlist", [])
        await asyncio.sleep(0.35)
        papers = await ncbi_fetch(client, key, ids) if ids else []
        total = int(found.get("count", 0))
        return result(
            "papers",
            papers,
            total=total,
            effective_query=found.get("querytranslation"),
            webenv=found.get("webenv"),
            query_key=found.get("querykey"),
            next_page=body.page + 1 if body.page * body.size < min(total, 10000) else None,
            note=(
                "PubMed 常规搜索有 10,000 条检索边界，大集合需按时间拆分。"
                "历史集合由 NCBI 暂存，会过期。"
            ),
        )
    if operation == "batch":
        ids = [identifier(x, r"\d+", "PMID") for x in body.ids]
        if not ids:
            raise HTTPException(422, "请填写 PMID 列表。")
        return result(
            "papers",
            await ncbi_fetch(client, key, ids),
            note="按 PMID 批量读取记录；缺失或非期刊记录可能未映射。",
        )
    if operation == "history":
        params = {
            "WebEnv": required(body.webenv, "WebEnv"),
            "query_key": identifier(body.query_key, r"\d+", "query_key"),
            "retstart": (body.page - 1) * body.size,
            "retmax": body.size,
        }
        papers = await ncbi_fetch(client, key, **params)
        return result(
            "papers",
            papers,
            next_page=body.page + 1 if len(papers) == body.size else None,
            note="从 NCBI 历史集合按页读取；空页表示当前读取结束或记录不可映射，失效时需重新检索。",
        )
    if operation == "related":
        pid = identifier(body.record_id, r"\d+", "PMID")
        links = {
            "similar": "pubmed_pubmed",
            "references": "pubmed_pubmed_refs",
            "citations": "pubmed_pubmed_citedin",
            "pmc": "pubmed_pmc",
        }
        if body.kind not in links:
            raise HTTPException(422, "请选择关联类型。")
        target = "pmc" if body.kind == "pmc" else "pubmed"
        data = await get_json(
            client,
            base + "elink.fcgi",
            params={
                **ncbi_params(key),
                "db": target,
                "dbfrom": "pubmed",
                "id": pid,
                "linkname": links[body.kind],
                "retmode": "json",
            },
        )
        ids = [
            str(i)
            for s in data.get("linksets", [])
            for group in s.get("linksetdbs", [])
            for i in group.get("links", [])
        ]
        batch = ids[(body.page - 1) * body.size : body.page * body.size]
        if target == "pmc":
            items = [
                row("PMC" + i, url=f"https://pmc.ncbi.nlm.nih.gov/articles/PMC{i}/") for i in batch
            ]
        else:
            await asyncio.sleep(0.35)
            items = await ncbi_fetch(client, key, batch) if batch else []
        return result(
            "records" if target == "pmc" else "papers",
            items,
            total=len(ids),
            next_page=body.page + 1 if body.page * body.size < len(ids) else None,
            note="相似论文是相关性建议；引用关联仅覆盖 NCBI 可解析的记录。",
        )
    raise HTTPException(404, "未定义的 PubMed 操作。")


async def europe_tool(operation, body, request, client):
    if not re.fullmatch(r"(MED|PMC|PPR|AGR):[A-Za-z0-9._-]+", body.record_id):
        raise HTTPException(422, "请填写来源与记录 ID，例如 MED:38451962 或 PMC:PMC11706764。")
    source, code = body.record_id.split(":", 1)
    if operation == "annotations":
        response = await fetch(
            client,
            "https://www.ebi.ac.uk/europepmc/annotations_api/annotationsByArticleIds",
            params={"articleIds": body.record_id},
        )
        try:
            data = response.json()
        except ValueError as exc:
            raise HTTPException(502, "标注接口未返回有效 JSON。") from exc
        if not isinstance(data, list):
            raise HTTPException(502, "标注接口返回格式不符合预期。")
        annotations = [x for record in data for x in record.get("annotations", [])]
        start = (body.page - 1) * body.size
        return result(
            "annotations",
            [
                row(
                    x.get("exact"),
                    " ".join(filter(None, [x.get("prefix"), x.get("exact"), x.get("postfix")])),
                    x.get("id"),
                    type=x.get("type"),
                    section=x.get("section"),
                    tags=x.get("tags", []),
                )
                for x in annotations[start : start + body.size]
            ],
            total=len(annotations),
            next_page=body.page + 1 if start + body.size < len(annotations) else None,
            note="标注来自上游文本挖掘；保留上下文和实体链接，不视为论断已经得到验证。",
        )
    if operation not in {"references", "citations", "datalinks"}:
        raise HTTPException(404, "未定义的 Europe PMC 操作。")
    data = await get_json(
        client,
        f"https://www.ebi.ac.uk/europepmc/webservices/rest/{source}/{code}/{operation}",
        params={"format": "json", "page": body.page, "pageSize": body.size},
    )
    if operation == "datalinks":
        items = []
        for category in data.get("dataLinkList", {}).get("Category", []):
            for section in category.get("Section", []):
                for link in section.get("Linklist", {}).get("Link", []):
                    target = link.get("Target", {})
                    items.append(
                        row(
                            target.get("Title"),
                            category.get("Name"),
                            target.get("Identifier", {}).get("IDURL"),
                            relationship=link.get("RelationshipType", {}).get("Name"),
                            provider=link.get("LinkProvider", {}).get("Name"),
                        )
                    )
        return result("records", items, total=len(items))
    noun = "reference" if operation == "references" else "citation"
    rows = data.get(noun + "List", {}).get(noun, [])
    total = data.get("hitCount", 0)
    return result(
        "records",
        [
            row(
                p.get("title") or p.get("id") or "未解析记录",
                p.get("authorString"),
                f"https://europepmc.org/article/{p['source']}/{p['id']}"
                if p.get("source") and p.get("id")
                else None,
                year=p.get("pubYear"),
                source=p.get("source"),
                id=p.get("id"),
                match=p.get("match"),
            )
            for p in rows
        ],
        total=total,
        next_page=body.page + 1 if body.page * body.size < total else None,
        note="保留接口返回的引用记录；未解析记录可能没有可打开的目标。",
    )


async def semantic_tool(operation, body, request, client):
    key = key_for(request, "semantic_scholar")
    headers = {"x-api-key": key} if key else {}
    base = "https://api.semanticscholar.org/graph/v1/"
    fields = "title,year,abstract,authors,externalIds,url,openAccessPdf,citationCount,venue"
    if operation in {"references", "citations"}:
        code = identifier(body.record_id, r"[a-fA-F0-9]{40}", "paperId")
        data = await get_json(
            client,
            base + f"paper/{code}/{operation}",
            headers=headers,
            params={"fields": fields, "limit": body.size, "offset": body.offset},
        )
        nested = "citedPaper" if operation == "references" else "citingPaper"
        papers = [p[nested] for p in data.get("data", []) if (p.get(nested) or {}).get("paperId")]
        return result(
            "papers",
            [semantic_paper(p).model_dump() for p in papers],
            next_offset=data.get("next"),
            edges=[
                {
                    "source": code if operation == "references" else p["paperId"],
                    "target": p["paperId"] if operation == "references" else code,
                    "type": "citation",
                }
                for p in papers
            ],
        )
    if operation == "batch":
        if not body.ids or any(len(x) > 200 for x in body.ids):
            raise HTTPException(422, "请填写至多 100 个合法论文标识。")
        response = await fetch(
            client,
            base + "paper/batch",
            method="POST",
            headers=headers,
            params={"fields": fields},
            json={"ids": body.ids},
        )
        data = response.json()
        if not isinstance(data, list):
            raise HTTPException(502, "批量接口返回格式不符合预期。")
        return result(
            "papers",
            [semantic_paper(p).model_dump() for p in data if p and p.get("paperId")],
            missing=sum(p is None for p in data),
        )
    if operation == "author_search":
        data = await get_json(
            client,
            base + "author/search",
            headers=headers,
            params={
                "query": required(body.query, "作者名"),
                "limit": body.size,
                "offset": body.offset,
                "fields": "name,affiliations,paperCount,citationCount,hIndex,url",
            },
        )
        return result(
            "records",
            [
                row(
                    a.get("name"),
                    url=a.get("url"),
                    **{
                        k: a.get(k)
                        for k in (
                            "authorId",
                            "affiliations",
                            "paperCount",
                            "citationCount",
                            "hIndex",
                        )
                    },
                )
                for a in data.get("data", [])
            ],
            total=data.get("total"),
            next_offset=data.get("next"),
        )
    if operation in {"author", "author_works"}:
        code = identifier(body.record_id, r"\d+", "Semantic Scholar authorId")
        if operation == "author":
            data = await get_json(
                client,
                base + f"author/{code}",
                headers=headers,
                params={
                    "fields": "name,affiliations,paperCount,citationCount,hIndex,url,externalIds"
                },
            )
            return result(
                "entity",
                title=data.get("name"),
                url=data.get("url"),
                details={
                    k: data.get(k)
                    for k in (
                        "authorId",
                        "affiliations",
                        "paperCount",
                        "citationCount",
                        "hIndex",
                        "externalIds",
                    )
                },
            )
        data = await get_json(
            client,
            base + f"author/{code}/papers",
            headers=headers,
            params={"fields": fields, "limit": body.size, "offset": body.offset},
        )
        return result(
            "papers",
            [semantic_paper(p).model_dump() for p in data.get("data", [])],
            next_offset=data.get("next"),
        )
    raise HTTPException(404, "未定义的 Semantic Scholar 操作。")


def clean(value, secret=""):
    """Keep returned task structure, never credential fields or reflected API keys."""
    if isinstance(value, dict):
        return {
            k: clean(v, secret)
            for k, v in value.items()
            if k.lower()
            not in {
                "api_key",
                "apikey",
                "authorization",
                "secret",
                "access_token",
                "refresh_token",
                "cookie",
            }
        }
    if isinstance(value, list):
        return [clean(v, secret) for v in value]
    if isinstance(value, str) and secret:
        return value.replace(secret, "[redacted]")
    return value


async def elicit_tool(operation, body, request, client):
    key = key_for(request, "elicit")
    if not key:
        raise HTTPException(503, "请先打开连接设置，配置有研究任务权限的 Elicit API Key。")
    headers = {"Authorization": f"Bearer {key}"}
    base = "https://elicit.com/api/v2"
    if operation in {"report", "review", "agent"}:
        question = required(body.query, "研究问题")
        if operation == "agent":
            path, payload = "/sessions/agents", {"query": question}
        elif operation == "report":
            path, payload = "/sessions/reports", {"researchQuestion": question}
        else:
            allowed = {
                "searches",
                "abstractScreening",
                "fulltextScreening",
                "extraction",
                "generateReport",
            }
            if set(body.options) - allowed:
                raise HTTPException(422, "研究流程配置含未知字段。")
            path = "/sessions/systematic-reviews"
            payload = {
                "researchQuestion": question,
                "searches": [{"query": question, "maxResults": min(body.size, 100)}],
                "abstractScreening": {"generate": True, "depth": "thorough"},
                "fulltextScreening": {"reuseAbstractCriteria": True, "depth": "thorough"},
                "extraction": {"generate": True, "useFigures": False},
                "generateReport": True,
                **body.options,
            }
        # Creation is never retried automatically: a timeout may still have created a session.
        try:
            data = await get_json(client, base + path, method="POST", headers=headers, json=payload)
        except HTTPException as exc:
            if exc.status_code in {502, 504}:
                raise HTTPException(
                    504, "任务创建状态未知；请先查询任务列表，避免重复创建。"
                ) from exc
            raise
        return result(
            "task",
            data=clean(data, key),
            note=(
                "任务已提交，不表示已完成。请保留 sessionId，查询状态和结果。"
                "创建超时时不要盲目重试，应先查询任务列表。"
            ),
        )
    if operation == "sessions":
        params = {"limit": body.size, **({"cursor": body.cursor} if body.cursor else {})}
        data = await get_json(client, base + "/sessions", headers=headers, params=params)
        return result("task", data=clean(data, key), next_cursor=data.get("nextCursor"))
    kinds = {"report": "reports", "review": "systematic-reviews", "agent": "agents"}
    if body.kind not in kinds:
        raise HTTPException(422, "请选择研究任务类型。")
    sid = identifier(body.record_id, r"[A-Za-z0-9_-]{1,100}", "sessionId")
    path = f"/sessions/{kinds[body.kind]}/{sid}"
    if operation == "status":
        data = await get_json(client, base + path, headers=headers)
    elif operation == "events" and body.kind == "agent":
        data = await get_json(
            client,
            base + path + "/events",
            headers=headers,
            params={"cursor": body.cursor} if body.cursor else {},
        )
    elif operation == "artifacts" and body.kind == "agent":
        data = await get_json(client, base + path + "/artifacts", headers=headers)
    elif operation == "sources" and body.kind == "agent":
        data = await get_json(client, base + path + "/sources", headers=headers)
    elif operation in {"artifact_content", "artifact_download"} and body.kind == "agent":
        artifact = quote(required(body.artifact_id, "artifactId"), safe="")
        suffix = "content" if operation == "artifact_content" else "download"
        params = (
            {"format": body.format} if suffix == "download" and body.format != "original" else {}
        )
        data = await get_json(
            client, base + path + f"/artifacts/{artifact}/{suffix}", headers=headers, params=params
        )
    elif operation == "stop" and body.kind == "agent":
        data = await get_json(client, base + path + "/stop", method="POST", headers=headers)
    elif operation == "message" and body.kind == "agent":
        data = await get_json(
            client,
            base + path + "/messages",
            method="POST",
            headers=headers,
            json={"message": required(body.query, "后续问题")},
        )
    elif operation == "resume":
        state = await get_json(client, base + path, headers=headers)
        resume = (state.get("links") or {}).get("resume")
        if not isinstance(resume, str):
            raise HTTPException(409, "该任务未提供恢复入口，请先检查状态与额度。")
        url = "https://elicit.com" + resume if resume.startswith("/") else resume
        parsed = urlsplit(url)
        if (
            parsed.scheme != "https"
            or parsed.netloc != "elicit.com"
            or not parsed.path.startswith("/api/v2/sessions/")
        ):
            raise HTTPException(502, "任务返回了不符合合同的恢复入口。")
        data = await get_json(client, url, method="POST", headers=headers)
    else:
        raise HTTPException(404, "此任务类型不支持该操作。")
    return result(
        "task",
        data=clean(data, key),
        next_cursor=data.get("cursor") if operation == "events" else None,
        note="报告与综述建议间隔 30–60 秒查询；Agent 事件建议间隔 3–10 秒。导出可能晚于任务完成。",
    )


async def sciverse_tool(operation, body, request, client):
    connection = request.app.state.sciverse_store.load()
    if not connection.configured or not connection.api_key:
        raise HTTPException(503, "请先在 Sciverse 连接设置中配置并启用 API Key。")
    key = connection.api_key.get_secret_value()
    headers = {"Authorization": f"Bearer {key}"}
    base = connection.base_url.rstrip("/")
    if operation == "catalog":
        data = await get_json(client, base + "/meta-catalog", headers=headers)
    elif operation == "metadata":
        if set(body.options) - {"filters", "fields", "sort", "collection"}:
            raise HTTPException(422, "元数据配置含未知字段。")
        payload = {
            "query": required(body.query, "检索词"),
            "page_size": body.size,
            "page": body.page,
            **body.options,
        }
        if body.cursor:
            payload["cursor"] = body.cursor
        data = await get_json(
            client, base + "/meta-search", method="POST", headers=headers, json=payload
        )
    elif operation == "evidence":
        if set(body.options) - {"filters", "sub_queries"}:
            raise HTTPException(422, "证据检索配置含未知字段。")
        data = await get_json(
            client,
            base + "/agentic-search",
            method="POST",
            headers=headers,
            json={"query": required(body.query, "研究问题"), "top_k": body.size, **body.options},
        )
    elif operation == "content":
        data = await get_json(
            client,
            base + "/content",
            headers=headers,
            params={
                "doc_id": required(body.record_id, "doc_id"),
                "offset": body.offset,
                "limit": 5000,
            },
        )
    else:
        raise HTTPException(404, "未定义的 Sciverse 操作。")
    if data.get("biz_code") not in {None, 0}:
        raise HTTPException(502, "Sciverse 返回业务错误，请检查参数、权限与账户额度。")
    if operation in {"metadata", "evidence"}:
        records = data.get("results" if operation == "metadata" else "hits", [])
        items = [
            row(
                p.get("title"),
                p.get("chunk") or p.get("abstract"),
                p.get("access_oa_url"),
                **{
                    k: p.get(k)
                    for k in (
                        "doi",
                        "doc_id",
                        "chunk_id",
                        "offset",
                        "page_no",
                        "author",
                        "publication_published_year",
                    )
                },
            )
            for p in records
        ]
        return result(
            "records",
            items,
            total=data.get("total_count"),
            next_cursor=data.get("next_cursor"),
            note="返回来源材料，不是模型结论。doc_id 可用于正文读取，位置字段用于回查。",
        )
    return result(
        "structured",
        data=clean(data, key),
        next_offset=data.get("next_offset") if data.get("more") else None,
        note="返回来源记录、证据或文本；不是模型生成的答案。",
    )


TOOLS = {
    "openalex": openalex_tool,
    "pubmed": pubmed_tool,
    "europepmc": europe_tool,
    "semantic_scholar": semantic_tool,
    "elicit": elicit_tool,
    "sciverse": sciverse_tool,
}


@router.post("/{provider}/{operation}")
async def run_tool(provider: str, operation: str, body: ToolInput, request: Request):
    if provider not in TOOLS:
        raise HTTPException(404, "未知数据源。")
    async with source_client(request, timeout=45) as client:
        return await TOOLS[provider](operation, body, request, client)


async def bounded_download(url, *, headers=None, params=None):
    chunks, size = [], 0
    async with httpx.AsyncClient(timeout=60, follow_redirects=False) as client:
        # Fixed service URLs only. Redirects are not followed with credentials.
        try:
            async with client.stream("GET", url, headers=headers, params=params) as response:
                if response.status_code != 200:
                    if response.status_code in {401, 402, 403, 404, 429}:
                        raise HTTPException(
                            response.status_code,
                            "内容获取失败，请检查密钥、权限、额度与内容可用性。",
                        )
                    raise HTTPException(502, "内容服务未直接返回文件，请稍后重试。")
                async for chunk in response.aiter_bytes():
                    size += len(chunk)
                    if size > 64 * 1024 * 1024:
                        raise HTTPException(413, "文件超过本应用的 64 MiB 单次下载上限。")
                    chunks.append(chunk)
                return b"".join(chunks), response.headers.get(
                    "content-type", "application/octet-stream"
                )
        except httpx.RequestError as exc:
            raise HTTPException(504, "内容下载超时或网络错误。") from exc


@router.get("/openalex/content/{work_id}/{file_format}")
async def openalex_content(work_id: str, file_format: Literal["pdf", "tei"], request: Request):
    code = identifier(work_id, r"W\d+", "OpenAlex 论文 ID")
    key = key_for(request, "openalex")
    if not key:
        raise HTTPException(503, "Content API 需要 OpenAlex API Key，请打开连接设置。")
    ext = "pdf" if file_format == "pdf" else "grobid-xml"
    content, _ = await bounded_download(
        f"https://content.openalex.org/works/{code}.{ext}", params={"api_key": key}
    )
    if file_format == "pdf" and not content.startswith(b"%PDF-"):
        raise HTTPException(502, "内容服务没有返回有效 PDF。")
    return Response(
        content,
        media_type="application/pdf" if file_format == "pdf" else "application/xml",
        headers={
            "Content-Disposition": f'attachment; filename="{code}.{ext}"',
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/sciverse/resource")
async def sciverse_resource(file_name: str, request: Request):
    if (
        not file_name
        or len(file_name) > 1000
        or file_name.startswith("/")
        or ".." in file_name
        or "\\" in file_name
        or ":" in file_name
    ):
        raise HTTPException(422, "资源需要接口返回的安全相对文件路径。")
    connection = request.app.state.sciverse_store.load()
    if not connection.configured or not connection.api_key:
        raise HTTPException(503, "请先配置 Sciverse API Key。")
    content, mime = await bounded_download(
        connection.base_url.rstrip("/") + "/resource",
        headers={"Authorization": f"Bearer {connection.api_key.get_secret_value()}"},
        params={"file_name": file_name},
    )
    name = quote(file_name.rsplit("/", 1)[-1], safe="")
    return Response(
        content,
        media_type=mime,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{name}",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
