// tests/lib/api/manageQueries.test.ts
// The admin list functions now POST a validated body to a /query endpoint
// instead of building a query string. These assert path/method/body per resource.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api/client";
import { listPassages } from "@/lib/api/manage/passage";
import { listUsers } from "@/lib/api/manage/user";
import { listGrammarContexts } from "@/lib/api/manage/grammar_context";
import { listGrammarRules } from "@/lib/api/manage/grammar_rule";
import { listQuestions } from "@/lib/api/manage/question";

vi.mock("@/lib/api/client", () => ({ apiFetch: vi.fn().mockResolvedValue({ items: [] }) }));

const mockFetch = vi.mocked(apiFetch);

function lastCall() {
  const [path, options] = mockFetch.mock.calls[0];
  return {
    path,
    method: (options as RequestInit).method,
    body: JSON.parse((options as RequestInit).body as string),
  };
}

describe("admin list queries POST validated bodies", () => {
  beforeEach(() => mockFetch.mockClear());

  it("listPassages -> /api/admin/passage/query", async () => {
    await listPassages(2, 50, "HSK3");
    expect(lastCall()).toEqual({
      path: "/api/admin/passage/query",
      method: "POST",
      body: { page: 2, page_size: 50, hsk_level: "HSK3" },
    });
  });

  it("listUsers omits empty search", async () => {
    await listUsers(1, 20, "   ");
    expect(lastCall().body).toEqual({ page: 1, page_size: 20 });
  });

  it("listGrammarContexts -> /query with filter", async () => {
    await listGrammarContexts(1, 20, "H1-2-1");
    expect(lastCall()).toEqual({
      path: "/api/admin/grammar_context/query",
      method: "POST",
      body: { page: 1, page_size: 20, grammar_id: "H1-2-1" },
    });
  });

  it("listGrammarRules forwards a numeric type", async () => {
    await listGrammarRules(1, 20, "H1-2-1", 1);
    expect(lastCall().body).toEqual({ page: 1, page_size: 20, grammar_id: "H1-2-1", type: 1 });
  });

  it("listQuestions -> /query with only the provided filters", async () => {
    await listQuestions(1, 20, { category: "practice", search: "hi" });
    expect(lastCall()).toEqual({
      path: "/api/admin/question/query",
      method: "POST",
      body: { page: 1, page_size: 20, category: "practice", search: "hi" },
    });
  });

  it("defaults to an empty filter body", async () => {
    await listQuestions();
    expect(lastCall().body).toEqual({ page: 1, page_size: 20 });
  });
});
