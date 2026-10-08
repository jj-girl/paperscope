import { useEffect, useRef, useState, type FormEvent } from "react";
import { SERVICE_OPERATIONS } from "./serviceOperations";
import type { LiteraturePaper } from "./SourceApp";
import SharedAi from "./SharedAi";
import { localFetch } from "./localFetch";
import "./service-tools.css";

type ToolResult = {
  view: string;
  items: Record<string, unknown>[];
  total?: number;
  note?: string;
  next_cursor?: string | null;
  next_page?: number | null;
  next_offset?: number | null;
  data?: Record<string, unknown>;
  details?: Record<string, unknown>;
  title?: string;
  webenv?: string;
  query_key?: string;
  effective_query?: string;
  edges?: { source: string; target: string; type: string }[];
};

const LABELS: Record<string, string> = {
  works_count: "论文数量",
  cited_by_count: "引用计数",
  summary_stats: "学术指标",
  counts_by_year: "逐年记录",
  affiliations: "机构",
  year: "年份",
  type: "类型",
  section: "来源章节",
  tags: "实体链接",
  status: "状态",
  sessionId: "任务 ID",
  phase: "阶段",
  stages: "阶段结果",
  url: "查看来源",
  pdfUrl: "下载 PDF",
  docxUrl: "下载 Word",
  txtUrl: "参考文献文本",
  bibUrl: "BibTeX",
  risUrl: "RIS",
  nextCursor: "下一页游标",
  cursor: "事件游标",
  query_key: "查询键",
  webenv: "历史集合",
  name: "名称",
  text: "内容",
  title: "标题",
  content: "内容",
  events: "活动记录",
  papers: "论文",
  results: "结果",
  items: "记录",
  references: "参考文献",
  sources: "来源",
  links: "操作链接",
  totalCount: "总数",
  exportsStatus: "导出状态",
};

