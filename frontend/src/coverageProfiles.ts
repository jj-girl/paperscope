import { SOURCE_DESCRIPTIONS } from "./sourceDescriptions";
export type CoverageMetric = {
  label: string;
  value: string;
  basis: string;
  url: string;
};
export type CoverageProfile = {
  sources: string;
  access: string;
  summary: string;
  metrics: CoverageMetric[];
};
const europeCount = (query: string) =>
  `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=1&resultType=idlist`;
export const COVERAGE: Record<string, CoverageProfile> = {
  sciverse: {
    sources: SOURCE_DESCRIPTIONS.sciverse.upstreamSummary,
    access: "全文 / 片段与出处段落",
    summary:
      "可以按 doc_id 一次请求全文或按范围读取片段；Schema 出处接口用于回查定位段落。元数据命中不保证正文可取，结构材料包也不是整篇全文。",
    metrics: [
      {
        label: "学术文献",
        value: "3.74 亿（官网展示值）",
        basis: "Sciverse 官方平台，更新于 2026 年 10 月。",
        url: "https://sciverse.opendatalab.com/",
      },
      {
        label: "AI-Ready 全文",
        value: "3071 万（官网展示值）",
        basis:
          "官网全文口径，不能等同于 OA 授权数量，也不代表每个账户可获取全部文件。",
        url: "https://sciverse.opendatalab.com/",
      },
      {
        label: "OA 标记文献",
        value: "尚无法确认精确总量",
        basis:
          "实测 meta-search 的 access_is_oa=true 仅报告 total_count=10,000；不将该值当作全库 OA 总量。",
        url: "https://sciverse.opendatalab.com/docs/sciverse/api/meta-search",
      },
      {
        label: "Paper Schema 子库",
        value: "100 万+（官方 API）",
        basis:
          "实测 GET /paper-schema 返回 coverage.paper_count=1M+、current_focus=AI conference papers。",
        url: "https://sciverse.opendatalab.com/docs/sciverse/api/paper-schema",
      },
    ],
  },
  pubmed: {
    sources: SOURCE_DESCRIPTIONS.pubmed.upstreamSummary,
    access: "摘要与外部全文链接",
    summary:
      "当前 PubMed E-utilities 不返回期刊文章全文。即使有 PMCID，也只提供 PMC 跳转，不在本来源中自动读取全文。",
    metrics: [
      {
        label: "书目记录",
        value: "41,256,727",
        basis: "2026-10-08，官方 EInfo 的 pubmed count。",
        url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=pubmed&retmode=json",
      },
      {
        label: "带免费全文入口的记录",
        value: "14,875,462",
        basis:
          "同日 ESearch: free full text[sb]。免费可读不等于 OA 授权，也不等于本接口返回正文。",
        url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term=free%20full%20text%5Bsb%5D",
      },
      {
        label: "本接口直接返回期刊全文",
        value: "不提供",
        basis: "通过外部出版社或 PMC 链接阅读；OA 精确总量未单独确认。",
        url: "https://pubmed.ncbi.nlm.nih.gov/about/",
      },
    ],
  },
  europepmc: {
    sources: SOURCE_DESCRIPTIONS.europepmc.upstreamSummary,
    access: "部分记录可直接读全文 XML",
    summary:
      "仅符合开放全文条件的记录可通过 fullTextXML 取正文。结果卡标出读取条件；读取成功后展示正文段落，并可保存原始 XML。",
    metrics: [
      {
        label: "索引记录",
        value: "49,008,535",
        basis: "2026-10-08 API 查询 EXT_ID:*；包含不同文献类型和版本。",
        url: europeCount("EXT_ID:*"),
      },
      {
        label: "库内全文记录",
        value: "12,409,642",
        basis: "同日 IN_EPMC:y 命中数；不等于 XML 下载数。",
        url: europeCount("IN_EPMC:y"),
      },
      {
        label: "OA 标记记录",
        value: "8,316,655",
        basis: "同日 OPEN_ACCESS:y；不代表已逐篇验证 XML 获取成功。",
        url: europeCount("OPEN_ACCESS:y"),
      },
    ],
  },
  openalex: {
    sources: SOURCE_DESCRIPTIONS.openalex.upstreamSummary,
    access: "部分记录可下载 PDF / TEI XML",
    summary:
      "按每篇记录的 has_content 判断格式；只有 OA 标记或外部 PDF 链接还不够。Content API 需要 Key，下载成功后才显示预览。",
    metrics: [
      {
        label: "学术作品记录",
        value: "331,133,838",
        basis:
          "2026-10-08 10:30 UTC，GET /works 返回 meta.count；默认核心语料。",
        url: "https://api.openalex.org/works?per_page=1&select=id",
      },
      {
        label: "OA 标记作品",
        value: "130,063,375",
        basis: "同次统计，filter=is_oa:true；不等于 Content API 文件数量。",
        url: "https://api.openalex.org/works?per_page=1&select=id&filter=is_oa:true",
      },
      {
        label: "有 PDF 内容的作品",
        value: "55,345,545",
        basis: "同次统计，filter=has_content.pdf:true。",
        url: "https://api.openalex.org/works?per_page=1&select=id&filter=has_content.pdf:true",
      },
      {
        label: "有 TEI XML 的作品",
        value: "52,966,359",
        basis:
          "同次统计，filter=has_content.grobid_xml:true；与 PDF 集合重叠，不相加。",
        url: "https://api.openalex.org/works?per_page=1&select=id&filter=has_content.grobid_xml:true",
      },
    ],
  },
  semantic_scholar: {
    sources: SOURCE_DESCRIPTIONS.semantic_scholar.upstreamSummary,
    access: "摘要与外部 PDF 链接",
    summary:
      "当前 Graph / 推荐接口返回论文信息、引用和可能存在的开放 PDF 链接；本应用未通过这些接口取得论文正文。",
    metrics: [
      {
        label: "论文记录",
        value: "2.14 亿（概览页展示值）",
        basis:
          "官方 API 概览页展示值，统计日期未注明。OA / 正文总量本次未能核实（匿名请求 429）。",
        url: "https://webflow.semanticscholar.org/product/api",
      },
      {
        label: "当前接入的全文范围",
        value: "外部链接，非全文库",
        basis: "另有 Datasets / S2ORC，但本应用未接入其全文数据集。",
        url: "https://api.semanticscholar.org/api-docs/",
      },
    ],
  },
  elicit: {
    sources: SOURCE_DESCRIPTIONS.elicit.upstreamSummary,
    access: "论文链接与研究任务产物",
    summary:
      "搜索提供论文记录和可能的全文链接；报告、抽取表、Agent 产物是生成输出，不是论文原文。未接入通用逐篇全文读取。",
    metrics: [
      {
        label: "论文索引",
        value: "1.38 亿+",
        basis:
          "官方 API 文档的索引规模；OA / 原始全文总量未核实，不能用索引量代替。",
        url: "https://docs.elicit.com/",
      },
      {
        label: "可直接读取原始论文全文",
        value: "当前未接入",
        basis: "任务产物下载与论文全文下载是不同能力。",
        url: "https://docs.elicit.com/",
      },
    ],
  },
};
