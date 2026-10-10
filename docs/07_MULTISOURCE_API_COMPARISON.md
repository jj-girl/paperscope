# 07 多源文献 API 的数据范围、粒度与全文能力对比

本节以 **PaperScope 当前接入的接口与实际调用结果** 为准。PaperScope 原名 FrontierLens Multisource。官方服务提供但本应用尚未接入的能力单独标注；PMC 仅作全文来源补充，不冒充第七个已接入服务。

## 测试条件与指标口径

- 检索时间：2026-10-10 **06:39:13—06:39:43 UTC**。单轮探索性测试，不代表稳定性能或数据库整体覆盖。运行环境：Python 3.12.14、PyMuPDF 1.28.2。
- 固定输入：`recursive self-improvement`，没有引号、没有 LLM 改写；每个来源请求前 **10 条**，不限制年份、OA 或文献类型。Sciverse 使用通用元数据检索，`collection=papers`，没有用 Paper Schema 子库替代通用检索。
- 按 PaperScope 现有适配器执行：PubMed 显式 `sort=relevance`；其他来源使用接口默认排序。PubMed 还执行自身的检索式映射。因此“同一输入”不等于各源完全相同的检索语义。
- Sciverse、OpenAlex 已配置数据 Key；PubMed、Europe PMC、Semantic Scholar 匿名访问；Elicit 没有付费 API Key，跳过。整个测试未调用 LLM 或创建研究任务。
- 本轮 **N 是实际返回的记录条数**，不是数据库命中总数，也不是跨版本去重后的论文数。各源内未发现重复来源 ID / 完全相同 DOI，但 Sciverse 含两条 `other` 类型的软件发布记录，以及同题不同 DOI 的版本；这些条目事先没有被过滤，事后也不剔除。
- 只沿各来源在 PaperScope 已接入的原生正文路径取回内容。不跨源补全文，不打开外部 OA 链接下载。因此 PubMed 的 PMC 链接不算 PubMed 直接获取正文成功；Semantic Scholar 未接入的 Snippet API 也不参与测量。
- “正文获取成功”采用工程判据：Sciverse 全文请求返回非空文本且 `more=false`；Europe PMC / OpenAlex XML 有非空正文段落；PDF 文件有效，能遍历全部页提取文字。逐项核对了成功条目的题名及章节/页数。没有逐字比对出版商原版，没有 OCR，也不保证完整解析图片、公式和表格。
- 接口错误率以 **一次 PaperScope 操作为一例**：失败操作数 / 实际尝试操作数。PubMed 的一例搜索内部含 ESearch 与 EFetch，Semantic Scholar 一例内部可能含重试，所以不能称为上游 HTTP 请求错误率。预检查配置不计入；无 Key 跳过不算失败。

本轮实际计算的是：

\[\text{记录级直接正文获取成功率}=\frac{\text{通过当前原生路径取回可解析正文的记录数}}{\text{该来源实际返回记录数}}\]

若下一轮要严格使用“去重论文数”作分母，应事先限定论文类型、版本归并规则或固定 DOI 集合。不能把这轮记录级结果直接改名为论文级覆盖率。

## 表 1：数据范围与数据粒度

