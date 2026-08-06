"use client";

// app/question/page.tsx
// Question bank management page — list, filter, search, create, edit, delete.

import { useEffect, useState } from "react";
import { useQuestion } from "@/hooks/useQuestion";
import { useToast } from "@/components/shared/manager_ui/Toast/Toast";
import { TopBar } from "@/components/layout/TopBar";
import { QuestionTable } from "@/components/question/QuestionTable";
import { QuestionForm } from "@/components/question/QuestionForm";
import { QUESTION_CATEGORIES, QUESTION_SKILLS } from "@/lib/types/types";
import type { Question, QuestionFormData } from "@/lib/types/types";

const selectCls =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all";

export default function QuestionPage() {
  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    filters,
    loading,
    error,
    setPage,
    setFilters,
    createItem,
    updateItem,
    deleteItem,
  } = useQuestion();

  const { toast } = useToast();

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const handle = setTimeout(() => setFilters({ search: searchInput.trim() }), 300);
    return () => clearTimeout(handle);
  }, [searchInput, setFilters]);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (question: Question) => {
    setEditing(question);
    setFormOpen(true);
  };

  const handleSubmit = async (data: QuestionFormData) => {
    if (editing) {
      await updateItem(editing.id, data);
      toast(`Question #${editing.id} updated.`, "success");
    } else {
      await createItem(data);
      toast(`Question created.`, "success");
    }
  };

  const handleDelete = async (question: Question) => {
    try {
      await deleteItem(question.id);
      toast(`Question #${question.id} deleted.`, "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed.", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Question Bank"
        subtitle={`${total.toLocaleString()} questions`}
        actions={
          <button
            id="question-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add Question
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            id="question-category-filter"
            value={filters.category ?? ""}
            onChange={(e) => setFilters({ category: e.target.value })}
            className={selectCls}
          >
            <option value="">All categories</option>
            {QUESTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            id="question-skill-filter"
            value={filters.skill ?? ""}
            onChange={(e) => setFilters({ skill: e.target.value })}
            className={selectCls}
          >
            <option value="">All skills</option>
            {QUESTION_SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            id="question-level-filter"
            type="number"
            value={filters.level ?? ""}
            onChange={(e) => setFilters({ level: e.target.value })}
            placeholder="Level"
            className={`${selectCls} w-24`}
          />
          <input
            id="question-lesson-filter"
            type="number"
            value={filters.lesson ?? ""}
            onChange={(e) => setFilters({ lesson: e.target.value })}
            placeholder="Lesson"
            className={`${selectCls} w-24`}
          />
          <input
            id="question-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search content…"
            className={`${selectCls} w-64 max-w-full`}
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <QuestionTable
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
      <QuestionForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
