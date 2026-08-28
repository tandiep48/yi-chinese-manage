"use client";

// components/page/book/BookForm.tsx
// Create / Edit book modal form.

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/manager_ui/Modal/Modal";
import type { Book, BookFormData } from "@/lib/types/types";

interface BookFormProps {
  open: boolean;
  initial?: Book | null; // null = create mode
  onClose: () => void;
  onSubmit: (data: BookFormData) => Promise<void>;
}

const EMPTY: BookFormData = {
  book_code: "",
  name_en: "",
  name_vn: "",
};

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "transition-all";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

export function BookForm({ open, initial, onClose, onSubmit }: BookFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<BookFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync form when initial changes
  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              book_code: initial.book_code,
              name_en: initial.name_en ?? "",
              name_vn: initial.name_vn ?? "",
            }
          : EMPTY
      );
      setError("");
    }
  }, [open, initial]);

  const set = (key: keyof BookFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.book_code.trim()) {
      setError("Book code is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit Book — ${initial?.book_code}` : "Add New Book"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="book-code" className={labelCls}>
            Book Code <span className="text-rose-500">*</span>
          </label>
          <input
            id="book-code"
            value={form.book_code}
            onChange={set("book_code")}
            placeholder="AML"
            disabled={isEdit}
            className={inputCls + (isEdit ? " opacity-60 cursor-not-allowed" : "")}
          />
        </div>

        <div>
          <label htmlFor="book-name-en" className={labelCls}>English Name</label>
          <input
            id="book-name-en"
            value={form.name_en}
            onChange={set("name_en")}
            placeholder="A Month in Life"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="book-name-vn" className={labelCls}>Vietnamese Name</label>
          <input
            id="book-name-vn"
            value={form.name_vn}
            onChange={set("name_vn")}
            placeholder="Một tháng"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            id="book-form-submit"
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Book"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
