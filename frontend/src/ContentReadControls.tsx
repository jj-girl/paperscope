export type ReadingInfo = {
  mode: "segment" | "full";
  doc_id: string;
  offset: number | null;
  limit: number | null;
  chars_received: number;
  more: boolean | null;
};
export function ContentReadControls({
  values,
  busy,
  onChange,
}: {
  values: Record<string, string>;
  busy: boolean;
  onChange: (update: Record<string, string>) => void;
}) {
  const full = values.read_mode === "full";
  return (
    <fieldset className="content-read-controls" disabled={busy}>
      <legend>原文读取参数</legend>
      <div className="read-mode-options">
        <label>
          <input
            type="radio"
            name="content-read-mode"
            checked={!full}
            onChange={() => onChange({ read_mode: "segment" })}
          />
          片段读取<span>按位置取一段，可继续下一段</span>
        </label>
        <label>
          <input
            type="radio"
            name="content-read-mode"
            checked={full}
            onChange={() => onChange({ read_mode: "full" })}
          />
          全文读取<span>一次请求服务提供的完整文本</span>
        </label>
      </div>
      {full ? (
        <p className="read-request-preview">
          将发送：<code>GET /content?doc_id=…</code>
          <br />
          不发送 offset 和 limit。服务若仍返回
          more=true，会明确提示本次不是完整全文。
        </p>
      ) : (
        <>
          <div className="read-range-fields">
            <label>
              起始字符位置（offset）
              <input
                aria-label="原文起始字符位置"
                type="number"
                min="0"
                max="10000000"
                required
                value={values.offset ?? "0"}
                onChange={(e) => onChange({ offset: e.target.value })}
              />
            </label>
            <label>
              本次最多读取（limit）
              <input
                aria-label="原文片段长度"
                type="number"
                min="1"
                max="50000"
                required
                value={values.content_limit ?? "5000"}
                onChange={(e) => onChange({ content_limit: e.target.value })}
              />
            </label>
          </div>
          <div className="read-limit-presets">
            片段长度：
            {[700, 4096, 5000, 10000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ content_limit: String(n) })}
              >
                {n.toLocaleString()} 字符
              </button>
            ))}
          </div>
          <p className="read-request-preview">
            将发送：
            <code>
              GET /content?doc_id=…&amp;offset={values.offset || "0"}&amp;limit=
              {values.content_limit || "5000"}
            </code>
            <br />
            位置与长度以 Unicode 字符计；片段长度的本应用上限为
            50,000。修改参数不会自动请求。
          </p>
        </>
      )}
    </fieldset>
  );
}
export function ReadingHistory({
  history,
}: {
  history: Partial<Record<"full" | "segment", ReadingInfo>>;
}) {
  const example = history.full || history.segment;
  if (!example) return null;
  return (
    <section className="reading-comparison" aria-label="同一文档读取方式对照">
      <h3>同一文档 · 最近两种读取方式对照</h3>
      <small>doc_id：{example.doc_id}</small>
      <div className="read-mode-options">
        {(["segment", "full"] as const).map((mode) => {
          const row = history[mode];
          return (
            <div key={mode}>
              <strong>{mode === "full" ? "全文读取" : "片段读取"}</strong>
              {row ? (
                <>
                  <p>
                    {mode === "full"
                      ? "未发送 offset / limit"
                      : `起始位置 ${row.offset}，请求最多 ${row.limit} 字符`}
                  </p>
                  <b>实际返回 {row.chars_received.toLocaleString()} 字符</b>
                  <p>
                    {row.more === true
                      ? "服务提示：还有后续内容"
                      : row.more === false
                        ? "服务提示：没有后续内容"
                        : "服务未提供后续内容标记"}
                  </p>
                </>
              ) : (
                <p>尚未执行；切换模式后点击运行即可对照。</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="source-muted">
        这里只比较同一 doc_id
        的实际返回量；切换按钮不会自动执行两次请求，也不会把多次片段拼成全文。
      </p>
    </section>
  );
}
