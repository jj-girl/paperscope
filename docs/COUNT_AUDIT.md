# 收录、OA 与全文数量核验

核验日期：2026-10-08 UTC。数字是当次快照；各来源的记录类型、版本合并、访问标记和统计时间不同，不直接相加或排名。Sciverse 数量只采用官方平台和官方 API，不再以示例项目的 GitHub 为规模依据。

| 来源 | 记录规模 | OA / 免费阅读 | 原始全文范围 |
| --- | --- | --- | --- |
| Sciverse | 官网：3.74 亿学术文献 | 精确 OA 总量未确认；下述 API 只报告 10,000，不能当作全库总量 | 官网：3071 万 AI-Ready 全文；不能等同于 OA 授权数量。Schema API 另外报告 1M+ 子库 |
| PubMed | EInfo：41,256,727 | ESearch `free full text[sb]`：14,875,462；是免费全文入口，不是严格 OA 许可统计 | 当前 PubMed 接口不直接返回期刊正文 |
| Europe PMC | `EXT_ID:*`：49,008,535 | `OPEN_ACCESS:y`：8,316,655 | `IN_EPMC:y`：12,409,642 库内全文记录；不能把库内全文数或 OA 标记数写成已成功下载 XML 的篇数 |
| OpenAlex | 默认核心语料 `/works`：331,133,838 | `is_oa:true`：130,063,375 | `has_content.pdf:true`：55,345,545；`has_content.grobid_xml:true`：52,966,359，两者重叠 |
| Semantic Scholar | 官方 API 概览页展示 2.14 亿，未标统计日期 | 本次未核实 OA 总量 | 匿名 Graph 请求返回 429；不能从整体论文记录量推断全文数量 |
| Elicit | 官方文档：1.38 亿+论文索引 | 本次未核实 OA 总量 | 无付费 API 权限，未核实原始全文总量；生成的报告不是原始论文 |

## Sciverse 官方依据

[官方平台](https://sciverse.opendatalab.com/) 的数据能力区标注“更新于 2026 年 10 月”。网页数字带动画，静态 HTML 抽取曾显示 0；本次使用浏览器加载并滚动到数据区后核实了 3.74 亿学术文献和 3071 万 AI-Ready 全文。官网另有图书、专利及知识记录口径，未将它们相加为论文数量。

[官方 Paper Schema 文档](https://sciverse.opendatalab.com/docs/sciverse/api/paper-schema)。本次实际请求：

```bash
curl -sS 'https://api.sciverse.space/paper-schema' \
  -H "Authorization: Bearer ${SCIVERSE_API_TOKEN}"
```

只摘录与规模相关的响应字段：

```json
{"coverage":{"current_focus":"AI conference papers","paper_count":"1M+"}}
```

这是服务提供的概数，不是精确实时计数，也不是全文总量。

[官方元数据文档](https://sciverse.opendatalab.com/docs/sciverse/api/meta-search)。先用 `GET /meta-catalog?collection=papers` 核实 `access_is_oa` 的字段类型和过滤操作，再查询：

```bash
curl -sS 'https://api.sciverse.space/meta-search' \
  -H "Authorization: Bearer ${SCIVERSE_API_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"collection":"papers","page_size":1,"fields":["unique_id","access_is_oa"],"filters":[{"field":"metadata_type","operator":"FILTER_OP_EQ","value":"paper"},{"field":"access_is_oa","operator":"FILTER_OP_EQ","value":"true"}]}'
```

本次返回 `total_count=10000`，所取记录的 `access_is_oa` 为字符串 `"true"`。未限定 OA 的广泛论文查询也返回 10,000；响应没有提供可确认精确全库总量的统计语义。因此页面写“尚无法确认精确总量”，不发布猜测的 OA 篇数。

环境变量必须由使用者在本机配置，示例与仓库没有包含实际 Token。计数摘录不包含凭据、游标或论文正文。

## 其他来源的可复核查询

OpenAlex 于 10:30 UTC 查询，读取 JSON 的 `meta.count`：

```bash
curl -sS 'https://api.openalex.org/works?per_page=1&select=id'
curl -sS 'https://api.openalex.org/works?per_page=1&select=id&filter=is_oa:true'
curl -sS 'https://api.openalex.org/works?per_page=1&select=id&filter=has_content.pdf:true'
curl -sS 'https://api.openalex.org/works?per_page=1&select=id&filter=has_content.grobid_xml:true'
```

[OpenAlex 全文与格式说明](https://help.openalex.org/access/fulltext/)。这些是接口当前标记的内容可用性，并未逐篇发起文件下载验证。

Europe PMC 读取 JSON 的 `hitCount`：

```bash
curl -sS 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A%2A&format=json&pageSize=1&resultType=idlist'
curl -sS 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=IN_EPMC%3Ay&format=json&pageSize=1&resultType=idlist'
curl -sS 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=OPEN_ACCESS%3Ay&format=json&pageSize=1&resultType=idlist'
```

[Europe PMC 查询与全文接口说明](https://europepmc.org/RestfulWebService)。

PubMed 读取 `einforesult.dbinfo[0].count` 与 `esearchresult.count`：

```bash
curl -sS 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=pubmed&retmode=json'
curl -sS 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term=free%20full%20text%5Bsb%5D'
```

其他官方来源：[Semantic Scholar API 概览](https://webflow.semanticscholar.org/product/api)、[Elicit API 文档](https://docs.elicit.com/)。
