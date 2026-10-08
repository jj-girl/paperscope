# RSI 功能示例

核验日期：2026-10-08。RSI 指 Recursive Self-Improvement（递归自我改进）。本页与各功能的“填入 RSI 示例”使用同一份数据。

固定论文标识来自实际记录。Semantic Scholar 本次匿名调用返回 429；Elicit 未做付费任务验证。sessionId、artifactId、WebEnv、query_key 等运行时标识须由自己的前一步请求返回，不提供虚构固定值。

## OpenAlex

### 检索论文记录

采用当前 OpenAlex 检索返回的作品记录；同名论文可能有多个出版/预印本版本。本记录标记有 PDF 与 TEI XML，获取还需要 Key。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 可获取正文 · 仅覆盖符合条件的记录

```json
{
  "query": "Darwin Godel Machine self improving",
  "size": "5"
}
```

### 完整检索集合聚合

采用当前 OpenAlex 检索返回的作品记录；同名论文可能有多个出版/预印本版本。本记录标记有 PDF 与 TEI XML，获取还需要 Key。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "query": "recursive self-improvement",
  "group": "year"
}
```

### 作者详情

作者例为检索记录返回的 Jenny Zhang；作者集合不限于 RSI。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "record_id": "A5101989330"
}
```

### 作者论文

作者例为检索记录返回的 Jenny Zhang；作者集合不限于 RSI。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 可获取正文 · 仅覆盖符合条件的记录

```json
{
  "record_id": "A5101989330",
  "size": "5"
}
```

### 机构详情

机构例为该记录关联的 University of British Columbia；机构论文集合不限于 RSI。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "record_id": "I141945490"
}
```

### 机构论文

机构例为该记录关联的 University of British Columbia；机构论文集合不限于 RSI。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 可获取正文 · 仅覆盖符合条件的记录

```json
{
  "record_id": "I141945490",
  "size": "5"
}
```

### 参考文献与引用图

采用当前 OpenAlex 检索返回的作品记录；同名论文可能有多个出版/预印本版本。本记录标记有 PDF 与 TEI XML，获取还需要 Key。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 可获取正文 · 仅覆盖符合条件的记录

```json
{
  "record_id": "W4412505633",
  "size": "5"
}
```

### 施引论文与引用图

采用当前 OpenAlex 检索返回的作品记录；同名论文可能有多个出版/预印本版本。本记录标记有 PDF 与 TEI XML，获取还需要 Key。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 可获取正文 · 仅覆盖符合条件的记录

```json
{
  "record_id": "W4412505633",
  "size": "5"
}
```

### 获取 PDF

采用当前 OpenAlex 检索返回的作品记录；同名论文可能有多个出版/预印本版本。本记录标记有 PDF 与 TEI XML，获取还需要 Key。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 原文文件 · 获取成功后预览 / 下载

```json
{
  "record_id": "W4412505633"
}
```

### 获取并阅读 TEI XML

采用当前 OpenAlex 检索返回的作品记录；同名论文可能有多个出版/预印本版本。本记录标记有 PDF 与 TEI XML，获取还需要 Key。

2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。

[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）](https://openalex.org/W4412505633)

**本功能返回边界：** 原文文件 · 获取成功后预览 / 下载

```json
{
  "record_id": "W4412505633"
}
```

## PubMed

### 高级筛选与检索集合

PMID 42793863 是书目记录；PMCID PMC13604973 是同文的 PMC 全文标识。此处只读取 PubMed 记录，不自动取全文。

2026-10-08 已用 PubMed EFetch 验证题名、PMID、PMCID 与 DOI。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

```json
{
  "query": "\"recursive self-improvement\"",
  "year_from": "",
  "year_to": "",
  "publication_type": "",
  "size": "5"
}
```

### 关联记录与引用

PMID 42793863 是书目记录；PMCID PMC13604973 是同文的 PMC 全文标识。此处只读取 PubMed 记录，不自动取全文。

2026-10-08 已用 PubMed EFetch 验证题名、PMID、PMCID 与 DOI。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

```json
{
  "record_id": "42793863",
  "kind": "similar",
  "size": "5"
}
```

### 批量读取 PMID

PMID 42793863 是书目记录；PMCID PMC13604973 是同文的 PMC 全文标识。此处只读取 PubMed 记录，不自动取全文。

2026-10-08 已用 PubMed EFetch 验证题名、PMID、PMCID 与 DOI。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

```json
{
  "ids": "42793863"
}
```

### 读取历史检索集合

先运行高级检索，使用返回的 WebEnv 和 query_key。它们是会过期的检索会话值，不能填论文 ID；本页保留本次检索返回值。

2026-10-08 已用 PubMed EFetch 验证题名、PMID、PMCID 与 DOI。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

前一步：先执行高级检索，取得历史集合。

```json
{
  "size": "5"
}
```

## Europe PMC

### 检索论文记录

全文 XML 填 PMC13604973；引用等记录接口填 MED:42793863。全文标识和书目标识是同一论文的不同入口。

2026-10-08 已验证检索、全文正文和注释；其他关联接口仍取决于其覆盖。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/) · [Europe PMC 原文](https://europepmc.org/articles/PMC13604973)

**本功能返回边界：** 可获取正文 · 仅覆盖符合条件的记录

```json
{
  "query": "\"recursive self-improvement\"",
  "size": "5"
}
```

### 读取开放全文 XML

全文 XML 填 PMC13604973；引用等记录接口填 MED:42793863。全文标识和书目标识是同一论文的不同入口。

2026-10-08 已验证检索、全文正文和注释；其他关联接口仍取决于其覆盖。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/) · [Europe PMC 原文](https://europepmc.org/articles/PMC13604973)

**本功能返回边界：** 可获取正文 · 仅覆盖符合条件的记录

```json
{
  "record_id": "PMC13604973"
}
```

### 实体标注与原文上下文

使用 PMC 全文来源查询注释。此 RSI 论文已返回参考文献 DOI 等标识注释；不是每篇 AI 论文都会有基因/疾病标注。

2026-10-08 已验证检索、全文正文和注释；其他关联接口仍取决于其覆盖。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/) · [Europe PMC 原文](https://europepmc.org/articles/PMC13604973)

**本功能返回边界：** 实体注释 · 词语、类型与位置

```json
{
  "record_id": "PMC:PMC13604973",
  "size": "5"
}
```

### 参考文献

全文 XML 填 PMC13604973；引用等记录接口填 MED:42793863。全文标识和书目标识是同一论文的不同入口。

2026-10-08 已验证检索、全文正文和注释；其他关联接口仍取决于其覆盖。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/) · [Europe PMC 原文](https://europepmc.org/articles/PMC13604973)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "record_id": "MED:42793863",
  "size": "5"
}
```

