import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BookTable } from "@/components/page/book/BookTable";
import type { Book } from "@/lib/types/book";

const BOOKS: Book[] = [
  { book_code: "AML", name_en: "A Month in Life", name_vn: "Một tháng" },
  { book_code: "BEG", name_en: "Beginner", name_vn: null },
];

describe("BookTable", () => {
  it("renders a row per book", () => {
    render(<BookTable items={BOOKS} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("AML")).toBeInTheDocument();
    expect(screen.getByText("A Month in Life")).toBeInTheDocument();
    expect(screen.getByText("BEG")).toBeInTheDocument();
  });

  it("shows an empty state when there are no books", () => {
    render(<BookTable items={[]} loading={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("No books found.")).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    const { container } = render(
      <BookTable items={[]} loading={true} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.queryByText("No books found.")).not.toBeInTheDocument();
    expect(container.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
  });

  it("calls onEdit when the edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<BookTable items={BOOKS} loading={false} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(document.getElementById("book-edit-AML")!);
    expect(onEdit).toHaveBeenCalledWith(BOOKS[0]);
  });

  it("requires delete confirmation before calling onDelete", () => {
    const onDelete = vi.fn();
    render(<BookTable items={BOOKS} loading={false} onEdit={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(document.getElementById("book-delete-AML")!);
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(document.getElementById("book-confirm-delete-AML")!);
    expect(onDelete).toHaveBeenCalledWith(BOOKS[0]);
  });
});
