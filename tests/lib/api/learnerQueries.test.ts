// tests/lib/api/learnerQueries.test.ts
// The learner list/search reads now POST a validated body to a /query endpoint
// (alongside the legacy GET the Jinja pages still use). These assert the path,
// method, and body per read. legacyApiFetch is mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { legacyApiFetch } from "@/lib/api/client";
import { getVocabTable, getVocabReview, searchVocab, getLearnedVocab } from "@/lib/api/learner/vocab";
import { getPracticeHistory } from "@/lib/api/learner/practice";

vi.mock("@/lib/api/client", () => ({ legacyApiFetch: vi.fn().mockResolvedValue({ rows: [] }) }));

const mock = vi.mocked(legacyApiFetch);

function call() {
  const [path, options] = mock.mock.calls[0];
  return {
    path,
    method: (options as RequestInit)?.method,
    body: JSON.parse((options as RequestInit).body as string),
  };
}

describe("learner reads POST validated bodies to /query", () => {
  beforeEach(() => mock.mockClear());

  it("getVocabTable (free) -> /api/vocab/table/query", async () => {
    await getVocabTable({ mode: "free", hskLevel: "HSK1", page: 1, pageSize: 20 });
    expect(call()).toEqual({
      path: "/api/vocab/table/query",
      method: "POST",
      body: { mode: "free", page: 1, page_size: 20, hsk_level: "HSK1" },
    });
  });

  it("getVocabTable (standard) sends the passages list", async () => {
    await getVocabTable({ mode: "standard", passages: ["H1_1_1", "H1_1_2"], page: 1, pageSize: 50 });
    expect(call().body).toEqual({
      mode: "standard",
      page: 1,
      page_size: 50,
      passages: ["H1_1_1", "H1_1_2"],
    });
  });

  it("getVocabTable accepts a large page size (UI offers up to 1000)", async () => {
    await getVocabTable({ mode: "free", hskLevel: "HSK2", page: 1, pageSize: 1000 });
    expect(call().body.page_size).toBe(1000);
  });

  it("getVocabReview -> /api/vocab/review/query", async () => {
    await getVocabReview(2, 100);
    expect(call()).toEqual({
      path: "/api/vocab/review/query",
      method: "POST",
      body: { page: 2, page_size: 100 },
    });
  });

  it("searchVocab omits an empty query", async () => {
    await searchVocab("   ", 1, 20);
    expect(call()).toEqual({
      path: "/api/vocab/search/query",
      method: "POST",
      body: { page: 1, page_size: 20 },
    });
  });

  it("searchVocab sends a trimmed query", async () => {
    await searchVocab("  ni hao  ", 1, 20);
    expect(call().body).toEqual({ page: 1, page_size: 20, q: "ni hao" });
  });

  it("getLearnedVocab -> /api/user/learned-vocab/query", async () => {
    await getLearnedVocab(1, 24);
    expect(call()).toEqual({
      path: "/api/user/learned-vocab/query",
      method: "POST",
      body: { page: 1, page_size: 24 },
    });
  });

  it("getPracticeHistory -> /api/practice/history/query with filters", async () => {
    await getPracticeHistory({ level: "all", category: "practice", sort: "recent", page: 1 });
    expect(call()).toEqual({
      path: "/api/practice/history/query",
      method: "POST",
      body: { page: 1, level: "all", category: "practice", sort: "recent" },
    });
  });
});
