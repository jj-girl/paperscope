"""Bibliographic adapters. These never manufacture Sciverse Schema objects."""

from __future__ import annotations

import os
import re
import time
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from html import unescape
from typing import Literal
from urllib.parse import quote, urlsplit

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, SecretStr

from app.semantic_access import source_client

Provider = Literal["pubmed", "europepmc", "openalex", "semantic_scholar", "elicit"]
router = APIRouter(prefix="/api/literature", tags=["Literature sources"])

# Native capabilities and this implementation are intentionally described separately.
PROVIDERS = {
    "pubmed": {
        "name": "PubMed",
        "scope": "生物医学书目与摘要；可使用 MeSH 和字段检索。",
        "env": "NCBI_API_KEY",
        "requires_key": False,
        "native": "书目、摘要、MeSH 与记录关联；PubMed 记录不是全文。",
        "integrated": "检索、摘要、MeSH、高级筛选、关联、历史集合、批量读取和原文入口",
        "docs": "https://www.ncbi.nlm.nih.gov/books/NBK25501/",
    },
    "europepmc": {
        "name": "Europe PMC",
        "scope": "生命科学论文与预印本；部分记录有开放全文。",
        "env": None,
        "requires_key": False,
        "native": "书目、开放全文、引用及文本挖掘标注；覆盖取决于单篇记录。",
        "integrated": "检索、摘要、开放正文、实体标注、引用、数据库与数据链接",
        "docs": "https://europepmc.org/RestfulWebService",
    },
    "openalex": {
        "name": "OpenAlex",
        "scope": "跨学科学术记录；作者、机构和引用关系丰富。",
        "env": "OPENALEX_API_KEY",
        "requires_key": False,
        "native": "元数据、作者机构、引用与聚合统计；部分记录提供 PDF / TEI XML。",
        "integrated": "检索、样本与完整查询聚合、作者机构、引用图、PDF / TEI XML 获取",
        "docs": "https://help.openalex.org/api/",
    },
    "semantic_scholar": {
        "name": "Semantic Scholar",
        "scope": "跨学科论文发现与引用网络；匿名访问可能受限流。",
        "env": "SEMANTIC_SCHOLAR_API_KEY",
        "requires_key": False,
        "native": "论文、作者、引用和推荐；部分记录有开放 PDF 链接。",
        "integrated": "检索、摘要、参考文献、施引与推荐、作者探索、分页批量与引用图",
        "docs": "https://api.semanticscholar.org/api-docs/",
    },
    "elicit": {
        "name": "Elicit",
        "scope": "论文搜索与研究工作流服务；需要有 API 权限的账户。",
        "env": "ELICIT_API_KEY",
        "requires_key": True,
        "native": "直接搜索及异步筛选、抽取和报告任务。",
        "integrated": "搜索、筛选抽取综述、报告和研究 Agent 任务的提交、状态、结果与产物",
        "docs": "https://docs.elicit.com/",
    },
}


class SearchInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    query: str = Field(min_length=1, max_length=500)
    size: int = Field(default=10, ge=1, le=20)


class KeyInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    api_key: SecretStr = Field(max_length=4096)


class Paper(BaseModel):
    id: str
    provider: str
    title: str
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    venue: str | None = None
    abstract: str | None = None
    doi: str | None = None
    pmid: str | None = None
    pmcid: str | None = None
    url: str | None = None
    fulltext_url: str | None = None
    fulltext_readable: bool = False
    citation_count: int | None = None
    subjects: list[str] = Field(default_factory=list)
    publication_types: list[str] = Field(default_factory=list)
    institutions: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    author_refs: list[dict] = Field(default_factory=list)
    institution_refs: list[dict] = Field(default_factory=list)
    content_formats: list[str] = Field(default_factory=list)


def plain(value: object) -> str:
    return unescape(re.sub(r"<[^>]*>", " ", str(value or ""))).strip()


