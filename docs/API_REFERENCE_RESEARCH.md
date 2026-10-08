# 文献 API：数据库范围、数据粒度与输入输出

官方资料核对日期：2026-10-08。本表与界面按钮使用同一份定义生成。

## 本页的“无 LLM”是什么意思

纯 API 模式不调用使用者配置的模型，不生成阅读顺序、总结或推测缺失事实。供应方可能使用检索模型或预先抽取结构，这与本应用调用 LLM 是不同层次。Elicit 等供应商的生成式任务单独标注，默认只能查看接口说明而不能启动。

Sciverse 的元数据、正文与 Paper Schema 是不同覆盖范围。材料包是按目标选取已有结构，不是自动生成的综述。返回的 unique_id、doc_id 和 schema_id 不能直接互换。

## Sciverse 工具名与 HTTP 接口对照

界面同时标明官方工具名与 HTTP 路径。read_content 已接入，先前称为“原文上下文读取”；名称不同不代表缺少该功能。

| 官方工具名 | HTTP 接口 | 本应用用途 |
| --- | --- | --- |
| list_catalog | GET /meta-catalog | 查看字段目录 |
| search_papers | POST /meta-search | 查询文献元数据 |
| semantic_search | POST /agentic-search | 搜索原文片段 |
| read_content | GET /content | 按 doc_id 读取原文，当前界面分段获取 |
| get_resource | GET /resource | 获取原文引用的图片或附件 |
| list_paper_relations | POST /meta-paper-relations | 读取论文关联 |