### 施引论文

全文 XML 填 PMC13604973；引用等记录接口填 MED:42793863。全文标识和书目标识是同一论文的不同入口。

2026-10-08 已验证检索、全文正文和注释；其他关联接口仍取决于其覆盖。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/) · [Europe PMC 原文](https://europepmc.org/articles/PMC13604973)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "record_id": "MED:42793863",
  "size": "5"
}
```

### 关联数据库与研究数据

全文 XML 填 PMC13604973；引用等记录接口填 MED:42793863。全文标识和书目标识是同一论文的不同入口。

2026-10-08 已验证检索、全文正文和注释；其他关联接口仍取决于其覆盖。

[Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement](https://pubmed.ncbi.nlm.nih.gov/42793863/) · [Europe PMC 原文](https://europepmc.org/articles/PMC13604973)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "record_id": "MED:42793863"
}
```

## Semantic Scholar

### 检索论文记录

先按完整题名搜索。匿名访问可能返回 429；示例没有虚构未核验的 paperId。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

```json
{
  "query": "Bounded Recursive Self-Improvement",
  "size": "5"
}
```

### 分页参考文献与引用图

先用 ARXIV:1312.6764 读取记录，将返回的 40 位 paperId 填到此处。当前匿名访问未通过实时验收，不能承诺马上有结果。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

前一步：先批量读取 RSI 论文，复制 paperId。

```json
{
  "size": "5"
}
```

### 分页施引论文与引用图

先用 ARXIV:1312.6764 读取记录，将返回的 40 位 paperId 填到此处。当前匿名访问未通过实时验收，不能承诺马上有结果。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

前一步：先批量读取 RSI 论文，复制 paperId。

```json
{
  "size": "5"
}
```

### 搜索作者

这是示例论文的作者之一；同名结果需核对，不能把姓名当作 authorId。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

```json
{
  "query": "Jürgen Schmidhuber",
  "size": "5"
}
```

### 作者详情

