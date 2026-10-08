import type { LiteraturePaper } from "./literatureTypes";

export type ContentKind =
  | "records"
  | "external"
  | "fulltext"
  | "file"
  | "passages"
  | "annotations"
  | "structure"
  | "generated";
export type ContentBoundary = {
  kind: ContentKind;
  label: string;
  detail: string;
};
export const CONTENT_BOUNDARIES: Record<ContentKind, ContentBoundary> = {
  records: {
    kind: "records",
    label: "记录 / 统计，不返回正文",
    detail:
      "本次返回书目、摘要、关联记录或统计信息。即使某篇文章标记 OA，也不表示正文已被读取。",
  },
  external: {
    kind: "external",
    label: "书目 / 摘要 · 全文需外部跳转",
    detail:
      "当前接口不返回文章正文。有全文链接时可打开外部页面；没有链接不能据此判断文章不存在开放版本。",
  },
  fulltext: {
    kind: "fulltext",
    label: "可获取正文 · 仅覆盖符合条件的记录",
    detail:
      "按单篇记录判断。找到文章、标记 OA 与成功取回全文是不同状态；读取成功后才显示正文。",
  },
  file: {
    kind: "file",
    label: "原文文件 · 获取成功后预览 / 下载",
    detail:
      "获取指定论文的 PDF 或 XML 文件；文件可用性与元数据覆盖不同。XML 段落预览不包含完整图片、表格和版式。",
  },
  passages: {
    kind: "passages",
    label: "原文片段 / 定位段落 · 非整篇全文",
    detail:
      "返回命中的片段或定位处的上下文。本页显示多少段，就只取回了这些段落，不能视作整篇阅读完成。",
  },
  annotations: {
    kind: "annotations",
    label: "实体注释 · 词语、类型与位置",
    detail:
      "识别原文提到的基因、疾病等对象，并附上下文和数据库链接；不是整篇正文，也不是经核实的研究结论。注释可能只来自摘要。",
  },
  structure: {
    kind: "structure",
    label: "已抽取结构 · 原文需另行回查",
    detail:
      "论文、实体、关系和证据的结构化字段由供应方预处理产生。字段或材料包不是完整正文；出处定位需单独调用段落接口。",
  },
  generated: {
    kind: "generated",
    label: "研究任务 / 生成产物 · 非原始论文全文",
    detail:
      "报告、抽取结果和会话产物属于研究流程输出，不能当作检索到的论文原文。",
  },
};
export function operationContent(
  source: string,
  operation: string,
): ContentBoundary {
  if (source === "sciverse") {
    if (operation === "content")
      return {
        kind: "fulltext",
        label: "原文读取 · 全文 / 片段可切换",
        detail:
          "全文模式不发送 offset / limit；片段模式按所填位置与长度读取。结果分别标明请求模式、实际返回字符数及是否仍有后续内容。",
      };
    if (
      [
        "content",
        "evidence",
        "schema_provenance",
        "schema_provenance_ids",
        "schema_text",
        "schema_hydrate",
      ].includes(operation)
    )
      return CONTENT_BOUNDARIES.passages;
    if (operation === "resource") return CONTENT_BOUNDARIES.file;
    if (operation.startsWith("schema_")) return CONTENT_BOUNDARIES.structure;
  }
  if (source === "europepmc") {
    if (operation === "annotations") return CONTENT_BOUNDARIES.annotations;
    if (["search", "fulltext"].includes(operation))
      return CONTENT_BOUNDARIES.fulltext;
  }
  if (source === "openalex") {
    if (["pdf", "tei"].includes(operation)) return CONTENT_BOUNDARIES.file;
    if (
      [
        "search",
        "author_works",
        "institution_works",
        "references",
        "citations",
      ].includes(operation)
    )
      return CONTENT_BOUNDARIES.fulltext;
  }
  if (source === "elicit")
    return CONTENT_BOUNDARIES[
      operation === "search" ? "external" : "generated"
    ];
  if (["pubmed", "semantic_scholar"].includes(source))
    return CONTENT_BOUNDARIES.external;
  return CONTENT_BOUNDARIES.records;
}
export function webUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? value
      : null;
  } catch {
    return null;
  }
}
export function paperAccess(paper: LiteraturePaper) {
  const formats = paper.content_formats || [];
  const xml =
    paper.provider === "europepmc" &&
    paper.fulltext_readable &&
    /^PMC\d+$/.test(paper.pmcid || "");
  const pdf = paper.provider === "openalex" && formats.includes("pdf");
  const tei = paper.provider === "openalex" && formats.includes("grobid_xml");
  const external = webUrl(paper.fulltext_url);
  const direct = xml || pdf || tei;
  let explanation =
    "本次只取得书目与可用摘要；没有返回全文入口，也没有读取正文。";
  if (paper.provider === "pubmed")
    explanation =
      "PubMed 当前接口只返回书目与摘要。PMC / 出版社全文入口在外部，本页没有取得正文。";
  else if (xml)
    explanation =
      "记录带 PMCID 且标记为开放获取，可尝试读取 Europe PMC 的全文 XML；尚未取回正文。";
  else if (pdf || tei)
    explanation = `服务标记存在 ${[pdf && "PDF", tei && "TEI XML"].filter(Boolean).join("、")}；尚未下载，实际可用性以获取结果为准。`;
  else if (paper.provider === "openalex")
    explanation = paper.content_status_known
      ? "服务本次未标记可下载的 PDF / TEI 文件。OA 或外部全文链接不代表 Content API 有文件。"
      : "本次记录未提供文件可用性信息。不能仅凭 OA 或外部链接推断 Content API 可下载。";
  else if (paper.provider === "europepmc")
    explanation =
      "本次记录不满足已接入的 XML 读取条件（PMCID + OA 标记）。外部可读与本接口可取 XML 是两回事。";
  else if (external)
    explanation = "接口给出外部全文入口，本应用没有下载或解析这篇文章的正文。";
  return {
    xml,
    pdf,
    tei,
    external,
    direct,
    explanation,
    label: direct
      ? "有正文 / 文件获取入口 · 尚未读取"
      : external
        ? "仅外部全文入口 · 未读取正文"
        : "未提供可用全文入口 · 未读取正文",
  };
}
