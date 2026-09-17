import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookForm } from "@/components/page/book/BookForm";
import type { Book } from "@/lib/types/book";

const BOOK: Book = { book_code: "AML", name_en: "A Month in Life", name_vn: "Một tháng" };

describe("BookForm", () => {
  it("renders create mode with empty fields", () => {
    render(<BookForm open initial={null} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Add New Book")).toBeInTheDocument();
    expect(screen.getByLabelText(/Book Code/)).toHaveValue("");
    expect(screen.getByLabelText(/Book Code/)).not.toBeDisabled();
  });

  it("renders edit mode with fields populated and code locked", () => {
    render(<BookForm open initial={BOOK} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Edit Book — AML")).toBeInTheDocument();
    expect(screen.getByLabelText(/Book Code/)).toHaveValue("AML");
    expect(screen.getByLabelText(/Book Code/)).toBeDisabled();
    expect(screen.getByLabelText("English Name")).toHaveValue("A Month in Life");
  });

  it("blocks submit and shows an error when book_code is empty", async () => {
    const onSubmit = vi.fn();
    render(<BookForm open initial={null} onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("Add Book"));
    expect(await screen.findByText("Book code is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits form data and closes on success", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<BookForm open initial={null} onClose={onClose} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Book Code/), "NEW");
    await user.type(screen.getByLabelText("English Name"), "New Book");
    fireEvent.click(screen.getByText("Add Book"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        book_code: "NEW",
        name_en: "New Book",
        name_vn: "",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows the submit error and does not close on failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Book 'AML' already exists."));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<BookForm open initial={null} onClose={onClose} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Book Code/), "AML");
    fireEvent.click(screen.getByText("Add Book"));

    expect(await screen.findByText("Book 'AML' already exists.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
