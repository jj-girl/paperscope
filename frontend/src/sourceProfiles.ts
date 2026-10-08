export interface SourceProfile {
  name: string;
  title: string;
  question: string;
  scope: string;
  output: string;
  pending: string[];
  boundary: string;
  extra: string;
  verification: string;
  verified: boolean;
}

// Product roles, not an exhaustive API inventory. Verification is dated, not a live health check.
export const SOURCE_PROFILES: Record<string, SourceProfile> = {
  sciverse: {
    name: "Sciverse",
    title: "结构化阅读与证据回查",
    question: "这篇论文的方法、实验与发现如何关联，依据在哪里？",
    scope:
      "Paper Schema 结构化论文，以及通用元数据、证据片段、正文与资源接口；各接口覆盖不同。",
    output: "原版结构化阅读，加上元数据检索、语义证据、正文分段和附件下载。",
    pending: [],
    boundary:
      "Schema 覆盖、全文覆盖与元数据覆盖不同；阅读顺序是应用生成的组织结果。",
    extra:
      "跨论文实体对齐、实验条件比较和证据是否支持结论，仍需额外处理与核验。",
    verification:
      "原版检索→图谱→AI 导读已实测；段落与实体来源回查成功。资源下载仍按具体文件可用性处理。",
    verified: true,
  },
  pubmed: {
    name: "PubMed",
    title: "医学文献检索与筛选",
    question: "围绕这个医学问题，应纳入哪些候选文献？",
    scope: "生物医学书目、摘要、文献类型及已提供的 MeSH 标引。",
    output: "书目与标引、高级筛选、关联记录、历史集合与 PMID 批量读取。",
    pending: [],
    boundary: "PubMed 记录不直接包含期刊全文；并非每条记录都有摘要或 MeSH。",
    extra:
      "共享 AI 可规划检索、导读与比较，但不会把摘要分析当作全文核验；实体抽取仍需另行实现。",
    verification:
      "检索、筛选、历史集合、关联与批量读取已有真实样例（2026-10-08）。",
    verified: true,
  },
  europepmc: {
    name: "Europe PMC",
    title: "生命科学全文与实体阅读",
    question: "能否读到正文，并进一步关联其中的生物医学实体？",
    scope: "生命科学文献和预印本；全文与文本挖掘标注的可用性按记录而异。",
    output: "开放正文、实体标注及上下文、引用列表、数据库与数据链接。",
    pending: [],
    boundary:
      "可检索不等于可读取全文；正文和实体标注也不等于已核验的论断证据。",
    extra: "实体与段落对齐、论断核验、方法与实验关系抽取需要额外处理。",
    verification:
      "正文、标注、参考文献和数据库链接已有真实样例（2026-10-08）。",
    verified: true,
  },
  openalex: {
    name: "OpenAlex",
    title: "领域、作者与机构概览",
    question: "这个领域有哪些主题、研究者和机构，文献如何分布？",
    scope: "跨学科论文、作者、机构、主题与引用关系；部分记录有可获取全文。",
    output:
      "样本概览、完整查询聚合、作者与机构详情及论文、双向引用图、PDF 与 TEI XML 获取。",
    pending: [],
    boundary:
      "样本图表与完整查询聚合分开显示；聚合分组本身仍需分页。Content 下载需要 API Key。",
    extra: "趋势解释、版本去重、实验比较与科研论断核验需要额外分析。",
    verification: "聚合、作者机构、引用及 PDF / TEI 文件获取均有真实样例；正文展示与 AI 入口已验证。",
    verified: true,
  },
  semantic_scholar: {
    name: "Semantic Scholar",
    title: "引用与相关工作探索",
    question: "读完这篇论文，应追溯哪些工作，继续读哪些相关论文？",
    scope: "跨学科论文、作者、引用和相关推荐；摘要与全文链接可能缺失。",
    output: "参考文献、施引和推荐；作者探索、分页、批量读取与有方向的引用图。",
    pending: [],
    boundary: "推荐表示相关性，不表示引用；全文链接不等于已读取或核验正文。",
    extra: "共享 AI 提供阅读与比较建议；论文内部实体图和论断核验仍需额外处理。",
    verification:
      "已增加限速、有限重试与缓存；最近匿名实测尝试 3 次仍返回 429，成功数据路径仍受上游限制。",
    verified: false,
  },
  elicit: {
    name: "Elicit",
    title: "筛选、抽取与综述流程",
    question: "能否按研究问题和标准，组织筛选、抽取与报告任务？",
    scope: "论文搜索，以及账户权限范围内的研究会话与异步工作流。",
    output:
      "搜索记录，以及筛选、抽取、报告与研究 Agent 任务的提交、状态、结果和导出入口。",
    pending: [],
    boundary:
      "创建任务会使用账户额度；任务接受不代表完成，导出可能晚于任务结束。",
    extra: "已提供阶段配置与任务结果查看；筛选、抽取和报告仍需人工审阅。",
    verification: "搜索与任务已通过合同测试；真实调用待 API 权限和密钥配置。",
    verified: false,
  },
};
