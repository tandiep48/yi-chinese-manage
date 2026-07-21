"use client";

// app/vocab/page.tsx
// Vocabulary management page — list, create, edit, delete.

import { useState } from "react";
import { useVocab } from "@/hooks/useVocab";
import { useToast } from "@/components/ui/Toast";
import { TopBar } from "@/components/layout/TopBar";
import { VocabTable } from "@/components/vocab/VocabTable";
import { VocabForm } from "@/components/vocab/VocabForm";
import { HSK_LEVELS } from "@/lib/types";
import type { Vocab, VocabFormData } from "@/lib/types";

export default function VocabPage() {
  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    hskFilter,
    loading,
    error,
    setPage,
    setHskFilter,
    createItem,
    updateItem,
    deleteItem,
  } = useVocab();

  const { toast } = useToast();

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vocab | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (vocab: Vocab) => {
    setEditing(vocab);
    setFormOpen(true);
  };

  const handleSubmit = async (data: VocabFormData) => {
    if (editing) {
      await updateItem(editing.id, data);
      toast(`"${data.cn}" updated successfully.`, "success");
    } else {
      await createItem(data);
      toast(`"${data.cn}" added successfully.`, "success");
    }
  };

  const handleDelete = async (vocab: Vocab) => {
    try {
      await deleteItem(vocab.id);
      toast(`"${vocab.cn}" deleted.`, "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed.", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Vocabulary"
        subtitle={`${total.toLocaleString()} entries`}
        actions={
          <button
            id="vocab-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add Vocabulary
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="vocab-hsk-filter" className="text-sm font-medium text-slate-600 shrink-0">
            HSK Level:
          </label>
          <select
            id="vocab-hsk-filter"
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

        {/* Table */}
        <VocabTable
          items={items}
          total={total}
          totalPages={totalPages}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Form modal */}
      <VocabForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