authorId 需从作者搜索结果复制；本次匿名接口限流，未获得可核验 ID，因此不填写猜测值。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

前一步：先搜索示例作者，复制 authorId。

```json
{}
```

### 作者论文

authorId 需从作者搜索结果复制；本次匿名接口限流，未获得可核验 ID，因此不填写猜测值。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

前一步：先搜索示例作者，复制 authorId。

```json
{
  "size": "5"
}
```

### 批量读取论文

批量读取支持带前缀的外部标识。先用 arXiv ID 取得 paperId，再用于参考文献、施引和推荐。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

```json
{
  "ids": "ARXIV:1312.6764"
}
```

### 读取相关推荐

先用 ARXIV:1312.6764 读取记录，将返回的 40 位 paperId 填到此处。当前匿名访问未通过实时验收，不能承诺马上有结果。

论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

前一步：先批量读取 RSI 论文，复制 paperId。

```json
{}
```

## Elicit

### 检索论文记录

示例围绕 RSI 的机制与证据。填入不会执行；创建报告、综述或 Agent 需主动开启 AI 扩展及有效 Elicit API 权限，可能消耗额度。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 书目 / 摘要 · 全文需外部跳转

```json
{
  "query": "recursive self-improvement",
  "size": "5"
}
```

### 创建研究报告

示例围绕 RSI 的机制与证据。填入不会执行；创建报告、综述或 Agent 需主动开启 AI 扩展及有效 Elicit API 权限，可能消耗额度。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

```json
{
  "query": "What mechanisms enable recursive self-improvement in AI systems, and what evidence distinguishes self-modification from repeated prompting?"
}
```

### 创建筛选、抽取与综述任务

示例围绕 RSI 的机制与证据。填入不会执行；创建报告、综述或 Agent 需主动开启 AI 扩展及有效 Elicit API 权限，可能消耗额度。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

```json
{
  "query": "What mechanisms enable recursive self-improvement in AI systems, and what evidence distinguishes self-modification from repeated prompting?",
  "size": "5",
  "options": "{}"
}
```

### 创建研究 Agent 任务

示例围绕 RSI 的机制与证据。填入不会执行；创建报告、综述或 Agent 需主动开启 AI 扩展及有效 Elicit API 权限，可能消耗额度。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

```json
{
  "query": "What mechanisms enable recursive self-improvement in AI systems, and what evidence distinguishes self-modification from repeated prompting?"
}
```

### 任务列表与恢复查找

列出自己的已有任务，按 RSI 研究问题找回会话；不创建新任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

```json
{
  "size": "5"
}
```

### 任务状态、阶段结果与导出

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看已有任务，取得 sessionId。

```json
{
  "kind": "report"
}
```

### 研究 Agent 事件

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看已有任务，取得 sessionId。

```json
{
  "kind": "agent"
}
```

### 研究 Agent 产物

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看已有任务，取得 sessionId。

```json
{
  "kind": "agent"
}
```

### 研究 Agent 引用来源

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看已有任务，取得 sessionId。

```json
{
  "kind": "agent"
}
```

### 读取证据表与其他产物内容

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看会话产物，取得 artifactId。

```json
{
  "kind": "agent"
}
```

### 获取产物下载链接

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看会话产物，取得 artifactId。

```json
{
  "kind": "agent",
  "format": "csv"
}
```

### 停止研究 Agent

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看已有任务，取得 sessionId。

```json
{
  "kind": "agent"
}
```

### 向研究 Agent 继续提问

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看已有任务，取得 sessionId。

```json
{
  "kind": "agent",
  "query": "Compare bounded self-improvement and the Darwin Gödel Machine; separate source evidence from proposed mechanisms."
}
```

### 恢复暂停的研究任务

sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。

输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764) · [Elicit API 文档](https://docs.elicit.com/)

**本功能返回边界：** 研究任务 / 生成产物 · 非原始论文全文

前一步：先查看已有任务，取得 sessionId。

```json
{
  "kind": "report"
}
```

## Sciverse

### 通用元数据检索（search_papers）

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "query": "bounded recursive self improvement",
  "size": "3",
  "options": "{}"
}
```

### 元数据字段目录（list_catalog）

读取接口字段或能力说明，无需论文 ID；之后可用 RSI 论文继续检索。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "kind": "papers"
}
```

### 语义证据片段检索（semantic_search）

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 原文片段 / 定位段落 · 非整篇全文

