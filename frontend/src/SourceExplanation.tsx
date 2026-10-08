import { useState } from "react";
import { SOURCE_DESCRIPTIONS } from "./sourceDescriptions";
import { SOURCE_RESEARCH } from "./apiResearch";
import { API_OPERATIONS } from "./apiOperations";

export function UpstreamTable({ source }: { source: string }) {
  const description = SOURCE_DESCRIPTIONS[source];
  return (
    <>
      <div className="api-scope-table upstream-table">
        <table>
          <thead>
            <tr>
              <th>上游来源</th>
              <th>它是什么</th>
              <th>向当前服务提供什么</th>
              <th>官方依据</th>
            </tr>
          </thead>
          <tbody>
            {description.upstream.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.explanation}</td>
                <td>{row.contribution}</td>
                <td>
                  <a href={row.url} target="_blank" rel="noopener noreferrer">
                    查看官方说明 ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="source-muted">{description.upstreamLimit}</p>
      {source === "sciverse" && (
        <a
          href="https://github.com/jj-girl/paperscope/blob/main/docs/SCIVERSE_SOURCE_AUDIT.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          查看实际 API 请求与响应摘录 ↗
        </a>
      )}
    </>
  );
}
export function SourceExplanation({ source }: { source: string }) {
  const d = SOURCE_DESCRIPTIONS[source];
  return (
    <details className="source-explanation">
      <summary>
        {SOURCE_RESEARCH[source].name}：上游来源明细与全文覆盖说明
      </summary>
      <UpstreamTable source={source} />
      <h3>全文覆盖到哪里</h3>
      <p>{d.fulltext}</p>
      <h3>PaperScope 当前接入范围</h3>
      <p>{d.implementation}</p>
    </details>
  );
}
export function ApiInputOutputTable({ source }: { source: string }) {
  return (
    <div className="api-scope-table api-io-table">
      <table>
        <thead>
          <tr>
            <th>功能与 API 名称</th>
            <th>提交什么（输入）</th>
            <th>得到什么（输出）</th>
          </tr>
        </thead>
        <tbody>
          {API_OPERATIONS[source].map((op) => (
            <tr key={op.id}>
              <td>
                <strong>{op.title}</strong>
                {op.contract.apis.map((api) => (
                  <code key={api}>{api}</code>
                ))}
              </td>
              <td>{op.contract.input}</td>
              <td>
                {op.contract.output}
                <p className="source-muted">
                  返回单位：{op.contract.granularity}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function DetailedComparisonTables() {
  const [source, setSource] = useState("sciverse");
  return (
    <section className="detailed-comparison">
      <h2>各来源的收录范围与返回内容</h2>
      <div className="api-scope-table">
        <table>
          <thead>
            <tr>
              <th>服务</th>
              <th>数据库范围</th>
              <th>数据粒度：具体返回什么</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SOURCE_DESCRIPTIONS).map(([id, d]) => (
              <tr key={id}>
                <td>{SOURCE_RESEARCH[id].name}</td>
                <td>{d.scope}</td>
                <td>{d.granularity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>全文覆盖度与当前接入范围</h2>
      <div className="api-scope-table">
        <table>
          <thead>
            <tr>
              <th>服务</th>
              <th>全文覆盖说明</th>
              <th>PaperScope 当前行为</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SOURCE_DESCRIPTIONS).map(([id, d]) => (
              <tr key={id}>
                <td>{SOURCE_RESEARCH[id].name}</td>
                <td>{d.fulltext}</td>
                <td>{d.implementation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="api-picker-heading">
        <h2>逐个 API 的输入与输出、上游来源明细</h2>
        <label>
          选择要展开的服务{" "}
          <select
            aria-label="选择接口说明来源"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {Object.entries(SOURCE_RESEARCH).map(([id, p]) => (
              <option key={id} value={id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <h3>{SOURCE_RESEARCH[source].name} 上游来源</h3>
      <UpstreamTable source={source} />
      <h3>{SOURCE_RESEARCH[source].name} API 输入输出</h3>
      <ApiInputOutputTable source={source} />
    </section>
  );
}
