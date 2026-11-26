"use client";

// app/manage/passage/page.tsx
// Passage list — search, filter, add, and open a passage to edit it.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePassage } from "@/hooks/manage/usePassage";
import { TopBar } from "@/components/layout/TopBar";
import { SearchBox } from "@/components/shared/manager_ui/SearchBox/SearchBox";
import { PassageTable } from "@/components/page/passage/PassageTable";
import { PassageForm } from "@/components/page/passage/PassageForm";
import { errorCls, primaryButtonCls } from "@/components/page/passage/formStyles";
import { createPassage } from "@/lib/api/manage/passage";
import { listBooks } from "@/lib/api/manage/book";
import { HSK_LEVELS } from "@/lib/types/common";
import type { Book } from "@/lib/types/book";
import type { PassageFormData } from "@/lib/types/lesson";

const selectCls =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all";

export default function PassagePage() {
  const { items, total, totalPages, page, pageSize, filters, loading, error, setPage, setFilter } =
    usePassage();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // A role without book:read still gets the page, just without book choices.
    listBooks().then(setBooks).catch(() => setBooks([]));
  }, []);

  const handleCreate = async (data: PassageFormData) => {
    await createPassage(data);
    router.push(`/manage/passage/${data.passage_id}`);
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Passages"
        subtitle={`${total.toLocaleString()} lesson passages`}
        actions={
          <button id="passage-add-btn" onClick={() => setFormOpen(true)} className={primaryButtonCls}>
            Add Passage
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="passage-hsk-filter" className="text-sm font-medium text-slate-600 shrink-0">
            HSK Level:
          </label>
          <select
            id="passage-hsk-filter"
            value={filters.hskLevel ?? ""}
            onChange={(e) => setFilter({ hskLevel: e.target.value })}
            className={selectCls}
          >
            <option value="">All Levels</option>
            {HSK_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <label htmlFor="passage-book-filter" className="text-sm font-medium text-slate-600 shrink-0">
            Book:
          </label>
          <select
            id="passage-book-filter"
            value={filters.bookCode ?? ""}
            onChange={(e) => setFilter({ bookCode: e.target.value })}
            className={`${selectCls} max-w-xs`}
          >
            <option value="">All Books</option>
            {books.map((b) => (
              <option key={b.book_code} value={b.book_code}>{b.book_code}</option>
            ))}
          </select>
          <SearchBox
            id="passage-search"
            label="Search passages"
            placeholder="Search passage ID, then Enter"
            onSearch={(search) => setFilter({ search })}
          />
        </div>

        {error && <div role="alert" className={errorCls}>{error}</div>}

        <PassageTable
          items={items}
          total={total}
          totalPages={totalPages}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={setPage}
        />
      </main>

      {/* Mounted only while open, so each visit starts blank. */}
      {formOpen && (
        <PassageForm open onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
