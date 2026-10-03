// tests/hooks/vocab/useVocabReview.test.ts
// Covers the behaviour the review page relies on: the initial load and its
// failure state, prev/next page navigation (with per-page caching), and the
// selection set — which survives page changes and whose select-all spans only
// the current page.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { getVocabReview } from "@/lib/api/learner/vocab";
import { useVocabReview, REVIEW_PAGE_SIZE } from "@/hooks/vocab/useVocabReview";
import type { VocabRow } from "@/lib/types/vocab";

vi.mock("@/lib/api/learner/vocab", () => ({ getVocabReview: vi.fn() }));

const mockReview = getVocabReview as unknown as ReturnType<typeof vi.fn>;

function row(word: string, over: Partial<VocabRow> = {}): VocabRow {
  return {
    word,
    cn: word,
    pinyin: `${word}-py`,
    meaning_vn: `${word}-vn`,
    meaning_en: `${word}-en`,
    audio_key: `${word}-key`,
    level: "HSK1",
    ...over,
  };
}

function response(rows: VocabRow[], over = {}) {
  return {
    rows,
    page: 1,
    page_size: REVIEW_PAGE_SIZE,
    total: rows.length,
    total_pages: 1,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockReview.mockResolvedValue(response([]));
});

describe("useVocabReview — initial load", () => {
  it("loads the first page and exposes its rows", async () => {
    mockReview.mockResolvedValue(response([row("学习"), row("你好")]));
    const { result } = renderHook(() => useVocabReview());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(mockReview).toHaveBeenCalledWith(1, REVIEW_PAGE_SIZE);
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.selectedCount).toBe(0);
  });

  it("skips rows the API returned without a word", async () => {
    mockReview.mockResolvedValue(
      response([row("水"), row("", { cn: "" })])
    );
    const { result } = renderHook(() => useVocabReview());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.rows).toHaveLength(1);
  });

  it("reports an error state when the request fails", async () => {
    mockReview.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useVocabReview());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.rows).toEqual([]);
    expect(result.current.totalPages).toBe(1);
  });
});

describe("useVocabReview — page navigation", () => {
  it("replaces the rows with the requested page", async () => {
    mockReview.mockResolvedValueOnce(
      response([row("一")], { page: 1, total_pages: 2, total: 2 })
    );
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    mockReview.mockResolvedValueOnce(
      response([row("二")], { page: 2, total_pages: 2, total: 2 })
    );
    await act(() => result.current.goToPage(2));

    expect(mockReview).toHaveBeenLastCalledWith(2, REVIEW_PAGE_SIZE);
    // A page replaces the list — it does not append.
    expect(result.current.rows.map((r) => r.word)).toEqual(["二"]);
    expect(result.current.page).toBe(2);
  });

  it("clamps out-of-range targets and ignores a no-op jump", async () => {
    mockReview.mockResolvedValue(
      response([row("甲")], { page: 1, total_pages: 2, total: 2 })
    );
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Already on page 1; going below 1 clamps to 1, which is a no-op fetch.
    await act(() => result.current.goToPage(0));
    expect(mockReview).toHaveBeenCalledTimes(1);
  });

  it("serves a revisited page from cache without re-fetching", async () => {
    mockReview.mockResolvedValueOnce(
      response([row("壹")], { page: 1, total_pages: 2, total: 2 })
    );
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    mockReview.mockResolvedValueOnce(
      response([row("贰")], { page: 2, total_pages: 2, total: 2 })
    );
    await act(() => result.current.goToPage(2));
    expect(mockReview).toHaveBeenCalledTimes(2);

    // Back to page 1: already cached, so no third request.
    await act(() => result.current.goToPage(1));
    expect(mockReview).toHaveBeenCalledTimes(2);
    expect(result.current.rows.map((r) => r.word)).toEqual(["壹"]);
  });

  it("stays on the current page when a page change fails", async () => {
    mockReview.mockResolvedValueOnce(
      response([row("四")], { page: 1, total_pages: 2, total: 2 })
    );
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    mockReview.mockRejectedValueOnce(new Error("network"));
    await act(() => result.current.goToPage(2));

    expect(result.current.rows.map((r) => r.word)).toEqual(["四"]);
    expect(result.current.page).toBe(1);
    expect(result.current.navigating).toBe(false);
  });
});

describe("useVocabReview — selection", () => {
  it("tracks individual words and reports the count", async () => {
    const rows = [row("五"), row("六")];
    mockReview.mockResolvedValue(response(rows));
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.toggleWord(rows[0], true));
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected(rows[0])).toBe(true);
    expect(result.current.someSelected).toBe(true);
    expect(result.current.allSelected).toBe(false);
    expect(result.current.selectedWords).toEqual(["五"]);

    act(() => result.current.toggleWord(rows[0], false));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.someSelected).toBe(false);
  });

  it("select-all covers the current page's rows", async () => {
    const rows = [row("七"), row("八")];
    mockReview.mockResolvedValue(response(rows));
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.toggleAll(true));
    expect(result.current.allSelected).toBe(true);
    expect(result.current.someSelected).toBe(false);
    expect(result.current.selectedWords).toEqual(["七", "八"]);

    act(() => result.current.toggleAll(false));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it("keeps selections from other pages after navigating", async () => {
    const first = row("九");
    mockReview.mockResolvedValueOnce(
      response([first], { page: 1, total_pages: 2, total: 2 })
    );
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.toggleWord(first, true));
    expect(result.current.allSelected).toBe(true);

    mockReview.mockResolvedValueOnce(
      response([row("十")], { page: 2, total_pages: 2, total: 2 })
    );
    await act(() => result.current.goToPage(2));

    // The new page's row is unselected, but the pick from page 1 is retained.
    expect(result.current.selectedWords).toEqual(["九"]);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.allSelected).toBe(false);
    expect(result.current.someSelected).toBe(false);
  });

  it("select-all is empty while there are no rows", async () => {
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.toggleAll(true));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.allSelected).toBe(false);
    expect(result.current.someSelected).toBe(false);
  });
});
