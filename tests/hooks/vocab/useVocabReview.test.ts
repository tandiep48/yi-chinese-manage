// tests/hooks/vocab/useVocabReview.test.ts
// The watch-only review hook: it loads one of two sources (recent / review) a page
// at a time, caps each at REVIEW_WORD_CAP words, caches per (source, page), and
// swaps sources on setSource. The two endpoints are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { getLearnedVocab, getReviewRecent } from "@/lib/api/learner/vocab";
import {
  useVocabReview,
  invalidateVocabReview,
  REVIEW_PAGE_SIZE,
  REVIEW_WORD_CAP,
} from "@/hooks/vocab/useVocabReview";
import type { VocabRow } from "@/lib/types/vocab";

vi.mock("@/lib/api/learner/vocab", () => ({
  getLearnedVocab: vi.fn(),
  getReviewRecent: vi.fn(),
}));

const mockRecent = getLearnedVocab as unknown as ReturnType<typeof vi.fn>;
const mockReview = getReviewRecent as unknown as ReturnType<typeof vi.fn>;

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
  // The read cache is a module singleton that outlives a render; clear it so one
  // test's cached pages never answer another's.
  invalidateVocabReview();
  mockRecent.mockResolvedValue(response([]));
  mockReview.mockResolvedValue(response([]));
});

describe("useVocabReview — initial load", () => {
  it("opens on the given source and exposes its first page", async () => {
    mockRecent.mockResolvedValue(response([row("学习"), row("你好")]));
    const { result } = renderHook(() => useVocabReview("recent"));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(mockRecent).toHaveBeenCalledWith(1, REVIEW_PAGE_SIZE);
    expect(mockReview).not.toHaveBeenCalled();
    expect(result.current.rows.map((r) => r.word)).toEqual(["学习", "你好"]);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.source).toBe("recent");
  });

  it("surfaces an error when the first load fails", async () => {
    mockRecent.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useVocabReview("recent"));
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("drops rows with no word", async () => {
    mockRecent.mockResolvedValue(response([row("水"), row(""), row("火")]));
    const { result } = renderHook(() => useVocabReview("recent"));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.rows.map((r) => r.word)).toEqual(["水", "火"]);
  });
});

describe("useVocabReview — the 100-word cap", () => {
  it("clamps the total and page count to REVIEW_WORD_CAP", async () => {
    // The 'recent' endpoint paginates the whole mastered set (here 250 words).
    mockRecent.mockResolvedValue(
      response([row("一")], { page: 1, total: 250, total_pages: 5 })
    );
    const { result } = renderHook(() => useVocabReview("recent"));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.totalItems).toBe(REVIEW_WORD_CAP); // 100, not 250
    expect(result.current.totalPages).toBe(2); // ceil(100 / 50), not 5
  });
});

describe("useVocabReview — pagination", () => {
  it("navigates to page 2 and caches each page", async () => {
    mockRecent.mockResolvedValueOnce(
      response([row("前")], { page: 1, total: 60, total_pages: 2 })
    );
    const { result } = renderHook(() => useVocabReview("recent"));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.totalPages).toBe(2);

    mockRecent.mockResolvedValueOnce(
      response([row("后")], { page: 2, total: 60, total_pages: 2 })
    );
    act(() => result.current.goToPage(2));
    await waitFor(() => expect(result.current.rows.map((r) => r.word)).toEqual(["后"]));
    expect(result.current.page).toBe(2);
    expect(mockRecent).toHaveBeenLastCalledWith(2, REVIEW_PAGE_SIZE);

    // Returning to page 1 is served from cache — no new request.
    const callsBefore = mockRecent.mock.calls.length;
    act(() => result.current.goToPage(1));
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(mockRecent.mock.calls.length).toBe(callsBefore);
  });
});

describe("useVocabReview — switching source", () => {
  it("loads the other endpoint, resets to page 1, and shows loading", async () => {
    mockRecent.mockResolvedValue(response([row("学习")]));
    mockReview.mockResolvedValue(response([row("复习")]));
    const { result } = renderHook(() => useVocabReview("recent"));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.setSource("review"));
    expect(result.current.source).toBe("review");
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(mockReview).toHaveBeenCalledWith(1, REVIEW_PAGE_SIZE);
    expect(result.current.rows.map((r) => r.word)).toEqual(["复习"]);
    expect(result.current.page).toBe(1);
  });

  it("ignores setSource to the current source", async () => {
    mockRecent.mockResolvedValue(response([row("学习")]));
    const { result } = renderHook(() => useVocabReview("recent"));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const callsBefore = mockRecent.mock.calls.length;
    act(() => result.current.setSource("recent"));
    expect(result.current.status).toBe("ready");
    expect(mockRecent.mock.calls.length).toBe(callsBefore);
  });
});