def safe_url(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = urlsplit(value)
    except ValueError:
        return None
    if parsed.scheme in {"https", "http"} and parsed.hostname and not parsed.username:
        return value
    return None


def year(value: object) -> int | None:
    match = re.search(r"\b(18|19|20|21)\d{2}\b", str(value or ""))
    return int(match.group()) if match else None


def doi(value: object) -> str | None:
    text = re.sub(r"^https?://(dx\.)?doi\.org/", "", str(value or ""), flags=re.I)
    return text.strip() or None


def doi_url(value: str | None) -> str | None:
    return f"https://doi.org/{quote(value, safe='/')}" if value else None


def key_for(request: Request, provider: str) -> str | None:
    entry = request.app.state.literature_config.section(provider) or {}
    # An explicitly cleared local value overrides an inherited environment key.
    if "api_key" in entry:
        return entry["api_key"] or None
    env = PROVIDERS[provider]["env"]
    return os.environ.get(env) if env else None


@router.get("/providers")
def providers(request: Request) -> list[dict]:
    return [
        {"id": name, **spec, "configured": bool(key_for(request, name))}
        for name, spec in PROVIDERS.items()
    ]


@router.put("/{provider}/key")
def save_key(provider: Provider, payload: KeyInput, request: Request) -> dict:
    if not request.app.state.allow_local_literature_config:
        raise HTTPException(403, "本地连接设置已禁用。")
    if not PROVIDERS[provider]["env"]:
        raise HTTPException(400, "此数据源无需密钥。")
    value = payload.api_key.get_secret_value().strip()
    request.app.state.literature_config.update_section(provider, {"api_key": value})
    return {"configured": bool(value)}


async def fetch(client: httpx.AsyncClient, url: str, **kwargs) -> httpx.Response:
    try:
        response = await client.request(kwargs.pop("method", "GET"), url, **kwargs)
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "数据源响应超时，请稍后重试。") from exc
    except httpx.RequestError as exc:
        raise HTTPException(502, "无法连接数据源，请检查网络或代理。") from exc
    if response.status_code == 429:
        raw_attempts = response.headers.get("x-paperscope-attempts", "0")
        attempts = int(raw_attempts) if raw_attempts.isdigit() else 0
        if attempts > 1:
            message = (
                f"已限速等待并尝试 {attempts} 次，Semantic Scholar 仍在限流。请稍后再试或配置密钥。"
            )
        else:
            message = "数据源限制了请求频率或额度。请稍后重试，或配置该服务的 API Key。"
        raise HTTPException(429, message)
    if response.status_code in {401, 402, 403}:
        raise HTTPException(response.status_code, "数据源拒绝访问，请检查 API Key、权限或额度。")
    if response.status_code == 404:
        raise HTTPException(404, "数据源中没有可用的对应记录或开放全文。")
    if response.is_error or response.is_redirect:
        raise HTTPException(502, f"数据源请求失败（HTTP {response.status_code}）。")
    return response


def json_body(response: httpx.Response) -> dict:
    try:
        value = response.json()
    except ValueError as exc:
        raise HTTPException(502, "数据源返回了无法解析的 JSON。") from exc
    if not isinstance(value, dict):
        raise HTTPException(502, "数据源返回格式不符合预期。")
    return value


def xml_body(response: httpx.Response) -> ET.Element:
    try:
        return ET.fromstring(response.content)
    except ET.ParseError as exc:
        raise HTTPException(502, "数据源返回了无法解析的 XML。") from exc


def node_text(node: ET.Element | None) -> str:
    return "".join(node.itertext()).strip() if node is not None else ""


def pubmed_papers(root: ET.Element) -> list[Paper]:
    papers = []
    for record in root.findall("PubmedArticle"):
        article = record.find("MedlineCitation/Article")
        if article is None:
            continue
        pmid = record.findtext("MedlineCitation/PMID")
        if not pmid:
            continue
        ids = {
            x.get("IdType"): node_text(x)
            for x in record.findall("PubmedData/ArticleIdList/ArticleId")
        }
        abstract = []
        for part in article.findall("Abstract/AbstractText"):
            label = part.get("Label")
            abstract.append(f"{label}: {node_text(part)}" if label else node_text(part))
        authors = []
        for author in article.findall("AuthorList/Author"):
            authors.append(
                author.findtext("CollectiveName")
                or " ".join(
                    filter(
                        None,
                        [
                            author.findtext("ForeName"),
                            author.findtext("LastName"),
                        ],
                    )
                )
            )
        papers.append(
            Paper(
                id=pmid,
                provider="pubmed",
                title=node_text(article.find("ArticleTitle")),
                publication_types=[
                    node_text(x) for x in article.findall("PublicationTypeList/PublicationType")
                ],
                authors=[x for x in authors if x],
                pmid=pmid,
                pmcid=ids.get("pmc"),
                doi=doi(ids.get("doi")),
                venue=article.findtext("Journal/Title"),
                year=year(
                    article.findtext("Journal/JournalIssue/PubDate/Year")
                    or article.findtext("Journal/JournalIssue/PubDate/MedlineDate")
                    or article.findtext("ArticleDate/Year")
                ),
                abstract="\n\n".join(abstract) or None,
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                fulltext_url=(
                    f"https://pmc.ncbi.nlm.nih.gov/articles/{ids['pmc']}/"
                    if ids.get("pmc")
                    else None
                ),
                subjects=[
                    node_text(x)
                    for x in record.findall(
                        "MedlineCitation/MeshHeadingList/MeshHeading/DescriptorName"
                    )
                ],
            )
        )
    return papers