官方依据：[Skills / SDK 工具名](https://sciverse.opendatalab.com/docs/sciverse/skills)、[content HTTP 接口](https://sciverse.opendatalab.com/docs/sciverse/api/content)、[供应商工具清单](https://github.com/opendatalab/Sciverse-Agent-Tools)。当前实现使用 HTTP 接口，不要求安装 SDK 或配置 LLM。

## 数据库范围对照

| 服务 | 数据库范围 | 数据粒度 | 主要边界 |
| --- | --- | --- | --- |
| Sciverse | 通用元数据用于跨学科文献与图书记录查询；正文接口只覆盖其持有可获取文本的记录；Paper Schema 是完成结构化处理的另一子集，官方能力 API 当前报告以 AI 会议论文为主。官网列有专利规模，不等于本应用已经接入专利专用检索接口。 | 元数据记录、文本片段 / 正文、论文内实体与关系、证据与段落、引用边 / 文件 | 元数据命中不保证有全文；全文存在不保证有 Schema。引用图只包含已解析的库内关联；材料包是裁剪集合。 |
| PubMed | 以生物医学、健康和生命科学为主，并覆盖相关行为科学、化学与生物工程文献；包含期刊论文、综述及部分图书/章节引用。本应用的记录解析主要面向期刊文章。 | PMID 列表、书目 / 摘要 / MeSH、关联标识、历史检索集合 | PubMed 与 PMC 不是同一数据粒度；并非所有记录都有摘要或 MeSH。常规 ESearch 的大结果集需要按时间等条件分段。 |
| Europe PMC | 生命科学文献及相关预印本、专利、指南、农业记录。记录来源用 MED、PMC、PPR、AGR 等代码区分；文献可能有 PMID、PMCID、DOI 等不同标识。 | 文献记录、开放全文 XML、实体提及 / 注释、参考文献 / 施引、数据库链接 | 能检索到的文献不一定能取全文 XML；可读全文与可复用内容也需按记录区分。文本挖掘标注不是已验证的科学论断。 |
| OpenAlex | 跨学科，记录类型包括期刊文章、会议论文、预印本、图书/章节、学位论文和数据集。当前查询默认主要记录集合（core，经过整理匹配，并非“核心期刊”）；另有主要由数据集和仓储记录组成、字段通常较少的扩展集合（expansion）。服务支持 corpus=all 合并查询，本应用尚未接入范围切换。 | 学术对象、作者/机构归属、引用边、分组计数、部分 PDF / TEI | 元数据图谱与可下载内容是不同覆盖；group_by 统计完整查询集合，但分组列表仍分页，机构分组可能重叠。 |
| Semantic Scholar | 跨学科的论文发现与引用图谱，包含出版论文及预印本等。官方说明当前主要关注英文出版物；不同学科、语言、年份和来源的字段覆盖不均匀。 | 论文 / 作者记录、引用边、相关性推荐、摘要与全文链接 | 摘要、PDF 链接及引用覆盖按记录变化；推荐不等于引用。匿名请求共享额度，429 不表示没有文献。 |
| Elicit | 跨学科论文搜索及筛选、抽取、报告、研究 Agent 工作流。官方论文索引为 1.38 亿+，临床试验另计；需要相应付费 API 权限。当前没有完成真实付费任务验收。 | 论文搜索记录、研究会话、筛选 / 抽取结果、报告 / 产物 | 需要付费 API 权限。搜索返回论文；创建报告/综述/Agent 返回异步会话，完成后再取结果。语料数量不能代表每篇都有全文。 |

## 收录来源、规模与全文获取

核对日期与数据口径分别标注。规模快照不等于实时计数；OA 标记、外部链接、API 文件存在及本页已读取是不同状态。

| 服务 | 收录来源 | 记录与全文规模 | 本应用全文边界 |
| --- | --- | --- | --- |
| Sciverse | 已用官方 API 核实：sources 来源对象使用 OpenAlex 标识与查询链接；抽样 RSI 论文的原文位置指向 arXiv。完整上游采集名单和各源收录比例仍未确认。 | 学术文献：**3.74 亿（官网展示值）**；Sciverse 官方平台，更新于 2026 年 10 月。 [依据](https://sciverse.opendatalab.com/)<br>AI-Ready 全文：**3071 万（官网展示值）**；官网全文口径，不能等同于 OA 授权数量，也不代表每个账户可获取全部文件。 [依据](https://sciverse.opendatalab.com/)<br>OA 标记文献：**尚无法确认精确总量**；实测 meta-search 的 access_is_oa=true 仅报告 total_count=10,000；不将该值当作全库 OA 总量。 [依据](https://sciverse.opendatalab.com/docs/sciverse/api/meta-search)<br>Paper Schema 子库：**100 万+（官方 API）**；实测 GET /paper-schema 返回 coverage.paper_count=1M+、current_focus=AI conference papers。 [依据](https://sciverse.opendatalab.com/docs/sciverse/api/paper-schema) | 原文片段与出处段落。可以按 doc_id 读取文本、按 Schema 出处回查段落。元数据命中不保证正文可取，结构材料包也不是整篇全文。 |
| PubMed | 主要由 MEDLINE 的期刊书目、PubMed Central（PMC）文章的书目，以及 NCBI Bookshelf 的书籍和章节引用组成。 | 书目记录：**41,256,727**；2026-10-08，官方 EInfo 的 pubmed count。 [依据](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=pubmed&retmode=json)<br>带免费全文入口的记录：**14,875,462**；同日 ESearch: free full text[sb]。免费可读不等于 OA 授权，也不等于本接口返回正文。 [依据](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term=free%20full%20text%5Bsb%5D)<br>本接口直接返回期刊全文：**不提供**；通过外部出版社或 PMC 链接阅读；OA 精确总量未单独确认。 [依据](https://pubmed.ncbi.nlm.nih.gov/about/) | 摘要与外部全文链接。当前 PubMed E-utilities 不返回期刊文章全文。即使有 PMCID，也只提供 PMC 跳转，不在本来源中自动读取全文。 |
| Europe PMC | 汇集 PubMed 摘要、大部分 PMC 全文，以及预印本、Agricola 农业书目、部分欧洲专利和临床指南。与 PubMed/PMC 大量重叠。 | 索引记录：**49,008,535**；2026-10-08 API 查询 EXT_ID:*；包含不同文献类型和版本。 [依据](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A*&format=json&pageSize=1&resultType=idlist)<br>库内全文记录：**12,409,642**；同日 IN_EPMC:y 命中数；不等于 XML 下载数。 [依据](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=IN_EPMC%3Ay&format=json&pageSize=1&resultType=idlist)<br>OA 标记记录：**8,316,655**；同日 OPEN_ACCESS:y；不代表已逐篇验证 XML 获取成功。 [依据](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=OPEN_ACCESS%3Ay&format=json&pageSize=1&resultType=idlist) | 部分记录可直接读全文 XML。仅符合开放全文条件的记录可通过 fullTextXML 取正文。结果卡标出读取条件；读取成功后展示正文段落，并可保存原始 XML。 |
| OpenAlex | 继承 Microsoft Academic Graph 的历史数据，并持续整合 Crossref、DataCite、PubMed、HAL 和其他开放仓储中的学术记录。 | 学术作品记录：**331,133,838**；2026-10-08 10:30 UTC，GET /works 返回 meta.count；默认核心语料。 [依据](https://api.openalex.org/works?per_page=1&select=id)<br>OA 标记作品：**130,063,375**；同次统计，filter=is_oa:true；不等于 Content API 文件数量。 [依据](https://api.openalex.org/works?per_page=1&select=id&filter=is_oa:true)<br>有 PDF 内容的作品：**55,345,545**；同次统计，filter=has_content.pdf:true。 [依据](https://api.openalex.org/works?per_page=1&select=id&filter=has_content.pdf:true)<br>有 TEI XML 的作品：**52,966,359**；同次统计，filter=has_content.grobid_xml:true；与 PDF 集合重叠，不相加。 [依据](https://api.openalex.org/works?per_page=1&select=id&filter=has_content.grobid_xml:true) | 部分记录可下载 PDF / TEI XML。按每篇记录的 has_content 判断格式；只有 OA 标记或外部 PDF 链接还不够。Content API 需要 Key，下载成功后才显示预览。 |
| Semantic Scholar | 通过网页索引及出版商/数据提供者合作收集论文。官方列举 PubMed、arXiv、Springer Nature、Taylor & Francis、SAGE、Wiley、ACM、IEEE 和 Unpaywall 等。 | 论文记录：**2.14 亿（概览页展示值）**；官方 API 概览页展示值，统计日期未注明。OA / 正文总量本次未能核实（匿名请求 429）。 [依据](https://webflow.semanticscholar.org/product/api)<br>当前接入的全文范围：**外部链接，非全文库**；另有 Datasets / S2ORC，但本应用未接入其全文数据集。 [依据](https://api.semanticscholar.org/api-docs/) | 摘要与外部 PDF 链接。当前 Graph / 推荐接口返回论文信息、引用和可能存在的开放 PDF 链接；本应用未通过这些接口取得论文正文。 |
| Elicit | 官方研究 Agent 产品页列举 OpenAlex、PubMed、Semantic Scholar、ASCO 和 Springer 等来源；论文 API 提供 Elicit 集合或 PubMed 限定集合，临床试验使用另一个接口。 | 论文索引：**1.38 亿+**；官方 API 文档的索引规模；OA / 原始全文总量未核实，不能用索引量代替。 [依据](https://docs.elicit.com/)<br>可直接读取原始论文全文：**当前未接入**；任务产物下载与论文全文下载是不同能力。 [依据](https://docs.elicit.com/) | 论文链接与研究任务产物。搜索提供论文记录和可能的全文链接；报告、抽取表、Agent 产物是生成输出，不是论文原文。未接入通用逐篇全文读取。 |

每项功能均附 RSI 示例和字段说明，见 [RSI_EXAMPLES.md](RSI_EXAMPLES.md)。示例填入不会发起请求。

## Sciverse

unique_id 标识元数据；doc_id 用于正文；schema_id 用于结构化论文；entity_id 在论文内有效。这些 ID 不能直接互换。

本页数据接口不调用你配置的 LLM。语义检索可能使用服务端检索模型；Schema 是供应方预先抽取的结构，不是本次由应用生成的结论。

[元数据 API](https://sciverse.opendatalab.com/docs/sciverse/api/meta-search) · [Paper Schema](https://sciverse.opendatalab.com/docs/sciverse/api/paper-schema) · [官方平台与数据规模](https://sciverse.opendatalab.com/)

| 按钮/操作 | 原生 API 名称 | 输入 | 输出 | 数据粒度 | 模型依赖 |
| --- | --- | --- | --- | --- | --- |
| 通用元数据检索（search_papers） | `POST /meta-search` | query 或 filters；collection、fields、sort、page/cursor | results 元数据、unique_id；有全文时可能有 doc_id | 元数据记录 | 数据读取，无需本地 LLM |
| 元数据字段目录（list_catalog） | `GET /meta-catalog` | collection: papers/authors/sources | 字段类型、过滤/排序/投影能力 | 字段定义 | 数据读取，无需本地 LLM |
| 语义证据片段检索（semantic_search） | `POST /agentic-search` | 自然语言 query、top_k、可选 filters | hits: chunk、doc_id、offset、页码及元数据 | 文本片段 | 服务端检索模型；无需本地 LLM |
| 读取论文原文（read_content） | `GET /content` | doc_id、offset、limit（字符） | text、next_offset、more；不是 Schema 对象 | 正文片段 | 数据读取，无需本地 LLM |
| 图表与附件获取（get_resource） | `GET /resource` | 原文返回的安全相对 file_name | 图像/PDF 等二进制文件 | 文件 | 数据读取，无需本地 LLM |
| 元数据论文引用与相关关系（list_paper_relations） | `POST /meta-paper-relations` | unique_id、relation、page/page_size | 库内引用/被引/相关工作记录与计数 | 论文关联 | 数据读取，无需本地 LLM |
| 结构化数据定义与分类 | `GET /paper-schema` | 数据 Token，无检索参数 | 接口版本、资源、分类与限额 | 能力说明 | 供应方预处理结果；无需本地 LLM |
| 检索结构化论文 | `POST /paper-schema/search` | query 或 filters、size/cursor | 论文 items[]、schema_id、贡献/问题等抽取字段 | 结构化论文 | 供应方预处理结果；无需本地 LLM |
| 跨论文检索实体 | `POST /paper-schema/entities/search` | query 或 schema_ids 范围；分类 filters | Entity items[]、entity_id、provenance | 实体 | 供应方预处理结果；无需本地 LLM |
| 从实体线索找论文 | `POST /paper-schema/entities/related-papers` | 实体名称 query、类型约束、size/cursor | 候选论文与 matched_entities、match_reasons | 相关论文 | 供应方预处理结果；无需本地 LLM |
| 已知论文的相关工作 | `POST /paper-schema/schemas/{schema_id}/related-papers` | schema_id、signals、size | 相关论文、分项信号和原因；不是事实引用边 | 相关论文 | 供应方预处理结果；无需本地 LLM |
| 读取论文实体列表 | `GET /paper-schema/schemas/{schema_id}/entities` | schema_id、类型/章节、size/cursor | 逐页 Entity 完整对象集合 | 实体 | 供应方预处理结果；无需本地 LLM |
| 读取一个实体 | `GET /paper-schema/schemas/{schema_id}/entities/{entity_id}` | schema_id、entity_id；可附关联关系 | entity、可选 relations 与截断标记 | 实体详情 | 供应方预处理结果；无需本地 LLM |
| 查询论文内部关系 | `POST /paper-schema/relations/search` | 限定论文/实体/关系类型的 filters | 文内 Relation、端点与 provenance | 文内关系 | 供应方预处理结果；无需本地 LLM |
| 读取一条内部关系 | `GET /paper-schema/schemas/{schema_id}/relations/{relation_id}` | schema_id、relation_id | 关系、端点对象、出处 | 关系详情 | 供应方预处理结果；无需本地 LLM |
| 引用数量与解析覆盖 | `GET /paper-schema/schemas/{schema_id}/citation-summary` | schema_id | 总参考数、解析覆盖、入/出边计数 | 引用统计 | 供应方预处理结果；无需本地 LLM |
| 读取参考文献记录 | `GET /paper-schema/schemas/{schema_id}/citations` | schema_id、size/cursor | 完整引用记录，保留未解析项 | 参考文献 | 供应方预处理结果；无需本地 LLM |
| 读取论文引用图数据 | `GET /paper-schema/schemas/{schema_id}/citation-graph` | schema_id、方向、深度和节点/边限额 | 已解析论文节点与引用边；可能截断 | 引用图数据 | 供应方预处理结果；无需本地 LLM |
| 检索结构化证据 | `POST /paper-schema/evidence/search` | groups 与论文/关键词等约束；size/cursor | Evidence 值、source_entity_id 和出处 | 结构化证据 | 供应方预处理结果；无需本地 LLM |
| 读取一条证据 | `GET /paper-schema/schemas/{schema_id}/evidence/{evidence_id}` | schema_id、evidence_id | 单条证据值、来源对象、出处 | 证据详情 | 供应方预处理结果；无需本地 LLM |
| 按 marker 回查段落 | `POST /paper-schema/resolve-provenance` | schema_id + marker_nums；window/max_segments | segments 原文段落、定位、缺失项 | 段落 | 供应方预处理结果；无需本地 LLM |
| 按 paragraph_id 回查段落 | `POST /paper-schema/resolve-provenance` | paragraph_ids；与 marker 模式互斥 | segments 原文段落及上下文 | 段落 | 供应方预处理结果；无需本地 LLM |
| 单篇论文内检索 | `POST /paper-schema/search-in-schema` | schema_id、query、top_k/window | 单篇文本命中与位置；不是出处判定 | 段落检索 | 数据读取，无需本地 LLM |
| 批量补全出处上下文 | `POST /paper-schema/hydrate-items` | 最多 50 个含 schema_id 和定位信息的 items | 逐项来源段落、hydration_method 和失败原因 | 对象 + 段落 | 供应方预处理结果；无需本地 LLM |
| 按目标读取结构材料包 | `POST /paper-schema/materials` | 1–20 个 schema_ids、goal、各资源限额 | 按目标选取的结构材料；total/returned/truncated | 结构材料包 | 供应方预处理结果；无需本地 LLM |

## PubMed

PMID 是 PubMed 记录 ID；PMCID 是 PMC 全文标识。ESearch 返回 PMID，EFetch 返回记录，不直接返回期刊全文。

E-utilities 检索与取数不需要本地 LLM；筛选结论和综述不是原始书目接口的输出。

[数据库范围](https://pubmed.ncbi.nlm.nih.gov/about/) · [E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)

| 按钮/操作 | 原生 API 名称 | 输入 | 输出 | 数据粒度 | 模型依赖 |
| --- | --- | --- | --- | --- | --- |
| 高级筛选与检索集合 | `GET /entrez/eutils/esearch.fcgi`<br>`GET /entrez/eutils/efetch.fcgi` | term、日期/文献类型、retstart/retmax | ESearch: PMID/count/历史集合；EFetch: PubmedArticleSet XML，本页归一显示 | 书目 / 摘要 / 标引 | 数据读取，无需本地 LLM |
| 关联记录与引用 | `GET /entrez/eutils/elink.fcgi`<br>`GET /entrez/eutils/efetch.fcgi` | PMID、linkname（相似/参考/施引/PMC） | 关联 ID；PubMed 目标继续取书目，PMC 目标给链接 | 关联标识 / 记录 | 数据读取，无需本地 LLM |
| 批量读取 PMID | `GET /entrez/eutils/efetch.fcgi` | PMID 列表，最多 100 个为本应用上限 | XML 中的书目、摘要和 MeSH | 记录批次 | 数据读取，无需本地 LLM |
| 读取历史检索集合 | `GET /entrez/eutils/efetch.fcgi` | WebEnv、query_key、retstart/retmax | 历史检索集合中的记录页 | 记录批次 | 数据读取，无需本地 LLM |

## Europe PMC

用 source:id 标识记录，如 MED:38451962；读取全文 XML 通常使用 PMCID；实体注释可能有外部数据库 URI。

本页调用检索、全文与注释接口，不需要本地 LLM；注释由上游流程生成。

[数据库范围](https://europepmc.org/help) · [Articles REST API](https://europepmc.org/RestfulWebService) · [Annotations API](https://europepmc.org/annotationsapi)

| 按钮/操作 | 原生 API 名称 | 输入 | 输出 | 数据粒度 | 模型依赖 |
| --- | --- | --- | --- | --- | --- |
| 检索论文记录 | `GET /europepmc/webservices/rest/search` | query、resultType=core、pageSize | resultList.result[]；包括记录、摘要和全文入口 | 文献记录 | 数据读取，无需本地 LLM |
| 读取开放全文 XML | `GET /europepmc/webservices/rest/{PMCID}/fullTextXML` | 可获取开放全文的 PMCID | 全文 XML；本页显示标题和正文段落 | 全文 / 段落 | 数据读取，无需本地 LLM |
| 实体标注与原文上下文 | `GET /europepmc/annotations_api/annotationsByArticleIds` | articleIds，例如 MED:38451962 | 实体提及、上下文、类型、来源锚点和 tags URI | 实体提及 | 供应方预处理结果；无需本地 LLM |
| 参考文献 | `GET /europepmc/webservices/rest/{source}/{id}/references` | source:id、page、pageSize | 参考文献记录和 hitCount；可能未解析 | 引用记录 | 数据读取，无需本地 LLM |
| 施引论文 | `GET /europepmc/webservices/rest/{source}/{id}/citations` | source:id、page、pageSize | 施引论文记录和 hitCount | 引用记录 | 数据读取，无需本地 LLM |
| 关联数据库与研究数据 | `GET /europepmc/webservices/rest/{source}/{id}/datalinks` | source:id | 数据库、数据引用、补充材料链接及关系类型 | 外部资源链接 | 数据读取，无需本地 LLM |

## OpenAlex

W/A/I 等前缀分别表示作品、作者和机构；DOI、ORCID、ROR 等可作为外部关联线索。对象消歧结果并非绝对正确。

当前查询、对象、聚合、引用与文件接口不需要本地 LLM；主题与消歧等字段包含供应方的预处理结果。

[数据对象与范围](https://help.openalex.org/data/) · [API](https://help.openalex.org/api/) · [全文文件](https://help.openalex.org/access/fulltext/)

| 按钮/操作 | 原生 API 名称 | 输入 | 输出 | 数据粒度 | 模型依赖 |
| --- | --- | --- | --- | --- | --- |
| 检索论文记录 | `GET /works` | search；本页 size 映射 per_page | meta.count + results[]（本页归一为论文条目） | 论文记录 | 数据读取，无需本地 LLM |
| 完整检索集合聚合 | `GET /works?group_by=…` | search + group_by + cursor | 完整查询的 meta.count 与一页 group_by[] 计数 | 聚合分组 | 数据读取，无需本地 LLM |
| 作者详情 | `GET /authors/{author_id}` | A 开头的作者 ID | 作者对象、关联机构和指标 | 作者对象 | 数据读取，无需本地 LLM |
| 作者论文 | `GET /works?filter=authorships.author.id:…` | author_id + per_page + cursor | 作者的 works 列表和下一页游标 | 论文集合 | 数据读取，无需本地 LLM |
| 机构详情 | `GET /institutions/{institution_id}` | I 开头的机构 ID | 机构对象、ROR、地理信息和指标 | 机构对象 | 数据读取，无需本地 LLM |
| 机构论文 | `GET /works?filter=authorships.institutions.id:…` | institution_id + per_page + cursor | 机构关联的 works 列表 | 论文集合 | 数据读取，无需本地 LLM |
| 参考文献与引用图 | `GET /works/{work_id}`<br>`GET /works?filter=openalex:…` | W ID；从 referenced_works 分批读取 | 已解析参考文献记录；本页据此画方向图 | 论文 + 引用边 | 数据读取，无需本地 LLM |
| 施引论文与引用图 | `GET /works?filter=cites:{work_id}` | W ID + cursor | 引用该论文的 works 与下一页游标 | 论文 + 引用边 | 数据读取，无需本地 LLM |
| 获取 PDF | `GET https://content.openalex.org/works/{work_id}.pdf` | W ID；Key 保留在后端 | PDF 二进制文件 | 文件 | 数据读取，无需本地 LLM |
| 获取并阅读 TEI XML | `GET https://content.openalex.org/works/{work_id}.grobid-xml` | W ID；Key 保留在后端 | TEI XML 文件；本页抽出段落预览 | 文件 / 段落 | 供应方预处理结果；无需本地 LLM |

## Semantic Scholar

paperId 用于图谱调用，corpusId 也用于数据集；部分接口接受 DOI、arXiv、PMID 等外部标识。当前引用表单使用解析后的 paperId。

不需要本地 LLM；推荐和部分派生字段是供应方计算结果，不能当作现场生成的综述。

[服务与匿名访问](https://webflow.semanticscholar.org/product/api) · [Graph API](https://api.semanticscholar.org/api-docs/) · [Recommendations](https://api.semanticscholar.org/api-docs/recommendations)

| 按钮/操作 | 原生 API 名称 | 输入 | 输出 | 数据粒度 | 模型依赖 |
| --- | --- | --- | --- | --- | --- |
| 检索论文记录 | `GET /graph/v1/paper/search` | query、limit、fields | 论文 records + total；不是最终研究答案 | 论文记录 | 数据读取，无需本地 LLM |
| 分页参考文献与引用图 | `GET /graph/v1/paper/{paper_id}/references` | paperId、offset、limit、fields | citedPaper 列表和 next；方向为当前论文→目标 | 引用边 | 数据读取，无需本地 LLM |
| 分页施引论文与引用图 | `GET /graph/v1/paper/{paper_id}/citations` | paperId、offset、limit、fields | citingPaper 列表和 next；方向为来文→当前论文 | 引用边 | 数据读取，无需本地 LLM |
| 搜索作者 | `GET /graph/v1/author/search` | 作者名 query、offset、limit、fields | 作者候选与 authorId | 作者记录 | 数据读取，无需本地 LLM |
| 作者详情 | `GET /graph/v1/author/{author_id}` | authorId、fields | 作者、机构、论文/引用计数与指标 | 作者对象 | 数据读取，无需本地 LLM |
| 作者论文 | `GET /graph/v1/author/{author_id}/papers` | authorId、offset、limit、fields | 该作者论文页与 next | 论文集合 | 数据读取，无需本地 LLM |
| 批量读取论文 | `POST /graph/v1/paper/batch` | ids[]；支持服务认可的 paperId/外部标识 | 按标识返回论文对象，可能包含 null | 论文批次 | 数据读取，无需本地 LLM |
| 读取相关推荐 | `GET /recommendations/v1/papers/forpaper/{paper_id}` | 起点 paperId、limit、fields | recommendedPapers；相关性建议而非引用 | 推荐论文 | 供应方预处理结果；无需本地 LLM |

## Elicit

论文可能提供 elicitId、DOI、PMID；任务用 sessionId，产物用会话内 artifactId。两类对象不要混用。

检索不需你提供额外 LLM Key，但可用服务端语义检索。报告、抽取和研究 Agent 属于服务端 AI 任务，默认纯 API 模式不启动这些任务。

[API v2](https://docs.elicit.com/) · [API 访问与计费](https://elicit.com/operations/api-terms)

| 按钮/操作 | 原生 API 名称 | 输入 | 输出 | 数据粒度 | 模型依赖 |
| --- | --- | --- | --- | --- | --- |
| 检索论文记录 | `POST /api/v2/search/papers` | query、maxResults；本页使用默认 corpus | papers[]、可选 warnings；无搜索分页游标 | 论文记录 | 服务端检索模型；无需本地 LLM |
| 创建研究报告 | `POST /api/v2/sessions/reports` | researchQuestion | 202: sessionId/status/url，报告尚未完成 | AI 任务 | 供应商生成式 AI 任务，默认不执行 |
| 创建筛选、抽取与综述任务 | `POST /api/v2/sessions/systematic-reviews` | 研究问题、searches、筛选/抽取阶段配置 | 202: 会话 ID；随后读取阶段结果和导出 | AI 工作流 | 供应商生成式 AI 任务，默认不执行 |
| 创建研究 Agent 任务 | `POST /api/v2/sessions/agents` | query | 202: 研究 Agent sessionId/status/url | AI 会话 | 供应商生成式 AI 任务，默认不执行 |
| 任务列表与恢复查找 | `GET /api/v2/sessions` | limit、cursor | 已有会话列表和 nextCursor | 任务记录 | 读取/控制已有任务；不调用本地 LLM |
| 任务状态、阶段结果与导出 | `GET /api/v2/sessions/reports/{id}`<br>`GET /api/v2/sessions/systematic-reviews/{id}`<br>`GET /api/v2/sessions/agents/{id}` | 任务类型与 sessionId | 状态、阶段结果；可用时有报告和导出链接 | 任务状态 | 读取/控制已有任务；不调用本地 LLM |
| 研究 Agent 事件 | `GET /api/v2/sessions/agents/{id}/events` | sessionId、cursor | 事件数组与游标；包含活动/引用/问题 | 事件 | 读取/控制已有任务；不调用本地 LLM |
| 研究 Agent 产物 | `GET /api/v2/sessions/agents/{id}/artifacts` | sessionId | 文件 artifacts 与交互式 deliveredOutputs | 产物清单 | 读取/控制已有任务；不调用本地 LLM |
| 研究 Agent 引用来源 | `GET /api/v2/sessions/agents/{id}/sources` | sessionId | 任务引用来源，按 sourceRef 关联 | 引用来源 | 读取/控制已有任务；不调用本地 LLM |
| 读取证据表与其他产物内容 | `GET /api/v2/sessions/agents/{id}/artifacts/{artifact_id}/content` | sessionId、artifactId | 结构化产物内容、表格/文本和引用 | 产物内容 | 读取/控制已有任务；不调用本地 LLM |
| 获取产物下载链接 | `GET /api/v2/sessions/agents/{id}/artifacts/{artifact_id}/download` | sessionId、artifactId、可选 format | 短时 downloadUrl、文件类型和过期时间 | 下载入口 | 读取/控制已有任务；不调用本地 LLM |
| 停止研究 Agent | `POST /api/v2/sessions/agents/{id}/stop` | sessionId | 停止请求状态；需要事件确认已停止 | 任务状态 | 读取/控制已有任务；不调用本地 LLM |
| 向研究 Agent 继续提问 | `POST /api/v2/sessions/agents/{id}/messages` | sessionId、message | messageId，触发后续 Agent 工作 | AI 会话 | 供应商生成式 AI 任务，默认不执行 |
| 恢复暂停的研究任务 | `POST /api/v2/sessions/{id}/resume` | 使用状态响应的 links.resume | 恢复暂停会话，可能继续产生模型用量 | AI 会话 | 供应商生成式 AI 任务，默认不执行 |

## 使用与解释规则

- 表中列的是本应用接入的操作，不是各服务所有产品接口的穷举。Sciverse Paper Schema 覆盖其文档中的 18 个公开操作；paragraph_id 与 marker 两种回查模式分成两个按钮。
- 表单字段会映射到对应的原生参数，例如本应用 size 映射到某些服务的 per_page/page_size。复合操作会明确列出多个原生端点，如 PubMed ESearch → EFetch。
- 元数据记录、摘要、全文、实体提及、科研关系、证据值和模型生成文本是不同粒度；同名字段和同名实体不代表可直接合并。
- 不用本地 LLM 不等于无需 API Key，也不代表供应商内部没有使用机器学习。数据权限、内容可用性、配额和许可证需分别判断。
- 检索结果总数会受语料范围、查询语法、索引和时间影响。PubMed 与 Europe PMC 等来源存在重叠，不能把来源数量当作独立证据数量。
- 本应用列出带来源和口径的规模快照；官方页面数字与当前 API 命中数不能作为同一时点的排名。
- Elicit 的报告、抽取、Agent 创建/继续/恢复会执行供应商 AI；其状态、事件与产物读取只是取回既有任务信息。

## 资料与实现

来源说明位于 `frontend/src/apiResearch.ts`，按钮与表单定义位于 `frontend/src/apiOperations.ts`。运行 `node scripts/export_api_reference.mjs` 可重新生成本文。
