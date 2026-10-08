import { SOURCE_DESCRIPTIONS } from "./sourceDescriptions";
export interface SourceResearch {
  name: string;
  scope: string;
  granularity: string[];
  identifiers: string;
  boundary: string;
  modelBoundary: string;
  docs: { label: string; url: string }[];
}
export interface ApiContract {
  apis: string[];
  input: string;
  output: string;
  granularity: string;
  family: string;
  model: "data" | "retrieval" | "precomputed" | "generation" | "task-state";
  scope?: string;
  note?: string;
  docs?: string;
}
export const RESEARCH_DATE = "2026-10-08";
export const SOURCE_RESEARCH: Record<string, SourceResearch> = {
  sciverse: {
    name: "Sciverse",
    scope: SOURCE_DESCRIPTIONS.sciverse.scope,
    granularity: [
      "元数据记录",
      "文本片段 / 正文",
      "论文内实体与关系",
      "证据与段落",
      "引用边 / 文件",
    ],
    identifiers:
      "unique_id 标识元数据；doc_id 用于正文；schema_id 用于结构化论文；entity_id 在论文内有效。这些 ID 不能直接互换。",
    boundary:
      "元数据命中不保证有全文；全文存在不保证有 Schema。引用图只包含已解析的库内关联；材料包是裁剪集合。",
    modelBoundary:
      "本页数据接口不调用你配置的 LLM。语义检索可能使用服务端检索模型；Schema 是供应方预先抽取的结构，不是本次由应用生成的结论。",
    docs: [
      {
        label: "元数据 API",
        url: "https://sciverse.opendatalab.com/docs/sciverse/api/meta-search",
      },
      {
        label: "Paper Schema",
        url: "https://sciverse.opendatalab.com/docs/sciverse/api/paper-schema",
      },
      {
        label: "官方平台与数据规模",
        url: "https://sciverse.opendatalab.com/",
      },
    ],
  },
  pubmed: {
    name: "PubMed",
    scope: SOURCE_DESCRIPTIONS.pubmed.scope,
    granularity: [
      "PMID 列表",
      "书目 / 摘要 / MeSH",
      "关联标识",
      "历史检索集合",
    ],
    identifiers:
      "PMID 是 PubMed 记录 ID；PMCID 是 PMC 全文标识。ESearch 返回 PMID，EFetch 返回记录，不直接返回期刊全文。",
    boundary:
      "PubMed 与 PMC 不是同一数据粒度；并非所有记录都有摘要或 MeSH。常规 ESearch 的大结果集需要按时间等条件分段。",
    modelBoundary:
      "E-utilities 检索与取数不需要本地 LLM；筛选结论和综述不是原始书目接口的输出。",
    docs: [
      { label: "数据库范围", url: "https://pubmed.ncbi.nlm.nih.gov/about/" },
      {
        label: "E-utilities",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK25501/",
      },
    ],
  },
  europepmc: {
    name: "Europe PMC",
    scope: SOURCE_DESCRIPTIONS.europepmc.scope,
    granularity: [
      "文献记录",
      "开放全文 XML",
      "实体提及 / 注释",
      "参考文献 / 施引",
      "数据库链接",
    ],
    identifiers:
      "用 source:id 标识记录，如 MED:38451962；读取全文 XML 通常使用 PMCID；实体注释可能有外部数据库 URI。",
    boundary:
      "能检索到的文献不一定能取全文 XML；可读全文与可复用内容也需按记录区分。文本挖掘标注不是已验证的科学论断。",
    modelBoundary:
      "本页调用检索、全文与注释接口，不需要本地 LLM；注释由上游流程生成。",
    docs: [
      { label: "数据库范围", url: "https://europepmc.org/help" },
      {
        label: "Articles REST API",
        url: "https://europepmc.org/RestfulWebService",
      },
      { label: "Annotations API", url: "https://europepmc.org/annotationsapi" },
    ],
  },
  openalex: {
    name: "OpenAlex",
    scope: SOURCE_DESCRIPTIONS.openalex.scope,
    granularity: [
      "学术对象",
      "作者/机构归属",
      "引用边",
      "分组计数",
      "部分 PDF / TEI",
    ],
    identifiers:
      "W/A/I 等前缀分别表示作品、作者和机构；DOI、ORCID、ROR 等可作为外部关联线索。对象消歧结果并非绝对正确。",
    boundary:
      "元数据图谱与可下载内容是不同覆盖；group_by 统计完整查询集合，但分组列表仍分页，机构分组可能重叠。",
    modelBoundary:
      "当前查询、对象、聚合、引用与文件接口不需要本地 LLM；主题与消歧等字段包含供应方的预处理结果。",
    docs: [
      { label: "数据对象与范围", url: "https://help.openalex.org/data/" },
      { label: "API", url: "https://help.openalex.org/api/" },
      { label: "全文文件", url: "https://help.openalex.org/access/fulltext/" },
    ],
  },
  semantic_scholar: {
    name: "Semantic Scholar",
    scope: SOURCE_DESCRIPTIONS.semantic_scholar.scope,
    granularity: ["论文 / 作者记录", "引用边", "相关性推荐", "摘要与全文链接"],
    identifiers:
      "paperId 用于图谱调用，corpusId 也用于数据集；部分接口接受 DOI、arXiv、PMID 等外部标识。当前引用表单使用解析后的 paperId。",
    boundary:
      "摘要、PDF 链接及引用覆盖按记录变化；推荐不等于引用。匿名请求共享额度，429 不表示没有文献。",
    modelBoundary:
      "不需要本地 LLM；推荐和部分派生字段是供应方计算结果，不能当作现场生成的综述。",
    docs: [
      {
        label: "服务与匿名访问",
        url: "https://webflow.semanticscholar.org/product/api",
      },
      { label: "Graph API", url: "https://api.semanticscholar.org/api-docs/" },
      {
        label: "Recommendations",
        url: "https://api.semanticscholar.org/api-docs/recommendations",
      },
    ],
  },
  elicit: {
    name: "Elicit",
    scope: SOURCE_DESCRIPTIONS.elicit.scope,
    granularity: ["论文搜索记录", "研究会话", "筛选 / 抽取结果", "报告 / 产物"],
    identifiers:
      "论文可能提供 elicitId、DOI、PMID；任务用 sessionId，产物用会话内 artifactId。两类对象不要混用。",
    boundary:
      "需要付费 API 权限。搜索返回论文；创建报告/综述/Agent 返回异步会话，完成后再取结果。语料数量不能代表每篇都有全文。",
    modelBoundary:
      "检索不需你提供额外 LLM Key，但可用服务端语义检索。报告、抽取和研究 Agent 属于服务端 AI 任务，默认纯 API 模式不启动这些任务。",
    docs: [
      { label: "API v2", url: "https://docs.elicit.com/" },
      {
        label: "API 访问与计费",
        url: "https://elicit.com/operations/api-terms",
      },
    ],
  },
};

