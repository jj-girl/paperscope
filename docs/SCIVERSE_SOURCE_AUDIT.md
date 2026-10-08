# Sciverse 来源信息：直接 API 核验

核验日期：2026-10-08。请求通过本地后端使用已配置的 Sciverse Token 发往官方 API；没有调用 LLM。本页只保留公共字段与少量结果摘录，不保存或展示实际凭据。

## 能确认什么

| 核验对象 | 实际返回 | 支持的结论 | 不能据此得出的结论 |
| --- | --- | --- | --- |
| `GET /meta-catalog?collection=papers` | 65 个字段，含 `metadata_type`、`locations`、出版载体及开放地址 | 能检查单篇文献类型、原文位置及出版信息 | `metadata_type=paper` 不是上游数据库名称 |
| `GET /meta-catalog?collection=sources` | 45 个字段；`id` 明确定义为 OpenAlex 来源 ID，另有 `ids` 和 `works_api_url` | 来源对象明确与 OpenAlex 标识体系关联 | 不能证明所有论文及全文都采集自 OpenAlex |
| `GET /meta-catalog?collection=authors` | 34 个字段；`source_ids` 为作者发表过的 OpenAlex 来源 ID | 能将作者与发表载体关联 | 这些 source IDs 不是作者记录的采集供应商列表 |
| 来源集合搜索 `arXiv` | 返回 `arXiv (Cornell University)`，类型为 `repository`，OpenAlex ID 为 `S4306400194` | 确认存在与 arXiv 对应的来源对象，附 OpenAlex 查询地址 | 不能保证 Sciverse 完整持有全部 arXiv 文献或全文 |
| RSI 论文元数据 | `locations`、`access_oa_url` 指向 arXiv，发表载体为 arXiv | 确认该论文的 arXiv 原文位置 | 不能把单篇样本推成完整上游名单，也不能还原 Sciverse 从哪个中间平台采集它 |

这些结论比仅看产品说明更具体。当前账户暴露的字段目录中，没有看到定义为“完整采集上游清单”的字段。官方说明目录受账户权限影响，枚举样本也不保证穷尽全部值，因此不能宣称服务内部不存在更完整的来源记录。

来源记录的 `works_count` 和 `oa_works_count` 是该来源对象上的统计，未获得它们与 Sciverse 实际存储/可读全文一一对应的保证。本次没有将它们相加或当作 Sciverse 的全文覆盖量。

## 可复核请求

在本机设置自己的 `SCIVERSE_API_TOKEN`，再执行以下请求。实际密钥不要写入文档、日志或公开仓库。

```bash
curl -sS 'https://api.sciverse.space/meta-catalog?collection=papers' \
  -H "Authorization: Bearer ${SCIVERSE_API_TOKEN}"
curl -sS 'https://api.sciverse.space/meta-catalog?collection=sources' \
  -H "Authorization: Bearer ${SCIVERSE_API_TOKEN}"
curl -sS 'https://api.sciverse.space/meta-catalog?collection=authors' \
  -H "Authorization: Bearer ${SCIVERSE_API_TOKEN}"
```

来源目录的相关字段定义（缩写）：

| 字段 | 服务说明的含义 |
| --- | --- |
| `id` | OpenAlex 来源 ID |
| `type` | journal / repository / conference / ebook platform 等 |
| `ids` | openalex、ISSN、MAG、Wikidata 等不同标识体系下的 ID |
| `works_api_url` | 查询该来源作品列表的 OpenAlex API URL |

查询一个具体的来源对象：

```bash
curl -sS 'https://api.sciverse.space/meta-search' \
  -H "Authorization: Bearer ${SCIVERSE_API_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"collection":"sources","query":"arXiv","page_size":2,"fields":["id","display_name","type","homepage_url","ids","works_api_url","works_count","oa_works_count"]}'
```

匹配结果中的一个对象摘录：

```json
{
  "id": "https://openalex.org/S4306400194",
  "display_name": "arXiv (Cornell University)",
  "type": "repository",
  "homepage_url": "https://arxiv.org",
  "ids": {"openalex": "https://openalex.org/S4306400194"},
  "works_api_url": "https://api.openalex.org/works?filter=primary_location.source.id:S4306400194"
}
```

查询 RSI 论文的原文位置：

```bash
curl -sS 'https://api.sciverse.space/meta-search' \
  -H "Authorization: Bearer ${SCIVERSE_API_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"collection":"papers","query":"bounded recursive self improvement","page_size":1,"fields":["unique_id","title","doi","metadata_type","locations","publication_venue_name_unified","publication_publisher","access_oa_url"]}'
```

响应的相关字段摘录，省略其他原文位置及未使用字段：

```json
{
  "title": "Bounded Recursive Self-Improvement",
  "doi": "10.48550/arxiv.1312.6764",
  "metadata_type": "paper",
  "publication_venue_name_unified": "arXiv (Cornell University)",
  "access_oa_url": ["https://arxiv.org/pdf/1312.6764", "https://arxiv.org/pdf/1312.6764v1"],
  "locations": [{"type":"download","is_oa":"true","url":"https://arxiv.org/pdf/1312.6764v1"}]
}
```

官方依据：[字段目录](https://sciverse.opendatalab.com/docs/sciverse/api/meta-catalog)、[元数据查询](https://sciverse.opendatalab.com/docs/sciverse/api/meta-search)。

本页确认的是标识关联和样本出处；要确认完整上游采集清单，还需要供应商提供相应目录、采集来源字段及其完整性说明。无需继续猜测字段或把样本域名汇总冒充全库清单。
