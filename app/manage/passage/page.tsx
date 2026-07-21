"use client";

// app/passage/page.tsx
// Passage management page — list, create, edit, delete, expand lines.

import { useState } from "react";
import { usePassage } from "@/hooks/usePassage";
import { useToast } from "@/components/ui/Toast";
import { TopBar } from "@/components/layout/TopBar";
import { PassageTable } from "@/components/passage/PassageTable";
import { PassageForm } from "@/components/passage/PassageForm";
import { HSK_LEVELS } from "@/lib/types";
import type { LessonPassage, PassageFormData } from "@/lib/types";

export default function PassagePage() {
  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    hskFilter,
    loading,
    error,
    expandedPassage,
    expandLoading,
    setPage,
    setHskFilter,
    expandPassage,
    createItem,
    updateItem,
    deleteItem,
  } = usePassage();

  const { toast } = useToast();

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LessonPassage | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = async (passage: LessonPassage) => {
    // Expand to load lines first, then open modal
    await expandPassage(passage.passage_id);
    setEditing(passage);
    setFormOpen(true);
  };

  const handleSubmit = async (data: PassageFormData) => {
    if (editing) {
      await updateItem(editing.passage_id, data);
      toast(`Passage "${editing.passage_id}" updated.`, "success");
    } else {
      await createItem(data);
      toast(`Passage "${data.passage_id}" created.`, "success");
    }
  };

  const handleDelete = async (passage: LessonPassage) => {
    try {
      await deleteItem(passage.passage_id);
      toast(`Passage "${passage.passage_id}" deleted.`, "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed.", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Passages"
        subtitle={`${total.toLocaleString()} lesson passages`}
        actions={
          <button
            id="passage-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
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
            value={hskFilter}
            onChange={(e) => setHskFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            <option value="">All Levels</option>
            {HSK_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Hint */}
        <p className="text-xs text-slate-400">
          💡 Click any row to expand and view its lesson lines.
        </p>

        {/* Table */}
        <PassageTable
          items={items}
          total={total}
          totalPages={totalPages}
          page={page}
          pageSize={pageSize}
          loading={loading}
          expandedPassage={expandedPassage}
          expandLoading={expandLoading}
          onPageChange={setPage}
          onExpand={expandPassage}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Form modal */}
      <PassageForm
        open={formOpen}
        initial={
          editing
            ? { ...editing, lines: expandedPassage?.lines ?? [] }
            : null
        }
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
