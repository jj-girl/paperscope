export interface ToolField {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "ids" | "numbers" | "json" | "select";
  options?: [string, string][];
  value?: string;
  required?: boolean;
  min?: number;
  max?: number;
}
export interface ServiceOperation {
  id: string;
  title: string;
  help: string;
  fields: ToolField[];
  createsTask?: boolean;
  needsKey?: boolean;
  download?: "pdf" | "tei" | "resource";
  basicSearch?: boolean;
  directPath?: string;
}
const query: ToolField = {
  key: "query",
  label: "检索词 / 问题",
  required: true,
};
const record = (label: string): ToolField => ({
  key: "record_id",
  label,
  required: true,
});
const size: ToolField = {
  key: "size",
  label: "每页数量（1–100）",
  type: "number",
  value: "20",
};
const ids: ToolField = {
  key: "ids",
  label: "标识列表（每行一个，最多 100 个）",
  type: "ids",
  required: true,
};
const taskKind: ToolField = {
  key: "kind",
  label: "任务类型",
  type: "select",
  options: [
    ["report", "报告"],
    ["review", "系统综述"],
    ["agent", "研究 Agent"],
  ],
};
const session = record("sessionId（提交任务后返回）");

export const SERVICE_OPERATIONS: Record<string, ServiceOperation[]> = {
  openalex: [
    {
      id: "aggregate",
      title: "完整检索集合聚合",
      help: "调用服务端 group_by；每个分组的计数覆盖完整检索集合，分组列表按页读取。",
      fields: [
        query,
        {
          key: "group",
          label: "聚合维度",
          type: "select",
          options: [
            ["year", "发表年份"],
            ["type", "文献类型"],
            ["institution", "机构"],
            ["topic", "主要主题"],
          ],
        },
      ],
    },
    {
      id: "author",
      title: "作者详情",
      help: "查看作者身份、机构和服务报告的学术指标。",
      fields: [record("作者 ID（A 开头）")],
    },
    {
      id: "author_works",
      title: "作者论文",
      help: "分页读取指定作者的论文集合。",
      fields: [record("作者 ID（A 开头）"), size],
    },
    {
      id: "institution",
      title: "机构详情",
      help: "查看机构标识、地理信息和学术指标。",
      fields: [record("机构 ID（I 开头）")],
    },
    {
      id: "institution_works",
      title: "机构论文",
      help: "分页读取指定机构的论文集合。",
      fields: [record("机构 ID（I 开头）"), size],
    },
    {
      id: "references",
      title: "参考文献与引用图",
      help: "这篇论文引用了谁？只包含 OpenAlex 已解析的关联。",
      fields: [record("论文 ID（W 开头）"), size],
    },
    {
      id: "citations",
      title: "施引论文与引用图",
      help: "哪些论文引用了它？引用方向与参考文献相反。",
      fields: [record("论文 ID（W 开头）"), size],
    },
    {
      id: "pdf",
      title: "获取 PDF",
      help: "从 OpenAlex Content API 下载；需要 API Key，并计入账户内容用量。仅部分论文有文件。",
      fields: [record("论文 ID（W 开头）")],
      download: "pdf",
      needsKey: true,
    },
    {
      id: "tei",
      title: "获取并阅读 TEI XML",
      help: "获取 GROBID TEI XML，可下载文件并预览结构化文本。需要 API Key；解析文本不等于证据核验。",
      fields: [record("论文 ID（W 开头）")],
      download: "tei",
      needsKey: true,
    },
  ],
  pubmed: [
    {
      id: "filtered_search",
      title: "高级筛选与检索集合",
      help: "组合检索式、发表年份和文献类型，返回 NCBI 历史集合。PubMed 常规搜索边界为 10,000 条；更大集合需分段查询。",
      fields: [
        query,
        { key: "year_from", label: "起始年份", type: "number" },
        { key: "year_to", label: "结束年份", type: "number" },
        {
          key: "publication_type",
          label: "文献类型",
          type: "select",
          options: [
            ["", "不限"],
            ["Review", "综述"],
            ["Systematic Review", "系统综述"],
            ["Meta-Analysis", "Meta 分析"],
            ["Randomized Controlled Trial", "随机对照试验"],
            ["Clinical Trial", "临床试验"],
          ],
        },
        size,
      ],
    },
    {
      id: "related",
      title: "关联记录与引用",
      help: "分别查询相似论文、参考文献、施引论文和 PMC 全文记录；关联完整性受来源覆盖限制。",
      fields: [
        record("PMID"),
        {
          key: "kind",
          label: "关联类型",
          type: "select",
          options: [
            ["similar", "相似论文"],
            ["references", "参考文献"],
            ["citations", "施引论文"],
            ["pmc", "PMC 全文记录"],
          ],
        },
        size,
      ],
    },
    {
      id: "batch",
      title: "批量读取 PMID",
      help: "按已知 PMID 获取书目、摘要与标引。",
      fields: [ids],
    },
    {
      id: "history",
      title: "读取历史检索集合",
      help: "使用高级检索返回的 WebEnv 和 query_key 分页读取；NCBI 历史集合会过期。",
      fields: [
        { key: "webenv", label: "WebEnv", required: true },
        { key: "query_key", label: "query_key", required: true },
        size,
      ],
    },
  ],
  europepmc: [
    {
      id: "annotations",
      title: "实体标注与原文上下文",
      help: "查看文本挖掘标注、上下文、来源锚点和外部实体链接。标注不代表论断已核验。",
      fields: [record("记录 ID（例如 MED:42793863 或 PMC:PMC13604973）"), size],
    },
    {
      id: "references",
      title: "参考文献",
      help: "分页读取参考文献，保留未解析记录。",
      fields: [record("来源:记录 ID"), size],
    },
    {
      id: "citations",
      title: "施引论文",
      help: "分页探索引用该论文的工作。",
      fields: [record("来源:记录 ID"), size],
    },
    {
      id: "datalinks",
      title: "关联数据库与研究数据",
      help: "查看数据库、补充材料与数据引用链接，保留来源和关联类型。",
      fields: [record("来源:记录 ID")],
    },
  ],
  semantic_scholar: [
    {
      id: "references",
      title: "分页参考文献与引用图",
      help: "读取论文引用的工作；可继续下一页。",
      fields: [record("paperId（40 位标识）"), size],
    },
    {
      id: "citations",
      title: "分页施引论文与引用图",
      help: "读取引用该论文的工作；可继续下一页。",
      fields: [record("paperId（40 位标识）"), size],
    },
    {
      id: "author_search",
      title: "搜索作者",
      help: "按名称找作者 ID，避免仅凭同名合并身份。",
      fields: [query, size],
    },
    {
      id: "author",
      title: "作者详情",
      help: "查看作者、机构及引用指标。",
      fields: [record("authorId（数字）")],
    },
    {
      id: "author_works",
      title: "作者论文",
      help: "分页读取作者论文。",
      fields: [record("authorId（数字）"), size],
    },
    {
      id: "batch",
      title: "批量读取论文",
      help: "接收 paperId 或服务支持的 DOI:、PMID: 等标识；缺失项单独计数。",
      fields: [ids],
    },
  ],
  elicit: [
    {
      id: "report",
      title: "创建研究报告",
      help: "提交后异步生成报告。此操作可能消耗账户额度，不会自动重试。",
      fields: [query],
      createsTask: true,
      needsKey: true,
    },
    {
      id: "review",
      title: "创建筛选、抽取与综述任务",
      help: "默认包含检索、摘要筛选、全文筛选、字段抽取和报告。可按官方合同定制阶段配置；创建可能消耗额度。",
      fields: [
        query,
        size,
        {
          key: "options",
          label:
            "可选阶段配置（JSON：searches、abstractScreening、fulltextScreening、extraction、generateReport）",
          type: "json",
          value: "{}",
        },
      ],
      createsTask: true,
      needsKey: true,
    },
    {
      id: "agent",
      title: "创建研究 Agent 任务",
      help: "提交研究问题，随后查看事件、状态及产物。创建可能消耗额度。",
      fields: [query],
      createsTask: true,
      needsKey: true,
    },
    {
      id: "sessions",
      title: "任务列表与恢复查找",
      help: "创建请求超时后先检查已有任务，避免重复提交。",
      fields: [size],
      needsKey: true,
    },
    {
      id: "status",
      title: "任务状态、阶段结果与导出",
      help: "报告与综述建议间隔 30–60 秒查询。完成后查看返回的文件与引用清单链接。",
      fields: [taskKind, session],
      needsKey: true,
    },
    {
      id: "events",
      title: "研究 Agent 事件",
      help: "查看活动、问题与证据进度；建议间隔 3–10 秒查询。",
      fields: [{ ...taskKind, options: [["agent", "研究 Agent"]] }, session],
      needsKey: true,
    },
    {
      id: "artifacts",
      title: "研究 Agent 产物",
      help: "查看任务生成的文件与其他产物。",
      fields: [{ ...taskKind, options: [["agent", "研究 Agent"]] }, session],
      needsKey: true,
    },
    {
      id: "sources",
      title: "研究 Agent 引用来源",
      help: "查看会话引用过的来源与摘要，用 sourceRef 对应事件中的引用。",
      fields: [{ ...taskKind, options: [["agent", "研究 Agent"]] }, session],
      needsKey: true,
    },
    {
      id: "artifact_content",
      title: "读取证据表与其他产物内容",
      help: "填写产物列表返回的 artifactId，查看交互式表格、文本与引用内容。",
      fields: [
        { ...taskKind, options: [["agent", "研究 Agent"]] },
        session,
        {
          key: "artifact_id",
          label: "artifactId（从产物列表复制）",
          required: true,
        },
      ],
      needsKey: true,
    },
    {
      id: "artifact_download",
      title: "获取产物下载链接",
      help: "获取短时有效的文件或表格导出链接。它不是永久分享地址。",
      fields: [
        { ...taskKind, options: [["agent", "研究 Agent"]] },
        session,
        {
          key: "artifact_id",
          label: "artifactId（从产物列表复制）",
          required: true,
        },
        {
          key: "format",
          label: "导出格式",
          type: "select",
          options: [
            ["original", "原始文件"],
            ["json", "JSON"],
            ["csv", "CSV 表格"],
            ["xlsx", "Excel 表格"],
            ["md", "Markdown"],
          ],
        },
      ],
      needsKey: true,
    },
    {
      id: "stop",
      title: "停止研究 Agent",
      help: "明确请求停止指定会话；随后查询事件确认停止状态。",
      fields: [{ ...taskKind, options: [["agent", "研究 Agent"]] }, session],
      createsTask: true,
      needsKey: true,
    },
    {
      id: "message",
      title: "向研究 Agent 继续提问",
      help: "在现有会话中提交后续问题，可能使用账户额度。",
      fields: [
        { ...taskKind, options: [["agent", "研究 Agent"]] },
        session,
        query,
      ],
      createsTask: true,
      needsKey: true,
    },
    {
      id: "resume",
      title: "恢复暂停的研究任务",
      help: "先核对额度；按任务状态返回的恢复入口继续，不会创建新会话。",
      fields: [taskKind, session],
      createsTask: true,
      needsKey: true,
    },
  ],
  sciverse: [
    {
      id: "catalog",
      title: "元数据字段目录",
      help: "先读取当前可过滤、排序和投影的字段合同。",
      fields: [],
      needsKey: true,
    },
    {
      id: "metadata",
      title: "通用元数据检索",
      help: "返回元数据，不等同于 Paper Schema 或全文覆盖。过滤字段应先从字段目录确认。",
      fields: [
        query,
        size,
        {
          key: "options",
          label: "可选筛选配置（JSON：filters、fields、sort、collection）",
          type: "json",
          value: "{}",
        },
      ],
      needsKey: true,
    },
    {
      id: "evidence",
      title: "语义证据片段检索",
      help: "按问题返回证据片段与 doc_id；接口不生成最终答案。",
      fields: [
        query,
        size,
        {
          key: "options",
          label: "可选配置（JSON：filters、sub_queries）",
          type: "json",
          value: "{}",
        },
      ],
      needsKey: true,
    },
    {
      id: "content",
      title: "原文上下文读取",
      help: "按检索返回的 doc_id 读取正文；每次 5,000 字符，可继续读取。",
      fields: [
        record("doc_id"),
        { key: "offset", label: "起始字符位置", type: "number", value: "0" },
      ],
      needsKey: true,
    },
    {
      id: "resource",
      title: "图表与附件获取",
      help: "使用原文或接口返回的相对文件路径下载附件，不接受任意 URL。",
      fields: [record("相对 file_name（例如 从原文复制，不填任意 URL）")],
      download: "resource",
      needsKey: true,
    },
  ],
};
