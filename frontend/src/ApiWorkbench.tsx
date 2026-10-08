import { useEffect, useRef, useState } from "react";
import { API_OPERATIONS } from "./apiOperations";
import { RESEARCH_DATE, SOURCE_RESEARCH } from "./apiResearch";
import {
  DataConnection,
  OptionalModelConnection,
  readJson,
} from "./SourceConnections";
import ServiceTools from "./ServiceTools";
import "./styles.css";
import "./sources.css";
import "./api-workbench.css";

type Connection = { id: string; configured: boolean; requires_key: boolean };
const MODEL_LABELS = {
  data: "数据读取",
  retrieval: "服务端检索",
  precomputed: "预处理数据",
  generation: "服务端 AI 任务",
  "task-state": "已有任务读取/控制",
};

export default function ApiWorkbench() {
  const [source, setSource] = useState(() => {
    const saved = localStorage.getItem("literature-api-source");
    return saved && SOURCE_RESEARCH[saved] ? saved : "sciverse";
  });
  const [operation, setOperation] = useState("");
  const [filter, setFilter] = useState("");
  const [overview, setOverview] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(false);
  const [modelSettings, setModelSettings] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  async function refresh(signal?: AbortSignal) {
    try {
      const [other, sciverse] = await Promise.all([
        readJson<Connection[]>("/api/literature/providers", { signal }),
        readJson<{ configured: boolean }>("/api/settings/sciverse", { signal }),
      ]);
      if (!signal?.aborted) {
        setConnections([
          ...other,
          {
            id: "sciverse",
            configured: sciverse.configured,
            requires_key: true,
          },
        ]);
        setError("");
      }
    } catch (e) {
      if (!signal?.aborted)
        setError(e instanceof Error ? e.message : "连接状态读取失败");
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, []);
  const profile = SOURCE_RESEARCH[source];
  const ops = API_OPERATIONS[source];
  const selected = ops.find((o) => o.id === operation) || ops[0];
  const connection = connections.find((c) => c.id === source);
  const configured = connection?.configured || false;
  const visible = ops.filter((o) =>
    `${o.title} ${o.contract.apis.join(" ")} ${o.contract.granularity} ${o.contract.family}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  function choose(id: string) {
    setSource(id);
    setOperation("");
    setFilter("");
    setSettings(false);
    setOverview(false);
    localStorage.setItem("literature-api-source", id);
  }
  function openSettings() {
    setSettings(true);
    requestAnimationFrame(() =>
      settingsRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      }),
    );
  }
  return (
    <div className="api-workbench">
      <header className="api-topbar">
        <div>
          <strong>文献接口实验台</strong>
          <span>范围 · 粒度 · 输入 · 输出</span>
        </div>
        <span className={`api-mode ${aiEnabled ? "optional" : ""}`}>
          {aiEnabled ? "AI 扩展已显式开启" : "纯 API 模式 · 不调用本地 LLM"}
        </span>
        <button onClick={() => setOverview((v) => !v)}>
          {overview ? "返回接口" : "数据库范围对照"}
        </button>
        <label className="api-check">
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => {
              setAiEnabled(e.target.checked);
              if (!e.target.checked) setModelSettings(false);
            }}
          />
          启用 AI 扩展（可选）
        </label>
        {aiEnabled && (
          <button onClick={() => setModelSettings((v) => !v)}>
            可选模型设置
          </button>
        )}
      </header>
      <div className="api-layout">
        <nav className="api-sources" aria-label="选择文献来源">
          <p>选择数据服务</p>
          {Object.entries(SOURCE_RESEARCH).map(([id, p]) => (
            <button
              key={id}
              aria-pressed={source === id && !overview}
              onClick={() => choose(id)}
            >
              <strong>{p.name}</strong>
              <span>{p.granularity.slice(0, 2).join(" · ")}</span>
              <small>{API_OPERATIONS[id].length} 个操作入口</small>
            </button>
          ))}
          <p className="api-fineprint">
            范围说明核对于 {RESEARCH_DATE}
            。记录数会变化；不能用单次命中数给数据库排名。
          </p>
        </nav>
        <main className="api-main">
          {error && (
            <p className="source-error" role="alert">
              {error}
              <button onClick={() => refresh()}>重新读取状态</button>
            </p>
          )}
          {modelSettings && aiEnabled && <OptionalModelConnection />}
          {overview ? (
            <section className="api-overview">
              <h1>文献数据库范围与数据粒度</h1>
              <p>
                检索到记录、能取得全文、具有结构化实体和能生成回答，是不同能力。下面按各服务官方接口说明区分。
              </p>
              <div className="api-scope-table">
                <table>
                  <thead>
                    <tr>
                      <th>服务</th>
                      <th>数据库范围</th>
                      <th>返回粒度</th>
                      <th>不用本地 LLM 时的边界</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(SOURCE_RESEARCH).map(([id, p]) => (
                      <tr key={id}>
                        <td>
                          <button onClick={() => choose(id)}>{p.name}</button>
                        </td>
                        <td>{p.scope}</td>
                        <td>{p.granularity.join("、")}</td>
                        <td>
                          {p.modelBoundary}
                          <p>{p.boundary}</p>
                          {p.docs.map((d) => (
                            <a
                              key={d.url}
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {d.label}
                            </a>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <>
              <header className="api-source-heading">
                <div>
                  <p className="api-eyebrow">DATA SOURCE / {profile.name}</p>
                  <h1>{profile.name} 接口能力</h1>
                </div>
                <button onClick={openSettings}>
                  数据连接设置 ·{" "}
                  {configured
                    ? "已保存密钥"
                    : connection?.requires_key
                      ? "需要配置"
                      : source === "europepmc"
                        ? "无需密钥"
                        : "可匿名尝试"}
                </button>
              </header>
              <section className="api-scope" aria-label="数据库范围与粒度">
                <div>
                  <h2>数据库范围</h2>
                  <p>{profile.scope}</p>
                </div>
                <div>
                  <h2>数据粒度</h2>
                  <div className="api-tags">
                    {profile.granularity.map((g) => (
                      <span key={g}>{g}</span>
                    ))}
                  </div>
                  <p>{profile.identifiers}</p>
                </div>
                <div>
                  <h2>不调用本地 LLM 的能力边界</h2>
                  <p>{profile.modelBoundary}</p>
                  <p>{profile.boundary}</p>
                </div>
              </section>
              <div className="api-references">
                <span>官方依据 · 核对日期 {RESEARCH_DATE}</span>
                {profile.docs.map((d) => (
                  <a
                    href={d.url}
                    key={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {d.label} ↗
                  </a>
                ))}
              </div>
              <div ref={settingsRef}>
                {settings && (
                  <DataConnection
                    key={source}
                    provider={source}
                    name={profile.name}
                    onSaved={() => refresh()}
                  />
                )}
              </div>
              <section className="api-picker" aria-label="API 操作按钮">
                <div className="api-picker-heading">
                  <div>
                    <h2>选择一个 API 操作</h2>
                    <p>按钮只选择操作；点击下方“运行此功能”才发起请求。</p>
                  </div>
                  <input
                    aria-label="筛选 API 操作"
                    placeholder="筛选接口名称、用途或粒度"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <div className="api-operation-grid">
                  {visible.map((op) => (
                    <button
                      key={op.id}
                      className={op.id === selected.id ? "selected" : ""}
                      aria-pressed={op.id === selected.id}
                      onClick={() => setOperation(op.id)}
                    >
                      <span className="api-card-family">
                        {op.contract.family} · {op.contract.granularity}
                      </span>
                      <strong>{op.title}</strong>
                      {op.contract.apis.map((api) => (
                        <code key={api}>{api}</code>
                      ))}
                      <small
                        className={
                          op.contract.model === "generation"
                            ? "api-generation"
                            : ""
                        }
                      >
                        {MODEL_LABELS[op.contract.model]}
                      </small>
                    </button>
                  ))}
                </div>
                {!visible.length && (
                  <p>没有匹配的接口。可清空筛选词查看全部操作。</p>
                )}
              </section>
              <ServiceTools
                key={source}
                provider={source}
                query="recursive self-improvement"
                configured={configured}
                operations={ops}
                selectedOperation={selected.id}
                onOperationChange={setOperation}
                contract={selected.contract}
                dataOnly={!aiEnabled}
                hideSelector
                onSettings={openSettings}
                onModelSettings={
                  aiEnabled ? () => setModelSettings(true) : undefined
                }
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
