import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ServiceTools from "./ServiceTools";
import SharedAi from "./SharedAi";
import type { LiteraturePaper } from "./SourceApp";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });

it("executes whole-query aggregation and continues with the submitted query", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      json({
        view: "groups",
        items: [{ key: "2024", title: "2024", count: 900 }],
        total: 10000,
        next_cursor: "next",
      }),
    ),
  );
  render(
    <ServiceTools
      provider="openalex"
      query="first query"
      configured={false}
      onSettings={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "运行此功能" }));
  expect(await screen.findByText("10,000")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("检索词 / 问题"), {
    target: { value: "different query" },
  });
  fireEvent.click(screen.getByRole("button", { name: "读取下一页" }));
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2));
  const sent = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
  expect(sent.query).toBe("first query");
  expect(sent.cursor).toBe("next");
});

it("gates Content downloads and exposes connection settings", async () => {
  const settings = vi.fn();
  render(
    <ServiceTools
      provider="openalex"
      query="x"
      configured={false}
      onSettings={settings}
    />,
  );
  fireEvent.change(screen.getByLabelText("选择接口功能"), {
    target: { value: "pdf" },
  });
  expect(screen.getByRole("button", { name: "获取文件" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "打开连接设置" }));
  expect(settings).toHaveBeenCalledOnce();
});

it("never starts an Elicit task merely by selecting an operation", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      json({
        view: "task",
        items: [],
        data: { sessionId: "s1", status: "processing" },
      }),
    ),
  );
  render(
    <ServiceTools
      provider="elicit"
      query="research"
      configured={true}
      onSettings={() => {}}
    />,
  );
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "提交任务操作" }));
  expect(await screen.findByText("processing")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledOnce();
});

it("shares model analysis but does not claim full-text verification", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      json({
        overview: "建议",
        items: [{ paper_id: "1", notes: "先读摘要", questions: [] }],
        comparisons: [],
        limitations: [],
        basis: "元数据与摘要（未读取全文）",
        note: "未核验",
        sources: [{ id: "1", title: "Title", url: null }],
      }),
    ),
  );
  const paper = {
    id: "1",
    provider: "pubmed",
    title: "Title",
    authors: [],
    subjects: [],
  } as unknown as LiteraturePaper;
  render(
    <SharedAi
      provider="pubmed"
      query="question"
      papers={[paper]}
      onSettings={() => {}}
    />,
  );
  fireEvent.click(screen.getByText("AI 研究助手 · 共用模型配置"));
  fireEvent.click(screen.getByRole("button", { name: "使用共享模型分析" }));
  expect(
    await screen.findByText(/元数据与摘要（未读取全文）/),
  ).toBeInTheDocument();
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe(
    "/api/shared-ai/analyze",
  );
});
