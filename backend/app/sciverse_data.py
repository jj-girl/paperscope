"""Direct Paper Schema data operations; no model runtime or guide generation."""

from __future__ import annotations

from urllib.parse import quote

from fastapi import HTTPException

from app.literature import fetch, json_body


async def schema_call(operation, body, client, base, headers):
    def need(value, label):
        if not value:
            raise HTTPException(422, f"请填写 {label}。")
        return value

    def options(*allowed):
        if set(body.options) - set(allowed):
            raise HTTPException(422, "附加参数含此接口不支持的字段，请检查接口说明。")
        value = dict(body.options)
        if "filters" in value and not isinstance(value["filters"], dict):
            raise HTTPException(422, "Paper Schema 的 filters 必须为对象。")
        return value

    page = {"size": body.size, **({"cursor": body.cursor} if body.cursor else {})}
    method, params, payload = "POST", None, None
    root = "/paper-schema"
    sid = quote(body.record_id, safe="")
    child = quote(body.child_id, safe="")
    paper_path = f"{root}/schemas/{sid}"
    if operation == "schema_capabilities":
        options()
        method, path = "GET", root
    elif operation == "schema_search":
        payload = {**page, **options("filters", "sort")}
        if body.query:
            payload["query"] = body.query
        if not body.query and not payload.get("filters"):
            raise HTTPException(422, "请提供检索词或 filters。")
        path = root + "/search"
    elif operation == "schema_entities_search":
        payload = {**page, **options("filters", "hydrate_schema_papers")}
        if body.query:
            payload["query"] = body.query
        if body.record_id:
            payload["filters"] = {**payload.get("filters", {}), "schema_ids": [body.record_id]}
        if not body.query and not payload.get("filters", {}).get("schema_ids"):
            raise HTTPException(422, "请提供检索词或 schema_id。")
        path = root + "/entities/search"
    elif operation == "schema_entity_papers":
        payload = {
            **page,
            "query": need(body.query, "实体名称 / query"),
            **options("entity_types", "entity_subtypes", "exclude_schema_ids"),
        }
        path = root + "/entities/related-papers"
    elif operation == "schema_related":
        need(body.record_id, "schema_id")
        payload = {"size": min(body.size, 50), **options("signals", "exclude_same_work")}
        path = paper_path + "/related-papers"
    elif operation in {
        "schema_entities",
        "schema_citations",
        "schema_citation_summary",
        "schema_citation_graph",
    }:
        need(body.record_id, "schema_id")
        method = "GET"
        suffix = {
            "schema_entities": "entities",
            "schema_citations": "citations",
            "schema_citation_summary": "citation-summary",
            "schema_citation_graph": "citation-graph",
        }[operation]
        path = paper_path + "/" + suffix
        if operation == "schema_entities":
            params = {**page, **options("entity_types", "entity_subtypes", "sections")}
        elif operation == "schema_citation_graph":
            params = {
                "direction": "outbound",
                "depth": 1,
                "max_nodes": 50,
                "max_edges": 100,
                **options("direction", "depth", "max_nodes", "max_edges"),
            }
        elif operation == "schema_citations":
            params = {**page, **options()}
        else:
            params = options()
    elif operation in {"schema_entity", "schema_relation", "schema_evidence_item"}:
        need(body.record_id, "schema_id")
        need(body.child_id, "entity_id / relation_id / evidence_id")
        method = "GET"
        suffix = {
            "schema_entity": "entities",
            "schema_relation": "relations",
            "schema_evidence_item": "evidence",
        }[operation]
        path = paper_path + f"/{suffix}/{child}"
        if operation == "schema_entity":
            params = options("include_relations", "relation_limit")
        elif operation == "schema_relation":
            params = options("include_context")
        else:
            params = options()
    elif operation == "schema_relations":
        payload = {**page, **options("filters", "evidence_query", "include_context")}
        if body.record_id:
            payload["filters"] = {**payload.get("filters", {}), "schema_ids": [body.record_id]}
        if not payload.get("filters"):
            raise HTTPException(422, "需要 schema_id 或关系范围 filters。")
        path = root + "/relations/search"
    elif operation == "schema_evidence":
        payload = {
            **page,
            **options(
                "groups",
                "group_operator",
                "schema_ids",
                "key",
                "path_bucket",
                "value_number_min",
                "value_number_max",
                "value_bool",
                "hydrate_schema_papers",
            ),
        }
        if body.record_id:
            payload["schema_ids"] = [body.record_id]
        if body.query:
            payload["query"] = body.query
        if not isinstance(payload.get("groups"), list) or not 1 <= len(payload["groups"]) <= 5:
            raise HTTPException(422, "请提供 1–5 个 Evidence groups。")
        path = root + "/evidence/search"
    elif operation in {"schema_provenance", "schema_provenance_ids"}:
        payload = {
            "window": 1,
            "max_segments": min(body.size, 100),
            **options("window", "max_segments"),
        }
        if operation == "schema_provenance_ids":
            payload["paragraph_ids"] = need(body.ids, "paragraph_ids")
        else:
            payload.update(
                schema_id=need(body.record_id, "schema_id"),
                marker_nums=need(body.markers, "marker_nums"),
            )
        path = root + "/resolve-provenance"
    elif operation == "schema_text":
        payload = {
            "schema_id": need(body.record_id, "schema_id"),
            "query": need(body.query, "query"),
            "top_k": min(body.size, 20),
            "window": 1,
            **options("section_hint", "prefer_url", "prefer_code", "window"),
        }
        path = root + "/search-in-schema"
    elif operation == "schema_hydrate":
        payload = options("items", "window", "max_segments_per_item", "prefer_url_or_code")
        if not isinstance(payload.get("items"), list) or not 1 <= len(payload["items"]) <= 50:
            raise HTTPException(422, "items 需要包含 1–50 项及各项的 schema_id 和定位信息。")
        path = root + "/hydrate-items"
    elif operation == "schema_materials":
        ids = body.ids or ([body.record_id] if body.record_id else [])
        if not 1 <= len(ids) <= 20:
            raise HTTPException(422, "研究材料包需要 1–20 个 schema_id。")
        goal = body.kind or "overview"
        if goal not in {"overview", "survey", "benchmark", "method", "reproduction"}:
            raise HTTPException(422, "未知的材料选择 goal。")
        payload = {
            "schema_ids": ids,
            "goal": goal,
            **options(
                "include_relation_context",
                "per_schema_entity_limit",
                "per_schema_relation_limit",
                "per_schema_attribute_limit",
                "per_schema_term_limit",
            ),
        }
        path = root + "/materials"
    else:
        raise HTTPException(404, "未知的 Paper Schema 数据操作。")
    args = {"params": params} if method == "GET" else {"json": payload}
    return json_body(await fetch(client, base + path, method=method, headers=headers, **args))
