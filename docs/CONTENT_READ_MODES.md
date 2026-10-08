# Sciverse 原文读取：全文与片段模式

PaperScope 直接调用 HTTP `GET /content`，没有调用 SDK。网页中的 `read_content` 是用于对应官方工具的名称。

| 方式 | 实际发给 Sciverse 的参数 | 网页行为 |
| --- | --- | --- |
| 全文读取 | 只发送 `doc_id`，省略 `offset` 和 `limit` | 一次请求该文档完整文本；显示实际字符数与服务的 `more` 标记 |
| 片段读取 | `doc_id`、`offset`、`limit` | 读取所选范围；有后续内容时沿服务返回的 `next_offset` 继续 |

片段默认从位置 0 请求最多 5000 个 Unicode 字符，可调整位置及长度，也可选择 700、4096、5000、10000 的快捷长度。本应用片段长度上限为 50000。全文模式不使用这个片段上限。切换模式、调整参数、填入示例都不会自动发送请求。

## 结果如何区分

结果标签来自本次已提交的请求及服务返回，不会因为事后切换表单而改变。页面记录同一 `doc_id` 最近一次全文和片段的返回量，方便对照；不自动发起两次调用，也不把若干片段暗中拼成全文。

- 全文模式若仍收到 `more=true`，页面明确提示本次不能视为完整全文。
- `more=false` 表示服务报告没有后续内容；不代表独立核验过出版商 PDF 的完整性。
- 未收到 `more` 时显示未确认，不推断全文完整。
- 本地按实际返回文本计算 Unicode 字符数；请求的 limit 是上限，不保证恰好返回该数量。

本次真实验收使用《Bounded Recursive Self-Improvement》，2026-10-08：

| 请求 | 本地计算的返回字符数 | 服务标记 |
| --- | ---: | --- |
| `offset=0&limit=700` | 618 | `more=true` |
| 不发送 `offset`、`limit` | 166354 | `more=false` |

核验记录只报告请求条件和返回量，不随代码发布论文全文或凭据。

## 与其他 Sciverse 接口的区别

| 接口 / 工具 | 返回内容 | 是否直接读取整篇正文文本 |
| --- | --- | --- |
| `POST /meta-search` / `search_papers` | 书目、摘要、标识与链接 | 否 |
| `POST /agentic-search` / `semantic_search` | 匹配的原文片段、位置和 doc_id | 否；可用返回的 doc_id 再调用 content |
| `GET /content` / `read_content` | 指定 doc_id 的全文或选定片段 | 支持；取决于请求参数和实际内容可用性 |
| Schema 的出处回查 / 文内检索 | 定位处的有限段落或命中上下文 | 否 |
| `GET /resource` / `get_resource` | 原文引用的图片、图表或附件文件 | 是资源文件获取，不是通用的整篇正文文本接口 |

其他服务也有全文路线，例如 Europe PMC 的 `fullTextXML` 和 OpenAlex Content 的 PDF/TEI；它们各自覆盖部分记录。

官方依据：[content HTTP API](https://sciverse.opendatalab.com/docs/sciverse/api/content)、[agentic-search](https://sciverse.opendatalab.com/docs/sciverse/api/agentic-search)、[Skills / SDK 工具名](https://sciverse.opendatalab.com/docs/sciverse/skills)。全文/片段模式遵循 HTTP 参数说明，不套用 SDK 的默认参数。
