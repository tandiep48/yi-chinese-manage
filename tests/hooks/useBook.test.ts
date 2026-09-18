import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBook } from "@/hooks/useBook";
import * as bookApi from "@/lib/api/manage/book";
import type { Book } from "@/lib/types/book";

vi.mock("@/lib/api/manage/book");

const BOOKS: Book[] = [
  { book_code: "AML", name_en: "A Month in Life", name_vn: null },
];

describe("useBook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads books on mount", async () => {
    vi.mocked(bookApi.listBooks).mockResolvedValue(BOOKS);

    const { result } = renderHook(() => useBook());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual(BOOKS);
    expect(result.current.error).toBeNull();
    expect(bookApi.listBooks).toHaveBeenCalledTimes(1);
  });

  it("sets an error message when the list call fails", async () => {
    vi.mocked(bookApi.listBooks).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useBook());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("network down");
    expect(result.current.items).toEqual([]);
  });

  it("createItem calls the API and refreshes the list", async () => {
    vi.mocked(bookApi.listBooks).mockResolvedValue([]);
    vi.mocked(bookApi.createBook).mockResolvedValue(BOOKS[0]);

    const { result } = renderHook(() => useBook());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(bookApi.listBooks).mockResolvedValue(BOOKS);
    await act(async () => {
      await result.current.createItem({ book_code: "AML", name_en: "A Month in Life" });
    });

    expect(bookApi.createBook).toHaveBeenCalledWith({
      book_code: "AML",
      name_en: "A Month in Life",
    });
    expect(result.current.items).toEqual(BOOKS);
  });

  it("updateItem calls the API with the book code and payload", async () => {
    vi.mocked(bookApi.listBooks).mockResolvedValue(BOOKS);
    vi.mocked(bookApi.updateBook).mockResolvedValue(BOOKS[0]);

    const { result } = renderHook(() => useBook());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateItem("AML", { name_en: "Updated" });
    });

    expect(bookApi.updateBook).toHaveBeenCalledWith("AML", { name_en: "Updated" });
  });

  it("deleteItem calls the API and refreshes the list", async () => {
    vi.mocked(bookApi.listBooks).mockResolvedValue(BOOKS);
    vi.mocked(bookApi.deleteBook).mockResolvedValue({ message: "deleted" });

    const { result } = renderHook(() => useBook());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(bookApi.listBooks).mockResolvedValue([]);
    await act(async () => {
      await result.current.deleteItem("AML");
    });

    expect(bookApi.deleteBook).toHaveBeenCalledWith("AML");
    expect(result.current.items).toEqual([]);
  });
});
