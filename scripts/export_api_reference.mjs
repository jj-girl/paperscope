import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "frontend/package.json"));
const { build } = require("esbuild");
const output = await build({
  stdin: {
    contents:
      'export { API_OPERATIONS } from "./apiOperations"; export { SOURCE_RESEARCH, RESEARCH_DATE } from "./apiResearch"; export { COVERAGE } from "./coverageProfiles"; export { apiExample } from "./apiExamples"; export { operationContent } from "./contentAccess"; export { SOURCE_DESCRIPTIONS } from "./sourceDescriptions";',
    resolveDir: path.join(root, "frontend/src"),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
});
const module = { exports: {} };
new Function("module", "exports", output.outputFiles[0].text)(
  module,
  module.exports,
);
const {
  API_OPERATIONS,
  SOURCE_RESEARCH,
  RESEARCH_DATE,
  COVERAGE,
  apiExample,
  operationContent,
  SOURCE_DESCRIPTIONS,
} = module.exports;
const cell = (value) =>
  String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const modes = {
  data: "数据读取，无需本地 LLM",
  retrieval: "服务端检索模型；无需本地 LLM",
  precomputed: "供应方预处理结果；无需本地 LLM",
  generation: "供应商生成式 AI 任务，默认不执行",
  "task-state": "读取/控制已有任务；不调用本地 LLM",
};
const lines = [
  "# 文献 API：数据库范围、数据粒度与输入输出",
  "",
  `官方资料核对日期：${RESEARCH_DATE}。本表与界面按钮使用同一份定义生成。`,
  "",
  "## 本页的“无 LLM”是什么意思",
  "",
  "纯 API 模式不调用使用者配置的模型，不生成阅读顺序、总结或推测缺失事实。供应方可能使用检索模型或预先抽取结构，这与本应用调用 LLM 是不同层次。Elicit 等供应商的生成式任务单独标注，默认只能查看接口说明而不能启动。",
  "",
  "Sciverse 的元数据、正文与 Paper Schema 是不同覆盖范围。材料包是按目标选取已有结构，不是自动生成的综述。返回的 unique_id、doc_id 和 schema_id 不能直接互换。",
  "",
  "## 数据库范围对照",
  "",
  "| 服务 | 数据库范围 | 数据粒度 | 主要边界 |",
  "| --- | --- | --- | --- |",
];
for (const p of Object.values(SOURCE_RESEARCH))
  lines.push(
    `| ${p.name} | ${cell(p.scope)} | ${cell(p.granularity.join("、"))} | ${cell(p.boundary)} |`,
  );
lines.push(
  "",
  "## 收录来源、规模与全文获取",
  "",
  "核对日期与数据口径分别标注。规模快照不等于实时计数；OA 标记、外部链接、API 文件存在及本页已读取是不同状态。",
  "",
  "| 服务 | 收录来源 | 记录与全文规模 | 本应用全文边界 |",
  "| --- | --- | --- | --- |",
);
for (const [id, p] of Object.entries(COVERAGE))
  lines.push(
    `| ${SOURCE_RESEARCH[id].name} | ${cell(p.sources)} | ${p.metrics.map((m) => `${m.label}：**${m.value}**；${m.basis} [依据](${m.url})`).join("<br>")} | ${cell(p.access + "。" + p.summary)} |`,
  );
lines.push(
  "",
  "每项功能均附 RSI 示例和字段说明，见 [RSI_EXAMPLES.md](RSI_EXAMPLES.md)。示例填入不会发起请求。",
);
for (const [source, p] of Object.entries(SOURCE_RESEARCH)) {
  lines.push(
    "",
    `## ${p.name}`,
    "",
    p.identifiers,
    "",
    p.modelBoundary,
    "",
    p.docs.map((d) => `[${d.label}](${d.url})`).join(" · "),
    "",
    "| 按钮/操作 | 原生 API 名称 | 输入 | 输出 | 数据粒度 | 模型依赖 |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const op of API_OPERATIONS[source]) {
    const c = op.contract;
    lines.push(
      `| ${cell(op.title)} | ${c.apis.map((api) => "`" + api + "`").join("<br>")} | ${cell(c.input)} | ${cell(c.output)} | ${cell(c.granularity)} | ${cell(modes[c.model])} |`,
    );
  }
}
lines.push(
  "",
  "## 使用与解释规则",
  "",
  "- 表中列的是本应用接入的操作，不是各服务所有产品接口的穷举。Sciverse Paper Schema 覆盖其文档中的 18 个公开操作；paragraph_id 与 marker 两种回查模式分成两个按钮。",
  "- 表单字段会映射到对应的原生参数，例如本应用 size 映射到某些服务的 per_page/page_size。复合操作会明确列出多个原生端点，如 PubMed ESearch → EFetch。",
  "- 元数据记录、摘要、全文、实体提及、科研关系、证据值和模型生成文本是不同粒度；同名字段和同名实体不代表可直接合并。",
  "- 不用本地 LLM 不等于无需 API Key，也不代表供应商内部没有使用机器学习。数据权限、内容可用性、配额和许可证需分别判断。",
  "- 检索结果总数会受语料范围、查询语法、索引和时间影响。PubMed 与 Europe PMC 等来源存在重叠，不能把来源数量当作独立证据数量。",
  "- 本应用列出带来源和口径的规模快照；官方页面数字与当前 API 命中数不能作为同一时点的排名。",
  "- Elicit 的报告、抽取、Agent 创建/继续/恢复会执行供应商 AI；其状态、事件与产物读取只是取回既有任务信息。",
  "",
  "## 资料与实现",
  "",
  "来源说明位于 `frontend/src/apiResearch.ts`，按钮与表单定义位于 `frontend/src/apiOperations.ts`。运行 `node scripts/export_api_reference.mjs` 可重新生成本文。",
  "",
);
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(
  path.join(root, "docs/API_REFERENCE_RESEARCH.md"),
  lines.join("\n"),
);
console.log(
  `Generated API reference: ${Object.keys(SOURCE_RESEARCH).length} providers, ${Object.values(API_OPERATIONS).reduce((n, a) => n + a.length, 0)} operation buttons.`,
);

const examples = [
  "# RSI 功能示例",
  "",
  `核验日期：${RESEARCH_DATE}。RSI 指 Recursive Self-Improvement（递归自我改进）。本页与各功能的“填入 RSI 示例”使用同一份数据。`,
  "",
  "固定论文标识来自实际记录。Semantic Scholar 本次匿名调用返回 429；Elicit 未做付费任务验证。sessionId、artifactId、WebEnv、query_key 等运行时标识须由自己的前一步请求返回，不提供虚构固定值。",
  "",
];
for (const [source, ops] of Object.entries(API_OPERATIONS)) {
  examples.push(`## ${SOURCE_RESEARCH[source].name}`, "");
  for (const op of ops) {
    const ex = apiExample(source, op.id);
    const allowed = new Set(op.fields.map((f) => f.key));
    const values = Object.fromEntries(
      Object.entries(ex.values).filter(([k]) => allowed.has(k)),
    );
    examples.push(
      `### ${op.title}`,
      "",
      ex.description,
      "",
      ex.basis,
      "",
      ex.links.map((l) => `[${l.label}](${l.url})`).join(" · "),
      "",
      "**本功能返回边界：** " + operationContent(source, op.id).label,
      "",
    );
    if (ex.prerequisite)
      examples.push("前一步：" + ex.prerequisite.label + "。", "");
    examples.push("```json", JSON.stringify(values, null, 2), "```", "");
  }
}
fs.writeFileSync(path.join(root, "docs/RSI_EXAMPLES.md"), examples.join("\n"));

const comparison = [
  "# 文献服务：上游来源、范围、粒度、API 输入输出与全文覆盖",
  "",
  `官方资料核对日期：${RESEARCH_DATE}。数量沿用同日记录的官方平台/API 快照，详见 [数量核验与 curl 请求](COUNT_AUDIT.md)。`,
  "",
  "本文区分供应商整体能力、单个 API 的响应和 PaperScope 已接入的功能。上游来源指数据从哪里来；数据库范围指能检索哪些类型和学科；粒度指返回记录、段落、实体还是文件；全文覆盖指哪些记录实际具有可获取正文。相同文献可能出现在多个服务中，不能把服务数当作独立证据数。",
  "",
  "## 上游来源总表",
  "",
  "| 服务 | 已核实的来源说明 | 确认边界 |",
  "| --- | --- | --- |",
];
for (const [id, d] of Object.entries(SOURCE_DESCRIPTIONS)) {
  const refs = [...new Set(d.upstream.map((r) => r.url))]
    .map((url, i) => `[官方依据 ${i + 1}](${url})`)
    .join(" · ");
  comparison.push(
    `| ${SOURCE_RESEARCH[id].name} | ${cell(d.upstreamSummary)} ${refs} | ${cell(d.upstreamLimit)} |`,
  );
}
comparison.push(
  "",
  "## 数据库范围与数据粒度",
  "",
  "| 服务 | 数据库范围 | 数据粒度：具体拿到什么 |",
  "| --- | --- | --- |",
);
for (const [id, d] of Object.entries(SOURCE_DESCRIPTIONS))
  comparison.push(
    `| ${SOURCE_RESEARCH[id].name} | ${cell(d.scope)} | ${cell(d.granularity)} |`,
  );
comparison.push(
  "",
  "## 全文覆盖度与本应用接入范围",
  "",
  "比例仅对同一次 API 查询、同一默认记录集合计算；有全文标记不是下载成功率。Sciverse 官网不同口径之间未计算比例。PubMed 免费全文入口比例不写作严格 OA 比例。",
  "",
  "| 服务 | 全文覆盖度 | PaperScope 当前行为 |",
  "| --- | --- | --- |",
);
for (const [id, d] of Object.entries(SOURCE_DESCRIPTIONS))
  comparison.push(
    `| ${SOURCE_RESEARCH[id].name} | ${cell(d.fulltext)} | ${cell(d.implementation)} |`,
  );
for (const [id, d] of Object.entries(SOURCE_DESCRIPTIONS)) {
  comparison.push(
    "",
    `## ${SOURCE_RESEARCH[id].name}：来源明细与 API 输入输出`,
    "",
    "| 上游名称 | 是什么 | 提供什么 | 官方依据 |",
    "| --- | --- | --- | --- |",
  );
  for (const row of d.upstream)
    comparison.push(
      `| ${cell(row.name)} | ${cell(row.explanation)} | ${cell(row.contribution)} | [说明](${row.url}) |`,
    );
  comparison.push(
    "",
    d.upstreamLimit,
    "",
    "下表为当前应用接入的 API 操作，非供应商所有接口的穷举。参数示例见 [RSI 功能示例](RSI_EXAMPLES.md)。",
    "",
    "| 功能及原生 API | 输入：提交什么 | 输出：返回什么 |",
    "| --- | --- | --- |",
  );
  for (const op of API_OPERATIONS[id])
    comparison.push(
      `| ${op.title}<br>${op.contract.apis.map((a) => "`" + a + "`").join("<br>")} | ${cell(op.contract.input)} | ${cell(op.contract.output)}；返回单位：${cell(op.contract.granularity)} |`,
    );
}
comparison.push(
  "",
  "## 需要特别区分的范围",
  "",
  "- OpenAlex 的默认主要记录集合叫 core，经过整理匹配，含义不是核心期刊。expansion 是另加的一批以数据集、仓储记录为主、字段通常较少的记录；all 合并两个集合。当前应用尚未提供切换。依据：[官方集合说明](https://help.openalex.org/data/works/corpus/)。",
  "- Crossref、DataCite 等是上游提供者；作者、机构、主题等是 API 的对象类型，二者不能混为一列。",
  "- Europe PMC 注释可来自摘要或正文；得到词语标注不意味着已得到全文。Elicit 的报告与抽取表是任务输出，也不等于原始论文全文。",
  "- Sciverse 已直接验证 OpenAlex 来源标识及样本论文的 arXiv 原文位置；完整采集名单、各源占比与精确 OA 总量仍未核实。请求与响应见 [Sciverse 来源 API 核验](SCIVERSE_SOURCE_AUDIT.md)。",
  "",
  "本说明由 `sourceDescriptions.ts`、`apiOperations.ts` 等界面定义生成，运行 `node scripts/export_api_reference.mjs` 更新，避免页面与文档采用不同口径。",
  "",
);
fs.writeFileSync(
  path.join(root, "docs/SOURCE_COMPARISON.md"),
  comparison.join("\n"),
);
