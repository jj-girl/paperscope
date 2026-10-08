import { useEffect, useState } from "react";
import { localFetch } from "./localFetch";

export async function readJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await localFetch(path, init);
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : data.error?.message || `请求失败（${response.status}）`,
    );
  return data;
}

export function DataConnection({
  provider,
  name,
  onSaved,
}: {
  provider: string;
  name: string;
  onSaved: () => void;
}) {
  const [key, setKey] = useState("");
  const [base, setBase] = useState("https://api.sciverse.space");
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (provider !== "sciverse") return;
    const controller = new AbortController();
    readJson<{ base_url: string; enabled: boolean }>("/api/settings/sciverse", {
      signal: controller.signal,
    })
      .then((s) => {
        setBase(s.base_url);
        setEnabled(s.enabled);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setMessage(e.message);
      });
    return () => controller.abort();
  }, [provider]);
  async function save(clear = false) {
    setBusy(true);
    setMessage("");
    try {
      const body =
        provider === "sciverse"
          ? {
              base_url: base,
              enabled,
              clear_api_key: clear,
              ...(key && !clear ? { api_key: key } : {}),
            }
          : { api_key: clear ? "" : key };
      await readJson(
        provider === "sciverse"
          ? "/api/settings/sciverse"
          : `/api/literature/${provider}/key`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      setKey("");
      setMessage(
        clear
          ? "本地数据密钥已清除。"
          : "数据连接配置已保存；不会调用 LLM。有效性以接口响应为准。",
      );
      onSaved();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="api-connection" aria-label={`${name} 数据连接设置`}>
      <h3>{name} 数据连接</h3>
      <p>这里只配置数据 API，不需要填写模型 Key。密钥保留在本机后端。</p>
      {provider === "europepmc" ? (
        <p>当前公开接口无需密钥。</p>
      ) : (
        <>
          {provider === "sciverse" && (
            <>
              <label>
                API Base URL
                <input
                  aria-label="Sciverse 数据 API 地址"
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                />
              </label>
              <label className="api-check">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                启用 Sciverse 数据连接
              </label>
            </>
          )}
          <label>
            {name} API Key
            <input
              aria-label={`${name} 数据 API Key`}
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="不会显示已有密钥"
            />
          </label>
          <div>
            <button
              onClick={() => save()}
              disabled={busy || (provider !== "sciverse" && !key.trim())}
            >
              保存数据连接
            </button>
            <button onClick={() => save(true)} disabled={busy}>
              清除数据密钥
            </button>
          </div>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export function OptionalModelConnection() {
  const [base, setBase] = useState("");
  const [model, setModel] = useState("");
  const [key, setKey] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    readJson<{ base_url: string; model: string; enabled: boolean }>(
      "/api/settings/model",
      { signal: controller.signal },
    )
      .then((s) => {
        setBase(s.base_url);
        setModel(s.model);
        setEnabled(s.enabled);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setMessage(e.message);
      });
    return () => controller.abort();
  }, []);
  async function save() {
    setBusy(true);
    try {
      await readJson("/api/settings/model", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_url: base,
          model,
          enabled,
          ...(key ? { api_key: key } : {}),
        }),
      });
      setKey("");
      setMessage("可选模型配置已保存。保存不会启动推理。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="api-connection" aria-label="可选模型配置">
      <h3>可选模型配置</h3>
      <p>
        该部分属于应用增强，不属于数据 API 自身能力。纯 API
        操作不需要这里的配置。
      </p>
      <label>
        模型地址
        <input value={base} onChange={(e) => setBase(e.target.value)} />
      </label>
      <label>
        模型名
        <input value={model} onChange={(e) => setModel(e.target.value)} />
      </label>
      <label>
        模型 Key
        <input
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </label>
      <label className="api-check">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        启用可选模型
      </label>
      <button onClick={save} disabled={busy || !base || !model}>
        保存模型配置
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
