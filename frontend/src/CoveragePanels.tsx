import { COVERAGE } from "./coverageProfiles";
import { RESEARCH_DATE, SOURCE_RESEARCH } from "./apiResearch";

export function CoveragePanels({ source }: { source: string }) {
  const p = SOURCE_RESEARCH[source],
    coverage = COVERAGE[source];
  return (
    <>
      <section
        className={`source-access-banner access-${source}`}
        aria-label="全文获取边界"
      >
        <span>全文获取方式</span>
        <h2>{coverage.access}</h2>
        <p>{coverage.summary}</p>
        <strong>OA 标记 ≠ 本接口有全文文件 ≠ 本页已读取正文</strong>
      </section>
      <section
        className="coverage-panels"
        aria-label="收录来源、规模与返回内容"
      >
        <div>
          <h2>收录哪些来源</h2>
          <p>{coverage.sources}</p>
          <details>
            <summary>学科和接口覆盖范围</summary>
            <p>{p.scope}</p>
          </details>
        </div>
        <div>
          <h2>记录与全文各有多少</h2>
          <ul className="coverage-metrics">
            {coverage.metrics.map((m) => (
              <li key={m.label}>
                <span>{m.label}</span>
                <strong>{m.value}</strong>
                <small>
                  {m.basis}{" "}
                  <a href={m.url} target="_blank" rel="noopener noreferrer">
                    统计依据 ↗
                  </a>
                </small>
              </li>
            ))}
          </ul>
          <p className="source-muted">
            核对于 {RESEARCH_DATE}。{" "}
            <a
              href="https://github.com/jj-girl/paperscope/blob/main/docs/COUNT_AUDIT.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              统计口径与复核命令 ↗
            </a>
          </p>
        </div>
        <div>
          <h2>接口返回什么</h2>
          <div className="api-tags">
            {p.granularity.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
          <p>{p.identifiers}</p>
          <p>{p.boundary}</p>
          <details>
            <summary>模型依赖</summary>
            <p>{p.modelBoundary}</p>
          </details>
        </div>
      </section>
    </>
  );
}
export function CoverageComparison({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  return (
    <section className="api-overview">
      <h1>收录来源、规模与全文获取对照</h1>
      <p>
        区分“找到文献”“能跳转原文”“API
        能获取文件”和“已在本页读到正文”。以下规模是带口径的资料快照，非实时计数。
      </p>
      <div className="api-scope-table">
        <table>
          <thead>
            <tr>
              <th>服务</th>
              <th>收录来源</th>
              <th>记录 / 全文规模</th>
              <th>本应用的全文能力</th>
              <th>返回内容</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(COVERAGE).map(([id, c]) => (
              <tr key={id}>
                <td>
                  <button onClick={() => onSelect(id)}>
                    {SOURCE_RESEARCH[id].name}
                  </button>
                </td>
                <td>{c.sources}</td>
                <td>
                  {c.metrics.map((m) => (
                    <p key={m.label}>
                      <strong>
                        {m.label}：{m.value}
                      </strong>
                      <br />
                      <small>
                        {m.basis}{" "}
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          依据 ↗
                        </a>
                      </small>
                    </p>
                  ))}
                </td>
                <td>
                  <strong>{c.access}</strong>
                  <p>{c.summary}</p>
                </td>
                <td>{SOURCE_RESEARCH[id].granularity.join("、")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