async def pubmed(client, query, size, key):
    common = {"db": "pubmed", "tool": "paperscope"}
    if key:
        common["api_key"] = key
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    data = json_body(
        await fetch(
            client,
            base + "esearch.fcgi",
            params={
                **common,
                "term": query,
                "retmax": size,
                "retmode": "json",
                "sort": "relevance",
            },
        )
    )
    result = data.get("esearchresult")
    if not isinstance(result, dict) or "ERROR" in result or "error" in data:
        raise HTTPException(502, "PubMed 没有返回有效检索结果。")
    ids = result.get("idlist", [])
    if not ids:
        return [], int(result.get("count", 0)), result.get("querytranslation"), []
    # E-utilities allows three requests per second without a key.
    import asyncio

    await asyncio.sleep(0.35)
    response = await fetch(
        client,
        base + "efetch.fcgi",
        params={
            **common,
            "id": ",".join(ids),
            "retmode": "xml",
        },
    )
    parsed = {p.id: p for p in pubmed_papers(xml_body(response))}
    warnings = []
    if len(parsed) < len(ids):
        warnings.append("部分记录未能映射为期刊论文，已保留实际可读取的结果。")
    return (
        [parsed[i] for i in ids if i in parsed],
        int(result["count"]),
        result.get("querytranslation"),
        warnings,
    )


def europe_paper(item: dict) -> Paper:
    source, pid = item.get("source", "MED"), str(item.get("id", ""))
    pmcid = item.get("pmcid")
    urls = item.get("fullTextUrlList", {}).get("fullTextUrl", [])
    fulltext = next(
        (
            safe_url(x.get("url"))
            for x in urls
            if x.get("availabilityCode") == "OA" and safe_url(x.get("url"))
        ),
        None,
    )
    return Paper(
        id=f"{source}:{pid}",
        provider="europepmc",
        title=plain(item.get("title")),
        authors=[
            a.get("fullName", "")
            for a in item.get("authorList", {}).get("author", [])
            if a.get("fullName")
        ],
        year=year(item.get("pubYear")),
        doi=doi(item.get("doi")),
        pmcid=pmcid,
        pmid=item.get("pmid") or (pid if source == "MED" else None),
        venue=item.get("journalInfo", {}).get("journal", {}).get("title"),
        abstract=plain(item.get("abstractText")) or None,
        url=f"https://europepmc.org/article/{quote(source, safe='')}/{quote(pid, safe='')}",
        fulltext_url=fulltext,
        fulltext_readable=bool(pmcid and item.get("isOpenAccess") == "Y"),
        citation_count=item.get("citedByCount"),
    )


async def europepmc(client, query, size, key):
    data = json_body(
        await fetch(
            client,
            "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
            params={
                "query": query,
                "format": "json",
                "resultType": "core",
                "pageSize": size,
            },
        )
    )
    if "resultList" not in data:
        raise HTTPException(502, "Europe PMC 返回格式不符合预期。")
    return (
        [europe_paper(p) for p in data["resultList"].get("result", [])],
        data.get("hitCount"),
        query,
        [],
    )


def abstract_from_index(index: dict | None) -> str | None:
    if not index:
        return None
    positions = {position: word for word, offsets in index.items() for position in offsets}
    return " ".join(positions[i] for i in sorted(positions)) or None