function c(
  apis: string[],
  input: string,
  output: string,
  granularity: string,
  family = "数据查询",
  model: ApiContract["model"] = "data",
  note?: string,
): ApiContract {
  return { apis, input, output, granularity, family, model, note };
}
export const API_CONTRACTS: Record<string, Record<string, ApiContract>> = {
  openalex: {
    search: c(
      ["GET /works"],
      "search；本页 size 映射 per_page",
      "meta.count + results[]（本页归一为论文条目）",
      "论文记录",
    ),
    aggregate: c(
      ["GET /works?group_by=…"],
      "search + group_by + cursor",
      "完整查询的 meta.count 与一页 group_by[] 计数",
      "聚合分组",
    ),
    author: c(
      ["GET /authors/{author_id}"],
      "A 开头的作者 ID",
      "作者对象、关联机构和指标",
      "作者对象",
    ),
    author_works: c(
      ["GET /works?filter=authorships.author.id:…"],
      "author_id + per_page + cursor",
      "作者的 works 列表和下一页游标",
      "论文集合",
    ),
    institution: c(
      ["GET /institutions/{institution_id}"],
      "I 开头的机构 ID",
      "机构对象、ROR、地理信息和指标",
      "机构对象",
    ),
    institution_works: c(
      ["GET /works?filter=authorships.institutions.id:…"],
      "institution_id + per_page + cursor",
      "机构关联的 works 列表",
      "论文集合",
    ),
    references: c(
      ["GET /works/{work_id}", "GET /works?filter=openalex:…"],
      "W ID；从 referenced_works 分批读取",
      "已解析参考文献记录；本页据此画方向图",
      "论文 + 引用边",
    ),
    citations: c(
      ["GET /works?filter=cites:{work_id}"],
      "W ID + cursor",
      "引用该论文的 works 与下一页游标",
      "论文 + 引用边",
    ),
    pdf: c(
      ["GET https://content.openalex.org/works/{work_id}.pdf"],
      "W ID；Key 保留在后端",
      "PDF 二进制文件",
      "文件",
      "内容",
    ),
    tei: c(
      ["GET https://content.openalex.org/works/{work_id}.grobid-xml"],
      "W ID；Key 保留在后端",
      "TEI XML 文件；本页抽出段落预览",
      "文件 / 段落",
      "内容",
      "precomputed",
    ),
  },
  pubmed: {
    filtered_search: c(
      ["GET /entrez/eutils/esearch.fcgi", "GET /entrez/eutils/efetch.fcgi"],
      "term、日期/文献类型、retstart/retmax",
      "ESearch: PMID/count/历史集合；EFetch: PubmedArticleSet XML，本页归一显示",
      "书目 / 摘要 / 标引",
    ),
    related: c(
      ["GET /entrez/eutils/elink.fcgi", "GET /entrez/eutils/efetch.fcgi"],
      "PMID、linkname（相似/参考/施引/PMC）",
      "关联 ID；PubMed 目标继续取书目，PMC 目标给链接",
      "关联标识 / 记录",
    ),
    batch: c(
      ["GET /entrez/eutils/efetch.fcgi"],
      "PMID 列表，最多 100 个为本应用上限",
      "XML 中的书目、摘要和 MeSH",
      "记录批次",
    ),
    history: c(
      ["GET /entrez/eutils/efetch.fcgi"],
      "WebEnv、query_key、retstart/retmax",
      "历史检索集合中的记录页",
      "记录批次",
    ),
  },
  europepmc: {
    search: c(
      ["GET /europepmc/webservices/rest/search"],
      "query、resultType=core、pageSize",
      "resultList.result[]；包括记录、摘要和全文入口",
      "文献记录",
    ),
    fulltext: c(
      ["GET /europepmc/webservices/rest/{PMCID}/fullTextXML"],
      "可获取开放全文的 PMCID",
      "全文 XML；本页显示标题和正文段落",
      "全文 / 段落",
      "内容",
    ),
    annotations: c(
      ["GET /europepmc/annotations_api/annotationsByArticleIds"],
      "articleIds，例如 MED:38451962",
      "实体提及、上下文、类型、来源锚点和 tags URI",
      "实体提及",
      "注释与关联",
      "precomputed",
    ),
    references: c(
      ["GET /europepmc/webservices/rest/{source}/{id}/references"],
      "source:id、page、pageSize",
      "参考文献记录和 hitCount；可能未解析",
      "引用记录",
      "注释与关联",
    ),
    citations: c(
      ["GET /europepmc/webservices/rest/{source}/{id}/citations"],
      "source:id、page、pageSize",
      "施引论文记录和 hitCount",
      "引用记录",
      "注释与关联",
    ),
    datalinks: c(
      ["GET /europepmc/webservices/rest/{source}/{id}/datalinks"],
      "source:id",
      "数据库、数据引用、补充材料链接及关系类型",
      "外部资源链接",
      "注释与关联",
    ),
  },
  semantic_scholar: {
    search: c(
      ["GET /graph/v1/paper/search"],
      "query、limit、fields",
      "论文 records + total；不是最终研究答案",
      "论文记录",
    ),
    references: c(
      ["GET /graph/v1/paper/{paper_id}/references"],
      "paperId、offset、limit、fields",
      "citedPaper 列表和 next；方向为当前论文→目标",
      "引用边",
    ),
    citations: c(
      ["GET /graph/v1/paper/{paper_id}/citations"],
      "paperId、offset、limit、fields",
      "citingPaper 列表和 next；方向为来文→当前论文",
      "引用边",
    ),
    recommendations: c(
      ["GET /recommendations/v1/papers/forpaper/{paper_id}"],
      "起点 paperId、limit、fields",
      "recommendedPapers；相关性建议而非引用",
      "推荐论文",
      "推荐",
      "precomputed",
    ),
    author_search: c(
      ["GET /graph/v1/author/search"],
      "作者名 query、offset、limit、fields",
      "作者候选与 authorId",
      "作者记录",
    ),
    author: c(
      ["GET /graph/v1/author/{author_id}"],
      "authorId、fields",
      "作者、机构、论文/引用计数与指标",
      "作者对象",
    ),
    author_works: c(
      ["GET /graph/v1/author/{author_id}/papers"],
      "authorId、offset、limit、fields",
      "该作者论文页与 next",
      "论文集合",
    ),
    batch: c(
      ["POST /graph/v1/paper/batch"],
      "ids[]；支持服务认可的 paperId/外部标识",
      "按标识返回论文对象，可能包含 null",
      "论文批次",
    ),
  },
  elicit: {
    search: c(
      ["POST /api/v2/search/papers"],
      "query、maxResults；本页使用默认 corpus",
      "papers[]、可选 warnings；无搜索分页游标",
      "论文记录",
      "搜索",
      "retrieval",
    ),
    report: c(
      ["POST /api/v2/sessions/reports"],
      "researchQuestion",
      "202: sessionId/status/url，报告尚未完成",
      "AI 任务",
      "服务端 AI",
      "generation",
    ),
    review: c(
      ["POST /api/v2/sessions/systematic-reviews"],
      "研究问题、searches、筛选/抽取阶段配置",
      "202: 会话 ID；随后读取阶段结果和导出",
      "AI 工作流",
      "服务端 AI",
      "generation",
    ),
    agent: c(
      ["POST /api/v2/sessions/agents"],
      "query",
      "202: 研究 Agent sessionId/status/url",
      "AI 会话",
      "服务端 AI",
      "generation",
    ),
    sessions: c(
      ["GET /api/v2/sessions"],
      "limit、cursor",
      "已有会话列表和 nextCursor",
      "任务记录",
      "任务读取",
      "task-state",
    ),
    status: c(
      [
        "GET /api/v2/sessions/reports/{id}",
        "GET /api/v2/sessions/systematic-reviews/{id}",
        "GET /api/v2/sessions/agents/{id}",
      ],
      "任务类型与 sessionId",
      "状态、阶段结果；可用时有报告和导出链接",
      "任务状态",
      "任务读取",
      "task-state",
    ),
    events: c(
      ["GET /api/v2/sessions/agents/{id}/events"],
      "sessionId、cursor",
      "事件数组与游标；包含活动/引用/问题",
      "事件",
      "任务读取",
      "task-state",
    ),
    artifacts: c(
      ["GET /api/v2/sessions/agents/{id}/artifacts"],
      "sessionId",
      "文件 artifacts 与交互式 deliveredOutputs",
      "产物清单",
      "任务读取",
      "task-state",
    ),
    sources: c(
      ["GET /api/v2/sessions/agents/{id}/sources"],
      "sessionId",
      "任务引用来源，按 sourceRef 关联",
      "引用来源",
      "任务读取",
      "task-state",
    ),
    artifact_content: c(
      ["GET /api/v2/sessions/agents/{id}/artifacts/{artifact_id}/content"],
      "sessionId、artifactId",
      "结构化产物内容、表格/文本和引用",
      "产物内容",
      "任务读取",
      "task-state",
    ),
    artifact_download: c(
      ["GET /api/v2/sessions/agents/{id}/artifacts/{artifact_id}/download"],
      "sessionId、artifactId、可选 format",
      "短时 downloadUrl、文件类型和过期时间",
      "下载入口",
      "任务读取",
      "task-state",
    ),
    stop: c(
      ["POST /api/v2/sessions/agents/{id}/stop"],
      "sessionId",
      "停止请求状态；需要事件确认已停止",
      "任务状态",
      "任务控制",
      "task-state",
    ),
    message: c(
      ["POST /api/v2/sessions/agents/{id}/messages"],
      "sessionId、message",
      "messageId，触发后续 Agent 工作",
      "AI 会话",
      "服务端 AI",
      "generation",
    ),
    resume: c(
      ["POST /api/v2/sessions/{id}/resume"],
      "使用状态响应的 links.resume",
      "恢复暂停会话，可能继续产生模型用量",
      "AI 会话",
      "服务端 AI",
      "generation",
    ),
  },
  sciverse: {
    metadata: c(
      ["POST /meta-search"],
      "query 或 filters；collection、fields、sort、page/cursor",
      "results 元数据、unique_id；有全文时可能有 doc_id",
      "元数据记录",
      "通用元数据",
    ),
    catalog: c(
      ["GET /meta-catalog"],
      "collection: papers/authors/sources",
      "字段类型、过滤/排序/投影能力",
      "字段定义",
      "通用元数据",
    ),
    meta_relations: c(
      ["POST /meta-paper-relations"],
      "unique_id、relation、page/page_size",
      "库内引用/被引/相关工作记录与计数",
      "论文关联",
      "通用元数据",
    ),
    evidence: c(
      ["POST /agentic-search"],
      "自然语言 query、top_k、可选 filters",
      "hits: chunk、doc_id、offset、页码及元数据",
      "文本片段",
      "全文与资源",
      "retrieval",
      "返回检索材料，不生成最终答案。",
    ),
    content: c(
      ["GET /content"],
      "doc_id、offset、limit（字符）",
      "text、next_offset、more；不是 Schema 对象",
      "正文片段",
      "全文与资源",
      "data",
      "官方 Skills / SDK 工具名为 read_content；本应用直接调用 GET /content，默认分段读取并沿 next_offset 继续。",
    ),
    resource: c(
      ["GET /resource"],
      "原文返回的安全相对 file_name",
      "图像/PDF 等二进制文件",
      "文件",
      "全文与资源",
    ),
    schema_capabilities: c(
      ["GET /paper-schema"],
      "数据 Token，无检索参数",
      "接口版本、资源、分类与限额",
      "能力说明",
      "Paper Schema",
      "precomputed",
    ),
    schema_search: c(
      ["POST /paper-schema/search"],
      "query 或 filters、size/cursor",
      "论文 items[]、schema_id、贡献/问题等抽取字段",
      "结构化论文",
      "Paper Schema",
      "precomputed",
    ),
    schema_entities_search: c(
      ["POST /paper-schema/entities/search"],
      "query 或 schema_ids 范围；分类 filters",
      "Entity items[]、entity_id、provenance",
      "实体",
      "Paper Schema",
      "precomputed",
    ),
    schema_entity_papers: c(
      ["POST /paper-schema/entities/related-papers"],
      "实体名称 query、类型约束、size/cursor",
      "候选论文与 matched_entities、match_reasons",
      "相关论文",
      "Paper Schema",
      "precomputed",
    ),
    schema_related: c(
      ["POST /paper-schema/schemas/{schema_id}/related-papers"],
      "schema_id、signals、size",
      "相关论文、分项信号和原因；不是事实引用边",
      "相关论文",
      "Paper Schema",
      "precomputed",
    ),
    schema_entities: c(
      ["GET /paper-schema/schemas/{schema_id}/entities"],
      "schema_id、类型/章节、size/cursor",
      "逐页 Entity 完整对象集合",
      "实体",
      "Paper Schema",
      "precomputed",
    ),
    schema_entity: c(
      ["GET /paper-schema/schemas/{schema_id}/entities/{entity_id}"],
      "schema_id、entity_id；可附关联关系",
      "entity、可选 relations 与截断标记",
      "实体详情",
      "Paper Schema",
      "precomputed",
    ),
    schema_relations: c(
      ["POST /paper-schema/relations/search"],
      "限定论文/实体/关系类型的 filters",
      "文内 Relation、端点与 provenance",
      "文内关系",
      "Paper Schema",
      "precomputed",
    ),
    schema_relation: c(
      ["GET /paper-schema/schemas/{schema_id}/relations/{relation_id}"],
      "schema_id、relation_id",
      "关系、端点对象、出处",
      "关系详情",
      "Paper Schema",
      "precomputed",
    ),
    schema_citation_summary: c(
      ["GET /paper-schema/schemas/{schema_id}/citation-summary"],
      "schema_id",
      "总参考数、解析覆盖、入/出边计数",
      "引用统计",
      "Paper Schema",
      "precomputed",
    ),
    schema_citations: c(
      ["GET /paper-schema/schemas/{schema_id}/citations"],
      "schema_id、size/cursor",
      "完整引用记录，保留未解析项",
      "参考文献",
      "Paper Schema",
      "precomputed",
    ),
    schema_citation_graph: c(
      ["GET /paper-schema/schemas/{schema_id}/citation-graph"],
      "schema_id、方向、深度和节点/边限额",
      "已解析论文节点与引用边；可能截断",
      "引用图数据",
      "Paper Schema",
      "precomputed",
    ),
    schema_evidence: c(
      ["POST /paper-schema/evidence/search"],
      "groups 与论文/关键词等约束；size/cursor",
      "Evidence 值、source_entity_id 和出处",
      "结构化证据",
      "Paper Schema",
      "precomputed",
    ),
    schema_evidence_item: c(
      ["GET /paper-schema/schemas/{schema_id}/evidence/{evidence_id}"],
      "schema_id、evidence_id",
      "单条证据值、来源对象、出处",
      "证据详情",
      "Paper Schema",
      "precomputed",
    ),
    schema_provenance: c(
      ["POST /paper-schema/resolve-provenance"],
      "schema_id + marker_nums；window/max_segments",
      "segments 原文段落、定位、缺失项",
      "段落",
      "Paper Schema",
      "precomputed",
    ),
    schema_provenance_ids: c(
      ["POST /paper-schema/resolve-provenance"],
      "paragraph_ids；与 marker 模式互斥",
      "segments 原文段落及上下文",
      "段落",
      "Paper Schema",
      "precomputed",
    ),
    schema_text: c(
      ["POST /paper-schema/search-in-schema"],
      "schema_id、query、top_k/window",
      "单篇文本命中与位置；不是出处判定",
      "段落检索",
      "Paper Schema",
    ),
    schema_hydrate: c(
      ["POST /paper-schema/hydrate-items"],
      "最多 50 个含 schema_id 和定位信息的 items",
      "逐项来源段落、hydration_method 和失败原因",
      "对象 + 段落",
      "Paper Schema",
      "precomputed",
    ),
    schema_materials: c(
      ["POST /paper-schema/materials"],
      "1–20 个 schema_ids、goal、各资源限额",
      "按目标选取的结构材料；total/returned/truncated",
      "结构材料包",
      "Paper Schema",
      "precomputed",
      "不是 LLM 综述或完整对象集合。",
    ),
  },
};
