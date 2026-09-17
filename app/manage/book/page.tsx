"use client";

// app/manage/book/page.tsx
// Book management page — list, create, edit, delete.

import { useState } from "react";
import { useBook } from "@/hooks/useBook";
import { useToast } from "@/components/shared/manager_ui/Toast/Toast";
import { TopBar } from "@/components/layout/TopBar";
import { BookTable } from "@/components/page/book/BookTable";
import { BookForm } from "@/components/page/book/BookForm";
import type { Book, BookFormData } from "@/lib/types/book";

export default function BookPage() {
  const { items, loading, error, createItem, updateItem, deleteItem } = useBook();
  const { toast } = useToast();

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setFormOpen(true);
  };

  const handleSubmit = async (data: BookFormData) => {
    if (editing) {
      await updateItem(editing.book_code, data);
      toast(`"${data.book_code}" updated successfully.`, "success");
    } else {
      await createItem(data);
      toast(`"${data.book_code}" added successfully.`, "success");
    }
  };

  const handleDelete = async (book: Book) => {
    try {
      await deleteItem(book.book_code);
      toast(`"${book.book_code}" deleted.`, "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed.", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Books"
        subtitle={`${items.length.toLocaleString()} books`}
        actions={
          <button
            id="book-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add Book
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <BookTable
          items={items}
          loading={loading}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </main>

      <BookForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
