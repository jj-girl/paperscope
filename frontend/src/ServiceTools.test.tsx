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
import type { LiteraturePaper } from "./literatureTypes";

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

it("switches content parameters without requests, compares actual modes and keeps response labels stable", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_path, init) => {
      const body = JSON.parse(String(init?.body));
      const full = body.read_mode === "full";
      return json({
        view: "structured",
        items: [],
        data: {
          text: full ? "Complete source text" : "A source slice",
          more: !full,
        },
        next_offset: full ? null : 720,
        reading: {
          mode: full ? "full" : "segment",
          doc_id: body.record_id,
          offset: full ? null : body.offset,
          limit: full ? null : body.content_limit,
          chars_received: full ? 20000 : 700,
          more: !full,
        },
      });
    }),
  );
  render(
    <ServiceTools
      provider="sciverse"
      query="RSI"
      configured
      onSettings={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("选择接口功能"), {
    target: { value: "content" },
  });
  fireEvent.change(screen.getByLabelText("doc_id"), {
    target: { value: "doc1" },
  });
  fireEvent.change(screen.getByLabelText("原文起始字符位置"), {
    target: { value: "20" },
  });
  fireEvent.change(screen.getByLabelText("原文片段长度"), {
    target: { value: "700" },
  });
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "运行此功能" }));
  await screen.findByText("A source slice", { selector: "p" });
  expect(
    JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)),
  ).toMatchObject({ read_mode: "segment", offset: 20, content_limit: 700 });
  fireEvent.click(screen.getByRole("radio", { name: /全文读取/ }));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText("原文起始字符位置")).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "片段模式 · 原文返回结果" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "运行此功能" }));
  await screen.findByText("Complete source text", { selector: "p" });
  const sent = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
  expect(sent.read_mode).toBe("full");
  expect(sent).not.toHaveProperty("offset");
  expect(sent).not.toHaveProperty("content_limit");
  expect(
    screen.getByRole("heading", { name: "全文模式 · 原文返回结果" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("同一文档读取方式对照")).toHaveTextContent(
    "20,000",
  );
  expect(screen.getByLabelText("同一文档读取方式对照")).toHaveTextContent(
    "700",
  );
  expect(
    screen.queryByRole("button", { name: "读取下一页" }),
  ).not.toBeInTheDocument();
});

it("does not mark a full request complete when the provider reports more content", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      json({
        view: "structured",
        items: [],
        data: { text: "Still partial", more: true, next_offset: 10 },
        reading: {
          mode: "full",
          doc_id: "doc1",
          offset: null,
          limit: null,
          chars_received: 10,
          more: true,
        },
      }),
    ),
  );
  render(
    <ServiceTools
      provider="sciverse"
      query="RSI"
      configured
      onSettings={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("选择接口功能"), {
    target: { value: "content" },
  });
  fireEvent.change(screen.getByLabelText("doc_id"), {
    target: { value: "doc1" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /全文读取/ }));
  fireEvent.click(screen.getByRole("button", { name: "运行此功能" }));
  expect(
    await screen.findByText(/虽然请求了全文，服务仍提示有后续内容/),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/本次返回之后没有后续内容/),
  ).not.toBeInTheDocument();
});
