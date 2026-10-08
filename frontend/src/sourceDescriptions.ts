export type UpstreamSource = {
  name: string;
  explanation: string;
  contribution: string;
  url: string;
};
export type SourceDescription = {
  upstreamSummary: string;
  upstream: UpstreamSource[];
  upstreamLimit: string;
  scope: string;
  granularity: string;
  fulltext: string;
  implementation: string;
};
const pubmed = "https://pubmed.ncbi.nlm.nih.gov/about/";
const europe = "https://europepmc.org/help";
const works = "https://help.openalex.org/data/works/";
const semantic = "https://webflow.semanticscholar.org/about/librarians";
const elicit = "https://elicit.com/solutions/research-agent";
export const SOURCE_DESCRIPTIONS: Record<string, SourceDescription> = {
  sciverse: {
    upstreamSummary:
      "已用官方 API 核实：sources 来源对象使用 OpenAlex 标识与查询链接；抽样 RSI 论文的原文位置指向 arXiv。完整上游采集名单和各源收录比例仍未确认。",
    upstream: [
      {
        name: "OpenAlex 关联的来源对象（API 已验证）",
        explanation:
          "GET /meta-catalog?collection=sources 明确把 id 定义为 OpenAlex 来源 ID；实际记录还返回 ids.openalex 和 works_api_url。",
        contribution:
          "可以确认期刊/仓储等来源元数据与 OpenAlex 对齐；不能仅凭这些字段断言全部论文、全文都由 OpenAlex 提供。",
        url: "https://sciverse.opendatalab.com/docs/sciverse/api/meta-catalog",
      },
      {
        name: "arXiv 原文位置（论文样本已验证）",
        explanation:
          "Bounded Recursive Self-Improvement 的 locations、access_oa_url 和发表载体都指向 arXiv。",
        contribution:
          "确认这篇论文的可访问原文位置；另有 arXiv (Cornell University) 来源记录。这不是全库上游数据库名单。",
        url: "https://sciverse.opendatalab.com/docs/sciverse/api/meta-search",
      },
      {
        name: "其他上游数据库 / 出版方（完整名单未核实）",
        explanation:
          "当前账户可见的目录分别有 65 个论文字段、45 个来源字段、34 个作者字段；未见定义为完整采集来源清单的字段。",
        contribution:
          "sources 在这里指期刊、会议或仓储等发表载体；不能把它或样本域名列表直接当作数据采集供应商清单。",
        url: "https://sciverse.opendatalab.com/docs/sciverse/api/meta-catalog",
      },
    ],
    upstreamLimit:
      "上述为 2026-10-08 的实际 API 返回所支持的结论。未提供完整采集链路、上游名单、占比或完整性保证；来源对象的 works_count / oa_works_count 也不能直接视为 Sciverse 实际持有全文的篇数。详细请求和响应摘录见 SCIVERSE_SOURCE_AUDIT.md。",
    scope:
      "通用元数据用于跨学科文献与图书记录查询；正文接口只覆盖其持有可获取文本的记录；Paper Schema 是完成结构化处理的另一子集，官方能力 API 当前报告以 AI 会议论文为主。官网列有专利规模，不等于本应用已经接入专利专用检索接口。",
    granularity:
      "元数据是一篇文献的题名、作者、年份等；正文检索返回命中的文本片段；content 按位置读取文本；Paper Schema 返回论文内的概念、方法、关系、证据及定位信息。实体和材料包属于抽取后的结构，原文需通过出处接口另外取回。",
    fulltext:
      "官网显示 3071 万篇 AI-Ready 全文；GET /paper-schema 另报告 100 万+结构化论文，两者不是同一口径。全库 OA 精确总量未确认，不能用 OA 查询返回的 10,000 当作总量。含 doc_id 的记录才有正文读取依据；出处接口返回有限段落，并不一次交付整篇论文。未计算官网不同口径之间的全文覆盖率。",
    implementation:
      "已接入元数据、证据片段、正文分段读取、资源文件、Schema 实体关系与出处。页面标明元数据、抽取结构和原文段落的区别；不需要应用侧 LLM。",
  },
  pubmed: {
    upstreamSummary:
      "主要由 MEDLINE 的期刊书目、PubMed Central（PMC）文章的书目，以及 NCBI Bookshelf 的书籍和章节引用组成。",
    upstream: [
      {
        name: "MEDLINE",
        explanation:
          "美国国家医学图书馆整理的生物医学期刊书目库，是 PubMed 的最大组成部分。",
        contribution:
          "期刊文章的题名、作者、摘要及 MeSH 主题标引等；不是期刊正文库。",
        url: pubmed,
      },
      {
        name: "PubMed Central（PMC）",
        explanation: "保存生物医学与生命科学文章全文的档案库。",
        contribution:
          "相关论文的书目被纳入 PubMed；正文仍在 PMC，不能把 PubMed EFetch 的书目 XML 当作全文。",
        url: pubmed,
      },
      {
        name: "NCBI Bookshelf",
        explanation: "存放生命科学、医学和健康相关图书、报告等的全文平台。",
        contribution:
          "向 PubMed 提供图书及部分章节的引用记录，不是把整本书正文放入普通 PubMed 检索响应。",
        url: pubmed,
      },
    ],
    upstreamLimit:
      "PubMed 不等于 MEDLINE，也不等于 PMC。不是所有 PubMed 记录都完成 MeSH 标引，也不是每条记录都有摘要或全文入口。",
    scope:
      "以生物医学、健康和生命科学为主，并覆盖相关行为科学、化学与生物工程文献；包含期刊论文、综述及部分图书/章节引用。本应用的记录解析主要面向期刊文章。",
    granularity:
      "搜索先返回 PMID 编号及命中数量，再按编号获取题名、作者、摘要、发表类型和主题词。ELink 给出相似论文、引用或 PMC 等关联编号。历史检索集合保存的是一组记录的查询状态，不是论文内容。",
    fulltext:
      "本次有 41,256,727 条书目，其中 14,875,462 条匹配免费全文入口条件，约占 36.1%。这是可跳转免费原文的比例，不是严格 OA 授权比例。当前 db=pubmed 的 EFetch 不直接返回期刊文章正文；有 PMCID 时，本应用提供外部 PMC 链接。",
    implementation:
      "已接入检索、筛选、摘要与标引、关联记录、批量读取和历史集合。当前 PubMed 工作区只显示记录和外部原文入口；相同论文可另用 Europe PMC 的 PMCID 正文接口读取。",
  },
  europepmc: {
    upstreamSummary:
      "汇集 PubMed 摘要、大部分 PMC 全文，以及预印本、Agricola 农业书目、部分欧洲专利和临床指南。与 PubMed/PMC 大量重叠。",
    upstream: [
      {
        name: "PubMed 与 PMC",
        explanation: "PubMed 提供生命科学书目与摘要；PMC 是文章全文档案库。",
        contribution:
          "Europe PMC 包含 PubMed 摘要及绝大多数 PMC 内容；受参与协议等影响，不能直接等同于完整 PMC。",
        url: europe,
      },
      {
        name: "预印本平台",
        explanation:
          "例如 bioRxiv、medRxiv、Research Square、ChemRxiv，发布正式发表前的研究稿件。",
        contribution:
          "生命科学预印本及版本信息；被索引不代表每篇均有 Europe PMC 可下载正文或已通过同行评审。",
        url: europe,
      },
      {
        name: "Agricola",
        explanation: "美国国家农业图书馆及合作者建设的农业文献书目库。",
        contribution: "补充农业及相关生命科学的文献记录。",
        url: europe,
      },
      {
        name: "欧洲专利局（EPO）与 NICE 等指南来源",
        explanation: "EPO 提供专利资料；NICE 是英国的健康与医疗指导机构。",
        contribution:
          "补充部分专利摘要、指南等非期刊内容；不代表服务提供所有专利/指南全文。",
        url: "https://europepmc.org/RestfulWebService",
      },
    ],
    upstreamLimit:
      "生命科学预印本来源和可获取正文范围是有条件的。不同来源的 ID、文献类型和引用解析覆盖不同，不能把总记录数全部称为期刊论文数。",
    scope:
      "生命科学文献及相关预印本、专利、指南、农业记录。记录来源用 MED、PMC、PPR、AGR 等代码区分；文献可能有 PMID、PMCID、DOI 等不同标识。",
    granularity:
      "搜索返回文章记录、摘要与全文状态；全文接口返回 XML 文件，可展示章节和正文段落；注释接口返回原文中的词语、类型、位置与数据库链接；引用及数据链接接口返回文章之间或文章与外部资源之间的关联。",
    fulltext:
      "本次索引 49,008,535 条记录，12,409,642 条标记有库内全文，约占 25.3%；8,316,655 条有 OA 标记，约占 17.0%。fullTextXML 面向其开放全文子集，库内全文总数和 OA 标记数都不能当作已验证的 XML 下载成功数。当前应用按 PMCID 和 OA 标记提供读取入口，成功后才显示正文。",
    implementation:
      "已接入检索、开放 XML 正文与原始文件下载、实体注释、参考文献、施引和外部数据链接。正文段落预览不完整复现图片、表格和排版；原始 XML 单独保留下载入口。",
  },
  openalex: {
    upstreamSummary:
      "继承 Microsoft Academic Graph 的历史数据，并持续整合 Crossref、DataCite、PubMed、HAL 和其他开放仓储中的学术记录。",
    upstream: [
      {
        name: "Microsoft Academic Graph（MAG）",
        explanation:
          "微软原来的论文、作者、机构和引用关系数据库，已于 2021 年停止更新。",
        contribution:
          "其最终开放数据是 OpenAlex 初始目录的重要基础，不是仍在实时更新的上游。",
        url: works,
      },
      {
        name: "Crossref",
        explanation:
          "学术出版物的 DOI 注册与元数据服务，记录题名、作者、年份和参考文献等。",
        contribution: "持续提供出版物书目及标识信息，通常不直接交付论文全文。",
        url: works,
      },
      {
        name: "DataCite 与 PubMed",
        explanation:
          "DataCite 为数据集等科研产出提供 DOI 和描述；PubMed 提供生物医学书目。",
        contribution:
          "补充不同类型、不同学科的学术记录；来源包含数据集，不全是期刊文章。",
        url: works,
      },
      {
        name: "HAL、机构与学科仓储",
        explanation:
          "HAL 是法国跨学科开放存储平台；机构/学科仓储保存大学或特定领域的论文、报告、学位论文、数据等。",
        contribution:
          "补充文献版本、存放位置和开放全文入口；相同作品的多个版本会尝试关联为一条作品记录。",
        url: "https://help.openalex.org/data/sources/repositories/",
      },
    ],
    upstreamLimit:
      "OpenAlex 整合的是这些来源的记录，PaperScope 不会分别向每个上游发请求。来源之间重叠，元数据匹配和版本归并也可能有误差。",
    scope:
      "跨学科，记录类型包括期刊文章、会议论文、预印本、图书/章节、学位论文和数据集。当前查询默认主要记录集合（core，经过整理匹配，并非“核心期刊”）；另有主要由数据集和仓储记录组成、字段通常较少的扩展集合（expansion）。服务支持 corpus=all 合并查询，本应用尚未接入范围切换。",
    granularity:
      "按作品返回题名、作者、摘要重建文本、主题、机构和引用；也可独立读取作者或机构档案。group_by 返回整个查询集合的分组计数，内容接口则另行返回部分作品的 PDF 或 TEI XML 文件。",
    fulltext:
      "本次默认集合有 331,133,838 条作品；130,063,375 条标记 OA，约占 39.3%；55,345,545 条标记有 PDF，约占 16.7%；52,966,359 条标记有 TEI XML，约占 16.0%。PDF 与 XML 集合有重叠，不能相加。下载需 Key；has_content 标记不等于本次下载已成功，外部 OA 地址也不代表 Content API 有文件。",
    implementation:
      "已接入作品搜索、作者机构、引用、完整查询聚合和 PDF/TEI 获取。每篇结果按文件标记显示按钮，取回文件后才提供预览和保存；TEI 为解析文本，不保证复现 PDF 的全部版式。",
  },
  semantic_scholar: {
    upstreamSummary:
      "通过网页索引及出版商/数据提供者合作收集论文。官方列举 PubMed、arXiv、Springer Nature、Taylor & Francis、SAGE、Wiley、ACM、IEEE 和 Unpaywall 等。",
    upstream: [
      {
        name: "PubMed 与 arXiv",
        explanation:
          "PubMed 是生物医学书目库；arXiv 是物理、数学、计算机等领域的预印本平台。",
        contribution: "提供不同学科、不同出版状态的论文记录与链接。",
        url: semantic,
      },
      {
        name: "出版商和学协会",
        explanation:
          "官方列举 Springer Nature、Taylor & Francis、SAGE、Wiley，以及计算机/工程领域的 ACM、IEEE 等。",
        contribution:
          "通过合作或公开网页提供出版信息、摘要、引用及可提供的内容；合作并不意味着其全部全文都能从 Graph API 取得。",
        url: semantic,
      },
      {
        name: "Unpaywall 与网页索引",
        explanation:
          "Unpaywall 用于发现合法开放版本的位置；网页索引从公开出版页面收集信息。",
        contribution:
          "补充开放全文地址和可发现记录。链接是位置线索，不是 API 返回的整篇正文。",
        url: "https://webflow.semanticscholar.org/faq/paper-sources",
      },
    ],
    upstreamLimit:
      "官方公开的是来源例子和合作机制，不能据此推断每家出版社被完整收录。Graph、推荐和可下载数据集是不同服务；本应用未接入 S2ORC 全文数据集。",
    scope:
      "跨学科的论文发现与引用图谱，包含出版论文及预印本等。官方说明当前主要关注英文出版物；不同学科、语言、年份和来源的字段覆盖不均匀。",
    granularity:
      "Graph API 返回论文、作者、摘要、参考文献和施引关系；推荐 API 返回与种子论文相关的论文；部分记录有 openAccessPdf 链接。引用边与推荐关系含义不同，链接和摘要不能代替正文。",
    fulltext:
      "官方概览页显示 2.14 亿论文记录，但这不是全文数。本次匿名 API 返回 429，未核实 OA 或正文可获取总量。当前接入的 Graph/推荐接口主要返回元数据和可能存在的外部 PDF 地址，没有通用的整篇正文返回；Datasets/S2ORC 属于单独的获取路线。",
    implementation:
      "已接入搜索、批量、作者、引用与推荐，并处理匿名限流。结果可跳转外部 PDF，但不会标记为本页已读取正文；未把匿名限流转换成空结果。",
  },
  elicit: {
    upstreamSummary:
      "官方研究 Agent 产品页列举 OpenAlex、PubMed、Semantic Scholar、ASCO 和 Springer 等来源；论文 API 提供 Elicit 集合或 PubMed 限定集合，临床试验使用另一个接口。",
    upstream: [
      {
        name: "OpenAlex、PubMed、Semantic Scholar",
        explanation:
          "分别是跨学科学术目录、生物医学书目库、论文发现与引用图谱。",
        contribution:
          "官方产品页将它们列为可搜索论文来源；公开说明未给出逐源收录量、完整性或占比。",
        url: elicit,
      },
      {
        name: "ASCO 与 Springer",
        explanation: "ASCO 是美国临床肿瘤学会；Springer 是学术出版品牌。",
        contribution:
          "官方列举的专业/出版内容来源；不据此推断 API 可取得所有会议内容或订阅全文。",
        url: elicit,
      },
      {
        name: "ClinicalTrials.gov",
        explanation: "临床研究注册与结果信息平台，记录的是试验而不是普通论文。",
        contribution:
          "服务有独立试验搜索；本应用当前未接入该接口，不混入论文库规模。",
        url: elicit,
      },
      {
        name: "用户文件与机构订阅",
        explanation: "服务产品可支持上传文件和利用自身订阅权限。",
        contribution:
          "属于用户提供或获授权的材料，不计作人人都可通过公共论文搜索 API 获取的全文。",
        url: elicit,
      },
    ],
    upstreamLimit:
      "产品页的来源列表与某个 API 端点的返回范围不能画等号。API 文档明确区分 corpus=elicit/pubmed，本应用快速搜索使用默认 elicit；未核实底层逐篇采集链路。",
    scope:
      "跨学科论文搜索及筛选、抽取、报告、研究 Agent 工作流。官方论文索引为 1.38 亿+，临床试验另计；需要相应付费 API 权限。当前没有完成真实付费任务验收。",
    granularity:
      "论文搜索返回题名、作者、摘要等记录；创建研究任务返回 sessionId，之后读取进度、引用来源、抽取表、报告或文件。任务可能处理全文，但返回的筛选结果或报告不是原始论文正文。",
    fulltext:
      "未核实统一的 OA/原始全文篇数或覆盖率。搜索可能给出全文链接；服务工作流能利用其可访问材料，但这不意味着所有检索命中都有可下载原文。本应用没有接入通用逐篇论文正文读取，任务产物下载也不能当作原始论文全文下载。",
    implementation:
      "已接入论文搜索以及报告、综述、Agent 的创建、状态、事件、来源和产物管理；默认纯数据模式不启动生成任务。服务端 AI 不要求另填模型 Key，但需要 Elicit 权限；本应用的可选共享 AI 是另一条独立流程。",
  },
};
