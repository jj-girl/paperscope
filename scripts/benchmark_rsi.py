#!/usr/bin/env python3
"""Small, explicit live benchmark through PaperScope. No keys or LLM calls.

Output is private by default. It contains retrieved article material and must not
be committed. Public reports should use only reviewed aggregate statistics.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import platform
from importlib.metadata import PackageNotFoundError, version
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

PROVIDERS = ["sciverse", "pubmed", "europepmc", "openalex", "semantic_scholar", "elicit"]


def now():
    return datetime.now(timezone.utc).isoformat()


def links(value):
    values = value if isinstance(value, list) else [value]
    result = []
    for item in values:
        if not isinstance(item, str):
            continue
        parsed = urllib.parse.urlsplit(item)
        if parsed.scheme in {"http", "https"} and parsed.hostname and not parsed.username:
            result.append(item)
    return list(dict.fromkeys(result))


def xml_body(content):
    root = ET.fromstring(content)

    def local(node):
        return node.tag.rsplit("}", 1)[-1].lower()

    document = next((node for node in root.iter() if local(node) in {"article", "tei"}), None)
    if document is None:
        raise ValueError("Response is neither an article XML nor a TEI document")
    root = document
    body = next((node for node in root.iter() if local(node) == "body"), None)
    # Some TEI variants use text/div without a body wrapper.
    if body is None:
        body = next((node for node in root.iter() if local(node) == "text"), None)
    title_nodes = [n for n in root.iter() if local(n) in {"article-title", "title"}]
    title = next(
        (" ".join(n.itertext()).strip() for n in title_nodes if " ".join(n.itertext()).strip()), ""
    )
    paragraphs = (
        []
        if body is None
        else [" ".join(n.itertext()).strip() for n in body.iter() if local(n) == "p"]
    )
    paragraphs = [p for p in paragraphs if p]
    headings = (
        []
        if body is None
        else [" ".join(n.itertext()).strip() for n in body.iter() if local(n) in {"head", "title"}]
    )
    text = "\n".join(paragraphs)
    return {
        "parsed": bool(paragraphs),
        "body_present": body is not None,
        "chars": len(text),
        "paragraphs": len(paragraphs),
        "document_title": title[:500],
        "headings": headings[:30],
        "completeness_basis": "full-text XML response with a nonempty body; not publisher-by-publisher validation",
    }


class Benchmark:
    def __init__(self, args):
        self.args = args
        self.output = Path(args.output).resolve()
        self.output.mkdir(parents=True, exist_ok=False)
        self.lock = threading.Lock()
        self.calls = []
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    def api(self, provider, operation, path, body=None, filename=None):
        started = now()
        tick = time.monotonic()
        method = "POST" if body is not None else "GET"
        request = urllib.request.Request(
            self.args.base_url.rstrip("/") + path,
            data=json.dumps(body).encode() if body is not None else None,
            headers={"Content-Type": "application/json"} if body is not None else {},
            method=method,
        )
        status, content, transport_error = None, b"", None
        try:
            with self.opener.open(request, timeout=90) as response:
                status, content = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, content = error.code, error.read()
        except (TimeoutError, OSError, urllib.error.URLError) as error:
            transport_error = type(error).__name__
        record = {
            "provider": provider,
            "operation": operation,
            "path": path,
            "method": method,
            "request": body,
            "started_at": started,
            "elapsed_ms": round((time.monotonic() - tick) * 1000),
            "status": status,
            "transport_error": transport_error,
            "response_bytes": len(content),
        }
        with self.lock:
            self.calls.append(record)
            self.save_json("calls.json", self.calls)
        if filename:
            directory = self.output / provider
            directory.mkdir(exist_ok=True)
            (directory / filename).write_bytes(content)
        return record, content

    def save_json(self, filename, value):
        (self.output / filename).write_text(json.dumps(value, ensure_ascii=False, indent=2))

    def search(self, provider, configured):
        if provider == "elicit" and not configured.get(provider):
            return {
                "provider": provider,
                "status": "skipped_missing_api_key",
                "records": [],
                "search": None,
            }
        if provider == "sciverse":
            body = {
                "query": self.args.query,
                "size": self.args.size,
                "options": {"collection": "papers"},
            }
            path = "/api/advanced/sciverse/metadata"
        else:
            body = {"query": self.args.query, "size": self.args.size}
            path = f"/api/literature/{provider}/search"
        call, content = self.api(provider, "search", path, body, "search.json")
        if call["status"] != 200:
            print(f"{provider}: search failed HTTP {call['status']}", flush=True)
            return {"provider": provider, "status": "search_failed", "records": [], "search": call}
        data = json.loads(content)
        rows = (
            data.get("provider_response", {}).get("results", [])
            if provider == "sciverse"
            else data.get("papers", [])
        )
        records = []
        for rank, row in enumerate(rows, 1):
            if provider == "sciverse":
                record = {
                    "id": row.get("unique_id"),
                    "doc_id": row.get("doc_id"),
                    "title": row.get("title"),
                    "doi": row.get("doi"),
                    "abstract_present": bool(row.get("abstract")),
                    "external_fulltext_links": links(row.get("access_oa_url")),
                    "is_oa": row.get("access_is_oa"),
                    "type": row.get("type") or row.get("metadata_type"),
                    "pdf_flag": False,
                    "xml_flag": False,
                    "native_content_candidate": bool(row.get("doc_id")),
                }
            else:
                formats = row.get("content_formats", [])
                xml_flag = (
                    bool(row.get("fulltext_readable") and row.get("pmcid"))
                    if provider == "europepmc"
                    else ("grobid_xml" in formats if provider == "openalex" else False)
                )
                record = {
                    "id": row.get("id"),
                    "title": row.get("title"),
                    "doi": row.get("doi"),
                    "pmid": row.get("pmid"),
                    "pmcid": row.get("pmcid"),
                    "abstract_present": bool(row.get("abstract")),
                    "external_fulltext_links": links(row.get("fulltext_url")),
                    "is_oa": row.get("is_open_access"),
                    "type": row.get("publication_types", []),
                    "content_formats": formats,
                    "pdf_flag": provider == "openalex" and "pdf" in formats,
                    "xml_flag": xml_flag,
                    "native_content_candidate": bool(
                        xml_flag or provider == "openalex" and "pdf" in formats
                    ),
                }
            record.update(provider=provider, rank=rank, artifacts=[], fulltext_success=False)
            records.append(record)
        print(
            f"{provider}: search HTTP 200, returned {len(records)}, {call['elapsed_ms']} ms",
            flush=True,
        )
        return {
            "provider": provider,
            "status": "searched",
            "records": records,
            "search": call,
            "reported_total": data.get("total"),
            "effective_query": data.get("effective_query"),
            "warnings": data.get("warnings", []),
            "retrieved_at": data.get("retrieved_at"),
        }

    def retrieve(self, record):
        provider, rank = record["provider"], record["rank"]
        targets = []
        if provider == "sciverse" and record.get("doc_id"):
            targets.append(
                (
                    "text",
                    "/api/advanced/sciverse/content",
                    {"record_id": record["doc_id"], "read_mode": "full"},
                    f"{rank:02}-full.json",
                )
            )
        elif provider == "europepmc" and record["xml_flag"]:
            targets.append(
                (
                    "xml",
                    f"/api/literature/europepmc/fulltext/{urllib.parse.quote(record['pmcid'], safe='')}?format=xml",
                    None,
                    f"{rank:02}-full.xml",
                )
            )
        elif provider == "openalex":
            for file_format, flag in [("tei", "xml_flag"), ("pdf", "pdf_flag")]:
                if record[flag]:
                    targets.append(
                        (
                            file_format,
                            f"/api/advanced/openalex/content/{urllib.parse.quote(record['id'], safe='')}/{file_format}",
                            None,
                            f"{rank:02}-full.{'xml' if file_format == 'tei' else 'pdf'}",
                        )
                    )
        for kind, path, body, filename in targets:
            call, raw = self.api(provider, kind, path, body, filename)
            artifact = {
                "format": kind,
                "status": call["status"],
                "elapsed_ms": call["elapsed_ms"],
                "bytes": len(raw),
                "download_success": call["status"] == 200,
                "parse_attempted": call["status"] == 200,
                "parsed": False,
                "complete": False,
                "sha256": hashlib.sha256(raw).hexdigest() if call["status"] == 200 else None,
            }
            if call["status"] == 200:
                try:
                    if kind == "text":
                        data = json.loads(raw)
                        text = data.get("data", {}).get("text", "")
                        paragraphs = [p for p in text.split("\n\n") if p.strip()]
                        artifact.update(
                            parsed=bool(text.strip()),
                            chars=len(text),
                            paragraphs=len(paragraphs),
                            more=data.get("reading", {}).get("more"),
                            headings=[
                                line.strip("# ")[:160]
                                for line in text.splitlines()
                                if line.startswith("#")
                            ][:30],
                        )
                        artifact["complete"] = bool(
                            artifact["parsed"] and artifact["more"] is False
                        )
                        artifact["completeness_basis"] = (
                            "full mode, nonempty text, service more=false"
                        )
                    elif kind in {"xml", "tei"}:
                        artifact.update(xml_body(raw))
                        artifact["complete"] = artifact["parsed"]
                    elif kind == "pdf":
                        import pymupdf

                        if not raw.startswith(b"%PDF-"):
                            raise ValueError("not_pdf")
                        with pymupdf.open(stream=raw, filetype="pdf") as document:
                            pages = [page.get_text() for page in document]
                            extracted = "\n".join(pages)
                            artifact.update(
                                parsed=bool(extracted.strip()),
                                chars=len(extracted),
                                pages=len(pages),
                                text_pages=sum(bool(t.strip()) for t in pages),
                                document_title=(document.metadata or {}).get("title", "")[:500],
                            )
                            artifact["complete"] = artifact["parsed"]
                            artifact["completeness_basis"] = (
                                "complete PDF file opened and all pages processed; no OCR"
                            )
                except Exception as error:
                    artifact["parse_error"] = type(error).__name__
            record["artifacts"].append(artifact)
        record["fulltext_success"] = any(a["parsed"] and a["complete"] for a in record["artifacts"])
        record["only_link_in_this_run"] = (
            bool(record["external_fulltext_links"]) and not record["fulltext_success"]
        )
        print(
            f"{provider} rank={rank}: fulltext={record['fulltext_success']}, artifacts="
            + ",".join(f"{a['format']}:{a['status']}" for a in record["artifacts"]),
            flush=True,
        )
        return record

    def run(self):
        # Read connection status only; no secrets are returned by these endpoints.
        with self.opener.open(self.args.base_url + "/api/literature/providers", timeout=15) as r:
            configured = {x["id"]: x["configured"] for x in json.load(r)}
        with self.opener.open(self.args.base_url + "/api/settings/sciverse", timeout=15) as r:
            configured["sciverse"] = json.load(r)["configured"]
        try:
            revision = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=Path(__file__).resolve().parents[1], text=True
            ).strip()
        except Exception:
            revision = None
        try:
            pdf_parser_version = version("pymupdf")
        except PackageNotFoundError:
            pdf_parser_version = None
        protocol = {
            "python_version": platform.python_version(),
            "pdf_parser_version": pdf_parser_version,
            "started_at": now(),
            "query": self.args.query,
            "requested_per_source": self.args.size,
            "sorting": "adapter defaults: PubMed sort=relevance; other providers default",
            "filters": "none; Sciverse collection=papers",
            "cross_provider_fulltext_fallback": False,
            "external_links_downloaded": False,
            "llm_used": False,
            "configured": configured,
            "application_revision": revision,
            "request_metric_unit": "one PaperScope operation; internal provider requests/retries are not separate trials",
            "parsing": "XML body paragraphs; Sciverse full text with more=false; PDF all-page text extraction without OCR",
            "sampling_unit": "returned source records; versions and software entries retained",
            "external_link_metric": "candidate URL presence, not verified reachability",
            "fulltext_definition": "engineering evidence of complete source document, not an independent proof of publisher-version completeness",
        }
        self.save_json("protocol.json", protocol)
        # Freeze every search result set before looking for full text.
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda p: self.search(p, configured), PROVIDERS))
        self.save_json("search_manifest.json", results)
        for result in results:
            with ThreadPoolExecutor(max_workers=2) as pool:
                result["records"] = list(pool.map(self.retrieve, result["records"]))
            self.save_json("results.json", results)
        summaries = []
        for result in results:
            records = result["records"]
            artifacts = [a for r in records for a in r["artifacts"]]
            calls = [c for c in self.calls if c["provider"] == result["provider"]]
            summaries.append(
                {
                    "provider": result["provider"],
                    "status": result["status"],
                    "n": len(records),
                    "search_ms": result["search"]["elapsed_ms"] if result["search"] else None,
                    "search_status": result["search"]["status"] if result["search"] else None,
                    "abstracts": sum(r["abstract_present"] for r in records),
                    "links": sum(bool(r["external_fulltext_links"]) for r in records),
                    "only_links": sum(r["only_link_in_this_run"] for r in records),
                    "native_candidates": sum(r["native_content_candidate"] for r in records),
                    "pdf_flags": sum(r["pdf_flag"] for r in records),
                    "xml_flags": sum(r["xml_flag"] for r in records),
                    "pdf_downloads": sum(
                        a["format"] == "pdf" and a["download_success"] for a in artifacts
                    ),
                    "xml_downloads": sum(
                        a["format"] in {"xml", "tei"} and a["download_success"] for a in artifacts
                    ),
                    "text_downloads": sum(
                        a["format"] == "text" and a["download_success"] for a in artifacts
                    ),
                    "parse_attempts": sum(a["parse_attempted"] for a in artifacts),
                    "parse_successes": sum(a["parsed"] for a in artifacts),
                    "structured_body_papers": sum(
                        any(a["format"] in {"xml", "tei"} and a["parsed"] for a in r["artifacts"])
                        for r in records
                    ),
                    "fulltext_papers": sum(r["fulltext_success"] for r in records),
                    "request_errors": sum(c["status"] != 200 for c in calls),
                    "requests": len(calls),
                    "request_elapsed_ms_sum": sum(c["elapsed_ms"] for c in calls),
                }
            )
        protocol["finished_at"] = now()
        self.save_json("protocol.json", protocol)
        self.save_json("summary.json", summaries)
        self.save_json("results.json", results)
        with (self.output / "summary.csv").open("w", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=list(summaries[0]))
            writer.writeheader()
            writer.writerows(summaries)
        print(json.dumps(summaries, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8040")
    parser.add_argument("--query", default="recursive self-improvement")
    parser.add_argument("--size", type=int, choices=range(1, 21), default=10)
    parser.add_argument(
        "--output", required=True, help="New private output directory, outside Git-tracked files"
    )
    Benchmark(parser.parse_args()).run()
