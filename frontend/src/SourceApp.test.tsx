import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import SourceApp, { type Source, type SearchResult } from "./SourceApp";

vi.mock("./App", () => ({
  default: () => <div>Original Sciverse workspace</div>,
}));

const sources: Source[] = ["pubmed", "europepmc", "elicit", "openalex"].map(
  (id) => ({
    id,
    name:
      id === "pubmed"
        ? "PubMed"
        : id === "europepmc"
          ? "Europe PMC"
          : id === "openalex"
            ? "OpenAlex"
            : "Elicit",
    scope: "Test scope",
    native: "Native capabilities",
    integrated: "Implemented capabilities",
    env: id === "europepmc" ? null : "TEST_KEY",
    requires_key: id === "elicit",
    configured: false,
    docs: "https://example.org/docs",
  }),
);

const result: SearchResult = {
  provider: "pubmed",
  query: "retrieval augmented generation",
  effective_query: null,
  total: 1,
  returned: 1,
  requested: 10,
  elapsed_ms: 500,
  retrieved_at: "2026-10-08T00:00:00Z",
  warnings: [],
  papers: [
    {
      id: "1",
      provider: "pubmed",
      title: "A real returned record",
      authors: ["Author"],
      year: 2025,
      venue: null,
      abstract: null,
      doi: null,
      pmid: "1",
      pmcid: null,
      url: "https://pubmed.ncbi.nlm.nih.gov/1/",
      fulltext_url: null,
      fulltext_readable: false,
      citation_count: null,
      subjects: [],
    },
  ],
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.endsWith("/providers")) return json(sources);
      if (path.endsWith("/key")) return json({ configured: true });
      return json(result);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("searches PubMed without Sciverse or a model and does not invent an abstract or graph", async () => {
  render(<SourceApp />);
  fireEvent.click(await screen.findByRole("button", { name: "搜索 PubMed" }));
  expect(
    await screen.findByText("该接口未返回摘要。可以通过来源记录或 DOI 查看。"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "本应用已接入功能" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "读取开放全文" }),
  ).not.toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls.map(([path]) => String(path))).toEqual([
    "/api/literature/providers",
    "/api/literature/pubmed/search",
  ]);
});

it("retains the query across sources and opens the original Sciverse workspace explicitly", async () => {
  render(<SourceApp />);
  const query = await screen.findByLabelText("研究关键词或检索式");
  fireEvent.change(query, { target: { value: "single cell" } });
  fireEvent.change(screen.getByLabelText("文献来源"), {
    target: { value: "europepmc" },
  });
  expect(screen.getByLabelText("研究关键词或检索式")).toHaveValue(
    "single cell",
  );
  expect(screen.getByText("✓ 开放全文阅读（按记录提供）")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("文献来源"), {
    target: { value: "sciverse" },
  });
  expect(screen.getByText("Original Sciverse workspace")).toBeInTheDocument();
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
});

it("disables Elicit until configured and never stores the key in browser storage", async () => {
  render(<SourceApp />);
  await screen.findByRole("button", { name: "搜索 PubMed" });
  fireEvent.change(screen.getByLabelText("文献来源"), {
    target: { value: "elicit" },
  });
  expect(screen.getByRole("button", { name: "搜索 Elicit" })).toBeDisabled();
  expect(
    screen.getByRole("heading", { name: "配置 Elicit 连接后开始搜索" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "打开连接设置" })[0]);
  expect(screen.getByLabelText("Elicit API Key")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Elicit API Key"), {
    target: { value: "test-only-secret" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存密钥" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "搜索 Elicit" })).toBeEnabled(),
  );
  expect(screen.getByLabelText("Elicit API Key")).toHaveValue("");
  expect(JSON.stringify(window.localStorage)).not.toContain("test-only-secret");
});

it("shows rate limiting as an error instead of a successful empty result", async () => {
  vi.mocked(fetch).mockImplementation(async (input) =>
    String(input).endsWith("/providers")
      ? json(sources)
      : json({ detail: "数据源限制了请求频率或额度。" }, 429),
  );
  render(<SourceApp />);
  fireEvent.click(await screen.findByRole("button", { name: "搜索 PubMed" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("限制了请求频率");
  fireEvent.click(
    within(screen.getByRole("alert")).getByRole("button", {
      name: "打开连接设置",
    }),
  );
  expect(screen.getByLabelText("PubMed API Key")).toHaveFocus();
  expect(
    screen.queryByText("当前来源没有匹配结果。这不表示相关研究不存在。"),
  ).not.toBeInTheDocument();
});

it("aborts a pending search when switching source and ignores its late result", async () => {
  let resolveSearch: (value: Response) => void = () => {};
  let searchSignal: AbortSignal | undefined;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (String(input).endsWith("/providers")) return json(sources);
    searchSignal = init?.signal as AbortSignal;
    return new Promise<Response>((resolve) => {
      resolveSearch = resolve;
    });
  });
  render(<SourceApp />);
  fireEvent.click(await screen.findByRole("button", { name: "搜索 PubMed" }));
  fireEvent.change(screen.getByLabelText("文献来源"), {
    target: { value: "europepmc" },
  });
  expect(searchSignal?.aborted).toBe(true);
  resolveSearch(json(result));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "搜索 Europe PMC" }),
    ).toBeEnabled(),
  );
  expect(screen.queryByText("A real returned record")).not.toBeInTheDocument();
});

it("uses a screening table for PubMed and a labeled sample overview for OpenAlex", async () => {
  vi.mocked(fetch).mockImplementation(async (input) => {
    if (String(input).endsWith("/providers")) return json(sources);
    if (String(input).includes("openalex"))
      return json({
        ...result,
        provider: "openalex",
        papers: [
          {
            ...result.papers[0],
            provider: "openalex",
            institutions: ["Institute A"],
            topics: ["Topic A"],
          },
        ],
      });
    return json(result);
  });
  render(<SourceApp />);
  fireEvent.click(await screen.findByRole("button", { name: "搜索 PubMed" }));
  expect(
    await screen.findByRole("table", {
      name: "书目筛选表 · 点击标题核对摘要和 MeSH",
    }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("文献来源"), {
    target: { value: "openalex" },
  });
  fireEvent.click(screen.getByRole("button", { name: "搜索 OpenAlex" }));
  expect(await screen.findByLabelText("OpenAlex 样本概览")).toBeInTheDocument();
  expect(screen.getByText(/不能据此推断整个领域趋势/)).toBeInTheDocument();
  expect(screen.getByText("Institute A")).toBeInTheDocument();
});

it("lets the user select by purpose without starting research requests", async () => {
  render(<SourceApp />);
  await screen.findByRole("button", { name: "搜索 PubMed" });
  fireEvent.change(screen.getByLabelText("研究关键词或检索式"), {
    target: { value: "test question" },
  });
  fireEvent.click(screen.getByRole("button", { name: "按用途选来源" }));
  expect(screen.getByLabelText("文献来源用途指南")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "进入 Elicit" }));
  expect(screen.getByLabelText("研究关键词或检索式")).toHaveValue(
    "test question",
  );
  expect(screen.getByRole("button", { name: "搜索 Elicit" })).toBeDisabled();
  expect(screen.queryByLabelText("文献来源用途指南")).not.toBeInTheDocument();
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
});
