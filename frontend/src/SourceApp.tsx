import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Settings2,
} from "lucide-react";
import App from "./App";
import { localFetch } from "./localFetch";
import SourceGuide from "./SourceGuide";
import ServiceTools from "./ServiceTools";
import SharedAi from "./SharedAi";
import { SOURCE_PROFILES } from "./sourceProfiles";
import "./sources.css";

export interface Source {
  id: string;
  name: string;
  scope: string;
  env: string | null;
  requires_key: boolean;
  configured: boolean;
  native: string;
  integrated: string;
  docs: string;
}

export interface LiteraturePaper {
  id: string;
  provider: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  abstract: string | null;
  doi: string | null;
  pmid: string | null;
  pmcid: string | null;
  url: string | null;
  fulltext_url: string | null;
  fulltext_readable: boolean;
  citation_count: number | null;
  subjects: string[];
  publication_types?: string[];
  institutions?: string[];
  topics?: string[];
  author_refs?: { id: string; name: string }[];
  institution_refs?: { id: string; name: string }[];
  content_formats?: string[];
}

export interface SearchResult {
  provider: string;
  query: string;
  effective_query: string | null;
  papers: LiteraturePaper[];
  total: number | null;
  returned: number;
  requested: number;
  elapsed_ms: number;
  retrieved_at: string;
  warnings: string[];
}

interface Fulltext {
  paragraphs: { kind: string; text: string }[];
  source_url: string;
  note: string;
}

class SourceRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  signal?: AbortSignal,
  body?: object,
  method = "POST",
): Promise<T> {
  const response = await localFetch(path, {
    method: body ? method : "GET",
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new SourceRequestError(
      typeof data.detail === "string"
        ? data.detail
        : `请求失败（${response.status}）`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

function exportResult(result: SearchResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.provider}-${result.retrieved_at.slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function External({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href || !/^https?:\/\//i.test(href)) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink size={13} />
    </a>
  );
}

const WORKSPACES: Record<
  string,
  { title: string; subtitle: string; steps: string[] }
> = {
  pubmed: {
    title: "医学文献筛选",
    subtitle: "先建立文献集合，再核对摘要、文献类型和 MeSH 标引。",
    steps: ["字段与 MeSH 检索", "书目筛选", "摘要与主题标引"],
  },
  europepmc: {
    title: "生命科学全文阅读",
    subtitle: "从摘要定位论文，再阅读可获取的开放正文。",
    steps: ["检索论文与预印本", "检查全文可用性", "阅读开放正文"],
  },
  openalex: {
    title: "学术集合概览",
    subtitle: "观察返回论文的年份、主题和作者机构，了解样本构成。",
    steps: ["发现跨学科论文", "观察年份与主题", "查看机构与引用"],
  },
  semantic_scholar: {
    title: "相关工作探索",
    subtitle: "从一篇论文出发，分别探索参考文献和推荐论文。",
    steps: ["找到起点论文", "查阅参考文献", "探索相关推荐"],
  },
  elicit: {
    title: "研究材料工作台",
    subtitle:
      "直接检索论文，或通过扩展工作台提交筛选、抽取、报告和研究 Agent 任务。",
    steps: ["论文搜索", "筛选与抽取任务", "状态、结果与报告"],
  },
};

function CollectionOverview({ result }: { result: SearchResult }) {
  const papers = result.papers;
  if (result.provider === "openalex") {
    const years = new Map<number, number>();
    const topics = new Map<string, number>();
    papers.forEach((p) => {
      if (p.year !== null) years.set(p.year, (years.get(p.year) ?? 0) + 1);
      p.topics?.forEach((t) => topics.set(t, (topics.get(t) ?? 0) + 1));
    });
    const max = Math.max(1, ...years.values());
    return (
      <section className="source-overview" aria-label="OpenAlex 样本概览">
        <div className="source-metrics">
          <div>
            <strong>{papers.length}</strong>
            <span>本次返回论文</span>
          </div>
          <div>
            <strong>
              {new Set(papers.flatMap((p) => p.institutions ?? [])).size}
            </strong>
            <span>出现的机构名称</span>
          </div>
          <div>
            <strong>{papers.filter((p) => p.fulltext_url).length}</strong>
            <span>有开放获取入口</span>
          </div>
        </div>
        <div className="source-sample-panels">
          <div>
            <h3>样本年份分布</h3>
            {[...years.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([y, n]) => (
                <div className="source-year" key={y}>
                  <span>{y}</span>
                  <i style={{ width: `${(n / max) * 65}%` }} />
                  <b>{n}</b>
                </div>
              ))}
            {!years.size && <p>年份缺失</p>}
          </div>
          <div>
            <h3>样本中出现的主题</h3>
            <div className="source-tags">
              {[...topics.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([t, n]) => (
                  <span key={t}>
                    {t} · {n}
                  </span>
                ))}
            </div>
            {!topics.size && <p>主题字段缺失</p>}
          </div>
        </div>
        <p className="source-muted">
          仅统计本次返回的前 {papers.length}{" "}
          篇，不能据此推断整个领域趋势。机构按名称去重；主题沿用 OpenAlex
          的分类。
        </p>
      </section>
    );
  }
  if (result.provider === "europepmc")
    return (
      <section className="source-overview source-metrics">
        <div>
          <strong>{papers.length}</strong>
          <span>文献记录</span>
        </div>
        <div>
          <strong>{papers.filter((p) => p.fulltext_readable).length}</strong>
          <span>标记为可读开放正文</span>
        </div>
        <div>
          <strong>{papers.filter((p) => p.abstract).length}</strong>
          <span>提供摘要</span>
        </div>
        <p className="source-muted">
          选择“可读取全文”的记录，在详情中打开正文。全文不等同于已核验的证据。
        </p>
      </section>
    );
  return null;
}

function Neighbors({ paper }: { paper: LiteraturePaper }) {
  const [result, setResult] = useState<{
    kind: string;
    papers: LiteraturePaper[];
    note: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function load(kind: "references" | "recommendations") {
    const controller = new AbortController();
    active.current?.abort();
    active.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const data = await request<{
        kind: string;
        papers: LiteraturePaper[];
        note: string;
      }>(
        `/api/literature/semantic_scholar/papers/${encodeURIComponent(paper.id)}/${kind}`,
        controller.signal,
      );
      if (!controller.signal.aborted) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "关联论文读取失败");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="source-neighbors">
      <h3>沿着这篇论文继续探索</h3>
      <div className="source-links">
        <button disabled={busy} onClick={() => load("references")}>
          参考文献
        </button>
        <button disabled={busy} onClick={() => load("recommendations")}>
          相关推荐
        </button>
      </div>
      <p className="source-muted">
        参考文献表示引用关系；推荐只表示相关性。每次最多读取 20 篇。
      </p>
      {busy && <p role="status">正在读取关联论文…</p>}
      {error && (
        <p className="source-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <>
          <h3>
            {result.kind === "references" ? "参考文献" : "相关性推荐"} ·{" "}
            {result.papers.length} 篇
          </h3>
          {!result.papers.length && <p>当前接口未返回关联论文。</p>}
          {result.papers.map((p) => (
            <div className="source-neighbor" key={p.id}>
              <External href={p.url}>{p.title}</External>
              <p className="source-muted">
                {p.year ?? "年份未知"} · {p.authors.slice(0, 2).join(", ")}
              </p>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function PaperCatalog({
  source,
  papers,
  selected,
  onSelect,
}: {
  source: Source;
  papers: LiteraturePaper[];
  selected: LiteraturePaper | null;
  onSelect: (p: LiteraturePaper) => void;
}) {
  if (source.id === "pubmed" || source.id === "elicit")
    return (
      <div className="source-table-wrap">
        <table className="source-literature-table">
          <caption>
            {source.id === "pubmed"
              ? "书目筛选表 · 点击标题核对摘要和 MeSH"
              : "搜索记录表 · 研究类型为接口标签，尚未运行证据抽取"}
          </caption>
          <thead>
            <tr>
              <th>论文</th>
              <th>{source.id === "pubmed" ? "文献类型" : "研究类型"}</th>
              <th>年份</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((paper, index) => (
              <tr
                key={`${paper.id}:${index}`}
                className={selected === paper ? "selected" : ""}
              >
                <td>
                  <button
                    className="source-table-title"
                    onClick={() => onSelect(paper)}
                    aria-pressed={selected === paper}
                  >
                    {paper.title}
                  </button>
                  <small>{paper.authors.slice(0, 2).join(", ")}</small>
                  <span>
                    {source.id === "pubmed"
                      ? `MeSH ${paper.subjects.length} 项`
                      : paper.abstract
                        ? "有摘要"
                        : "摘要缺失"}
                    {paper.fulltext_url ? " · 有原文入口" : ""}
                  </span>
                </td>
                <td>{paper.publication_types?.join(" · ") || "未提供"}</td>
                <td>{paper.year ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <div className="source-cards">
      {papers.map((paper, index) => (
        <button
          className={`source-card ${selected === paper ? "selected" : ""}`}
          key={`${paper.id}:${index}`}
          onClick={() => onSelect(paper)}
          aria-pressed={selected === paper}
        >
          <span className="source-eyebrow">
            {String(index + 1).padStart(2, "0")} · {paper.year ?? "年份未知"}
            {source.id === "openalex" && paper.citation_count !== null
              ? ` · 来源被引 ${paper.citation_count}`
              : ""}
          </span>
          <h3>{paper.title}</h3>
          <p>{paper.authors.slice(0, 3).join(", ")}</p>
          <p className="source-card-abstract">
            {paper.abstract || "摘要未提供"}
          </p>
          <div className="source-tags">
            <span>{paper.abstract ? "有摘要" : "无摘要"}</span>
            {paper.fulltext_url && <span>有原文入口</span>}
            {paper.fulltext_readable && <span>可读取全文</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

function PaperDetail({
  paper,
  onModelSettings,
}: {
  paper: LiteraturePaper;
  onModelSettings: () => void;
}) {
  const [fulltext, setFulltext] = useState<Fulltext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function readFulltext() {
    if (!paper.pmcid) return;
    const current = new AbortController();
    controller.current?.abort();
    controller.current = current;
    setLoading(true);
    setError("");
    try {
      const data = await request<Fulltext>(
        `/api/literature/europepmc/fulltext/${encodeURIComponent(paper.pmcid)}`,
        current.signal,
      );
      if (!current.signal.aborted) setFulltext(data);
    } catch (e) {
      if (!current.signal.aborted)
        setError(e instanceof Error ? e.message : "全文读取失败");
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }

  return (
    <article className="source-detail" aria-label="论文详情">
      <div className="source-eyebrow">原始文献记录 · {paper.provider}</div>
      <h2>{paper.title}</h2>
      <p className="source-muted">
        {paper.authors.join(", ") || "作者信息缺失"}
      </p>
      <p className="source-muted">
        {[paper.year, paper.venue].filter(Boolean).join(" · ") ||
          "出版信息缺失"}
      </p>
      <div className="source-links">
        <External href={paper.url}>来源记录</External>
        <External
          href={paper.doi ? `https://doi.org/${encodeURI(paper.doi)}` : null}
        >
          DOI
        </External>
        <External href={paper.fulltext_url}>原文 / 全文入口</External>
      </div>
      <dl className="source-identifiers">
        {paper.doi && (
          <>
            <dt>DOI</dt>
            <dd>{paper.doi}</dd>
          </>
        )}
        {paper.pmid && (
          <>
            <dt>PMID</dt>
            <dd>{paper.pmid}</dd>
          </>
        )}
        {paper.pmcid && (
          <>
            <dt>PMCID</dt>
            <dd>{paper.pmcid}</dd>
          </>
        )}
        {paper.citation_count !== null && (
          <>
            <dt>来源引用计数</dt>
            <dd>{paper.citation_count}（各库统计口径不同）</dd>
          </>
        )}
      </dl>
      <h3>摘要</h3>
      <SharedAi
        provider={paper.provider}
        query={`解读 ${paper.title}`}
        papers={[paper]}
        onSettings={onModelSettings}
        context={
          fulltext
            ? [
                {
                  paper_id: paper.id,
                  text: fulltext.paragraphs
                    .map((p) => p.text)
                    .join("\n")
                    .slice(0, 40000),
                  source_url: fulltext.source_url,
                },
              ]
            : []
        }
      />
      <p className="source-abstract">
        {paper.abstract || "该接口未返回摘要。可以通过来源记录或 DOI 查看。"}
      </p>
      {!!paper.subjects.length && (
        <>
          <h3>主题标引</h3>
          <div className="source-tags">
            {paper.subjects.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </>
      )}
      {!!paper.publication_types?.length && (
        <>
          <h3>{paper.provider === "elicit" ? "研究类型标签" : "文献类型"}</h3>
          <div className="source-tags">
            {paper.publication_types.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </>
      )}
      {!!paper.institutions?.length && (
        <>
          <h3>作者关联机构</h3>
          <p className="source-muted">{paper.institutions.join(" · ")}</p>
        </>
      )}
      {!!paper.topics?.length && (
        <>
          <h3>OpenAlex 主题</h3>
          <div className="source-tags">
            {paper.topics.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </>
      )}
      {paper.provider === "semantic_scholar" && (
        <Neighbors key={paper.id} paper={paper} />
      )}
      <section className="source-reading">
        <h3>继续阅读</h3>
        {paper.fulltext_readable ? (
          <button
            className="source-primary"
            onClick={readFulltext}
            disabled={loading || !!fulltext}
          >
            <BookOpen size={16} />
            {loading
              ? "正在读取开放全文…"
              : fulltext
                ? "开放全文已载入"
                : "读取开放全文"}
          </button>
        ) : (
          <p className="source-muted">
            {paper.fulltext_url
              ? "本页提供全文入口；链接是否可访问取决于原站。"
              : "当前记录未提供可用的全文入口，可打开 DOI 或来源记录查看。"}
          </p>
        )}
        <p className="source-muted">
          此记录未接入 Paper Schema
          的文内实体关系与证据定位。摘要、引用计数和全文链接不代表已完成原文核验。
        </p>
        {error && (
          <p role="alert" className="source-error">
            {error}
          </p>
        )}
        {fulltext && (
          <div className="source-fulltext">
            <p className="source-notice">{fulltext.note}</p>
            <External href={fulltext.source_url}>查看完整原文</External>
            {fulltext.paragraphs.map((p, i) =>
              p.kind === "title" ? (
                <h3 key={i}>{p.text}</h3>
              ) : (
                <p key={i}>{p.text}</p>
              ),
            )}
          </div>
        )}
      </section>
    </article>
  );
}

export function LiteratureWorkspace({
  source,
  query,
  onQuery,
  result,
  onResult,
  onConfigured,
  onModelSettings,
}: {
  source: Source;
  query: string;
  onQuery: (query: string) => void;
  result: SearchResult | null;
  onResult: (result: SearchResult | null) => void;
  onConfigured: (configured: boolean) => void;
  onModelSettings: () => void;
}) {
  const [size, setSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LiteraturePaper | null>(
    result?.papers[0] ?? null,
  );
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [keyMessage, setKeyMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planNote, setPlanNote] = useState("");
  const planningRequest = useRef<AbortController | null>(null);
  const settingsPanel = useRef<HTMLDetailsElement | null>(null);
  const keyInput = useRef<HTMLInputElement | null>(null);
  const active = useRef<AbortController | null>(null);
  const settingsRequest = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      settingsRequest.current?.abort();
      planningRequest.current?.abort();
    },
    [],
  );

  async function search(event: FormEvent) {
    event.preventDefault();
    const current = new AbortController();
    active.current?.abort();
    active.current = current;
    setBusy(true);
    setError("");
    setErrorStatus(null);
    setSelected(null);
    onResult(null);
    try {
      const value = await request<SearchResult>(
        `/api/literature/${source.id}/search`,
        current.signal,
        { query, size },
      );
      if (current.signal.aborted) return;
      onResult(value);
      setSelected(value.papers[0] ?? null);
    } catch (e) {
      if (!current.signal.aborted) {
        setError(e instanceof Error ? e.message : "检索失败");
        setErrorStatus(e instanceof SourceRequestError ? e.status : null);
      }
    } finally {
      if (!current.signal.aborted) setBusy(false);
    }
  }

  function cancel() {
    active.current?.abort();
    setBusy(false);
    setErrorStatus(null);
    setError("检索已取消。服务器已发出的上游请求可能仍在完成。");
  }

  async function planQuery() {
    planningRequest.current?.abort();
    const controller = new AbortController();
    planningRequest.current = controller;
    setPlanning(true);
    setPlanNote("");
    try {
      const plan = await request<{ query: string; explanation: string }>(
        "/api/shared-ai/plan",
        controller.signal,
        { provider: source.id, query },
      );
      if (!controller.signal.aborted) {
        onQuery(plan.query);
        setPlanNote(plan.explanation);
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setPlanNote(e instanceof Error ? e.message : "检索规划失败");
    } finally {
      if (!controller.signal.aborted) setPlanning(false);
    }
  }

  function openConnectionSettings() {
    if (settingsPanel.current) settingsPanel.current.open = true;
    keyInput.current?.focus({ preventScroll: true });
    keyInput.current?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }

  async function saveKey(value: string) {
    setSaving(true);
    setKeyMessage("");
    const current = new AbortController();
    settingsRequest.current = current;
    try {
      const status = await request<{ configured: boolean }>(
        `/api/literature/${source.id}/key`,
        current.signal,
        { api_key: value },
        "PUT",
      );
      if (current.signal.aborted) return;
      onConfigured(status.configured);
      setApiKey("");
      setKeyMessage(
        status.configured
          ? "密钥已保存到本机后端，下一次检索将使用它。"
          : "本地密钥已清除。",
      );
    } catch (e) {
      if (!current.signal.aborted)
        setKeyMessage(e instanceof Error ? e.message : "保存失败");
    } finally {
      if (!current.signal.aborted) setSaving(false);
    }
  }

  const needsKey = source.requires_key && !source.configured;
  const workspace = WORKSPACES[source.id];
  const profile = SOURCE_PROFILES[source.id];
  return (
    <main className={`literature-workspace source-${source.id}`}>
      <aside className="source-sidebar">
        <div className="source-eyebrow">文献来源实验</div>
        <h1>{source.name}</h1>
        <p className="source-muted">{source.scope}</p>
        <div className="source-workspace-label">{workspace.title}</div>
        {source.id === "semantic_scholar" && (
          <p className="source-muted">
            支持匿名调用：请求会限速、有限重试，并缓存成功结果。遇到持续限流时会明确提示，不会返回虚构结果。
          </p>
        )}
        <section
          className={`source-connection-status ${needsKey ? "required" : ""}`}
          aria-label={`${source.name} 连接状态`}
        >
          <strong>
            {needsKey
              ? "需要配置连接"
              : source.configured
                ? "已保存 API Key"
                : source.env
                  ? "匿名访问 · 密钥可选"
                  : "公开访问 · 无需密钥"}
          </strong>
          <p>
            {needsKey
              ? `请填写有 API 访问权限的 ${source.name} API Key。`
              : source.configured
                ? "密钥是否有效，以实际检索响应为准。"
                : source.env
                  ? "可以直接尝试检索；遇到权限或额度限制时，可配置自己的 API Key。"
                  : "当前接口不需要单独配置连接。"}
          </p>
          {source.env && (
            <button type="button" onClick={openConnectionSettings}>
              <Settings2 size={14} />
              打开连接设置
            </button>
          )}
        </section>
        <form onSubmit={search} className="source-search">
          <label htmlFor="literature-query">研究关键词或检索式</label>
          <textarea
            id="literature-query"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            maxLength={500}
            rows={4}
            required
            placeholder="例如 retrieval augmented generation"
          />
          <p className="source-muted">
            默认直接检索。也可先用共享模型将自然语言问题规划为英文检索词，再检查和提交；AI
            规划会调用你配置的模型服务。
          </p>
          <button
            type="button"
            onClick={planQuery}
            disabled={planning || !query.trim()}
          >
            {planning ? "正在规划…" : "AI 规划检索词"}
          </button>
          {planNote && (
            <p role="status" className="source-notice">
              {planNote}
            </p>
          )}
          <button type="button" onClick={onModelSettings}>
            共享模型设置
          </button>
          <label htmlFor="literature-size">本次读取数量</label>
          <select
            id="literature-size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            <option value={5}>5 篇</option>
            <option value={10}>10 篇</option>
            <option value={20}>20 篇</option>
          </select>
          <button
            className="source-primary"
            disabled={busy || needsKey || !query.trim()}
          >
            <Search size={16} />
            {busy ? "正在检索…" : `搜索 ${source.name}`}
          </button>
          {busy && (
            <button type="button" onClick={cancel}>
              取消检索
            </button>
          )}
          {needsKey && (
            <p className="source-notice">
              此来源需要 API Key，请在下方连接设置中填写。
            </p>
          )}
        </form>
        <section className="source-capabilities">
          <h2>本应用已接入功能</h2>
          <p
            className={`source-verification ${profile.verified ? "verified" : "pending"}`}
          >
            {profile.verification}
          </p>
          <p className="source-enabled">✓ 论文检索与摘要阅读</p>
          <p className="source-enabled">✓ 原文入口（按记录提供）</p>
          {source.id === "europepmc" && (
            <p className="source-enabled">✓ 开放全文阅读（按记录提供）</p>
          )}
          {source.id === "pubmed" && (
            <p className="source-enabled">✓ MeSH 与文献类型（按记录提供）</p>
          )}
          {source.id === "openalex" && (
            <p className="source-enabled">✓ 样本年份、主题与机构概览</p>
          )}
          {source.id === "semantic_scholar" && (
            <p className="source-enabled">✓ 参考文献 / 推荐分别探索</p>
          )}
          <details>
            <summary>
              {profile.pending.length
                ? "服务支持，尚未接入"
                : "本轮扩展能力已接入"}
            </summary>
            {!profile.pending.length && (
              <p>
                打开右侧“扩展功能工作台”使用分页、关联、内容或任务操作；是否能运行取决于连接、权限和具体记录。
              </p>
            )}
            <ul>
              {profile.pending.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
          <details>
            <summary>接口边界与额外处理</summary>
            <p>{profile.boundary}</p>
            <p>{profile.extra}</p>
            <p>5/10/20 篇及关联论文 20 篇为本应用的实验设置，不是接口上限。</p>
          </details>
          <details>
            <summary>服务能力与本次接入范围</summary>
            <p>{source.native}</p>
            <p>本次接入：{source.integrated}</p>
            <External href={source.docs}>官方接口说明</External>
          </details>
        </section>
        {source.env && (
          <details
            className="source-key"
            ref={settingsPanel}
            open={needsKey || undefined}
          >
            <summary>
              <Settings2 size={14} />
              连接设置 ·{" "}
              {source.configured
                ? "已配置密钥"
                : source.requires_key
                  ? "需要密钥"
                  : "可匿名访问"}
            </summary>
            <label htmlFor="literature-key">{source.name} API Key</label>
            <input
              id="literature-key"
              ref={keyInput}
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="只写入本机后端"
            />
            <button
              onClick={() => saveKey(apiKey)}
              disabled={saving || !apiKey.trim()}
            >
              保存密钥
            </button>
            {source.configured && (
              <button onClick={() => saveKey("")} disabled={saving}>
                清除密钥
              </button>
            )}
            {keyMessage && <p role="status">{keyMessage}</p>}
          </details>
        )}
      </aside>
      <section className="source-results" aria-label="文献结果">
        <header className="source-workspace-intro">
          <div className="source-eyebrow">{source.name} WORKSPACE</div>
          <h2>{workspace.title}</h2>
          <p>{workspace.subtitle}</p>
          <div className="source-task-purpose">
            <p>
              <strong>适合回答</strong>
              {profile.question}
            </p>
            <p>
              <strong>范围边界</strong>
              {profile.boundary}
            </p>
          </div>
          <div className="source-workflow">
            {workspace.steps.map((step, index) => (
              <span key={step}>
                <b>{index + 1}</b>
                {step}
              </span>
            ))}
          </div>
        </header>
        {error && (
          <div className="source-error" role="alert">
            {error}
            {source.env &&
              errorStatus !== null &&
              [401, 402, 403, 429, 503].includes(errorStatus) && (
                <button type="button" onClick={openConnectionSettings}>
                  <Settings2 size={14} />
                  打开连接设置
                </button>
              )}
          </div>
        )}
        <details className="source-extended-entry">
          <summary>{source.name} · 扩展功能工作台</summary>
          <ServiceTools
            provider={source.id}
            query={query}
            paper={selected}
            configured={source.configured}
            onSettings={openConnectionSettings}
            onModelSettings={onModelSettings}
          />
        </details>
        {!result && needsKey ? (
          <div className="source-empty source-connection-prompt">
            <Settings2 size={30} />
            <h2>配置 {source.name} 连接后开始搜索</h2>
            <p>
              此来源需要有 API 访问权限的账户和 API Key；无需配置 Sciverse
              或大模型。
            </p>
            <button
              type="button"
              className="source-primary"
              onClick={openConnectionSettings}
            >
              打开连接设置
            </button>
          </div>
        ) : (
          !result && (
            <div className="source-empty">
              <Search size={30} />
              <h2>{busy ? "正在获取真实文献记录" : "从一个研究问题开始"}</h2>
              <p>
                输入关键词后检索。切换来源会保留输入词，可分别运行并比较结果。
              </p>
              <p>普通文献检索无需配置 Sciverse 或大模型。</p>
            </div>
          )
        )}
        {result && (
          <>
            <header className="source-result-header">
              <div>
                <h2>
                  {source.name} · {result.returned} 篇
                </h2>
                <p>
                  “{result.query}” · {(result.elapsed_ms / 1000).toFixed(1)} 秒
                  ·{" "}
                  {result.total === null
                    ? "接口未提供总命中数"
                    : `来源报告 ${result.total.toLocaleString()} 条命中`}
                </p>
                <small>
                  命中数与耗时仅描述本次调用，不代表召回率或服务质量排名。
                </small>
              </div>
              <button onClick={() => exportResult(result)}>
                <Download size={15} />
                导出结果
              </button>
            </header>
            {result.warnings.map((w, i) => (
              <p className="source-notice" key={i}>
                {w}
              </p>
            ))}
            {result.effective_query &&
              result.effective_query !== result.query && (
                <details className="source-query">
                  <summary>查看数据源实际解释的检索式</summary>
                  <p>{result.effective_query}</p>
                </details>
              )}
            <CollectionOverview result={result} />
            {!!result.papers.length && (
              <SharedAi
                key={`${source.id}:${result.retrieved_at}`}
                provider={source.id}
                query={result.query}
                papers={result.papers}
                onSettings={onModelSettings}
              />
            )}
            {!result.papers.length && (
              <p className="source-empty">
                当前来源没有匹配结果。这不表示相关研究不存在。
              </p>
            )}
            <div className="source-paper-layout">
              <PaperCatalog
                source={source}
                papers={result.papers}
                selected={selected}
                onSelect={setSelected}
              />
              {selected && (
                <PaperDetail
                  key={`${source.id}:${selected.id}`}
                  paper={selected}
                  onModelSettings={onModelSettings}
                />
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function SourceApp() {
  const [settingsStart, setSettingsStart] = useState(false);
  const [sciverseTools, setSciverseTools] = useState(false);
  const [sciverseConfigured, setSciverseConfigured] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  useEffect(() => {
    if (!sciverseTools) return;
    const controller = new AbortController();
    request<{ configured: boolean }>(
      "/api/settings/sciverse",
      controller.signal,
    )
      .then((s) => setSciverseConfigured(s.configured))
      .catch(() => {});
    return () => controller.abort();
  }, [sciverseTools]);
  const [sourceId, setSourceId] = useState(
    () => window.localStorage.getItem("frontierlens-source") || "pubmed",
  );
  const [query, setQuery] = useState("retrieval augmented generation");
  const [results, setResults] = useState<Record<string, SearchResult | null>>(
    {},
  );
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request<Source[]>("/api/literature/providers", controller.signal)
      .then(setSources)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "数据源列表加载失败");
      });
    return () => controller.abort();
  }, []);
  const selected = sources.find((s) => s.id === sourceId);
  const actualId = sourceId === "sciverse" || selected ? sourceId : "pubmed";
  const current = sources.find((s) => s.id === actualId);
  function modelSettings() {
    setSourceId("sciverse");
    setGuideOpen(false);
    setSciverseTools(false);
    setSettingsStart(true);
  }
  const completed = Object.values(results).filter(
    (r): r is SearchResult => !!r,
  );
  return (
    <div className="source-shell">
      <header className="source-switcher">
        <strong>
          FrontierLens <span>多来源实验</span>
        </strong>
        <label htmlFor="paper-source">文献来源</label>
        <select
          id="paper-source"
          value={actualId}
          onChange={(e) => {
            setSourceId(e.target.value);
            setSettingsStart(false);
            setSciverseTools(false);
            setGuideOpen(false);
            window.localStorage.setItem("frontierlens-source", e.target.value);
          }}
        >
          <option value="sciverse">Sciverse · 原版结构化阅读</option>
          {sources.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name}
              {s.requires_key && !s.configured ? " · 需配置" : ""}
            </option>
          ))}
        </select>
        <span className="source-switch-hint">
          功能随来源变化 · 搜索不会自动调用其他服务
        </span>
        <button className="source-guide-toggle" onClick={modelSettings}>
          共享模型设置
        </button>
        {actualId === "sciverse" && (
          <button
            className="source-guide-toggle"
            onClick={() => setSciverseTools((v) => !v)}
          >
            {sciverseTools ? "返回结构化阅读" : "Sciverse 扩展接口"}
          </button>
        )}
        <button
          className="source-guide-toggle"
          aria-expanded={guideOpen}
          onClick={() => setGuideOpen((value) => !value)}
        >
          {guideOpen ? "返回当前工作区" : "按用途选来源"}
        </button>
        {!!completed.length && (
          <details className="source-comparisons">
            <summary>本次对照记录（{completed.length}）</summary>
            <div>
              <p>
                记录每个来源最近一次成功检索；不同检索词与总命中数不能直接作为质量比较。
              </p>
              <table>
                <thead>
                  <tr>
                    <th>来源 / 检索词</th>
                    <th>返回</th>
                    <th>有摘要</th>
                    <th>有全文入口</th>
                    <th>耗时</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((r) => (
                    <tr key={r.provider}>
                      <td>
                        {sources.find((s) => s.id === r.provider)?.name}
                        <small>{r.query}</small>
                      </td>
                      <td>{r.returned}</td>
                      <td>{r.papers.filter((p) => p.abstract).length}</td>
                      <td>{r.papers.filter((p) => p.fulltext_url).length}</td>
                      <td>{(r.elapsed_ms / 1000).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>此表统计检索接口返回字段，不包括原版 Sciverse 的模型导读。</p>
            </div>
          </details>
        )}
      </header>
      <div
        className={`source-stage ${actualId === "sciverse" ? "source-stage-sciverse" : ""}`}
      >
        {guideOpen ? (
          <SourceGuide
            onSelect={(id) => {
              setSourceId(id);
              window.localStorage.setItem("frontierlens-source", id);
              setGuideOpen(false);
            }}
          />
        ) : actualId === "sciverse" ? (
          sciverseTools ? (
            <div className="source-tools-page">
              <ServiceTools
                provider="sciverse"
                query={query}
                configured={sciverseConfigured}
                onSettings={modelSettings}
                onModelSettings={modelSettings}
              />
            </div>
          ) : (
            <App
              key={settingsStart ? "settings" : "reader"}
              startInSettings={settingsStart}
            />
          )
        ) : current ? (
          <LiteratureWorkspace
            key={current.id}
            source={current}
            query={query}
            onQuery={setQuery}
            onModelSettings={modelSettings}
            result={results[current.id] ?? null}
            onResult={(result) =>
              setResults((previous) => ({ ...previous, [current.id]: result }))
            }
            onConfigured={(configured) =>
              setSources((previous) =>
                previous.map((s) =>
                  s.id === current.id ? { ...s, configured } : s,
                ),
              )
            }
          />
        ) : (
          <div className="source-empty" role="status">
            {error || "正在加载数据源…"}
          </div>
        )}
      </div>
    </div>
  );
}