def openalex_paper(item: dict) -> Paper:
    location = item.get("best_oa_location") or {}
    primary = item.get("primary_location") or {}
    identifiers = item.get("ids") or {}
    return Paper(
        id=str(item["id"]).rsplit("/", 1)[-1],
        provider="openalex",
        title=plain(item.get("display_name")),
        year=year(item.get("publication_year")),
        authors=[a.get("author", {}).get("display_name", "") for a in item.get("authorships", [])],
        venue=(primary.get("source") or {}).get("display_name"),
        abstract=abstract_from_index(item.get("abstract_inverted_index")),
        doi=doi(item.get("doi")),
        pmid=str(identifiers["pmid"]).rstrip("/").rsplit("/", 1)[-1]
        if identifiers.get("pmid")
        else None,
        url=safe_url(primary.get("landing_page_url")) or safe_url(item.get("id")),
        fulltext_url=safe_url(location.get("pdf_url"))
        or safe_url(location.get("landing_page_url")),
        citation_count=item.get("cited_by_count"),
        publication_types=[item["type"]] if item.get("type") else [],
        topics=[p["display_name"] for p in item.get("topics", []) if p.get("display_name")],
        institutions=list(
            dict.fromkeys(
                institution["display_name"]
                for a in item.get("authorships", [])
                for institution in a.get("institutions", [])
                if institution.get("display_name")
            )
        ),
        author_refs=[
            {
                "id": a["author"]["id"].rsplit("/", 1)[-1],
                "name": a["author"].get("display_name", ""),
            }
            for a in item.get("authorships", [])
            if (a.get("author") or {}).get("id")
        ],
        institution_refs=list(
            {
                i["id"]: {"id": i["id"].rsplit("/", 1)[-1], "name": i.get("display_name", "")}
                for a in item.get("authorships", [])
                for i in a.get("institutions", [])
                if i.get("id")
            }.values()
        ),
        content_formats=[
            k
            for k, v in (item.get("has_content") or {}).items()
            if v and k in {"pdf", "grobid_xml"}
        ],
    )


async def openalex(client, query, size, key):
    data = json_body(
        await fetch(
            client,
            "https://api.openalex.org/works",
            params={
                "search": query,
                "per_page": size,
            },
            headers={"Authorization": f"Bearer {key}"} if key else {},
        )
    )
    if "results" not in data:
        raise HTTPException(502, "OpenAlex 返回格式不符合预期。")
    return (
        [openalex_paper(p) for p in data["results"]],
        data.get("meta", {}).get("count"),
        query,
        [],
    )


async def semantic_scholar(client, query, size, key):
    data = json_body(
        await fetch(
            client,
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={
                "query": query,
                "limit": size,
                "fields": (
                    "title,year,abstract,authors,externalIds,url,openAccessPdf,citationCount,venue"
                ),
            },
            headers={"x-api-key": key} if key else {},
        )
    )
    if "data" not in data:
        raise HTTPException(502, "Semantic Scholar 返回格式不符合预期。")
    return [semantic_paper(p) for p in data["data"]], data.get("total"), query, []


def semantic_paper(p: dict) -> Paper:
    ids = p.get("externalIds") or {}
    return Paper(
        id=p["paperId"],
        provider="semantic_scholar",
        title=plain(p.get("title")),
        authors=[a["name"] for a in p.get("authors", []) if a.get("name")],
        author_refs=[
            {"id": a["authorId"], "name": a.get("name", "")}
            for a in p.get("authors", [])
            if a.get("authorId")
        ],
        year=year(p.get("year")),
        venue=p.get("venue"),
        abstract=p.get("abstract"),
        doi=doi(ids.get("DOI")),
        pmid=ids.get("PubMed"),
        pmcid=ids.get("PubMedCentral"),
        url=safe_url(p.get("url")),
        fulltext_url=safe_url((p.get("openAccessPdf") or {}).get("url")),
        citation_count=p.get("citationCount"),
    )


