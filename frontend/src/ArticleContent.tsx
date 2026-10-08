import { useEffect, useRef, useState } from "react";
import type { LiteraturePaper } from "./literatureTypes";
import { localFetch } from "./localFetch";
import { paperAccess, webUrl } from "./contentAccess";

export type Paragraph = { kind: string; text: string };
export function parseArticleXml(text: string): Paragraph[] {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror"))
    throw new Error("文件已返回，但无法解析为有效 XML。");
  const nodes = [...doc.getElementsByTagName("*")];
  const root =
    nodes.find((n) => n.localName.toLowerCase() === "body") ||
    nodes.find((n) => n.localName.toLowerCase() === "text");
  return root
    ? [...root.getElementsByTagName("*")]
        .filter((n) =>
          ["p", "title", "head"].includes(n.localName.toLowerCase()),
        )
        .map((n) => ({
          kind: n.localName.toLowerCase() === "p" ? "p" : "title",
          text: n.textContent?.trim() || "",
        }))
        .filter((n) => n.text)
    : [];
}
export function ParagraphReader({
  paragraphs,
  title,
  note,
}: {
  paragraphs: Paragraph[];
  title: string;
  note: string;
}) {
  return (
    <section className="content-reader">
      <h3>{title}</h3>
      <p>{note}</p>
      <div className="content-reader-body">
        {paragraphs.map((p, i) =>
          p.kind === "title" ? (
            <h4 key={i}>{p.text}</h4>
          ) : (
            <p key={i}>{p.text}</p>
          ),
        )}
      </div>
    </section>
  );
}
export function ArticleContent({
  paper,
  configured,
  onSettings,
}: {
  paper: LiteraturePaper;
  configured: boolean;
  onSettings: () => void;
}) {
  const access = paperAccess(paper);
  const [loaded, setLoaded] = useState<{
    url: string;
    format: string;
    paragraphs: Paragraph[];
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef<AbortController | null>(null),
    blob = useRef<string | null>(null);
  useEffect(
    () => () => {
      request.current?.abort();
      if (blob.current) URL.revokeObjectURL(blob.current);
    },
    [],
  );
  async function read(format: "xml" | "pdf" | "tei") {
    if (busy || (paper.provider === "openalex" && !configured)) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setLoaded(null);
    if (blob.current) {
      URL.revokeObjectURL(blob.current);
      blob.current = null;
    }
    try {
      const path =
        format === "xml"
          ? `/api/literature/europepmc/fulltext/${encodeURIComponent(paper.pmcid!)}?format=xml`
          : `/api/advanced/openalex/content/${encodeURIComponent(paper.id)}/${format}`;
      const response = await localFetch(path, { signal: controller.signal });
      if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(
          typeof e.detail === "string"
            ? e.detail
            : `正文 / 文件获取失败（${response.status}）`,
        );
      }
      const xmlText = format === "pdf" ? null : await response.text();
      const file =
        xmlText === null
          ? await response.blob()
          : new Blob([xmlText], { type: "application/xml" });
      const paragraphs = xmlText === null ? [] : parseArticleXml(xmlText);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(file);
      blob.current = url;
      setLoaded({ url, format, paragraphs });
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "读取失败");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const needsKey =
    paper.provider === "openalex" && access.direct && !configured;
  const oaLabel =
    paper.is_open_access === true
      ? "来源标记 OA（不代表已读取）"
      : paper.is_open_access === false
        ? "来源未标记 OA"
        : "OA 状态未提供";
  return (
    <div className={`paper-access ${access.direct ? "has-content" : ""}`}>
      <div className="paper-access-status">
        <span
          className={`content-badge kind-${loaded ? "fulltext" : access.direct ? "file" : "external"}`}
        >
          {loaded
            ? `已获取 ${loaded.format === "tei" ? "TEI XML" : loaded.format.toUpperCase()}${loaded.paragraphs.length ? " · 正文段落已读取" : ""}`
            : access.label}
        </span>
        <span className="content-badge">{oaLabel}</span>
      </div>
      <p>
        {loaded
          ? "文件已从当前服务取回；下方展示本次实际取得的内容。外部入口仍指向原站。"
          : access.explanation}
      </p>
      {access.external && (
        <a href={access.external} target="_blank" rel="noopener noreferrer">
          打开外部全文入口 ↗（离开本页）
        </a>
      )}
      {access.xml && (
        <button disabled={busy} onClick={() => read("xml")}>
          读取全文 XML（本页）
        </button>
      )}
      {access.pdf && (
        <button disabled={busy || needsKey} onClick={() => read("pdf")}>
          获取 PDF 并预览
        </button>
      )}
      {access.tei && (
        <button disabled={busy || needsKey} onClick={() => read("tei")}>
          读取 TEI 正文（本页）
        </button>
      )}
      {needsKey && (
        <button onClick={onSettings}>配置 OpenAlex Key 后获取文件</button>
      )}
      {busy && (
        <p role="status">
          正在获取正文 / 文件…{" "}
          <button
            onClick={() => {
              request.current?.abort();
              setBusy(false);
              setError("已取消读取，正文未取回。");
            }}
          >
            取消读取
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="source-error">
          {error} 未将此记录标记为已读取全文。
        </p>
      )}
      {loaded && (
        <>
          <a
            href={loaded.url}
            download={`${paper.pmcid || paper.id}.${loaded.format === "pdf" ? "pdf" : "xml"}`}
          >
            保存已获取的{" "}
            {loaded.format === "tei" ? "TEI XML" : loaded.format.toUpperCase()}{" "}
            文件
          </a>
          {loaded.format === "pdf" ? (
            <section className="content-reader">
              <h3>已获取 PDF · 原文文件预览</h3>
              <iframe src={loaded.url} title={`${paper.title} PDF 预览`} />
              <p>浏览器不支持内嵌 PDF 时，请保存文件阅读。</p>
            </section>
          ) : loaded.paragraphs.length ? (
            <ParagraphReader
              title={`已读取正文 · ${loaded.paragraphs.length} 个段落项`}
              paragraphs={loaded.paragraphs}
              note="下方来自已获取 XML 的正文，不是摘要或模型总结。图片、表格、公式和完整结构请查看原始文件；解析结果不等于证据核验。"
            />
          ) : (
            <p>
              XML
              已获取，但未识别出正文段落；可保存文件检查，不能当作正文已阅读。
            </p>
          )}
        </>
      )}
    </div>
  );
}
export function AnnotationCards({
  items,
}: {
  items: Record<string, unknown>[];
}) {
  return (
    <section>
      <h3>实体注释 · 提到什么、出现在哪</h3>
      <p className="source-muted">
        每张卡是一处词语标注及其上下文。它不是整篇论文，也不证明相关论断正确。
      </p>
      {items.map((item, i) => {
        const d = (item.details || {}) as Record<string, unknown>;
        const tags = Array.isArray(d.tags)
          ? (d.tags as { name?: string; uri?: string }[])
          : [];
        return (
          <article key={i} className="annotation-card">
            <h4>
              <mark>{String(item.title || "未命名词语")}</mark>
            </h4>
            <small>
              类型：{String(d.type || "未提供")} · 出现位置：
              {String(d.section || "未提供")}
            </small>
            <p>{String(item.text || "未提供上下文")}</p>
            {webUrl(item.url) && (
              <a
                href={String(item.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                查看注释出处 ↗
              </a>
            )}
            {tags.map((t, j) =>
              webUrl(t.uri) ? (
                <p key={j}>
                  <a href={t.uri} target="_blank" rel="noopener noreferrer">
                    实体数据库：{t.name || t.uri} ↗
                  </a>
                </p>
              ) : null,
            )}
          </article>
        );
      })}
      {!items.length && (
        <p>本次未返回实体注释，不代表文章没有相关实体或没有全文。</p>
      )}
    </section>
  );
}
