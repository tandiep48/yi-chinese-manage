// tests/hooks/useVocabReview.test.ts
// Covers the behaviour the review page relies on: the initial load and its
// failure state, "Load more" appending pages, and the selection set — which
// survives appends and whose select-all spans only the rows loaded so far.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { getVocabReview } from "@/lib/api/learner/learnerVocab";
import { useVocabReview, REVIEW_PAGE_SIZE } from "@/hooks/vocab/useVocabReview";
import type { VocabRow } from "@/lib/types/vocab";

vi.mock("@/lib/api/learner/learnerVocab", () => ({ getVocabReview: vi.fn() }));

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
    expect(result.current.canLoadMore).toBe(false);
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
    expect(result.current.canLoadMore).toBe(false);
  });
});

describe("useVocabReview — load more", () => {
  it("appends the next page and stops offering more at the last one", async () => {
    mockReview.mockResolvedValueOnce(
      response([row("一")], { page: 1, total_pages: 2, total: 2 })
    );
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.canLoadMore).toBe(true);

    mockReview.mockResolvedValueOnce(
      response([row("二")], { page: 2, total_pages: 2, total: 2 })
    );
    await act(() => result.current.loadMore());

    expect(mockReview).toHaveBeenLastCalledWith(2, REVIEW_PAGE_SIZE);
    expect(result.current.rows.map((r) => r.word)).toEqual(["一", "二"]);
    expect(result.current.canLoadMore).toBe(false);
  });

  it("does nothing once every page is loaded", async () => {
    mockReview.mockResolvedValue(response([row("三")]));
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(() => result.current.loadMore());
    expect(mockReview).toHaveBeenCalledTimes(1);
  });

  it("keeps the rows already loaded when the next page fails", async () => {
    mockReview.mockResolvedValueOnce(
      response([row("四")], { page: 1, total_pages: 2, total: 2 })
    );
    const { result } = renderHook(() => useVocabReview());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    mockReview.mockRejectedValueOnce(new Error("network"));
    await act(() => result.current.loadMore());

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.loadingMore).toBe(false);
    // The button stays available so the learner can retry.
    expect(result.current.canLoadMore).toBe(true);
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

  it("select-all covers every loaded row", async () => {
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

  it("keeps earlier selections after a new page is appended", async () => {
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
    await act(() => result.current.loadMore());

    // The appended row is unselected, so the list is now partially selected.
    expect(result.current.selectedWords).toEqual(["九"]);
    expect(result.current.allSelected).toBe(false);
    expect(result.current.someSelected).toBe(true);
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
