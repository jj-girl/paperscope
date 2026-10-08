import {
  SERVICE_OPERATIONS,
  type ServiceOperation,
  type ToolField,
} from "./serviceOperations";
import { API_CONTRACTS, type ApiContract } from "./apiResearch";

export type CatalogOperation = ServiceOperation & { contract: ApiContract };
const query: ToolField = {
  key: "query",
  label: "query（关键词，不做模型改写）",
};
const sid: ToolField = { key: "record_id", label: "schema_id", required: true };
const child = (label: string): ToolField => ({
  key: "child_id",
  label,
  required: true,
});
const size: ToolField = {
  key: "size",
  label: "size（1–100）",
  type: "number",
  value: "20",
  min: 1,
  max: 100,
};
const opt = (
  value = "{}",
  label = "附加参数 JSON（按当前接口约定）",
): ToolField => ({ key: "options", label, type: "json", value });
const schema = (
  id: string,
  title: string,
  fields: ToolField[],
): ServiceOperation => ({
  id,
  title,
  fields,
  help: "直接读取供应方的结构化数据与定位信息，不调用本地模型。",
  needsKey: true,
});
const schemaOperations: ServiceOperation[] = [
  schema("schema_capabilities", "结构化数据定义与分类", []),
  schema("schema_search", "检索结构化论文", [query, size, opt()]),
  schema("schema_entities_search", "跨论文检索实体", [
    query,
    { ...sid, required: false },
    size,
    opt(),
  ]),
  schema("schema_entity_papers", "从实体线索找论文", [
    { ...query, required: true },
    size,
    opt(),
  ]),
  schema("schema_related", "已知论文的相关工作", [
    sid,
    { ...size, max: 50, label: "size（1–50）" },
    opt(),
  ]),
  schema("schema_entities", "读取论文实体列表", [sid, size, opt()]),
  schema("schema_entity", "读取一个实体", [
    sid,
    child("entity_id"),
    opt('{"include_relations":true,"relation_limit":20}'),
  ]),
  schema("schema_relations", "查询论文内部关系", [
    { ...sid, required: false },
    size,
    opt('{"include_context":"entities"}'),
  ]),
  schema("schema_relation", "读取一条内部关系", [
    sid,
    child("relation_id"),
    opt(),
  ]),
  schema("schema_citation_summary", "引用数量与解析覆盖", [sid]),
  schema("schema_citations", "读取参考文献记录", [sid, size]),
  schema("schema_citation_graph", "读取论文引用图数据", [
    sid,
    opt('{"direction":"outbound","depth":1,"max_nodes":50,"max_edges":100}'),
  ]),
  schema("schema_evidence", "检索结构化证据", [
    { ...sid, required: false },
    query,
    size,
    opt('{"groups":["formula","table_evidence"]}'),
  ]),
  schema("schema_evidence_item", "读取一条证据", [sid, child("evidence_id")]),
  schema("schema_provenance", "按 marker 回查段落", [
    sid,
    {
      key: "markers",
      label: "marker_nums（逗号或换行分隔）",
      type: "numbers",
      required: true,
    },
    size,
    opt('{"window":1}'),
  ]),
  schema("schema_provenance_ids", "按 paragraph_id 回查段落", [
    {
      key: "ids",
      label: "paragraph_ids（每行一个）",
      type: "ids",
      required: true,
    },
    size,
    opt(),
  ]),
  schema("schema_text", "单篇论文内检索", [
    sid,
    { ...query, required: true },
    { ...size, max: 20, label: "top_k（1–20）", value: "5" },
    opt(),
  ]),
  schema("schema_hydrate", "批量补全出处上下文", [
    opt(
      '{"items":[],"window":1,"max_segments_per_item":5}',
      "items 与定位参数 JSON（items 需要 1–50 项）",
    ),
  ]),
  schema("schema_materials", "按目标读取结构材料包", [
    {
      key: "ids",
      label: "schema_ids（每行一个，最多 20 个）",
      type: "ids",
      required: true,
    },
    {
      key: "kind",
      label: "goal（材料选择策略）",
      type: "select",
      options: [
        ["overview", "overview"],
        ["survey", "survey"],
        ["benchmark", "benchmark"],
        ["method", "method"],
        ["reproduction", "reproduction"],
      ],
    },
    opt(),
  ]),
];
const basic = (provider: string): ServiceOperation => ({
  id: "search",
  title: "检索论文记录",
  help: "直接调用文献检索 API；输入原样发送，不生成阅读路径。",
  fields: [
    { ...query, required: true },
    { ...size, label: "本页读取数量（最多 20）", max: 20, value: "10" },
  ],
  basicSearch: true,
  needsKey: provider === "elicit",
});
const sciverseGeneral = SERVICE_OPERATIONS.sciverse.map((op) =>
  op.id === "catalog"
    ? {
        ...op,
        fields: [
          {
            key: "kind",
            label: "collection",
            type: "select",
            options: [
              ["papers", "papers"],
              ["authors", "authors"],
              ["sources", "sources"],
            ],
          } as ToolField,
        ],
      }
    : op.id === "metadata"
      ? { ...op, fields: [query, size, opt()] }
      : op,
);
const operations: Record<string, ServiceOperation[]> = {
  ...SERVICE_OPERATIONS,
  sciverse: [
    sciverseGeneral.find((o) => o.id === "metadata")!,
    ...sciverseGeneral.filter((o) => o.id !== "metadata"),
    {
      id: "meta_relations",
      title: "元数据论文引用与相关关系",
      help: "使用 unique_id，不是 doc_id 或 schema_id。",
      needsKey: true,
      fields: [
        { key: "record_id", label: "unique_id", required: true },
        {
          key: "kind",
          label: "relation",
          type: "select",
          options: [
            ["REFERENCES", "REFERENCES（参考文献）"],
            ["CITATIONS", "CITATIONS（施引）"],
            ["RELATED_WORKS", "RELATED_WORKS（相关）"],
          ],
        },
        size,
      ],
    },
    ...schemaOperations,
  ],
  openalex: [basic("openalex"), ...SERVICE_OPERATIONS.openalex],
  europepmc: [
    basic("europepmc"),
    {
      id: "fulltext",
      title: "读取开放全文 XML",
      help: "只读取可用正文，不生成总结。",
      fields: [
        {
          key: "record_id",
          label: "PMCID（例如 PMC11706764）",
          required: true,
        },
      ],
      directPath: "/api/literature/europepmc/fulltext/",
    },
    ...SERVICE_OPERATIONS.europepmc,
  ],
  semantic_scholar: [
    basic("semantic_scholar"),
    ...SERVICE_OPERATIONS.semantic_scholar,
    {
      id: "recommendations",
      title: "读取相关推荐",
      help: "返回相关性建议，不表示引用。",
      fields: [{ key: "record_id", label: "paperId（40 位）", required: true }],
      directPath: "/api/literature/semantic_scholar/papers/",
    },
  ],
  elicit: [basic("elicit"), ...SERVICE_OPERATIONS.elicit],
};

export const API_OPERATIONS: Record<string, CatalogOperation[]> =
  Object.fromEntries(
    Object.entries(operations).map(([source, ops]) => [
      source,
      ops.map((op) => {
        const contract = API_CONTRACTS[source]?.[op.id];
        if (!contract)
          throw new Error(`Missing API contract: ${source}/${op.id}`);
        return { ...op, contract };
      }),
    ]),
  );
