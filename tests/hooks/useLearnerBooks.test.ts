import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLearnerBooks } from "@/hooks/useLearnerBooks";
import * as api from "@/lib/api/learnerBooks";
import type { LearnerBookSummary } from "@/lib/types/book";

vi.mock("@/lib/api/learnerBooks");

const BOOKS: LearnerBookSummary[] = [
  { book_code: "AML", name: "A Month in Life", cover_url: "/c/AML", lesson_count: 3, part_count: 9, done_count: 2 },
];

describe("useLearnerBooks", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads the book grid on mount", async () => {
    vi.mocked(api.getLearnerBooks).mockResolvedValue(BOOKS);

    const { result } = renderHook(() => useLearnerBooks());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.books).toEqual(BOOKS);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error message on failure", async () => {
    vi.mocked(api.getLearnerBooks).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useLearnerBooks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("network down");
    expect(result.current.books).toEqual([]);
  });
});