async def elicit(client, query, size, key):
    data = json_body(
        await fetch(
            client,
            "https://elicit.com/api/v2/search/papers",
            method="POST",
            headers={"Authorization": f"Bearer {key}"},
            json={"query": query, "maxResults": size},
        )
    )
    if "papers" not in data:
        raise HTTPException(502, "Elicit 返回格式不符合预期。")
    papers = []
    for index, p in enumerate(data["papers"]):
        paper_doi = doi(p.get("doi"))
        papers.append(
            Paper(
                id=p.get("elicitId") or p.get("pmid") or paper_doi or f"result-{index}",
                provider="elicit",
                title=plain(p.get("title")),
                authors=p.get("authors") or [],
                year=year(p.get("year")),
                venue=p.get("venue"),
                abstract=p.get("abstract"),
                doi=paper_doi,
                pmid=p.get("pmid"),
                citation_count=p.get("citedByCount"),
                url=doi_url(paper_doi),
                fulltext_url=safe_url(p.get("fullTextUrl")),
                publication_types=p.get("studyTypeTags") or [],
            )
        )
    # Do not pass arbitrary upstream warning text or account details to the browser.
    warnings = ["Elicit 返回了部分结果警告；此结果集可能不完整。"] if data.get("warnings") else []
    return papers, None, query, warnings


ADAPTERS = {
    "pubmed": pubmed,
    "europepmc": europepmc,
    "openalex": openalex,
    "semantic_scholar": semantic_scholar,
    "elicit": elicit,
}


@router.get("/semantic_scholar/papers/{paper_id}/{kind}")
async def semantic_neighbors(
    paper_id: str,
    kind: Literal["references", "recommendations"],
    request: Request,
) -> dict:
    if not re.fullmatch(r"[a-fA-F0-9]{40}", paper_id):
        raise HTTPException(422, "需要检索结果中的 Semantic Scholar paperId。")
    key = key_for(request, "semantic_scholar")
    fields = "title,year,abstract,authors,externalIds,url,openAccessPdf,citationCount,venue"
    if kind == "references":
        url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}/references"
    else:
        url = f"https://api.semanticscholar.org/recommendations/v1/papers/forpaper/{paper_id}"
    async with source_client(request, timeout=30) as client:
        data = json_body(
            await fetch(
                client,
                url,
                params={"fields": fields, "limit": 20},
                headers={"x-api-key": key} if key else {},
            )
        )
    field = "data" if kind == "references" else "recommendedPapers"
    if field not in data:
        raise HTTPException(502, "关联论文返回格式不符合预期。")
    records = (
        [x.get("citedPaper") or {} for x in data[field]] if kind == "references" else data[field]
    )
    return {
        "kind": kind,
        "seed_id": paper_id,
        "papers": [semantic_paper(p).model_dump() for p in records if p.get("paperId")],
        "limit": 20,
        "note": "仅展示最多 20 篇；推荐是相关性建议，不表示论文间存在引用。",
    }


@router.post("/{provider}/search")
async def search(provider: Provider, payload: SearchInput, request: Request) -> dict:
    key = key_for(request, provider)
    if PROVIDERS[provider]["requires_key"] and not key:
        raise HTTPException(503, "请先配置此服务的 API Key。此检索不需要配置 Sciverse 或模型。")
    started = time.monotonic()
    async with source_client(request, timeout=30) as client:
        papers, total, translated, warnings = await ADAPTERS[provider](
            client,
            payload.query,
            payload.size,
            key,
        )
    return {
        "provider": provider,
        "query": payload.query,
        "effective_query": translated,
        "papers": [p.model_dump() for p in papers],
        "total": total,
        "returned": len(papers),
        "requested": payload.size,
        "elapsed_ms": round((time.monotonic() - started) * 1000),
        "retrieved_at": datetime.now(UTC).isoformat(),
        "warnings": warnings,
    }


@router.get("/europepmc/fulltext/{pmcid}")
async def fulltext(pmcid: str) -> dict:
    if not re.fullmatch(r"PMC\d+", pmcid):
        raise HTTPException(422, "需要有效的 PMCID。")
    async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
        root = xml_body(
            await fetch(
                client, f"https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML"
            )
        )
    paragraphs = []
    body = root.find("body")
    if body is not None:
        for node in body.iter():
            if node.tag in {"title", "p"} and node_text(node):
                paragraphs.append({"kind": node.tag, "text": node_text(node)})
    if not paragraphs:
        raise HTTPException(404, "该记录没有可读取的开放正文。")
    return {
        "pmcid": pmcid,
        "paragraphs": paragraphs,
        "source_url": f"https://europepmc.org/articles/{pmcid}",
        "note": "开放全文正文，尚未与实体或论断建立证据对齐；表格和图片请打开原文。",
    }