```json
{
  "query": "How does AERA achieve bounded recursive self improvement?",
  "size": "3",
  "options": "{}"
}
```

### 读取论文原文（read_content）

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 原文片段 / 定位段落 · 非整篇全文

```json
{
  "record_id": "675c3be456e605b07e515c6d52bb4244b0f22de4c32b5f4d11864a91f2c6a602",
  "offset": "0"
}
```

### 图表与附件获取（get_resource）

使用该论文正文返回的相对资源路径，不是任意网站 URL；示例是原文资源，不保证是研究结果图。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 原文文件 · 获取成功后预览 / 下载

```json
{
  "record_id": "dt=2026-05-08/ht=22/c33392e84291d240d36c3847bf5fc07fe0e0612ce8e8d07477e2ea346748fe49.jpg"
}
```

### 元数据论文引用与相关关系（list_paper_relations）

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 记录 / 统计，不返回正文

```json
{
  "record_id": "paper:10.48550/arxiv.1312.6764",
  "kind": "REFERENCES",
  "size": "5"
}
```

### 结构化数据定义与分类

读取接口字段或能力说明，无需论文 ID；之后可用 RSI 论文继续检索。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{}
```

### 检索结构化论文

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "query": "recursive self-improvement",
  "size": "3",
  "options": "{}"
}
```

### 跨论文检索实体

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "query": "AERA",
  "record_id": "1312.6764-675c3be456e6",
  "size": "5",
  "options": "{}"
}
```

### 从实体线索找论文

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "query": "AERA",
  "size": "5",
  "options": "{\"entity_types\":[\"Contribution\"]}"
}
```

### 已知论文的相关工作

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "size": "5",
  "options": "{}"
}
```

### 读取论文实体列表

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "size": "5",
  "options": "{}"
}
```

### 读取一个实体

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "child_id": "1312.6764-675c3be456e6::cmp:abstraction_mechanism",
  "options": "{\"include_relations\":true,\"relation_limit\":5}"
}
```

### 查询论文内部关系

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "size": "5",
  "options": "{\"include_context\":\"entities\"}"
}
```

### 读取一条内部关系

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "child_id": "1312.6764-675c3be456e6::0ce10c3051704062",
  "options": "{}"
}
```

### 引用数量与解析覆盖

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6"
}
```

### 读取参考文献记录

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "size": "5"
}
```

### 读取论文引用图数据

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "options": "{\"direction\":\"outbound\",\"depth\":1,\"max_nodes\":10,\"max_edges\":10}"
}
```

### 检索结构化证据

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "query": "",
  "size": "3",
  "options": "{\"groups\":[\"formula\",\"table_evidence\"]}"
}
```

### 读取一条证据

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "child_id": "1312.6764-675c3be456e6::022310aff03eda23"
}
```

### 按 marker 回查段落

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 原文片段 / 定位段落 · 非整篇全文

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "markers": "137",
  "size": "3",
  "options": "{\"window\":0}"
}
```

### 按 paragraph_id 回查段落

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 原文片段 / 定位段落 · 非整篇全文

```json
{
  "ids": "paragraph::1312.6764-675c3be456e6::000137",
  "size": "3",
  "options": "{\"window\":0}"
}
```

### 单篇论文内检索

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 原文片段 / 定位段落 · 非整篇全文

```json
{
  "record_id": "1312.6764-675c3be456e6",
  "query": "abstraction",
  "size": "3",
  "options": "{\"window\":0}"
}
```

### 批量补全出处上下文

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 原文片段 / 定位段落 · 非整篇全文

```json
{
  "options": "{\n  \"items\": [\n    {\n      \"schema_id\": \"1312.6764-675c3be456e6\",\n      \"marker_nums\": [\n        137\n      ]\n    }\n  ],\n  \"window\": 0,\n  \"max_segments_per_item\": 3\n}"
}
```

### 按目标读取结构材料包

用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。

标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。

[Bounded Recursive Self-Improvement](https://arxiv.org/abs/1312.6764)

**本功能返回边界：** 已抽取结构 · 原文需另行回查

```json
{
  "ids": "1312.6764-675c3be456e6",
  "kind": "reproduction",
  "options": "{\n  \"per_schema_entity_limit\": 5,\n  \"per_schema_relation_limit\": 5,\n  \"per_schema_attribute_limit\": 5,\n  \"per_schema_term_limit\": 5\n}"
}
```
