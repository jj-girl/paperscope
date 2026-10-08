import { useEffect, useRef, useState } from "react";
import type { LiteraturePaper } from "./literatureTypes";
import { localFetch } from "./localFetch";
type Analysis = {
  overview: string;
  items: { paper_id: string; notes: string; questions: string[] }[];
  comparisons: { text: string; paper_ids: string[] }[];
  limitations: string[];
  basis: string;
  note: string;
  sources: { id: string; title: string; url: string | null }[];
  screening?: {
    paper_id: string;
    decision: "include" | "exclude" | "uncertain";
    reason: string;
  }[];
  extractions?: {
    paper_id: string;
    values: Record<
      string,
      {
        value: string | null;
        supporting_quote: string | null;
        source_kind: string;
      }
    >;
  }[];
  report_sections?: { heading: string; text: string; paper_ids: string[] }[];
  extraction_fields?: string[];
};
export default function SharedAi({
  provider,
  query,
  papers,
  onSettings,
  context = [],
}: {
  provider: string;
  query: string;
  papers: LiteraturePaper[];
  onSettings: () => void;
  context?: { paper_id: string; text: string; source_url: string }[];
}) {
  const [mode, setMode] = useState("guide");
  const [question, setQuestion] = useState(query);
  const [criteria, setCriteria] = useState("");
  const [fields, setFields] = useState("研究问题\n方法\n数据集\n主要发现");
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const structuredMode = mode === "screen" || mode === "extract";
  const selectedPapers = papers.slice(0, structuredMode ? 8 : 20);
  const fieldNames = fields
    .split(/[\n,，]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  function download(text: string, filename: string, mime: string) {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportCsv() {
    if (!result) return;
    const headings = result.extraction_fields || [];
    const cell = (value: unknown) => {
      const s = String(value ?? "");
      return (
        '"' + (/^\s*[=+@-]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'
      );
    };
    const rows: unknown[][] = result.extractions?.length
      ? [
          [
            "paper_id",
            "title",
            ...headings.flatMap((f) => [f, f + "_原文片段", f + "_依据"]),
          ],
          ...result.extractions.map((row) => [
            row.paper_id,
            result.sources.find((s) => s.id === row.paper_id)?.title,
            ...headings.flatMap((f) => [
              row.values[f]?.value,
              row.values[f]?.supporting_quote,
              row.values[f]?.source_kind,
            ]),
          ]),
        ]
      : [
          ["paper_id", "title", "decision", "reason"],
          ...(result.screening || []).map((row) => [
            row.paper_id,
            result.sources.find((s) => s.id === row.paper_id)?.title,
            row.decision,
            row.reason,
          ]),
        ];
    download(
      "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n"),
      `${provider}-ai-table.csv`,
      "text/csv;charset=utf-8",
    );
  }
  function exportReport() {
    if (!result) return;
    const sections = result.report_sections || [];
    download(
      [
        "# 当前文献集合的综述草稿",
        result.note,
        "依据：" + result.basis,
        result.overview,
        ...sections.flatMap((s) => [
          "## " + s.heading,
          s.text,
          "来源 ID：" + s.paper_ids.join(", "),
        ]),
        "## 来源",
        ...result.sources.map((s) => `${s.id}: ${s.title}\n${s.url || ""}`),
        "## 局限",
        ...result.limitations,
      ].join("\n\n"),
      `${provider}-review-draft.md`,
      "text/markdown;charset=utf-8",
    );
  }
  async function run() {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await localFetch("/api/shared-ai/analyze", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          query: question || query,
          mode,
          screening_criteria: criteria,
          extraction_fields: mode === "extract" ? fieldNames : [],
          papers: selectedPapers.map((p) => ({
            id: p.id,
            provider: p.provider,
            title: p.title,
            abstract: p.abstract?.slice(0, 3500),
            year: p.year,
            venue: p.venue,
            subjects: p.subjects,
            publication_types: p.publication_types,
            url: p.url,
          })),
          context,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : data.error?.message || "模型分析失败",
        );
      if (!controller.signal.aborted) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "模型调用失败");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function citation(id: string) {
    const s = result?.sources.find((s) => s.id === id);
    return s?.url && /^https?:\/\//i.test(s.url) ? (
      <a href={s.url} target="_blank" rel="noopener noreferrer">
        {s.title}
      </a>
    ) : (
      <span>{s?.title || id}</span>
    );
  }
  return (
    <details className="source-extended-entry shared-ai">
      <summary>AI 研究助手 · 共用模型配置</summary>
      <section className="service-tools">
        <p className="source-muted">
          将当前材料发送到你配置的模型服务。本次分析前 {selectedPapers.length}{" "}
          篇；筛选和抽取最多 8 篇，其他分析最多 20
          篇。没有正文时只依据元数据与摘要。此操作可能产生模型调用费用；长任务最多等待
          180 秒。
        </p>
        <div className="tools-form">
          <label>
            分析方式
            <select
              aria-label="AI 分析方式"
              value={mode}
              disabled={busy}
              onChange={(e) => {
                setMode(e.target.value);
                setResult(null);
                setError("");
              }}
            >
              <option value="guide">建议阅读顺序</option>
              <option value="compare">比较当前论文</option>
              <option value="question">根据材料回答问题</option>
              <option value="screen">按标准给出筛选建议</option>
              <option value="extract">抽取指定字段与证据片段</option>
              <option value="report">生成带引用的综述草稿</option>
            </select>
          </label>
          <label>
            关注的问题
            <input
              aria-label="AI 关注的问题"
              disabled={busy}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={2000}
            />
          </label>
        </div>
        {mode === "screen" && (
          <label className="ai-extra-input">
            纳入与排除标准
            <textarea
              aria-label="AI 筛选标准"
              disabled={busy}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              maxLength={3000}
              rows={4}
              placeholder="例如：纳入研究检索增强文献问答的论文；排除不涉及文献证据的通用聊天应用。信息不足时应待定。"
            />
          </label>
        )}
        {mode === "extract" && (
          <label className="ai-extra-input">
            抽取字段（每行一个，最多 5 个）
            <textarea
              aria-label="AI 抽取字段"
              disabled={busy}
              value={fields}
              onChange={(e) => setFields(e.target.value)}
              rows={4}
            />
            <span className="source-muted">
              每个非空字段须提供能匹配本次材料的原文片段；未提取到的信息留空。
            </span>
          </label>
        )}
        <button
          onClick={run}
          disabled={
            busy ||
            !papers.length ||
            !(question || query).trim() ||
            (mode === "screen" && !criteria.trim()) ||
            (mode === "extract" &&
              (!fieldNames.length ||
                fieldNames.length > 5 ||
                new Set(fieldNames).size !== fieldNames.length))
          }
        >
          {busy ? "模型正在分析…" : "使用共享模型分析"}
        </button>
        <button onClick={onSettings}>共享模型设置</button>
        {busy && (
          <button
            onClick={() => {
              active.current?.abort();
              setBusy(false);
            }}
          >
            停止等待
          </button>
        )}
        {error && (
          <p role="alert" className="source-error">
            {error}
          </p>
        )}
        {result && (
          <div className="tools-result">
            <p className="source-notice">
              依据：{result.basis}。{result.note}
            </p>
            <p className="tools-text">{result.overview}</p>
            <button
              onClick={() =>
                download(
                  JSON.stringify(result, null, 2),
                  `${provider}-ai-analysis.json`,
                  "application/json",
                )
              }
            >
              导出 AI 结果
            </button>
            {!!(result.screening?.length || result.extractions?.length) && (
              <button onClick={exportCsv}>导出 CSV 表格</button>
            )}
            {!!result.report_sections?.length && (
              <button onClick={exportReport}>下载综述草稿</button>
            )}
            {!!result.screening?.length && (
              <section>
                <h4>筛选建议（待人工复核）</h4>
                {result.screening.map((row) => (
                  <article className="tools-record" key={row.paper_id}>
                    <h4>{citation(row.paper_id)}</h4>
                    <strong>
                      {
                        {
                          include: "建议纳入",
                          exclude: "建议排除",
                          uncertain: "信息不足，待定",
                        }[row.decision]
                      }
                    </strong>
                    <p>{row.reason}</p>
                  </article>
                ))}
              </section>
            )}
            {!!result.extractions?.length && (
              <section>
                <h4>字段抽取表</h4>
                {result.extractions.map((row) => (
                  <article className="tools-record" key={row.paper_id}>
                    <h4>{citation(row.paper_id)}</h4>
                    <dl className="tools-fields">
                      {Object.entries(row.values).map(([name, value]) => (
                        <div key={name}>
                          <dt>{name}</dt>
                          <dd>
                            <p>{value.value ?? "未从当前材料提取到"}</p>
                            {value.supporting_quote && (
                              <blockquote>{value.supporting_quote}</blockquote>
                            )}
                            <small>
                              依据：
                              {{
                                metadata: "元数据",
                                abstract: "摘要",
                                fulltext: "提供的正文片段",
                                missing: "无可用提取值",
                              }[value.source_kind] || value.source_kind}
                              {value.supporting_quote
                                ? " · 摘录已匹配输入文本"
                                : ""}
                            </small>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </section>
            )}
            {!!result.report_sections?.length && (
              <section>
                <h4>综述草稿（仅当前集合）</h4>
                {result.report_sections.map((section, i) => (
                  <article className="tools-record" key={i}>
                    <h4>{section.heading}</h4>
                    <p className="tools-text">{section.text}</p>
                    {section.paper_ids.map((id) => (
                      <div key={id}>{citation(id)}</div>
                    ))}
                  </article>
                ))}
              </section>
            )}
            {result.items.map((item, index) => (
              <article
                className="tools-record"
                key={`${item.paper_id}:${index}`}
              >
                <h4>
                  {index + 1}. {citation(item.paper_id)}
                </h4>
                <p>{item.notes}</p>
                {item.questions.map((q, i) => (
                  <p key={i}>阅读时核对：{q}</p>
                ))}
              </article>
            ))}
            {result.comparisons.map((c, i) => (
              <article className="tools-record" key={i}>
                <p>{c.text}</p>
                {c.paper_ids.map((id) => (
                  <div key={id}>{citation(id)}</div>
                ))}
              </article>
            ))}
            {!!result.limitations.length && (
              <>
                <h4>缺失信息与不确定性</h4>
                <ul>
                  {result.limitations.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>
    </details>
  );
}