| 数据服务 | 收录范围 / 主要对象 | 元数据、摘要 | 全文、段落 | 实体、关系或研究任务 | 与 PaperScope 的对应 |
| --- | --- | --- | --- | --- | --- |
| Sciverse | 跨学科论文、图书等元数据；Schema 为预处理子库，官方报告以 1M+ AI 会议论文为主 | 标题、作者、摘要、DOI、年份等，字段可能缺失 | agentic-search 返回命中片段；content 按 doc_id 请求全文或片段 | Schema 提供实体、关系、证据及出处；不现场解析任意上传论文 | 本轮测通用元数据→content；Schema 功能已接入但未混入本轮分母。[官方说明](https://sciverse.opendatalab.com/docs/sciverse/api/paper-schema) |
| PubMed | 生物医学、生命科学书目，来自 MEDLINE、PMC 对应引用、Bookshelf 等 | PMID、标题、摘要、MeSH、发表类型等 | 当前 db=pubmed 的记录接口不直接返回期刊正文；可带 PMC 链接 | MeSH 为主题标引，ELink 为关联记录，不是通用研究结论图谱 | 本轮取得记录与 PMC 跳转链接；未访问外部全文。[官方说明](https://pubmed.ncbi.nlm.nih.gov/about/) |
| Europe PMC | PubMed / PMC、生命科学预印本、农业记录、部分专利和指南等 | 文章记录、摘要、标识、引用信息 | 可获取开放全文 XML；程序从 XML 提取正文段落 | 官方有实体注释、引用和数据库链接；注释可只覆盖摘要 | 本轮 search→符合 PMCID+OA 条件时取 XML；段落结构与科研语义结构分开。[官方说明](https://europepmc.org/RestfulWebService) |
| OpenAlex | 跨学科学术作品，包括论文、预印本、书籍、数据集等；本轮用默认 core 集合 | 作者、机构、主题、引用、OA；摘要可能缺失 | 有外部 OA 链接；部分作品另有 Content API PDF / TEI | 学术对象及引用关系；TEI 文档结构不是实验结论图谱 | 本轮按 has_content 标记取 PDF/TEI。PDF 文字提取为测试脚本验证；网页自身以 PDF 预览和 TEI 正文为主。[官方说明](https://help.openalex.org/access/fulltext/) |
| Semantic Scholar | 跨学科论文、作者及引用网络 | 论文/作者记录、可用摘要、openAccessPdf 链接 | 官方另有 Snippet API，但 **PaperScope 当前未接入**；片段也不是整篇全文 | 引用、推荐等；另有独立数据集产品 | 本轮当前 Graph 搜索匿名请求返回 429，无可评估样本。[Snippet 官方文档](https://api.semanticscholar.org/api-docs/snippets) |
| Elicit | 跨学科论文搜索；官方另支持 PubMed 子语料和临床试验 | 搜索返回论文记录和可用摘要 | 普通 search/papers 不交付通用原文文件；研究流程处理可访问材料 | 会话、筛选、抽取、报告与 Agent 产物 | 搜索/研究任务代码已接入，但本轮缺 Key，未执行；官方的试验搜索和 corpus 切换未接入当前快速搜索表单。[官方文档](https://docs.elicit.com/) |
| PMC（补充，未独立接入） | 生物医学、生命科学全文档案，包括期刊文章及作者稿件 | 文章标识及书目信息 | 部分内容经 E-utilities、OAI-PMH、BioC、Article Datasets 等允许的路线获取 | XML / BioC 的段落结构不等于科研语义关系 | 本轮仅通过 PubMed 链接和 Europe PMC 的 XML 路线涉及，不单列实测成功率。[开发者说明](https://pmc.ncbi.nlm.nih.gov/tools/developers/) |

## 表 2：核心 API 输入输出（标出本轮实际执行与未接入项）

表内为供应商原生 HTTP endpoint。实际实验通过本地 PaperScope 后端转发；鉴权 Key 只在后端，不写入本报告。缩写主机：Sciverse=`https://api.sciverse.space`；NCBI=`https://eutils.ncbi.nlm.nih.gov`；Europe PMC REST=`https://www.ebi.ac.uk/europepmc/webservices/rest`；OpenAlex 元数据=`https://api.openalex.org`，文件=`https://content.openalex.org`；Semantic Scholar=`https://api.semanticscholar.org`；Elicit=`https://elicit.com`。

| 服务 / 功能 | 原生 endpoint | 主要输入 | 核心输出及结构 | 本轮状态 |
| --- | --- | --- | --- | --- |
| Sciverse 元数据 | `POST /meta-search` | `collection=papers`、`query`、`page_size=10` | `results[]`、`unique_id`、`abstract`、可能的 `doc_id`、`access_oa_url` | 已调用，返回 10 条；不是 Schema 搜索 |
| Sciverse 原文 | `GET /content` | `doc_id`；全文模式省略 `offset` 和 `limit` | `text`、`more`、可能的 `next_offset`；应用另计算字符数 | 已对有 doc_id 的 1 条调用；成功取回全文模式文本 |
| Sciverse 语义片段 | `POST /agentic-search` | `query`、`top_k`、可选 `filters`、`sub_queries` | `hits[]` 中的 `chunk`、`doc_id`、位置和得分 | 已接入，非本轮检索入口 |
| Sciverse Schema | `GET /paper-schema`；`POST /paper-schema/search`；`POST /paper-schema/entities/search`；`POST /paper-schema/relations/search`；`POST /paper-schema/evidence/search` | 能力读取无需主题参数；搜索使用 `query/filters/size/cursor`；证据检索还需 `groups` | 能力/分类/限额；论文、Entity、Relation、Evidence、provenance | 已接入，不混入本轮通用检索分母 |
| PubMed 检索 | `GET /entrez/eutils/esearch.fcgi` | `db=pubmed`、`term`、`retmax=10`、`retmode=json`、`sort=relevance` | `esearchresult.idlist/count/querytranslation` | 已调用；注意这是 JSON 小写字段，不能与 XML 的 IdList/Count 混写 |
| PubMed 记录 | `GET /entrez/eutils/efetch.fcgi` | `db=pubmed`、`id`、`retmode=xml` | `PubmedArticleSet/ PubmedArticle` 中的摘要、作者、MeSH 等 | 作为搜索流程的一部分已调用；不是全文 XML |
| Europe PMC 搜索 | REST 主机下 `GET /search` | `query`、`format=json`、`resultType=core`、`pageSize=10` | `hitCount`、`resultList.result[]`、摘要、PMCID、OA 标志及全文链接 | 已调用；core 表示更完整的记录字段，不是全文 |
| Europe PMC 正文 | REST 主机下 `GET /{PMCID}/fullTextXML` | PMCID | XML 中的 `article/body/sec/p` 等 | 已调用 1 次，解析出正文段落 |
| Europe PMC 注释 | `GET https://www.ebi.ac.uk/europepmc/annotations_api/annotationsByArticleIds` | `articleIds=来源:编号` | 原文词语、类型、章节、上下文、数据库链接 | 已接入，非本轮正文获取步骤 |
| OpenAlex 搜索 | 元数据主机下 `GET /works` | `search`、`per_page=10`；当前未传 corpus，使用默认集合 | `meta.count`、`results[]`、摘要索引、`open_access`、`has_content`、位置等 | 已调用，返回 10 条；本程序使用 per_page |
| OpenAlex 文件 | 文件主机下 `GET /works/{id}.pdf`、`GET /works/{id}.grobid-xml` | Work ID；后端附 API Key | PDF 字节或 TEI XML | 对标记有文件的 5 条分别获取两种格式，合计 10 个文件 |
| Semantic Scholar 搜索 | `GET /graph/v1/paper/search` | `query`、`limit=10`、`fields` | `data[]`：paperId、摘要、引用计数、openAccessPdf 等 | 已尝试，HTTP 429 |
| Semantic Scholar 引用/推荐 | `GET /graph/v1/paper/{id}/references`、`.../citations`；`GET /recommendations/v1/papers/forpaper/{id}` | paperId、分页/数量、fields | 引用或推荐的论文列表 | 已接入，但本轮没有可继续探索的检索样本 |
| Semantic Scholar Snippet | `GET /graph/v1/snippet/search` | `query`、`limit`、`fields`，可限定 paperIds | `data[]` 包含 `snippet`、`paper`、`score` 等 | **官方支持、PaperScope 未接入，本轮未调用** |
| Elicit 搜索 | `POST /api/v2/search/papers` | 当前代码发送 `query`、`maxResults`；官方另支持 corpus/searchMode 等 | `papers[]`、可能的 warnings | 缺 Key，本轮跳过；不是返回空集合 |
| Elicit 研究任务 | `POST /api/v2/sessions/reports`、`.../systematic-reviews`、`.../agents` | 报告/综述使用 `researchQuestion`，Agent 使用 `query`；综述还有阶段配置 | sessionId、后续状态/事件/来源/产物 | 代码已接入，默认不自动创建；本轮未执行 |
| PMC 补充路线 | `GET /entrez/eutils/efetch.fcgi?db=pmc` 等 | 指定 PMC 记录及相应格式参数 | 可提供的正文 XML 等 | **未独立接入/实测**，不能计入六个来源的成功率 |

Sciverse Content 的官方输出文档列 `chars_returned`；实际服务还可能返回其他计数字段。本实验统一按拿到的文本重新计算字符数，不把某个字段缺失判成没有正文。[Sciverse Content](https://sciverse.opendatalab.com/docs/sciverse/api/content)。

## 表 3：全文覆盖与实际可用性——RSI 样本实测

### 表 3A：检索输出与实际取回正文

“全文入口”只表示响应里有被适配器保留的候选全文 URL，没有逐一打开验证链接有效性；“本轮仅获链接”表示有入口但本轮未取回正文。它不证明只能永远通过链接阅读。

| 来源 | 返回 N | 非空摘要 / N | 候选全文入口 / N | 成功获取可解析正文 / N | 本轮仅获链接 | 本轮拿到的正文形式 |
| --- | ---: | --- | --- | --- | ---: | --- |
| Sciverse | 10 | 10/10（100%） | 5/10（50%） | 1/10（10%） | 4 | 1 条 Markdown/纯文本，含标题与段落；未测 Schema 抽取 |
| PubMed | 2 | 2/2（100%） | 2/2（100%） | 0/2（0%）；当前路径不提供正文 | 2 | 无；2 条均给出 PMC 链接 |
| Europe PMC | 10 | 10/10（100%） | 1/10（10%） | 1/10（10%） | 0 | 1 份全文 XML，可提取章节和段落 |
| OpenAlex | 10 | 10/10（100%） | 10/10（100%） | 5/10（50%） | 5 | 5 份 PDF + 同 5 篇的 TEI XML，不是 10 篇 |
| Semantic Scholar | — | — | — | — | — | 检索 429，比例不可计算 |
| Elicit | — | — | — | — | — | 无 Key 未执行，比例不可计算 |

### 表 3B：格式获取、解析与接口可用性

“PDF/XML 成功数”统计本轮通过当前来源原生内容接口实际取回的文件，不计仅有链接。XML 解析须存在非空正文段落；PDF 使用 PyMuPDF 逐页提取文字，无 OCR。解析分母是成功取回的文件/文本响应数，因此 OpenAlex 为 10 个文件，而不是 10 篇论文。

| 来源 | 原生 PDF 成功数 / N | 原生 XML 成功数 / N | 正文解析成功 / 已取回内容 | 检索耗时（秒） | 应用请求错误 / 尝试数 |
| --- | --- | --- | --- | ---: | --- |
| Sciverse | —（本轮无此原生路径） | —（未通过 XML 取正文） | 1/1（100%） | 2.762 | 0/2（0%） |
| PubMed | —（本轮无此原生路径） | —（未通过 XML 取正文） | — | 1.785 | 0/1（0%） |
| Europe PMC | —（本轮无此原生路径） | 1/10（10%） | 1/1（100%） | 1.829 | 0/2（0%） |
| OpenAlex | 5/10（50%） | 5/10（50%） | 10/10（100%） | 1.842 | 0/11（0%） |
| Semantic Scholar | — | — | — | 13.524 | 1/1（100%） |
| Elicit | — | — | — | — | — |

- PubMed 的 0/2 是当前应用路径不提供正文；没有发出两次失败的正文下载请求。
- Sciverse 本轮只对返回 doc_id 的 1 条发起 content 请求；其余 9 条不是“content 调用失败”。
- Europe PMC 本轮 10 条中有 9 条 PPR 预印本记录，仅 1 条满足本应用的 PMCID+OA 正文条件。不能据此说另外 9 条论文在网上没有全文。
- OpenAlex 的 5 篇都成功取回两种文件，解析率为 10/10；记录级正文获取率仍是 5/10。PDF 和 TEI 文本长度不同，未把它们当作相互完全等价的文本。
- Semantic Scholar 的 1/1（100%）仅是本轮一个应用级检索操作失败，含程序内部等待/重试；不是服务整体错误率。Elicit 是未执行，不能写成 0% 成功或 100% 失败。
- 检索时间含当前网络、应用适配和必要等待，只测一次，不据此给平台速度排名。

## 两个同文实例：能搜到与能取回的区别

1. **Bounded Recursive Self-Improvement**：Sciverse 与 OpenAlex 都返回该文。Sciverse 给出 doc_id，本轮取回 166354 字符、`more=false`；OpenAlex 返回外部 arXiv PDF 地址，但本轮记录未提供可触发 Content 下载的格式标记，因此只记为入口。不能把它写成 PDF 下载失败。
2. **Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement**：PubMed 返回 PMID `42793863` 和 PMC 入口；Europe PMC 返回同文 PMCID `PMC13604973` 并成功交付 XML，本轮提取 152 个正文段落、77859 字符。两者都搜到，但当前接口交付粒度不同。

## 对用户草稿的核对结论

- 三张表的结构与“公开能力不能代替实际成功率”的原则正确。现在已经完成一轮实测，应删除“尚未做统一在线实测”，改为明确上述协议与边界。
- Sciverse `/content` 不只是“连续分段才能取得全文”：不传 offset 时可请求全文，PaperScope 已提供两种模式。本轮采用全文模式。
- Semantic Scholar Snippet API 确实存在，但当前未接入；PMC 也是补充路线。它们可以写入“官方支持”栏，不可以写成本轮 PaperScope 已运行的功能。
- endpoint 必须写明主机前缀；Europe PMC REST 与 Annotations 的路径不同，OpenAlex 元数据与 Content 的主机也不同。PubMed ESearch JSON 与 XML 字段大小写不能混写。
- 全库 Works、PDF、TEI 的不同时间快照不能作为本轮分母；未复核的“3.29 亿”等数字不沿用为本次实测结果。
- 固定 DOI 的配对实验可以更好比较“同一文献能否取得”。本轮比较的是“同一主题实际搜到并取回多少”，两种设计回答不同问题；建议后续分别报告，不合并成功率。
- [PMC 官方公告](https://pmc.ncbi.nlm.nih.gov/tools/oa-service/)确实说明 OA Web Service 自 2026-08-25 不再可用。停用的是旧 OA Web Service，不是 PMC 全部 API；新接入应遵循 [PMC 开发者说明](https://pmc.ncbi.nlm.nih.gov/tools/developers/)与 Article Datasets。

## 样本清单与复核

公开附表只列文献标识、标题与结果判据，不包含 API Key、原始摘要、正文或下载文件。各来源按返回顺序列出。

| 来源 | 排名 | 标识 / DOI | 返回标题 | 本轮正文结果 |
| --- | ---: | --- | --- | --- |
| Sciverse | 1 | 10.48550/arxiv.1312.6764 | Bounded Recursive Self-Improvement | 已获取可解析正文 |
| Sciverse | 2 | 10.5281/zenodo.18654415 | Evolutionary Solutions to Recursive Self-Improvement | 未提供已接入路径可用的正文入口 |
| Sciverse | 3 | 10.48550/arxiv.2609.15802 | The Economics of Recursive Self-Improvement | 未提供已接入路径可用的正文入口 |
| Sciverse | 4 | 10.5281/zenodo.18654414 | Evolutionary Solutions to Recursive Self-Improvement | 仅获候选全文入口 |
| Sciverse | 5 | 10.5281/zenodo.13207300 | keskival/recursive-self-improvement-suite: 0.1 | 仅获候选全文入口 |
| Sciverse | 6 | 10.5281/zenodo.13207301 | keskival/recursive-self-improvement-suite: 0.1 | 仅获候选全文入口 |
| Sciverse | 7 | 10.17605/osf.io/9eyz6 | Recursive Self-improvement: Geometry and Entropy Backstop | 仅获候选全文入口 |
| Sciverse | 8 | 10.48550/arxiv.2609.26457 | Recursive self-improvement of AI research agents | 未提供已接入路径可用的正文入口 |
| Sciverse | 9 | 10.48550/arxiv.2610.03002 | Recursive Self-Improvement in Unified Multimodal Models | 未提供已接入路径可用的正文入口 |
| Sciverse | 10 | 10.48550/arxiv.2609.27389 | EvoAudio: Recursive Self-Improvement for Audio Understanding | 未提供已接入路径可用的正文入口 |
| PubMed | 1 | 10.3389/fpsyg.2026.1922407 | Instrumental succession: the gradual transfer of agency to AI. | 仅获候选全文入口 |
| PubMed | 2 | 10.3390/e28090951 | Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement. | 仅获候选全文入口 |
| Europe PMC | 1 | 10.20944/preprints202609.2073.v1 | Bayesian Recursive Self-Improvement | 未提供已接入路径可用的正文入口 |
| Europe PMC | 2 | 10.20944/preprints202609.2680.v1 | Recursive Self-Improvement in AI: A Survey | 未提供已接入路径可用的正文入口 |
| Europe PMC | 3 | 10.20944/preprints202610.0582.v1 | Where the Loop Meets the Budget: Analyzing On-Device Recursive Self-Improvement | 未提供已接入路径可用的正文入口 |
| Europe PMC | 4 | 10.3390/e28090951 | Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement. | 已获取可解析正文 |
| Europe PMC | 5 | 10.20944/preprints202608.2108.v1 | AI4AI Survey: From Long-Horizon Agents to Recursive Self-Improvement—Definitions, Reliable Horizons, and Open Problems | 未提供已接入路径可用的正文入口 |
| Europe PMC | 6 | 10.20944/preprints202608.0975.v2 | Bounded Recursive Self-Improvement Under Human Governance: Evidence from a Seven-Cycle Reinforcement Learning Contour Experiment | 未提供已接入路径可用的正文入口 |
| Europe PMC | 7 | 10.20944/preprints202608.0051.v1 | The Path to Recursive Self-Improving Agents: Foundation, Framework, and Future Directions | 未提供已接入路径可用的正文入口 |
| Europe PMC | 8 | 10.31234/osf.io/qkp75_v1 | Creativity Geometry: Recursive Creative Self-Improvement Through System-3 Metacognitive Scaffolding | 未提供已接入路径可用的正文入口 |
| Europe PMC | 9 | 10.20944/preprints202609.0624.v1 | SAI-V: A Multidimensional Framework for Self-Improving Artificial Intelligence | 未提供已接入路径可用的正文入口 |
| Europe PMC | 10 | 10.20944/preprints202608.2066.v1 | Pandora’s Toolbox: A Survey of Generalist Agent Security from the Lifecycle Perspective | 未提供已接入路径可用的正文入口 |
| OpenAlex | 1 | 10.48550/arxiv.1312.6764 | Bounded Recursive Self-Improvement | 仅获候选全文入口 |
| OpenAlex | 2 | 10.20944/preprints202609.2073.v1 | Bayesian Recursive Self-Improvement | 仅获候选全文入口 |
| OpenAlex | 3 | W7213371396 | The Economics of Recursive Self-Improvement | 已获取可解析正文 |
| OpenAlex | 4 | 10.5281/zenodo.19044633 | Recursive Self-Improvement Stability under Endogenous Yardstick Drift | 仅获候选全文入口 |
| OpenAlex | 5 | 10.20944/preprints202609.2680.v1 | Recursive Self-Improvement in AI: A Survey | 仅获候选全文入口 |
| OpenAlex | 6 | 10.48550/arxiv.2609.26457 | Recursive self-improvement of AI research agents | 已获取可解析正文 |
| OpenAlex | 7 | 10.48550/arxiv.2609.27389 | EvoAudio: Recursive Self-Improvement for Audio Understanding | 已获取可解析正文 |
| OpenAlex | 8 | 10.48550/arxiv.2609.38662 | CollabFlow: Recursive Self-Improvement of Agent Collaboration | 已获取可解析正文 |
| OpenAlex | 9 | 10.48550/arxiv.2609.24972 | RRSI: Regularized Recursive Self-Improvement of Agent Harnesses | 已获取可解析正文 |
| OpenAlex | 10 | 10.5281/zenodo.22751569 | The Meowpiler Architecture: Falsification as the Engine of Recursive Self-Improvement | 仅获候选全文入口 |

复现实验脚本：`scripts/benchmark_rsi.py`。需先运行 PaperScope 后端，使用自己的本地连接配置。输出目录含文章材料，必须保留在 Git 忽略目录。

```bash
uv run --no-project --with pymupdf==1.28.2 python scripts/benchmark_rsi.py \
  --query "recursive self-improvement" --size 10 \
  --output .runtime/rsi-benchmark-new-run
```

再次执行会产生新的动态检索结果，不应覆盖本轮快照。采样时运行的应用工作树提交：`e8f9ce115ba3a065b6cab60c5fa8bc8de1efcbab`。本轮仅新增测试脚本，未修改检索、排序、全文获取的生产代码。

本章可以支持特定 RSI 检索任务下的应用可用性观察，不能推出数据库整体全文覆盖率、检索质量排名或系统综述完整性。
