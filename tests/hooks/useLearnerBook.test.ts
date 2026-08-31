import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLearnerBook } from "@/hooks/useLearnerBook";
import * as api from "@/lib/api/learnerBooks";
import type { LearnerBookDetail } from "@/lib/types/types";

vi.mock("@/lib/api/learnerBooks");

const BOOK: LearnerBookDetail = {
  book_code: "AML",
  book_name: "A Month in Life",
  lessons: [
    { lesson: 1, title: "Arrival", part_count: 3, done_count: 1, parts: [{ part: 1, passage_id: "AML_1_1", completed: true }] },
  ],
};

describe("useLearnerBook", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads one book's lessons on mount", async () => {
    vi.mocked(api.getLearnerBook).mockResolvedValue(BOOK);

    const { result } = renderHook(() => useLearnerBook("AML"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.getLearnerBook).toHaveBeenCalledWith("AML");
    expect(result.current.book).toEqual(BOOK);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error message on failure", async () => {
    vi.mocked(api.getLearnerBook).mockRejectedValue(new Error("not found"));

    const { result } = renderHook(() => useLearnerBook("AML"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("not found");
    expect(result.current.book).toBeNull();
  });
});
