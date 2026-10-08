# PaperScope · 文献接口实验台

[English](README.md) · [服务来源与接口完整对照](docs/SOURCE_COMPARISON.md) · [数据库范围与 API 输入输出](docs/API_REFERENCE_RESEARCH.md) · [OA 与全文数量核验](docs/COUNT_AUDIT.md) · [接入与验证状态](docs/SOURCE_CAPABILITIES.md) · [可选 AI](docs/SHARED_AI.md)

PaperScope 用同一个网页探索 **Sciverse、PubMed、Europe PMC、OpenAlex、Semantic Scholar 和 Elicit** 的数据接口。它让数据库覆盖范围、数据粒度和接口输入输出直接可见，帮助判断每个来源适合什么工作。

默认不调用使用者配置的大模型。选择 API 按钮只切换表单；填写参数后点击运行才请求数据。旧 FrontierLens 阅读器、图谱页面、主题探索与自动导读后端已从当前源码删除。

每个功能都附 RSI 参数示例与字段说明，可一键填入但不会自动执行。论文结果分别显示外部全文入口、可获取的 XML/PDF 和成功取回的正文；实体注释与出处段落使用独立展示。规模说明附统计口径与来源。参见 [RSI 功能示例](docs/RSI_EXAMPLES.md)。

## 使用流程

1. **选来源**：查看数据库覆盖、标识符、数据粒度和访问限制。
2. **选 API**：按钮标出原生请求方法与路径，并说明输入、输出与模型依赖。
3. **填写参数**：数据连接设置独立于模型配置；缺少数据 Key 时有明确入口。
4. **查看结果**：浏览记录、结构化字段、分组统计、引用边或可获取的文件与正文。
5. **对照与导出**：在数据库范围对照表中比较服务，按需导出本次返回结果。

六个来源共 67 个操作入口。一个按钮可能组合多个端点，也可能与另一个按钮共用端点；这不代表实现了所有供应商 API。

| 来源 | 不调用应用侧 LLM 时的主要工作 |
| --- | --- |
| Sciverse | 元数据、原文全文/片段、Schema 实体关系、证据、出处回查、引用和结构材料包 |
| PubMed | 生物医学书目、摘要、MeSH、筛选、关联 ID、检索历史集合与批量读取 |
| Europe PMC | 生命科学记录、可获取的开放全文 XML、实体标注、引用和数据库链接 |
| OpenAlex | 跨学科学术对象、完整查询聚合、作者机构与引用探索、部分 PDF/TEI 文件 |
| Semantic Scholar | 论文与作者、参考文献、施引、推荐与批量读取 |
| Elicit | 论文检索、已有任务状态及产物；生成任务默认禁用 |

元数据命中不保证有全文；全文存在不保证有 Schema。Sciverse 的 `unique_id`、`doc_id`、`schema_id` 不可互换。供应方预先抽取的结构、服务端检索模型与本应用调用 LLM 是不同层次，界面分别标明。

Sciverse 原文读取新增参数条：选择全文或片段，片段可设置位置和长度；结果按同一文档对照实际返回量。见 [全文与片段读取](docs/CONTENT_READ_MODES.md)。

## 安装运行

需要 Python 3.11+（推荐 3.12）、[uv](https://docs.astral.sh/uv/)、Node.js 22.12+ 或 24+、npm 和 make。

```bash
git clone https://github.com/jj-girl/paperscope.git
cd paperscope
./run.sh setup
```

在两个终端分别运行：

```bash
./run.sh backend
```

```bash
./run.sh frontend
```

访问 **http://127.0.0.1:3040**。后端为 8040，前端代理 API；两个服务都需要运行。远程使用可在自己的电脑执行：

```bash
ssh -N -L 3040:127.0.0.1:3040 USER@SERVER
```

## 数据连接与可选 AI

**仓库不包含 API Key、账户凭据、运行结果或论文数据集。** 在各来源的“数据连接设置”填写自己的凭据。

- PubMed、Europe PMC 可匿名使用，NCBI Key 可选。
- OpenAlex 的内容文件需要 Key；实际访问、额度与计费以账户和接口响应为准。
- Semantic Scholar 匿名访问可能持续限流；429 不代表没有文献。
- Sciverse 需要数据 Token，但读取数据不要求模型 Key。
- Elicit 需要相应付费 API 权限，不配置不影响其他来源。

“启用 AI 扩展（可选）”默认关闭。开启后可配置独立模型，对支持的论文结果做导读、比较、问答、筛选、抽取和综述草稿；它不是已删除的旧阅读器。Elicit 的生成式任务也需显式开启该开关，使用的是 Elicit 自己的服务权限。切换来源或保存配置不会启动模型任务。

配置写入本机 `local.config*.json`，Git 默认忽略，并在支持的平台上设置为仅所有者可读写。数据和模型调用可能按账户计费。本应用面向本地单用户，见 [SECURITY.md](SECURITY.md)。

## 开发与验证

```bash
./run.sh lint test build
python3 scripts/check_publication.py
node scripts/export_api_reference.mjs
```

测试使用模拟服务，不要求真实密钥。真实调用验收是小规模样例，不等于完整覆盖或检索质量排名，见 [验证状态](docs/SOURCE_CAPABILITIES.md)。

## 来源与许可

PaperScope 基于 [FrontierLens 固定版本](https://github.com/Shannon4Science/sciverse-frontier-lens/tree/e67f0b2a0f940bd56e1b4b3f444c21ff3210e54f) 演化而来，曾用名 FrontierLens Multisource。保留必要的上游署名与 [LICENSE](LICENSE)、[NOTICE](NOTICE)；旧产品界面和流程不再随源码保留。

上游许可证标题为 Apache License 2.0，但第 6、9 条与标准文本不同，不能直接宣称标准 Apache-2.0。详见 [许可证说明](docs/LICENSE_NOTE.md) 和 [来源记录](docs/UPSTREAM.md)。代码许可与文献内容的使用权限分别适用。
