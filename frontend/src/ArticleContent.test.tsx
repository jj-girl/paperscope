import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ArticleContent, parseArticleXml } from "./ArticleContent";
import { paperAccess } from "./contentAccess";
import { API_OPERATIONS } from "./apiOperations";
import { apiExample, RSI_PMCID, RSI_PMID } from "./apiExamples";
import ApiWorkbench from "./ApiWorkbench";
import type { LiteraturePaper } from "./literatureTypes";
const paper = (overrides: Partial<LiteraturePaper>) =>
  ({
    id: "W1",
    provider: "openalex",
    title: "RSI paper",
    authors: [],
    subjects: [],
    abstract: "An abstract",
    fulltext_readable: false,
    ...overrides,
  }) as LiteraturePaper;
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:article");
      static revokeObjectURL = vi.fn();
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("does not equate OA or an external PDF link with a downloadable OpenAlex file", () => {
  const p = paper({
    is_open_access: true,
    fulltext_url: "https://example.org/paper.pdf",
    content_formats: [],
    content_status_known: true,
  });
  expect(paperAccess(p).direct).toBe(false);
  render(<ArticleContent paper={p} configured onSettings={() => {}} />);
  expect(
    screen.getByRole("link", { name: /打开外部全文入口/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /获取 PDF/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/服务本次未标记可下载/)).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("does not turn a PubMed PMCID into an inline full-text reader", () => {
  render(
    <ArticleContent
      paper={paper({
        provider: "pubmed",
        pmcid: RSI_PMCID,
        fulltext_url: `https://pmc.ncbi.nlm.nih.gov/articles/${RSI_PMCID}/`,
      })}
      configured={false}
      onSettings={() => {}}
    />,
  );
  expect(
    screen.queryByRole("button", { name: /读取全文/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(/PubMed 当前接口只返回书目与摘要/),
  ).toBeInTheDocument();
});
it("only labels a Europe PMC XML as read after a successful explicit fetch", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      "<article><body><sec><title>Methods</title><p>Full body text.</p></sec></body></article>",
      { headers: { "Content-Type": "application/xml" } },
    ),
  );
  render(
    <ArticleContent
      paper={paper({
        provider: "europepmc",
        pmcid: RSI_PMCID,
        fulltext_readable: true,
        is_open_access: true,
      })}
      configured={false}
      onSettings={() => {}}
    />,
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(
    screen.getByText(/有正文 \/ 文件获取入口 · 尚未读取/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "读取全文 XML（本页）" }));
  expect(await screen.findByText("Full body text.")).toBeInTheDocument();
  expect(screen.getByText("已获取 XML · 正文段落已读取")).toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
    `/api/literature/europepmc/fulltext/${RSI_PMCID}?format=xml`,
  );
});
it("keeps failures distinct from acquired full text and gates file credentials", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ detail: "No XML available" }), {
      status: 404,
    }),
  );
  const { unmount } = render(
    <ArticleContent
      paper={paper({
        provider: "europepmc",
        pmcid: RSI_PMCID,
        fulltext_readable: true,
      })}
      configured={false}
      onSettings={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "读取全文 XML（本页）" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "未将此记录标记为已读取全文",
  );
  expect(screen.queryByText(/已获取 XML/)).not.toBeInTheDocument();
  unmount();
  const settings = vi.fn();
  render(
    <ArticleContent
      paper={paper({ content_formats: ["pdf"] })}
      configured={false}
      onSettings={settings}
    />,
  );
  expect(
    screen.getByRole("button", { name: "获取 PDF 并预览" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "配置 OpenAlex Key 后获取文件" }),
  );
  expect(settings).toHaveBeenCalledOnce();
});
it("parses namespaced TEI paragraphs without calling XML metadata a full text", () => {
  expect(
    parseArticleXml(
      '<TEI xmlns="urn:tei"><text><body><div><head>Intro</head><p>Body.</p></div></body></text></TEI>',
    ),
  ).toEqual([
    { kind: "title", text: "Intro" },
    { kind: "p", text: "Body." },
  ]);
  expect(
    parseArticleXml("<record><title>Metadata only</title></record>"),
  ).toEqual([]);
  expect(() => parseArticleXml("<broken>")).toThrow();
});
it("has an example for every operation and preserves correct ID types", () => {
  for (const [source, ops] of Object.entries(API_OPERATIONS))
    for (const op of ops) {
      const e = apiExample(source, op.id);
      expect(e.title).toBeTruthy();
      expect(e.basis).toBeTruthy();
      expect(e.links.length).toBeGreaterThan(0);
      if (e.prerequisite)
        expect(ops.some((o) => o.id === e.prerequisite!.operation)).toBe(true);
    }
  expect(apiExample("pubmed", "batch").values.ids).toBe(RSI_PMID);
  expect(apiExample("europepmc", "fulltext").values.record_id).toBe(RSI_PMCID);
  expect(apiExample("elicit", "status").values.record_id).toBeUndefined();
});
it("fills a verified RSI PMCID without fetching or running the selected API", async () => {
  localStorage.clear();
  vi.mocked(fetch).mockImplementation(
    async (path) =>
      new Response(
        JSON.stringify(
          String(path).includes("providers") ? [] : { configured: false },
        ),
      ),
  );
  render(<ApiWorkbench />);
  fireEvent.click(screen.getByRole("button", { name: /Europe PMC 部分记录/ }));
  fireEvent.click(screen.getByRole("button", { name: /读取开放全文 XML/ }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  fireEvent.click(
    screen.getByRole("button", { name: "填入 RSI 示例（不执行）" }),
  );
  expect(screen.getByLabelText(`PMCID（例如 ${RSI_PMCID}）`)).toHaveValue(
    RSI_PMCID,
  );
  expect(fetch).toHaveBeenCalledTimes(2);
});
