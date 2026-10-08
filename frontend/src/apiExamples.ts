export type ApiExample = {
  title: string;
  description: string;
  values: Record<string, string>;
  basis: string;
  links: { label: string; url: string }[];
  prerequisite?: { operation: string; label: string };
};
export const RSI_SCHEMA = "1312.6764-675c3be456e6";
export const RSI_PMID = "42793863";
export const RSI_PMCID = "PMC13604973";
const bounded = {
  label: "Bounded Recursive Self-Improvement",
  url: "https://arxiv.org/abs/1312.6764",
};
const introspection = {
  label:
    "Self-Referential Introspection in Large Language Models: The Critical Threshold for Recursive Self-Improvement",
  url: "https://pubmed.ncbi.nlm.nih.gov/42793863/",
};
const dgm = {
  label:
    "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents（OpenAlex 返回版本）",
  url: "https://openalex.org/W4412505633",
};
const query = "recursive self-improvement";
const question =
  "What mechanisms enable recursive self-improvement in AI systems, and what evidence distinguishes self-modification from repeated prompting?";
const j = (value: unknown) => JSON.stringify(value, null, 2);
export function apiExample(source: string, op: string): ApiExample {
  if (source === "sciverse") {
    const examples: Record<string, Record<string, string>> = {
      metadata: {
        query: "bounded recursive self improvement",
        size: "3",
        options: "{}",
      },
      catalog: { kind: "papers" },
      evidence: {
        query: "How does AERA achieve bounded recursive self improvement?",
        size: "3",
        options: "{}",
      },
      content: {
        record_id:
          "675c3be456e605b07e515c6d52bb4244b0f22de4c32b5f4d11864a91f2c6a602",
        offset: "0",
      },
      resource: {
        record_id:
          "dt=2026-05-08/ht=22/c33392e84291d240d36c3847bf5fc07fe0e0612ce8e8d07477e2ea346748fe49.jpg",
      },
      meta_relations: {
        record_id: "paper:10.48550/arxiv.1312.6764",
        kind: "REFERENCES",
        size: "5",
      },
      schema_capabilities: {},
      schema_search: { query, size: "3", options: "{}" },
      schema_entities_search: {
        query: "AERA",
        record_id: RSI_SCHEMA,
        size: "5",
        options: "{}",
      },
      schema_entity_papers: {
        query: "AERA",
        size: "5",
        options: '{"entity_types":["Contribution"]}',
      },
      schema_related: { record_id: RSI_SCHEMA, size: "5", options: "{}" },
      schema_entities: { record_id: RSI_SCHEMA, size: "5", options: "{}" },
      schema_entity: {
        record_id: RSI_SCHEMA,
        child_id: `${RSI_SCHEMA}::cmp:abstraction_mechanism`,
        options: '{"include_relations":true,"relation_limit":5}',
      },
      schema_relations: {
        record_id: RSI_SCHEMA,
        size: "5",
        options: '{"include_context":"entities"}',
      },
      schema_relation: {
        record_id: RSI_SCHEMA,
        child_id: `${RSI_SCHEMA}::0ce10c3051704062`,
        options: "{}",
      },
      schema_citation_summary: { record_id: RSI_SCHEMA },
      schema_citations: { record_id: RSI_SCHEMA, size: "5" },
      schema_citation_graph: {
        record_id: RSI_SCHEMA,
        options:
          '{"direction":"outbound","depth":1,"max_nodes":10,"max_edges":10}',
      },
      schema_evidence: {
        record_id: RSI_SCHEMA,
        query: "",
        size: "3",
        options: '{"groups":["formula","table_evidence"]}',
      },
      schema_evidence_item: {
        record_id: RSI_SCHEMA,
        child_id: `${RSI_SCHEMA}::022310aff03eda23`,
      },
      schema_provenance: {
        record_id: RSI_SCHEMA,
        markers: "137",
        size: "3",
        options: '{"window":0}',
      },
      schema_provenance_ids: {
        ids: `paragraph::${RSI_SCHEMA}::000137`,
        size: "3",
        options: '{"window":0}',
      },
      schema_text: {
        record_id: RSI_SCHEMA,
        query: "abstraction",
        size: "3",
        options: '{"window":0}',
      },
      schema_hydrate: {
        options: j({
          items: [{ schema_id: RSI_SCHEMA, marker_nums: [137] }],
          window: 0,
          max_segments_per_item: 3,
        }),
      },
      schema_materials: {
        ids: RSI_SCHEMA,
        kind: "reproduction",
        options: j({
          per_schema_entity_limit: 5,
          per_schema_relation_limit: 5,
          per_schema_attribute_limit: 5,
          per_schema_term_limit: 5,
        }),
      },
    };
    if (!examples[op]) throw new Error(`Missing Sciverse example: ${op}`);
    return {
      title: "RSI 示例：Bounded Recursive Self-Improvement",
      description:
        op === "resource"
          ? "使用该论文正文返回的相对资源路径，不是任意网站 URL；示例是原文资源，不保证是研究结果图。"
          : ["catalog", "schema_capabilities"].includes(op)
            ? "读取接口字段或能力说明，无需论文 ID；之后可用 RSI 论文继续检索。"
            : "用同一篇 RSI 论文串联元数据 → Schema → 实体/关系 → 出处段落。各类 ID 不可互换。",
      values: examples[op],
      basis:
        "标识核验：2026-10-08，来自 Sciverse 实际返回；示例输入不保证未来仍有相同结果。",
      links: [bounded],
    };
  }
  if (source === "pubmed") {
    const values: Record<string, Record<string, string>> = {
      filtered_search: {
        query: '"recursive self-improvement"',
        year_from: "",
        year_to: "",
        publication_type: "",
        size: "5",
      },
      related: { record_id: RSI_PMID, kind: "similar", size: "5" },
      batch: { ids: RSI_PMID },
      history: { size: "5" },
    };
    if (!values[op]) throw new Error(`Missing PubMed example: ${op}`);
    return {
      title: "RSI 示例：大模型自省与递归自我改进",
      description:
        op === "history"
          ? "先运行高级检索，使用返回的 WebEnv 和 query_key。它们是会过期的检索会话值，不能填论文 ID；本页保留本次检索返回值。"
          : `PMID ${RSI_PMID} 是书目记录；PMCID ${RSI_PMCID} 是同文的 PMC 全文标识。此处只读取 PubMed 记录，不自动取全文。`,
      values: values[op],
      basis: "2026-10-08 已用 PubMed EFetch 验证题名、PMID、PMCID 与 DOI。",
      links: [introspection],
      ...(op === "history"
        ? {
            prerequisite: {
              operation: "filtered_search",
              label: "先执行高级检索，取得历史集合",
            },
          }
        : {}),
    };
  }
  if (source === "europepmc") {
    const values: Record<string, string> =
      op === "search"
        ? { query: '"recursive self-improvement"', size: "5" }
        : op === "fulltext"
          ? { record_id: RSI_PMCID }
          : {
              record_id:
                op === "annotations" ? `PMC:${RSI_PMCID}` : `MED:${RSI_PMID}`,
              size: "5",
            };
    return {
      title: "RSI 示例：同一论文的正文、注释与引用",
      description:
        op === "annotations"
          ? "使用 PMC 全文来源查询注释。此 RSI 论文已返回参考文献 DOI 等标识注释；不是每篇 AI 论文都会有基因/疾病标注。"
          : `全文 XML 填 ${RSI_PMCID}；引用等记录接口填 MED:${RSI_PMID}。全文标识和书目标识是同一论文的不同入口。`,
      values,
      basis:
        "2026-10-08 已验证检索、全文正文和注释；其他关联接口仍取决于其覆盖。",
      links: [
        introspection,
        {
          label: "Europe PMC 原文",
          url: `https://europepmc.org/articles/${RSI_PMCID}`,
        },
      ],
    };
  }
  if (source === "openalex") {
    const values: Record<string, string> =
      op === "search"
        ? { query: "Darwin Godel Machine self improving", size: "5" }
        : op === "aggregate"
          ? { query, group: "year" }
          : {
              record_id: op.startsWith("author")
                ? "A5101989330"
                : op.startsWith("institution")
                  ? "I141945490"
                  : "W4412505633",
              size: "5",
            };
    return {
      title: "RSI 示例：Darwin Gödel Machine",
      description: op.startsWith("author")
        ? "作者例为检索记录返回的 Jenny Zhang；作者集合不限于 RSI。"
        : op.startsWith("institution")
          ? "机构例为该记录关联的 University of British Columbia；机构论文集合不限于 RSI。"
          : "采用当前 OpenAlex 检索返回的作品记录；同名论文可能有多个出版/预印本版本。本记录标记有 PDF 与 TEI XML，获取还需要 Key。",
      values,
      basis:
        "2026-10-08 核实作品、作者、机构 ID 及 has_content 标记；文件须以实际获取结果确认。",
      links: [dgm],
    };
  }
  if (source === "semantic_scholar") {
    let values: Record<string, string> = {
      query: "Bounded Recursive Self-Improvement",
      size: "5",
    };
    let prerequisite: ApiExample["prerequisite"];
    let description =
      "先按完整题名搜索。匿名访问可能返回 429；示例没有虚构未核验的 paperId。";
    if (op === "batch") {
      values = { ids: "ARXIV:1312.6764" };
      description =
        "批量读取支持带前缀的外部标识。先用 arXiv ID 取得 paperId，再用于参考文献、施引和推荐。";
    } else if (op === "author_search") {
      values = { query: "Jürgen Schmidhuber", size: "5" };
      description =
        "这是示例论文的作者之一；同名结果需核对，不能把姓名当作 authorId。";
    } else if (["author", "author_works"].includes(op)) {
      values = { size: "5" };
      prerequisite = {
        operation: "author_search",
        label: "先搜索示例作者，复制 authorId",
      };
      description =
        "authorId 需从作者搜索结果复制；本次匿名接口限流，未获得可核验 ID，因此不填写猜测值。";
    } else if (["references", "citations", "recommendations"].includes(op)) {
      values = { size: "5" };
      prerequisite = {
        operation: "batch",
        label: "先批量读取 RSI 论文，复制 paperId",
      };
      description =
        "先用 ARXIV:1312.6764 读取记录，将返回的 40 位 paperId 填到此处。当前匿名访问未通过实时验收，不能承诺马上有结果。";
    }
    return {
      title: "RSI 示例：Bounded Recursive Self-Improvement",
      description,
      values,
      basis:
        "论文身份有公开来源；Semantic Scholar 匿名接口本次返回 429，未伪造 paperId / authorId。",
      links: [bounded],
      prerequisite,
    };
  }
  if (source === "elicit") {
    const create = ["search", "report", "review", "agent"].includes(op);
    const values: Record<string, string> = create
      ? { query: op === "search" ? query : question, size: "5", options: "{}" }
      : {
          kind: ["status", "resume"].includes(op) ? "report" : "agent",
          size: "5",
          format: "csv",
          ...(op === "message"
            ? {
                query:
                  "Compare bounded self-improvement and the Darwin Gödel Machine; separate source evidence from proposed mechanisms.",
              }
            : {}),
        };
    return {
      title: "RSI 研究任务示例",
      description: create
        ? "示例围绕 RSI 的机制与证据。填入不会执行；创建报告、综述或 Agent 需主动开启 AI 扩展及有效 Elicit API 权限，可能消耗额度。"
        : op === "sessions"
          ? "列出自己的已有任务，按 RSI 研究问题找回会话；不创建新任务。"
          : "sessionId 必须使用自己账户创建任务后返回的值；artifactId 从该会话的产物列表复制。示例不含虚构会话或他人的任务。",
      values,
      basis: "输入格式示例；没有 Elicit 付费权限，未做真实任务创建验证。",
      links: [
        bounded,
        { label: "Elicit API 文档", url: "https://docs.elicit.com/" },
      ],
      ...(!create && op !== "sessions"
        ? {
            prerequisite: {
              operation: op.startsWith("artifact_") ? "artifacts" : "sessions",
              label: op.startsWith("artifact_")
                ? "先查看会话产物，取得 artifactId"
                : "先查看已有任务，取得 sessionId",
            },
          }
        : {}),
    };
  }
  throw new Error(`Missing example source: ${source}`);
}
export const FIELD_HELP: Record<string, string> = {
  query:
    "关键词或检索式。RSI 此处指 recursive self-improvement；只填缩写可能检索到医学中的其他含义。",
  size: "限制本次返回数量，示例使用 3–5 条；它不是数据库总量。",
  ids: "一行一个标识，必须符合当前接口的 ID 类型。",
  child_id:
    "从当前 schema_id 的实体、关系或证据结果复制，不与其他论文的子对象混用。",
  markers: "出处标记 §137 填为数字 137，不是 PDF 页码。",
  options: "供应商原生附加参数的 JSON 对象；示例可直接填入后修改。",
  offset: "从第几个字符或记录继续读取；默认 0。具体单位见当前接口说明。",
  webenv: "由高级检索返回的历史会话标识，会过期；不使用固定假值。",
  query_key: "与同一 WebEnv 配套的查询键，由高级检索返回。",
  artifact_id: "在自己的 Elicit 会话产物列表中取得，不能用论文 ID 替代。",
  year_from: "可选的发表年份下限；留空不限制。",
  year_to: "可选的发表年份上限；留空不限制。",
};
export function fieldHelp(
  source: string,
  operation: string,
  key: string,
): string {
  if (key !== "record_id")
    return FIELD_HELP[key] || "选项限定本次查询或返回方式；可按示例选择。";
  if (source === "pubmed")
    return `PMID：PubMed 书目编号，例如 ${RSI_PMID}，不带 PMC 前缀。`;
  if (source === "europepmc")
    return operation === "fulltext"
      ? `PMCID：PMC 全文编号，例如 ${RSI_PMCID}，与 PMID 不同。`
      : `需要“来源:编号”，例如 MED:${RSI_PMID} 或 PMC:${RSI_PMCID}。`;
  if (source === "openalex")
    return operation.startsWith("author")
      ? "作者 ID 以 A 开头。示例来自所选 RSI 论文的作者记录。"
      : operation.startsWith("institution")
        ? "机构 ID 以 I 开头。示例机构论文并不限于 RSI。"
        : "作品 ID 以 W 开头；不等于 DOI，也不代表一定有文件。";
  if (source === "semantic_scholar")
    return operation.startsWith("author")
      ? "authorId 为作者搜索返回的数字编号。"
      : "paperId 为论文检索/批量读取返回的 40 位标识，不填 DOI 或 arXiv ID。";
  if (source === "elicit")
    return "自己账户的 sessionId；先创建或查询已有任务。";
  return operation === "content"
    ? "doc_id：正文检索/元数据返回的文本标识。"
    : operation === "resource"
      ? "file_name：正文中出现的资源相对路径，不是本机路径或任意 URL。"
      : operation === "meta_relations"
        ? "unique_id：元数据论文标识，不可用 schema_id 或 doc_id 代替。"
        : "schema_id：已结构化论文标识，由 Paper Schema 检索返回。";
}
