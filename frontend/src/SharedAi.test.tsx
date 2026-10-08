import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SharedAi from "./SharedAi";
import type { LiteraturePaper } from "./SourceApp";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const papers = Array.from(
  { length: 10 },
  (_, i) =>
    ({
      id: String(i),
      provider: "pubmed",
      title: `Paper ${i}`,
      abstract: "Source text",
      authors: [],
      subjects: [],
    }) as unknown as LiteraturePaper,
);
function mount() {
  render(
    <SharedAi
      provider="pubmed"
      query="test"
      papers={papers}
      onSettings={() => {}}
    />,
  );
  fireEvent.click(screen.getByText("AI 研究助手 · 共用模型配置"));
}

it("requires screening criteria and sends only the displayed eight-paper scope", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          overview: "筛选建议",
          items: [],
          comparisons: [],
          limitations: [],
          basis: "摘要",
          note: "待人工复核",
          sources: [],
          screening: body.papers.map((p: LiteraturePaper) => ({
            paper_id: p.id,
            decision: "uncertain",
            reason: "信息不足",
          })),
        }),
      );
    }),
  );
  mount();
  fireEvent.change(screen.getByLabelText("AI 分析方式"), {
    target: { value: "screen" },
  });
  expect(
    screen.getByRole("button", { name: "使用共享模型分析" }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("AI 筛选标准"), {
    target: { value: "需要原始实验结果" },
  });
  fireEvent.click(screen.getByRole("button", { name: "使用共享模型分析" }));
  await screen.findByText("筛选建议（待人工复核）");
  const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
  expect(body.papers).toHaveLength(8);
  expect(body.screening_criteria).toBe("需要原始实验结果");
  expect(screen.getAllByText("信息不足，待定")).toHaveLength(8);
});

it("does not submit duplicate extraction fields and displays missing evidence as missing", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            overview: "抽取",
            items: [],
            comparisons: [],
            limitations: [],
            basis: "摘要",
            note: "未核验",
            sources: [],
            extraction_fields: ["数据集"],
            extractions: [
              {
                paper_id: "0",
                values: {
                  数据集: {
                    value: null,
                    supporting_quote: null,
                    source_kind: "missing",
                  },
                },
              },
            ],
          }),
        ),
    ),
  );
  mount();
  fireEvent.change(screen.getByLabelText("AI 分析方式"), {
    target: { value: "extract" },
  });
  fireEvent.change(screen.getByLabelText("AI 抽取字段"), {
    target: { value: "方法\n方法" },
  });
  expect(
    screen.getByRole("button", { name: "使用共享模型分析" }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("AI 抽取字段"), {
    target: { value: "数据集" },
  });
  fireEvent.click(screen.getByRole("button", { name: "使用共享模型分析" }));
  expect(await screen.findByText("未从当前材料提取到")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "导出 CSV 表格" })).toBeEnabled(),
  );
});
