import { SOURCE_PROFILES } from "./sourceProfiles";

export default function SourceGuide({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  return (
    <main className="source-guide" aria-label="文献来源用途指南">
      <header>
        <div className="source-eyebrow">FRONTIERLENS · 选择研究任务</div>
        <h1>先确定要完成什么，再选择文献来源</h1>
        <p>
          下列是本应用的用途分工，不是各服务的全部能力清单。服务原生能力、当前接入范围与真实验证状态分别说明。
        </p>
      </header>
      <div className="source-guide-grid">
        {Object.entries(SOURCE_PROFILES).map(([id, profile]) => (
          <article key={id}>
            <div className="source-eyebrow">{profile.name}</div>
            <h2>{profile.title}</h2>
            <p className="source-guide-question">{profile.question}</p>
            <dl>
              <dt>对象与范围</dt>
              <dd>{profile.scope}</dd>
              <dt>当前产出</dt>
              <dd>{profile.output}</dd>
              <dt>解释边界</dt>
              <dd>{profile.boundary}</dd>
            </dl>
            <details>
              <summary>
                {profile.pending.length
                  ? "服务支持、尚未接入的能力"
                  : "本轮扩展能力已接入"}
              </summary>
              {!profile.pending.length && (
                <p>
                  进入工作区的扩展功能工作台操作。这里覆盖本轮计划清单，不代表该服务的所有
                  API；可用性仍受权限与数据覆盖限制。
                </p>
              )}
              <ul>
                {profile.pending.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{profile.extra}</p>
            </details>
            <p
              className={`source-verification ${profile.verified ? "verified" : "pending"}`}
            >
              {profile.verification}
            </p>
            <button onClick={() => onSelect(id)}>进入 {profile.name}</button>
          </article>
        ))}
      </div>
      <footer>
        快速检索读取 5/10/20
        篇；扩展工作台提供分页和批量操作。显示数量是应用设置，不代表接口上限。不同来源的命中数不能直接比较为检索质量。
      </footer>
    </main>
  );
}
