// tests/lib/api/manageVocab.test.ts
// listVocab now POSTs a validated body to /api/admin/vocab/query instead of
// building a query string. These assert the path/method/body it sends.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api/client";
import { listVocab } from "@/lib/api/manage/vocab";

vi.mock("@/lib/api/client", () => ({ apiFetch: vi.fn().mockResolvedValue({ items: [] }) }));

const mockFetch = vi.mocked(apiFetch);

function sentBody() {
  const [, options] = mockFetch.mock.calls[0];
  return JSON.parse((options as RequestInit).body as string);
}

describe("listVocab", () => {
  beforeEach(() => mockFetch.mockClear());

  it("POSTs to the query endpoint with defaults", async () => {
    await listVocab();
    const [path, options] = mockFetch.mock.calls[0];
    expect(path).toBe("/api/admin/vocab/query");
    expect((options as RequestInit).method).toBe("POST");
    expect(sentBody()).toEqual({ page: 1, page_size: 20 });
  });

  it("includes the hsk filter and trimmed search when provided", async () => {
    await listVocab(2, 50, "HSK2", "  hao  ");
    expect(sentBody()).toEqual({ page: 2, page_size: 50, hsk_level: "HSK2", search: "hao" });
  });

  it("omits an empty search and undefined filter", async () => {
    await listVocab(1, 20, undefined, "   ");
    expect(sentBody()).toEqual({ page: 1, page_size: 20 });
  });
});
