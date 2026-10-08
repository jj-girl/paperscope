# FrontierLens Multisource

[English](README.md) · [来源能力](docs/SOURCE_CAPABILITIES.md) · [共享 AI](docs/SHARED_AI.md)

基于 [FrontierLens 指定版本](https://github.com/Shannon4Science/sciverse-frontier-lens/tree/e67f0b2a0f940bd56e1b4b3f444c21ff3210e54f) 修改和扩展的本地文献研究应用，使用 Python 后端与 React 前端。它按不同文献接口的能力设计工作区，并让各来源复用同一份可选大模型配置。

## 来源与用途

| 来源 | 主要用途 |
| --- | --- |
| Sciverse | 结构化阅读、论文内实体关系、出处回查、元数据与证据检索 |
| PubMed | 医学文献筛选、MeSH、年份/文献类型筛选、关联记录和批量读取 |
| Europe PMC | 开放正文、实体标注、引用及数据库关联阅读 |
| OpenAlex | 完整查询聚合、作者机构探索、引用图、PDF/TEI 获取 |
| Semantic Scholar | 相关工作、参考文献与施引、推荐、作者和批量查询 |
| Elicit | 可选付费接入：筛选、抽取、报告和研究 Agent 任务 |

共享 AI 支持检索词规划、导读、比较、材料问答、筛选建议、带支持摘录的字段抽取，以及带引用的综述草稿。结果可导出 CSV、JSON 或 Markdown。筛选和结论仍需人工核对。

## 安装运行

需要 Python 3.11+（推荐 3.12）、[uv](https://docs.astral.sh/uv/)、Node.js 22.12+ 或 24+、npm 和 make。

```bash
git clone https://github.com/jj-girl/frontierlens-multisource.git
cd frontierlens-multisource
./run.sh setup
```

在两个终端分别运行：

```bash
./run.sh backend
```

```bash
./run.sh frontend
```

访问 **http://127.0.0.1:3040**。前后端分别使用 3040、8040 端口，均需运行。缓存和临时文件由脚本放在项目内的忽略目录。

远程机器可通过 SSH 转发：

```bash
ssh -N -L 3040:127.0.0.1:3040 USER@SERVER
```

## 密钥与账户

**本仓库不包含任何 API Key、账户凭据、论文数据集或模型密钥。** 使用者需在自己的连接设置中填写。

- PubMed、Europe PMC 可以先匿名使用；NCBI Key 可选。
- OpenAlex 基础查询可匿名尝试，Content 文件获取需要 Key。
- Semantic Scholar 匿名调用可能遇到限流，部分操作可能需要认证。
- Sciverse 需要数据 Token；共享模型使用另一组独立的模型地址、模型名与 API Key。
- Elicit 是可选的付费 API 集成，不配置它也能使用其他来源和本应用自己的 AI 流程。

页面提供“打开连接设置”和“共享模型设置”。真实配置只写入本地 `local.config*.json`，Git 默认忽略，并在支持的平台上设置为仅所有者可读写。`.env.example` 只列变量名，值均为空。

数据服务、模型和研究任务可能按账户规则计费。切换来源不会自动创建研究任务。API 接口和代码许可证不授予论文内容的额外使用权。

## 使用边界

不同来源的覆盖与字段不相同；缺失信息保持缺失。引用、推荐与论文内部关系分别展示；样本概览与完整查询聚合分别标注。AI 引用必须来自输入论文集合，非空抽取字段须附能匹配对应输入材料的摘录；这不等于科学结论已经核验。

筛选和抽取每次最多八篇、最多五个字段；其他分析每次最多二十篇。摘要与正文片段有长度限制，界面说明本次依据。详见 [共享 AI 工作流](docs/SHARED_AI.md)。

这是本地单用户应用。公开源代码不等于可以直接把未加认证的运行服务部署到公网；运行边界见 [SECURITY.md](SECURITY.md)。

## 验证与贡献

```bash
./run.sh lint test build
python3 scripts/check_publication.py
```

自动化测试不需要真实 API Key。模拟合同测试与真实在线验收分开记录，见 [来源能力与验证状态](docs/SOURCE_CAPABILITIES.md)。

保留上游 Apache-2.0 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)，并标注了修改。上游来源见 [UPSTREAM](docs/UPSTREAM.md)。欢迎提交有测试和来源说明的改进。
