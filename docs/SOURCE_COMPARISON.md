# 文献服务：上游来源、范围、粒度、API 输入输出与全文覆盖

官方资料核对日期：2026-10-08。数量沿用同日记录的官方平台/API 快照，详见 [数量核验与 curl 请求](COUNT_AUDIT.md)。

本文区分供应商整体能力、单个 API 的响应和 PaperScope 已接入的功能。上游来源指数据从哪里来；数据库范围指能检索哪些类型和学科；粒度指返回记录、段落、实体还是文件；全文覆盖指哪些记录实际具有可获取正文。相同文献可能出现在多个服务中，不能把服务数当作独立证据数。

## 上游来源总表

| 服务 | 已核实的来源说明 | 确认边界 |
| --- | --- | --- |
| Sciverse | 已用官方 API 核实：sources 来源对象使用 OpenAlex 标识与查询链接；抽样 RSI 论文的原文位置指向 arXiv。完整上游采集名单和各源收录比例仍未确认。 [官方依据 1](https://sciverse.opendatalab.com/docs/sciverse/api/meta-catalog) · [官方依据 2](https://sciverse.opendatalab.com/docs/sciverse/api/meta-search) | 上述为 2026-10-08 的实际 API 返回所支持的结论。未提供完整采集链路、上游名单、占比或完整性保证；来源对象的 works_count / oa_works_count 也不能直接视为 Sciverse 实际持有全文的篇数。详细请求和响应摘录见 SCIVERSE_SOURCE_AUDIT.md。 |
| PubMed | 主要由 MEDLINE 的期刊书目、PubMed Central（PMC）文章的书目，以及 NCBI Bookshelf 的书籍和章节引用组成。 [官方依据 1](https://pubmed.ncbi.nlm.nih.gov/about/) | PubMed 不等于 MEDLINE，也不等于 PMC。不是所有 PubMed 记录都完成 MeSH 标引，也不是每条记录都有摘要或全文入口。 |
| Europe PMC | 汇集 PubMed 摘要、大部分 PMC 全文，以及预印本、Agricola 农业书目、部分欧洲专利和临床指南。与 PubMed/PMC 大量重叠。 [官方依据 1](https://europepmc.org/help) · [官方依据 2](https://europepmc.org/RestfulWebService) | 生命科学预印本来源和可获取正文范围是有条件的。不同来源的 ID、文献类型和引用解析覆盖不同，不能把总记录数全部称为期刊论文数。 |
| OpenAlex | 继承 Microsoft Academic Graph 的历史数据，并持续整合 Crossref、DataCite、PubMed、HAL 和其他开放仓储中的学术记录。 [官方依据 1](https://help.openalex.org/data/works/) · [官方依据 2](https://help.openalex.org/data/sources/repositories/) | OpenAlex 整合的是这些来源的记录，PaperScope 不会分别向每个上游发请求。来源之间重叠，元数据匹配和版本归并也可能有误差。 |
| Semantic Scholar | 通过网页索引及出版商/数据提供者合作收集论文。官方列举 PubMed、arXiv、Springer Nature、Taylor & Francis、SAGE、Wiley、ACM、IEEE 和 Unpaywall 等。 [官方依据 1](https://webflow.semanticscholar.org/about/librarians) · [官方依据 2](https://webflow.semanticscholar.org/faq/paper-sources) | 官方公开的是来源例子和合作机制，不能据此推断每家出版社被完整收录。Graph、推荐和可下载数据集是不同服务；本应用未接入 S2ORC 全文数据集。 |
| Elicit | 官方研究 Agent 产品页列举 OpenAlex、PubMed、Semantic Scholar、ASCO 和 Springer 等来源；论文 API 提供 Elicit 集合或 PubMed 限定集合，临床试验使用另一个接口。 [官方依据 1](https://elicit.com/solutions/research-agent) | 产品页的来源列表与某个 API 端点的返回范围不能画等号。API 文档明确区分 corpus=elicit/pubmed，本应用快速搜索使用默认 elicit；未核实底层逐篇采集链路。 |

## 数据库范围与数据粒度

| 服务 | 数据库范围 | 数据粒度：具体拿到什么 |
| --- | --- | --- |
| Sciverse | 通用元数据用于跨学科文献与图书记录查询；正文接口只覆盖其持有可获取文本的记录；Paper Schema 是完成结构化处理的另一子集，官方能力 API 当前报告以 AI 会议论文为主。官网列有专利规模，不等于本应用已经接入专利专用检索接口。 | 元数据是一篇文献的题名、作者、年份等；正文检索返回命中的文本片段；content 按位置读取文本；Paper Schema 返回论文内的概念、方法、关系、证据及定位信息。实体和材料包属于抽取后的结构，原文需通过出处接口另外取回。 |
| PubMed | 以生物医学、健康和生命科学为主，并覆盖相关行为科学、化学与生物工程文献；包含期刊论文、综述及部分图书/章节引用。本应用的记录解析主要面向期刊文章。 | 搜索先返回 PMID 编号及命中数量，再按编号获取题名、作者、摘要、发表类型和主题词。ELink 给出相似论文、引用或 PMC 等关联编号。历史检索集合保存的是一组记录的查询状态，不是论文内容。 |
| Europe PMC | 生命科学文献及相关预印本、专利、指南、农业记录。记录来源用 MED、PMC、PPR、AGR 等代码区分；文献可能有 PMID、PMCID、DOI 等不同标识。 | 搜索返回文章记录、摘要与全文状态；全文接口返回 XML 文件，可展示章节和正文段落；注释接口返回原文中的词语、类型、位置与数据库链接；引用及数据链接接口返回文章之间或文章与外部资源之间的关联。 |
| OpenAlex | 跨学科，记录类型包括期刊文章、会议论文、预印本、图书/章节、学位论文和数据集。当前查询默认主要记录集合（core，经过整理匹配，并非“核心期刊”）；另有主要由数据集和仓储记录组成、字段通常较少的扩展集合（expansion）。服务支持 corpus=all 合并查询，本应用尚未接入范围切换。 | 按作品返回题名、作者、摘要重建文本、主题、机构和引用；也可独立读取作者或机构档案。group_by 返回整个查询集合的分组计数，内容接口则另行返回部分作品的 PDF 或 TEI XML 文件。 |
| Semantic Scholar | 跨学科的论文发现与引用图谱，包含出版论文及预印本等。官方说明当前主要关注英文出版物；不同学科、语言、年份和来源的字段覆盖不均匀。 | Graph API 返回论文、作者、摘要、参考文献和施引关系；推荐 API 返回与种子论文相关的论文；部分记录有 openAccessPdf 链接。引用边与推荐关系含义不同，链接和摘要不能代替正文。 |
| Elicit | 跨学科论文搜索及筛选、抽取、报告、研究 Agent 工作流。官方论文索引为 1.38 亿+，临床试验另计；需要相应付费 API 权限。当前没有完成真实付费任务验收。 | 论文搜索返回题名、作者、摘要等记录；创建研究任务返回 sessionId，之后读取进度、引用来源、抽取表、报告或文件。任务可能处理全文，但返回的筛选结果或报告不是原始论文正文。 |

## 全文覆盖度与本应用接入范围

比例仅对同一次 API 查询、同一默认记录集合计算；有全文标记不是下载成功率。Sciverse 官网不同口径之间未计算比例。PubMed 免费全文入口比例不写作严格 OA 比例。

| 服务 | 全文覆盖度 | PaperScope 当前行为 |
| --- | --- | --- |
| Sciverse | 官网显示 3071 万篇 AI-Ready 全文；GET /paper-schema 另报告 100 万+结构化论文，两者不是同一口径。全库 OA 精确总量未确认，不能用 OA 查询返回的 10,000 当作总量。含 doc_id 的记录才有正文读取依据；出处接口返回有限段落，并不一次交付整篇论文。未计算官网不同口径之间的全文覆盖率。 | 已接入元数据、证据片段、正文分段读取、资源文件、Schema 实体关系与出处。页面标明元数据、抽取结构和原文段落的区别；不需要应用侧 LLM。 |
| PubMed | 本次有 41,256,727 条书目，其中 14,875,462 条匹配免费全文入口条件，约占 36.1%。这是可跳转免费原文的比例，不是严格 OA 授权比例。当前 db=pubmed 的 EFetch 不直接返回期刊文章正文；有 PMCID 时，本应用提供外部 PMC 链接。 | 已接入检索、筛选、摘要与标引、关联记录、批量读取和历史集合。当前 PubMed 工作区只显示记录和外部原文入口；相同论文可另用 Europe PMC 的 PMCID 正文接口读取。 |
| Europe PMC | 本次索引 49,008,535 条记录，12,409,642 条标记有库内全文，约占 25.3%；8,316,655 条有 OA 标记，约占 17.0%。fullTextXML 面向其开放全文子集，库内全文总数和 OA 标记数都不能当作已验证的 XML 下载成功数。当前应用按 PMCID 和 OA 标记提供读取入口，成功后才显示正文。 | 已接入检索、开放 XML 正文与原始文件下载、实体注释、参考文献、施引和外部数据链接。正文段落预览不完整复现图片、表格和排版；原始 XML 单独保留下载入口。 |
| OpenAlex | 本次默认集合有 331,133,838 条作品；130,063,375 条标记 OA，约占 39.3%；55,345,545 条标记有 PDF，约占 16.7%；52,966,359 条标记有 TEI XML，约占 16.0%。PDF 与 XML 集合有重叠，不能相加。下载需 Key；has_content 标记不等于本次下载已成功，外部 OA 地址也不代表 Content API 有文件。 | 已接入作品搜索、作者机构、引用、完整查询聚合和 PDF/TEI 获取。每篇结果按文件标记显示按钮，取回文件后才提供预览和保存；TEI 为解析文本，不保证复现 PDF 的全部版式。 |
| Semantic Scholar | 官方概览页显示 2.14 亿论文记录，但这不是全文数。本次匿名 API 返回 429，未核实 OA 或正文可获取总量。当前接入的 Graph/推荐接口主要返回元数据和可能存在的外部 PDF 地址，没有通用的整篇正文返回；Datasets/S2ORC 属于单独的获取路线。 | 已接入搜索、批量、作者、引用与推荐，并处理匿名限流。结果可跳转外部 PDF，但不会标记为本页已读取正文；未把匿名限流转换成空结果。 |
| Elicit | 未核实统一的 OA/原始全文篇数或覆盖率。搜索可能给出全文链接；服务工作流能利用其可访问材料，但这不意味着所有检索命中都有可下载原文。本应用没有接入通用逐篇论文正文读取，任务产物下载也不能当作原始论文全文下载。 | 已接入论文搜索以及报告、综述、Agent 的创建、状态、事件、来源和产物管理；默认纯数据模式不启动生成任务。服务端 AI 不要求另填模型 Key，但需要 Elicit 权限；本应用的可选共享 AI 是另一条独立流程。 |

## Sciverse：来源明细与 API 输入输出

| 上游名称 | 是什么 | 提供什么 | 官方依据 |
| --- | --- | --- | --- |
| OpenAlex 关联的来源对象（API 已验证） | GET /meta-catalog?collection=sources 明确把 id 定义为 OpenAlex 来源 ID；实际记录还返回 ids.openalex 和 works_api_url。 | 可以确认期刊/仓储等来源元数据与 OpenAlex 对齐；不能仅凭这些字段断言全部论文、全文都由 OpenAlex 提供。 | [说明](https://sciverse.opendatalab.com/docs/sciverse/api/meta-catalog) |
| arXiv 原文位置（论文样本已验证） | Bounded Recursive Self-Improvement 的 locations、access_oa_url 和发表载体都指向 arXiv。 | 确认这篇论文的可访问原文位置；另有 arXiv (Cornell University) 来源记录。这不是全库上游数据库名单。 | [说明](https://sciverse.opendatalab.com/docs/sciverse/api/meta-search) |
| 其他上游数据库 / 出版方（完整名单未核实） | 当前账户可见的目录分别有 65 个论文字段、45 个来源字段、34 个作者字段；未见定义为完整采集来源清单的字段。 | sources 在这里指期刊、会议或仓储等发表载体；不能把它或样本域名列表直接当作数据采集供应商清单。 | [说明](https://sciverse.opendatalab.com/docs/sciverse/api/meta-catalog) |

上述为 2026-10-08 的实际 API 返回所支持的结论。未提供完整采集链路、上游名单、占比或完整性保证；来源对象的 works_count / oa_works_count 也不能直接视为 Sciverse 实际持有全文的篇数。详细请求和响应摘录见 SCIVERSE_SOURCE_AUDIT.md。

下表为当前应用接入的 API 操作，非供应商所有接口的穷举。参数示例见 [RSI 功能示例](RSI_EXAMPLES.md)。

| 功能及原生 API | 输入：提交什么 | 输出：返回什么 |
| --- | --- | --- |
| 通用元数据检索<br>`POST /meta-search` | query 或 filters；collection、fields、sort、page/cursor | results 元数据、unique_id；有全文时可能有 doc_id；返回单位：元数据记录 |
| 元数据字段目录<br>`GET /meta-catalog` | collection: papers/authors/sources | 字段类型、过滤/排序/投影能力；返回单位：字段定义 |
| 语义证据片段检索<br>`POST /agentic-search` | 自然语言 query、top_k、可选 filters | hits: chunk、doc_id、offset、页码及元数据；返回单位：文本片段 |
| 原文上下文读取<br>`GET /content` | doc_id、offset、limit（字符） | text、next_offset、more；不是 Schema 对象；返回单位：正文片段 |
| 图表与附件获取<br>`GET /resource` | 原文返回的安全相对 file_name | 图像/PDF 等二进制文件；返回单位：文件 |
| 元数据论文引用与相关关系<br>`POST /meta-paper-relations` | unique_id、relation、page/page_size | 库内引用/被引/相关工作记录与计数；返回单位：论文关联 |
| 结构化数据定义与分类<br>`GET /paper-schema` | 数据 Token，无检索参数 | 接口版本、资源、分类与限额；返回单位：能力说明 |
| 检索结构化论文<br>`POST /paper-schema/search` | query 或 filters、size/cursor | 论文 items[]、schema_id、贡献/问题等抽取字段；返回单位：结构化论文 |
| 跨论文检索实体<br>`POST /paper-schema/entities/search` | query 或 schema_ids 范围；分类 filters | Entity items[]、entity_id、provenance；返回单位：实体 |
| 从实体线索找论文<br>`POST /paper-schema/entities/related-papers` | 实体名称 query、类型约束、size/cursor | 候选论文与 matched_entities、match_reasons；返回单位：相关论文 |
| 已知论文的相关工作<br>`POST /paper-schema/schemas/{schema_id}/related-papers` | schema_id、signals、size | 相关论文、分项信号和原因；不是事实引用边；返回单位：相关论文 |
| 读取论文实体列表<br>`GET /paper-schema/schemas/{schema_id}/entities` | schema_id、类型/章节、size/cursor | 逐页 Entity 完整对象集合；返回单位：实体 |
| 读取一个实体<br>`GET /paper-schema/schemas/{schema_id}/entities/{entity_id}` | schema_id、entity_id；可附关联关系 | entity、可选 relations 与截断标记；返回单位：实体详情 |
| 查询论文内部关系<br>`POST /paper-schema/relations/search` | 限定论文/实体/关系类型的 filters | 文内 Relation、端点与 provenance；返回单位：文内关系 |
| 读取一条内部关系<br>`GET /paper-schema/schemas/{schema_id}/relations/{relation_id}` | schema_id、relation_id | 关系、端点对象、出处；返回单位：关系详情 |
| 引用数量与解析覆盖<br>`GET /paper-schema/schemas/{schema_id}/citation-summary` | schema_id | 总参考数、解析覆盖、入/出边计数；返回单位：引用统计 |
| 读取参考文献记录<br>`GET /paper-schema/schemas/{schema_id}/citations` | schema_id、size/cursor | 完整引用记录，保留未解析项；返回单位：参考文献 |
| 读取论文引用图数据<br>`GET /paper-schema/schemas/{schema_id}/citation-graph` | schema_id、方向、深度和节点/边限额 | 已解析论文节点与引用边；可能截断；返回单位：引用图数据 |
| 检索结构化证据<br>`POST /paper-schema/evidence/search` | groups 与论文/关键词等约束；size/cursor | Evidence 值、source_entity_id 和出处；返回单位：结构化证据 |
| 读取一条证据<br>`GET /paper-schema/schemas/{schema_id}/evidence/{evidence_id}` | schema_id、evidence_id | 单条证据值、来源对象、出处；返回单位：证据详情 |
| 按 marker 回查段落<br>`POST /paper-schema/resolve-provenance` | schema_id + marker_nums；window/max_segments | segments 原文段落、定位、缺失项；返回单位：段落 |
| 按 paragraph_id 回查段落<br>`POST /paper-schema/resolve-provenance` | paragraph_ids；与 marker 模式互斥 | segments 原文段落及上下文；返回单位：段落 |
| 单篇论文内检索<br>`POST /paper-schema/search-in-schema` | schema_id、query、top_k/window | 单篇文本命中与位置；不是出处判定；返回单位：段落检索 |
| 批量补全出处上下文<br>`POST /paper-schema/hydrate-items` | 最多 50 个含 schema_id 和定位信息的 items | 逐项来源段落、hydration_method 和失败原因；返回单位：对象 + 段落 |
| 按目标读取结构材料包<br>`POST /paper-schema/materials` | 1–20 个 schema_ids、goal、各资源限额 | 按目标选取的结构材料；total/returned/truncated；返回单位：结构材料包 |

## PubMed：来源明细与 API 输入输出

| 上游名称 | 是什么 | 提供什么 | 官方依据 |
| --- | --- | --- | --- |
| MEDLINE | 美国国家医学图书馆整理的生物医学期刊书目库，是 PubMed 的最大组成部分。 | 期刊文章的题名、作者、摘要及 MeSH 主题标引等；不是期刊正文库。 | [说明](https://pubmed.ncbi.nlm.nih.gov/about/) |
| PubMed Central（PMC） | 保存生物医学与生命科学文章全文的档案库。 | 相关论文的书目被纳入 PubMed；正文仍在 PMC，不能把 PubMed EFetch 的书目 XML 当作全文。 | [说明](https://pubmed.ncbi.nlm.nih.gov/about/) |
| NCBI Bookshelf | 存放生命科学、医学和健康相关图书、报告等的全文平台。 | 向 PubMed 提供图书及部分章节的引用记录，不是把整本书正文放入普通 PubMed 检索响应。 | [说明](https://pubmed.ncbi.nlm.nih.gov/about/) |

PubMed 不等于 MEDLINE，也不等于 PMC。不是所有 PubMed 记录都完成 MeSH 标引，也不是每条记录都有摘要或全文入口。

下表为当前应用接入的 API 操作，非供应商所有接口的穷举。参数示例见 [RSI 功能示例](RSI_EXAMPLES.md)。

| 功能及原生 API | 输入：提交什么 | 输出：返回什么 |
| --- | --- | --- |
| 高级筛选与检索集合<br>`GET /entrez/eutils/esearch.fcgi`<br>`GET /entrez/eutils/efetch.fcgi` | term、日期/文献类型、retstart/retmax | ESearch: PMID/count/历史集合；EFetch: PubmedArticleSet XML，本页归一显示；返回单位：书目 / 摘要 / 标引 |
| 关联记录与引用<br>`GET /entrez/eutils/elink.fcgi`<br>`GET /entrez/eutils/efetch.fcgi` | PMID、linkname（相似/参考/施引/PMC） | 关联 ID；PubMed 目标继续取书目，PMC 目标给链接；返回单位：关联标识 / 记录 |
| 批量读取 PMID<br>`GET /entrez/eutils/efetch.fcgi` | PMID 列表，最多 100 个为本应用上限 | XML 中的书目、摘要和 MeSH；返回单位：记录批次 |
| 读取历史检索集合<br>`GET /entrez/eutils/efetch.fcgi` | WebEnv、query_key、retstart/retmax | 历史检索集合中的记录页；返回单位：记录批次 |

## Europe PMC：来源明细与 API 输入输出

| 上游名称 | 是什么 | 提供什么 | 官方依据 |
| --- | --- | --- | --- |
| PubMed 与 PMC | PubMed 提供生命科学书目与摘要；PMC 是文章全文档案库。 | Europe PMC 包含 PubMed 摘要及绝大多数 PMC 内容；受参与协议等影响，不能直接等同于完整 PMC。 | [说明](https://europepmc.org/help) |
| 预印本平台 | 例如 bioRxiv、medRxiv、Research Square、ChemRxiv，发布正式发表前的研究稿件。 | 生命科学预印本及版本信息；被索引不代表每篇均有 Europe PMC 可下载正文或已通过同行评审。 | [说明](https://europepmc.org/help) |
| Agricola | 美国国家农业图书馆及合作者建设的农业文献书目库。 | 补充农业及相关生命科学的文献记录。 | [说明](https://europepmc.org/help) |
| 欧洲专利局（EPO）与 NICE 等指南来源 | EPO 提供专利资料；NICE 是英国的健康与医疗指导机构。 | 补充部分专利摘要、指南等非期刊内容；不代表服务提供所有专利/指南全文。 | [说明](https://europepmc.org/RestfulWebService) |

生命科学预印本来源和可获取正文范围是有条件的。不同来源的 ID、文献类型和引用解析覆盖不同，不能把总记录数全部称为期刊论文数。

下表为当前应用接入的 API 操作，非供应商所有接口的穷举。参数示例见 [RSI 功能示例](RSI_EXAMPLES.md)。

| 功能及原生 API | 输入：提交什么 | 输出：返回什么 |
| --- | --- | --- |
| 检索论文记录<br>`GET /europepmc/webservices/rest/search` | query、resultType=core、pageSize | resultList.result[]；包括记录、摘要和全文入口；返回单位：文献记录 |
| 读取开放全文 XML<br>`GET /europepmc/webservices/rest/{PMCID}/fullTextXML` | 可获取开放全文的 PMCID | 全文 XML；本页显示标题和正文段落；返回单位：全文 / 段落 |
| 实体标注与原文上下文<br>`GET /europepmc/annotations_api/annotationsByArticleIds` | articleIds，例如 MED:38451962 | 实体提及、上下文、类型、来源锚点和 tags URI；返回单位：实体提及 |
| 参考文献<br>`GET /europepmc/webservices/rest/{source}/{id}/references` | source:id、page、pageSize | 参考文献记录和 hitCount；可能未解析；返回单位：引用记录 |
| 施引论文<br>`GET /europepmc/webservices/rest/{source}/{id}/citations` | source:id、page、pageSize | 施引论文记录和 hitCount；返回单位：引用记录 |
| 关联数据库与研究数据<br>`GET /europepmc/webservices/rest/{source}/{id}/datalinks` | source:id | 数据库、数据引用、补充材料链接及关系类型；返回单位：外部资源链接 |

## OpenAlex：来源明细与 API 输入输出

| 上游名称 | 是什么 | 提供什么 | 官方依据 |
| --- | --- | --- | --- |
| Microsoft Academic Graph（MAG） | 微软原来的论文、作者、机构和引用关系数据库，已于 2021 年停止更新。 | 其最终开放数据是 OpenAlex 初始目录的重要基础，不是仍在实时更新的上游。 | [说明](https://help.openalex.org/data/works/) |
| Crossref | 学术出版物的 DOI 注册与元数据服务，记录题名、作者、年份和参考文献等。 | 持续提供出版物书目及标识信息，通常不直接交付论文全文。 | [说明](https://help.openalex.org/data/works/) |
| DataCite 与 PubMed | DataCite 为数据集等科研产出提供 DOI 和描述；PubMed 提供生物医学书目。 | 补充不同类型、不同学科的学术记录；来源包含数据集，不全是期刊文章。 | [说明](https://help.openalex.org/data/works/) |
| HAL、机构与学科仓储 | HAL 是法国跨学科开放存储平台；机构/学科仓储保存大学或特定领域的论文、报告、学位论文、数据等。 | 补充文献版本、存放位置和开放全文入口；相同作品的多个版本会尝试关联为一条作品记录。 | [说明](https://help.openalex.org/data/sources/repositories/) |

OpenAlex 整合的是这些来源的记录，PaperScope 不会分别向每个上游发请求。来源之间重叠，元数据匹配和版本归并也可能有误差。

下表为当前应用接入的 API 操作，非供应商所有接口的穷举。参数示例见 [RSI 功能示例](RSI_EXAMPLES.md)。

| 功能及原生 API | 输入：提交什么 | 输出：返回什么 |
| --- | --- | --- |
| 检索论文记录<br>`GET /works` | search；本页 size 映射 per_page | meta.count + results[]（本页归一为论文条目）；返回单位：论文记录 |
| 完整检索集合聚合<br>`GET /works?group_by=…` | search + group_by + cursor | 完整查询的 meta.count 与一页 group_by[] 计数；返回单位：聚合分组 |
| 作者详情<br>`GET /authors/{author_id}` | A 开头的作者 ID | 作者对象、关联机构和指标；返回单位：作者对象 |
| 作者论文<br>`GET /works?filter=authorships.author.id:…` | author_id + per_page + cursor | 作者的 works 列表和下一页游标；返回单位：论文集合 |
| 机构详情<br>`GET /institutions/{institution_id}` | I 开头的机构 ID | 机构对象、ROR、地理信息和指标；返回单位：机构对象 |
| 机构论文<br>`GET /works?filter=authorships.institutions.id:…` | institution_id + per_page + cursor | 机构关联的 works 列表；返回单位：论文集合 |
| 参考文献与引用图<br>`GET /works/{work_id}`<br>`GET /works?filter=openalex:…` | W ID；从 referenced_works 分批读取 | 已解析参考文献记录；本页据此画方向图；返回单位：论文 + 引用边 |
| 施引论文与引用图<br>`GET /works?filter=cites:{work_id}` | W ID + cursor | 引用该论文的 works 与下一页游标；返回单位：论文 + 引用边 |
| 获取 PDF<br>`GET https://content.openalex.org/works/{work_id}.pdf` | W ID；Key 保留在后端 | PDF 二进制文件；返回单位：文件 |
| 获取并阅读 TEI XML<br>`GET https://content.openalex.org/works/{work_id}.grobid-xml` | W ID；Key 保留在后端 | TEI XML 文件；本页抽出段落预览；返回单位：文件 / 段落 |

## Semantic Scholar：来源明细与 API 输入输出

| 上游名称 | 是什么 | 提供什么 | 官方依据 |
| --- | --- | --- | --- |
| PubMed 与 arXiv | PubMed 是生物医学书目库；arXiv 是物理、数学、计算机等领域的预印本平台。 | 提供不同学科、不同出版状态的论文记录与链接。 | [说明](https://webflow.semanticscholar.org/about/librarians) |
| 出版商和学协会 | 官方列举 Springer Nature、Taylor & Francis、SAGE、Wiley，以及计算机/工程领域的 ACM、IEEE 等。 | 通过合作或公开网页提供出版信息、摘要、引用及可提供的内容；合作并不意味着其全部全文都能从 Graph API 取得。 | [说明](https://webflow.semanticscholar.org/about/librarians) |
| Unpaywall 与网页索引 | Unpaywall 用于发现合法开放版本的位置；网页索引从公开出版页面收集信息。 | 补充开放全文地址和可发现记录。链接是位置线索，不是 API 返回的整篇正文。 | [说明](https://webflow.semanticscholar.org/faq/paper-sources) |

官方公开的是来源例子和合作机制，不能据此推断每家出版社被完整收录。Graph、推荐和可下载数据集是不同服务；本应用未接入 S2ORC 全文数据集。

下表为当前应用接入的 API 操作，非供应商所有接口的穷举。参数示例见 [RSI 功能示例](RSI_EXAMPLES.md)。

| 功能及原生 API | 输入：提交什么 | 输出：返回什么 |
| --- | --- | --- |
| 检索论文记录<br>`GET /graph/v1/paper/search` | query、limit、fields | 论文 records + total；不是最终研究答案；返回单位：论文记录 |
| 分页参考文献与引用图<br>`GET /graph/v1/paper/{paper_id}/references` | paperId、offset、limit、fields | citedPaper 列表和 next；方向为当前论文→目标；返回单位：引用边 |
| 分页施引论文与引用图<br>`GET /graph/v1/paper/{paper_id}/citations` | paperId、offset、limit、fields | citingPaper 列表和 next；方向为来文→当前论文；返回单位：引用边 |
| 搜索作者<br>`GET /graph/v1/author/search` | 作者名 query、offset、limit、fields | 作者候选与 authorId；返回单位：作者记录 |
| 作者详情<br>`GET /graph/v1/author/{author_id}` | authorId、fields | 作者、机构、论文/引用计数与指标；返回单位：作者对象 |
| 作者论文<br>`GET /graph/v1/author/{author_id}/papers` | authorId、offset、limit、fields | 该作者论文页与 next；返回单位：论文集合 |
| 批量读取论文<br>`POST /graph/v1/paper/batch` | ids[]；支持服务认可的 paperId/外部标识 | 按标识返回论文对象，可能包含 null；返回单位：论文批次 |
| 读取相关推荐<br>`GET /recommendations/v1/papers/forpaper/{paper_id}` | 起点 paperId、limit、fields | recommendedPapers；相关性建议而非引用；返回单位：推荐论文 |

## Elicit：来源明细与 API 输入输出

| 上游名称 | 是什么 | 提供什么 | 官方依据 |
| --- | --- | --- | --- |
| OpenAlex、PubMed、Semantic Scholar | 分别是跨学科学术目录、生物医学书目库、论文发现与引用图谱。 | 官方产品页将它们列为可搜索论文来源；公开说明未给出逐源收录量、完整性或占比。 | [说明](https://elicit.com/solutions/research-agent) |
| ASCO 与 Springer | ASCO 是美国临床肿瘤学会；Springer 是学术出版品牌。 | 官方列举的专业/出版内容来源；不据此推断 API 可取得所有会议内容或订阅全文。 | [说明](https://elicit.com/solutions/research-agent) |
| ClinicalTrials.gov | 临床研究注册与结果信息平台，记录的是试验而不是普通论文。 | 服务有独立试验搜索；本应用当前未接入该接口，不混入论文库规模。 | [说明](https://elicit.com/solutions/research-agent) |
| 用户文件与机构订阅 | 服务产品可支持上传文件和利用自身订阅权限。 | 属于用户提供或获授权的材料，不计作人人都可通过公共论文搜索 API 获取的全文。 | [说明](https://elicit.com/solutions/research-agent) |

产品页的来源列表与某个 API 端点的返回范围不能画等号。API 文档明确区分 corpus=elicit/pubmed，本应用快速搜索使用默认 elicit；未核实底层逐篇采集链路。

下表为当前应用接入的 API 操作，非供应商所有接口的穷举。参数示例见 [RSI 功能示例](RSI_EXAMPLES.md)。

| 功能及原生 API | 输入：提交什么 | 输出：返回什么 |
| --- | --- | --- |
| 检索论文记录<br>`POST /api/v2/search/papers` | query、maxResults；本页使用默认 corpus | papers[]、可选 warnings；无搜索分页游标；返回单位：论文记录 |
| 创建研究报告<br>`POST /api/v2/sessions/reports` | researchQuestion | 202: sessionId/status/url，报告尚未完成；返回单位：AI 任务 |
| 创建筛选、抽取与综述任务<br>`POST /api/v2/sessions/systematic-reviews` | 研究问题、searches、筛选/抽取阶段配置 | 202: 会话 ID；随后读取阶段结果和导出；返回单位：AI 工作流 |
| 创建研究 Agent 任务<br>`POST /api/v2/sessions/agents` | query | 202: 研究 Agent sessionId/status/url；返回单位：AI 会话 |
| 任务列表与恢复查找<br>`GET /api/v2/sessions` | limit、cursor | 已有会话列表和 nextCursor；返回单位：任务记录 |
| 任务状态、阶段结果与导出<br>`GET /api/v2/sessions/reports/{id}`<br>`GET /api/v2/sessions/systematic-reviews/{id}`<br>`GET /api/v2/sessions/agents/{id}` | 任务类型与 sessionId | 状态、阶段结果；可用时有报告和导出链接；返回单位：任务状态 |
| 研究 Agent 事件<br>`GET /api/v2/sessions/agents/{id}/events` | sessionId、cursor | 事件数组与游标；包含活动/引用/问题；返回单位：事件 |
| 研究 Agent 产物<br>`GET /api/v2/sessions/agents/{id}/artifacts` | sessionId | 文件 artifacts 与交互式 deliveredOutputs；返回单位：产物清单 |
| 研究 Agent 引用来源<br>`GET /api/v2/sessions/agents/{id}/sources` | sessionId | 任务引用来源，按 sourceRef 关联；返回单位：引用来源 |
| 读取证据表与其他产物内容<br>`GET /api/v2/sessions/agents/{id}/artifacts/{artifact_id}/content` | sessionId、artifactId | 结构化产物内容、表格/文本和引用；返回单位：产物内容 |
| 获取产物下载链接<br>`GET /api/v2/sessions/agents/{id}/artifacts/{artifact_id}/download` | sessionId、artifactId、可选 format | 短时 downloadUrl、文件类型和过期时间；返回单位：下载入口 |
| 停止研究 Agent<br>`POST /api/v2/sessions/agents/{id}/stop` | sessionId | 停止请求状态；需要事件确认已停止；返回单位：任务状态 |
| 向研究 Agent 继续提问<br>`POST /api/v2/sessions/agents/{id}/messages` | sessionId、message | messageId，触发后续 Agent 工作；返回单位：AI 会话 |
| 恢复暂停的研究任务<br>`POST /api/v2/sessions/{id}/resume` | 使用状态响应的 links.resume | 恢复暂停会话，可能继续产生模型用量；返回单位：AI 会话 |

## 需要特别区分的范围

- OpenAlex 的默认主要记录集合叫 core，经过整理匹配，含义不是核心期刊。expansion 是另加的一批以数据集、仓储记录为主、字段通常较少的记录；all 合并两个集合。当前应用尚未提供切换。依据：[官方集合说明](https://help.openalex.org/data/works/corpus/)。
- Crossref、DataCite 等是上游提供者；作者、机构、主题等是 API 的对象类型，二者不能混为一列。
- Europe PMC 注释可来自摘要或正文；得到词语标注不意味着已得到全文。Elicit 的报告与抽取表是任务输出，也不等于原始论文全文。
- Sciverse 已直接验证 OpenAlex 来源标识及样本论文的 arXiv 原文位置；完整采集名单、各源占比与精确 OA 总量仍未核实。请求与响应见 [Sciverse 来源 API 核验](SCIVERSE_SOURCE_AUDIT.md)。

本说明由 `sourceDescriptions.ts`、`apiOperations.ts` 等界面定义生成，运行 `node scripts/export_api_reference.mjs` 更新，避免页面与文档采用不同口径。