export function StructuredValue({
  value,
  depth = 0,
}: {
  value: unknown;
  depth?: number;
}) {
  if (value === null || value === undefined)
    return <span className="source-muted">未提供</span>;
  if (typeof value === "string")
    return /^https?:\/\/[^\s]+$/i.test(value) ? (
      <a href={value} target="_blank" rel="noopener noreferrer">
        {value.length > 100 ? value.slice(0, 90) + "…" : value}
      </a>
    ) : (
      <span className="tools-text">{value}</span>
    );
  if (typeof value !== "object") return <span>{String(value)}</span>;
  if (depth > 7)
    return <span className="source-muted">更深层内容请导出结果查看</span>;
  if (Array.isArray(value))
    return value.length ? (
      <div className="tools-values">
        {value.map((v, i) => (
          <div key={i}>
            <StructuredValue value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    ) : (
      <span className="source-muted">空集合</span>
    );
  return (
    <dl className="tools-fields">
      {Object.entries(value).map(([key, v]) => (
        <div key={key}>
          <dt>{LABELS[key] || key}</dt>
          <dd>
            <StructuredValue value={v} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CitationMap({ edges }: { edges: NonNullable<ToolResult["edges"]> }) {
  const shown = edges.slice(0, 12);
  const nodes = [...new Set(shown.flatMap((e) => [e.source, e.target]))];
  const position = new Map(
    nodes.map((id, i) => [
      id,
      {
        x: 225 + 175 * Math.cos((i * 2 * Math.PI) / nodes.length),
        y: 175 + 130 * Math.sin((i * 2 * Math.PI) / nodes.length),
      },
    ]),
  );
  return (
    <details className="tools-network">
      <summary>查看本页引用关系图（展示前 {shown.length} 条边）</summary>
      <svg viewBox="0 0 450 350" role="img" aria-label="引用方向图">
        <defs>
          <marker
            id="citation-arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8d91a7" />
          </marker>
        </defs>
        {shown.map((e, i) => {
          const a = position.get(e.source)!;
          const b = position.get(e.target)!;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#b0b6ca"
              markerEnd="url(#citation-arrow)"
            />
          );
        })}
        {nodes.map((id) => {
          const p = position.get(id)!;
          return (
            <g key={id}>
              <circle cx={p.x} cy={p.y} r="12" fill="#5b5bf7" />
              <text x={p.x} y={p.y + 26} textAnchor="middle" fontSize="8">
                {id.length > 15 ? id.slice(0, 12) + "…" : id}
              </text>
              <title>{id}</title>
            </g>
          );
        })}
      </svg>
      <p>箭头从引用论文指向被引用论文；节点标识对应下方记录。</p>
    </details>
  );
}

function ResultView({ data }: { data: ToolResult }) {
  const max = Math.max(1, ...data.items.map((x) => Number(x.count) || 0));
  return (
    <div className="tools-result">
      {data.note && <p className="source-notice">{data.note}</p>}
      {data.total !== undefined && data.total !== null && (
        <p>
          <strong>{data.total.toLocaleString()}</strong>{" "}
          {data.view === "groups"
            ? "篇论文匹配本次查询（完整集合）"
            : "条来源记录"}
        </p>
      )}
      {data.effective_query && (
        <details>
          <summary>实际检索式</summary>
          <p className="tools-text">{data.effective_query}</p>
        </details>
      )}
      {data.webenv && (
        <details>
          <summary>保存本次检索集合参数</summary>
          <StructuredValue
            value={{ webenv: data.webenv, query_key: data.query_key }}
          />
        </details>
      )}
      {data.edges?.length ? <CitationMap edges={data.edges} /> : null}
      {data.title && <h3>{data.title}</h3>}
      {data.details && <StructuredValue value={data.details} />}
      {data.data && <StructuredValue value={data.data} />}
      {data.view === "groups" ? (
        <div className="tools-groups">
          {data.items.map((g, i) => (
            <div key={i}>
              <span>{String(g.title)}</span>
              <i style={{ width: `${(Number(g.count) / max) * 60}%` }} />
              <b>{Number(g.count).toLocaleString()}</b>
            </div>
          ))}
        </div>
      ) : (
        data.items.map((item, i) => (
          <article className="tools-record" key={i}>
            <h4>{String(item.title || item.id || `记录 ${i + 1}`)}</h4>
            {!!item.id && <small>{String(item.id)}</small>}
            {typeof item.url === "string" && /^https?:\/\//i.test(item.url) && (
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                打开来源
              </a>
            )}
            {item.text ? (
              <p className="tools-text">{String(item.text)}</p>
            ) : null}
            {item.abstract ? (
              <details>
                <summary>摘要</summary>
                <p>{String(item.abstract)}</p>
              </details>
            ) : null}
            {Array.isArray(item.authors) && (
              <p className="source-muted">{item.authors.join(", ")}</p>
            )}
            {item.details ? <StructuredValue value={item.details} /> : null}
          </article>
        ))
      )}
      {!data.items.length && !data.data && !data.details && (
        <p>该操作没有返回可展示记录。</p>
      )}
    </div>
  );
}

export default function ServiceTools({
  provider,
  query,
  paper,
  configured,
  onSettings,
  onModelSettings,
}: {
  provider: string;
  query: string;
  paper?: LiteraturePaper | null;
  configured: boolean;
  onSettings: () => void;
  onModelSettings?: () => void;
}) {
  const operations = SERVICE_OPERATIONS[provider] || [];
  const [operation, setOperation] = useState(operations[0]?.id || "");
  const spec = operations.find((o) => o.id === operation)!;
  const [values, setValues] = useState<Record<string, string>>({});
  const [data, setData] = useState<ToolResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [teiText, setTeiText] = useState<string[]>([]);
  const active = useRef<AbortController | null>(null);
  const savedRequest = useRef<Record<string, unknown> | null>(null);
  const blobRef = useRef<string | null>(null);
  const lastSession = useRef<{ id: string; kind: string } | null>(null);
  const lastHistory = useRef<{ webenv: string; query_key: string } | null>(
    null,
  );
  useEffect(
    () => () => {
      active.current?.abort();
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    },
    [],
  );
  useEffect(() => {
    active.current?.abort();
    setBusy(false);
    setData(null);
    setError("");
    setTeiText([]);
    setDownloadUrl(null);
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    const selected = operations.find((o) => o.id === operation);
    const next = Object.fromEntries(
      (selected?.fields || []).map((f) => [
        f.key,
        f.value ?? f.options?.[0]?.[0] ?? "",
      ]),
    );
    next.query = query;
    const author = paper?.author_refs?.[0]?.id;
    const institution = paper?.institution_refs?.[0]?.id;
    next.record_id = operation.startsWith("author")
      ? author || ""
      : operation.startsWith("institution")
        ? institution || ""
        : paper?.id || "";
    if (provider === "elicit") {
      next.record_id = lastSession.current?.id || "";
      if (lastSession.current && ["status", "resume"].includes(operation))
        next.kind = lastSession.current.kind;
    }
    if (provider === "pubmed" && operation === "history" && lastHistory.current)
      Object.assign(next, lastHistory.current);
    setValues(next);
    savedRequest.current = null;
    // The current paper seeds the form; edits remain local until a user selects another operation/paper.
  }, [provider, operation, paper?.id]);

  async function run(event?: FormEvent, next?: Record<string, unknown>) {
    event?.preventDefault();
    if (busy) return;
    const controller = new AbortController();
    active.current?.abort();
    active.current = controller;
    setBusy(true);
    setError("");
    setData(null);
    setDownloadUrl(null);
    setTeiText([]);
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    try {
      const body: Record<string, unknown> =
        next ||
        Object.fromEntries(
          spec.fields
            .filter((f) => values[f.key]?.trim())
            .map((f) => [
              f.key,
              f.type === "number"
                ? Number(values[f.key])
                : f.type === "ids"
                  ? values[f.key].split(/[\s,]+/).filter(Boolean)
                  : f.type === "json"
                    ? JSON.parse(values[f.key])
                    : values[f.key],
            ]),
        );
      savedRequest.current = body;
      let path = `/api/advanced/${provider}/${operation}`;
      if (spec.download === "resource")
        path = `/api/advanced/sciverse/resource?file_name=${encodeURIComponent(String(body.record_id || ""))}`;
      else if (spec.download)
        path = `/api/advanced/openalex/content/${encodeURIComponent(String(body.record_id || ""))}/${spec.download}`;
      const response = await localFetch(path, {
        method: spec.download ? "GET" : "POST",
        signal: controller.signal,
        headers: spec.download
          ? undefined
          : { "Content-Type": "application/json" },
        body: spec.download ? undefined : JSON.stringify(body),
      });
      if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(
          typeof e.detail === "string"
            ? e.detail
            : e.detail?.message || `请求失败（${response.status}）`,
        );
      }
      if (spec.download) {
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        blobRef.current = url;
        setDownloadUrl(url);
        if (spec.download === "tei") {
          const doc = new DOMParser().parseFromString(
            await blob.text(),
            "application/xml",
          );
          if (doc.querySelector("parsererror"))
            throw new Error("文件已获取，但无法解析为 XML。");
          const bodyNodes = [...doc.getElementsByTagNameNS("*", "body")];
          const root =
            bodyNodes[0] ||
            doc.getElementsByTagNameNS("*", "text")[0] ||
            doc.documentElement;
          setTeiText(
            [...root.getElementsByTagName("*")]
              .filter((el) =>
                ["head", "p"].includes(el.localName.toLowerCase()),
              )
              .map((el) => el.textContent?.trim() || "")
              .filter(Boolean),
          );
        }
      } else {
        const value = await response.json();
        if (!controller.signal.aborted) {
          setData(value);
          if (
            provider === "elicit" &&
            ["report", "review", "agent"].includes(operation) &&
            typeof value.data?.sessionId === "string"
          )
            lastSession.current = { id: value.data.sessionId, kind: operation };
          if (provider === "pubmed" && value.webenv && value.query_key)
            lastHistory.current = {
              webenv: value.webenv,
              query_key: value.query_key,
            };
        }
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function pageNext() {
    if (!data || !savedRequest.current) return;
    const next = { ...savedRequest.current };
    if (data.next_cursor) next.cursor = data.next_cursor;
    if (data.next_page) next.page = data.next_page;
    if (data.next_offset !== null && data.next_offset !== undefined)
      next.offset = data.next_offset;
    run(undefined, next);
  }
  function exportData() {
    if (!data) return;
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = `${provider}-${operation}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  const needsKey = !!spec.needsKey && !configured;
  return (
    <section className="service-tools" aria-label={`${provider} 功能工作台`}>
      <header>
        <h2>功能工作台</h2>
        <p>
          选择真实接口操作。每次点击才发起请求；下一页沿用上一次提交的条件。
        </p>
      </header>
      {provider === "semantic_scholar" && (
        <p className="source-notice">
          匿名请求按约 2 秒间隔排队；限流时遵循服务等待提示，最多尝试 3
          次，单次等待预算约 45 秒。成功结果在本机内存缓存 5
          分钟。持续限流仍会明确报错。
        </p>
      )}
      {provider === "elicit" && lastSession.current && (
        <p className="source-notice">
          最近创建的任务：{lastSession.current.id}
          <button onClick={() => setOperation("status")}>查看此任务状态</button>
        </p>
      )}
      <label>
        功能
        <select
          aria-label="选择接口功能"
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
        >
          {operations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
      </label>
      <p className="source-muted">{spec.help}</p>
      {needsKey && (
        <div className="source-notice">
          此功能需要配置相应 API Key。
          {provider !== "europepmc" && (
            <button onClick={onSettings}>打开连接设置</button>
          )}
        </div>
      )}
      <form onSubmit={run} className="tools-form">
        {spec.fields.map((f) => (
          <label key={f.key}>
            {f.label}
            {f.type === "select" ? (
              <select
                aria-label={f.label}
                value={values[f.key] || ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              >
                {f.options?.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            ) : ["textarea", "ids", "json"].includes(f.type || "") ? (
              <textarea
                aria-label={f.label}
                value={values[f.key] || ""}
                required={f.required}
                rows={f.type === "json" ? 5 : 3}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            ) : (
              <input
                aria-label={f.label}
                type={f.type === "number" ? "number" : "text"}
                value={values[f.key] || ""}
                required={f.required}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
        {provider === "openalex" && (
          <div className="tools-quick-links">
            {(operation.startsWith("author")
              ? paper?.author_refs
              : operation.startsWith("institution")
                ? paper?.institution_refs
                : []
            )?.map((ref) => (
              <button
                key={ref.id}
                type="button"
                onClick={() => setValues((v) => ({ ...v, record_id: ref.id }))}
              >
                {ref.name}
              </button>
            ))}
          </div>
        )}
        {spec.createsTask && (
          <p className="source-notice">
            这是实际任务操作。提交可能计入账户额度；超时后先检查任务列表，不要重复创建。
          </p>
        )}
        <button className="source-primary" disabled={busy || needsKey}>
          {busy
            ? "正在请求…"
            : spec.createsTask
              ? "提交任务操作"
              : spec.download
                ? "获取文件"
                : "运行此功能"}
        </button>
        {busy && (
          <button
            type="button"
            onClick={() => {
              active.current?.abort();
              setBusy(false);
              setError(
                spec.createsTask
                  ? "已停止等待；上游可能已创建任务，请先检查任务列表。"
                  : "已取消等待，上游请求可能仍在完成。",
              );
            }}
          >
            取消等待
          </button>
        )}
      </form>
      {error && (
        <div role="alert" className="source-error">
          {error}
          {provider !== "europepmc" && (
            <button onClick={onSettings}>打开连接设置</button>
          )}
        </div>
      )}
      {downloadUrl && (
        <div className="tools-download">
          <a
            href={downloadUrl}
            download={`${values.record_id || provider}.${spec.download === "tei" ? "xml" : spec.download === "pdf" ? "pdf" : "bin"}`}
          >
            保存已获取的文件
          </a>
          {spec.download === "pdf" && (
            <details open className="tools-pdf">
              <summary>PDF 预览（浏览器支持时）</summary>
              <iframe src={downloadUrl} title="OpenAlex PDF 预览" />
              <p>如果浏览器无法显示预览，可使用上方链接保存文件。</p>
            </details>
          )}
          {!!teiText.length && (
            <details open>
              <summary>TEI 正文预览 · {teiText.length} 个段落项</summary>
              <p className="source-notice">
                这是解析后的文本，未经实体或论断对齐；图片、表格和完整结构请下载
                XML 查看。
              </p>
              {teiText.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </details>
          )}
        </div>
      )}
      {provider === "openalex" &&
        teiText.length > 0 &&
        paper &&
        onModelSettings &&
        savedRequest.current?.record_id === paper.id && (
          <SharedAi
            provider="openalex"
            query={`解读 ${paper.title}`}
            papers={[paper]}
            onSettings={onModelSettings}
            context={[
              {
                paper_id: paper.id,
                text: teiText.join("\n").slice(0, 40000),
                source_url: `https://openalex.org/${paper.id}`,
              },
            ]}
          />
        )}
      {data && (
        <>
          <div className="tools-result-actions">
            <button onClick={exportData}>导出本次结果</button>
            {(data.next_cursor ||
              data.next_page ||
              (data.next_offset !== null &&
                data.next_offset !== undefined)) && (
              <button onClick={pageNext} disabled={busy}>
                读取下一页
              </button>
            )}
          </div>
          <ResultView data={data} />
          {data.view === "papers" &&
            data.items.length > 0 &&
            provider !== "sciverse" &&
            onModelSettings && (
              <SharedAi
                key={`${operation}:${JSON.stringify(savedRequest.current)}`}
                provider={provider}
                query={String(
                  savedRequest.current?.query || "分析当前返回的论文",
                )}
                papers={data.items as unknown as LiteraturePaper[]}
                onSettings={onModelSettings}
              />
            )}
        </>
      )}
    </section>
  );
}
