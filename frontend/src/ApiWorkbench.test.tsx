import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ApiWorkbench from "./ApiWorkbench";
import { API_OPERATIONS } from "./apiOperations";
import { SOURCE_RESEARCH } from "./apiResearch";

const json = (value: unknown) => new Response(JSON.stringify(value));
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input) => {
      const path = String(input);
      if (path === "/api/literature/providers")
        return json(
          Object.keys(SOURCE_RESEARCH)
            .filter((s) => s !== "sciverse")
            .map((id) => ({
              id,
              configured: id === "elicit",
              requires_key: id === "elicit",
            })),
        );
      if (path === "/api/settings/sciverse")
        return json({
          configured: true,
          base_url: "https://api.sciverse.space",
          enabled: true,
        });
      return json({
        view: "structured",
        items: [],
        data: { items: [{ schema_id: "s1", title: "Returned paper" }] },
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("opens a pure API view and never loads the model or the old discovery map", async () => {
  render(<ApiWorkbench />);
  expect(
    await screen.findByRole("heading", { name: "Sciverse 接口能力" }),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "运行此功能" })).toBeEnabled(),
  );
  expect(screen.getByText("纯 API 模式 · 不调用本地 LLM")).toBeInTheDocument();
  expect(screen.queryByText("FrontierLens")).not.toBeInTheDocument();
  expect(
    vi
      .mocked(fetch)
      .mock.calls.map(([p]) => String(p))
      .sort(),
  ).toEqual(["/api/literature/providers", "/api/settings/sciverse"]);
});

it("selects named endpoint buttons and calls only the chosen data operation", async () => {
  render(<ApiWorkbench />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "运行此功能" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /检索结构化论文/ }));
  const contract = screen.getByLabelText("当前 API 输入输出");
  expect(
    within(contract).getByText("POST /paper-schema/search"),
  ).toBeInTheDocument();
  expect(within(contract).getByText(/schema_id/)).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "运行此功能" }));
  expect(await screen.findByText("Returned paper")).toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toBe(
    "/api/advanced/sciverse/schema_search",
  );
});

it("lets readers inspect Elicit AI contracts while preventing task creation in data mode", async () => {
  render(<ApiWorkbench />);
  fireEvent.click(
    within(screen.getByLabelText("选择文献来源")).getByRole("button", {
      name: /Elicit/,
    }),
  );
  await screen.findByRole("button", { name: "数据连接设置 · 已保存密钥" });
  fireEvent.click(screen.getByRole("button", { name: /创建研究报告/ }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "提交任务操作" })).toBeDisabled(),
  );
  expect(screen.getByText(/纯 API 模式不启动此生成式任务/)).toBeInTheDocument();
  expect(
    vi.mocked(fetch).mock.calls.some(([p]) => String(p).includes("report")),
  ).toBe(false);
});

it("has researched input/output contracts for every button and all 18 Schema routes", () => {
  for (const [source, ops] of Object.entries(API_OPERATIONS)) {
    expect(SOURCE_RESEARCH[source].docs.length).toBeGreaterThan(0);
    for (const op of ops) {
      expect(op.contract.apis.length).toBeGreaterThan(0);
      expect(op.contract.input).toBeTruthy();
      expect(op.contract.output).toBeTruthy();
    }
  }
  const routes = new Set(
    API_OPERATIONS.sciverse
      .filter((o) => o.id.startsWith("schema_"))
      .flatMap((o) => o.contract.apis),
  );
  expect(routes.size).toBe(18);
});
