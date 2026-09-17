"use client";

// components/question/QuestionTable.tsx
// Question bank data table with edit/delete actions.

import { useState } from "react";
import { SkeletonTable } from "@/components/shared/manager_ui/SkeletonRow/SkeletonRow";
import { Pagination } from "@/components/shared/manager_ui/Pagination/Pagination";
import type { Question } from "@/lib/types/question";

interface QuestionTableProps {
  items: Question[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (p: number) => void;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
}

const COL_COUNT = 9;

const th = "px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider";
const td = "px-3 py-3 text-sm text-slate-700";

function truncate(text: string | null, n = 40): string {
  if (!text) return "—";
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > n ? oneLine.slice(0, n) + "…" : oneLine;
}

export function QuestionTable({
  items,
  total,
  totalPages,
  page,
  pageSize,
  loading,
  onPageChange,
  onEdit,
  onDelete,
}: QuestionTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>ID</th>
              <th className={th}>Category</th>
              <th className={th}>Lvl</th>
              <th className={th}>Lesson</th>
              <th className={th}>No</th>
              <th className={th}>Skill</th>
              <th className={th}>Type</th>
              <th className={th}>Content</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <SkeletonTable cols={COL_COUNT} rows={6} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No questions found.
                </td>
              </tr>
            ) : (
              items.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className={`${td} text-slate-400 font-mono text-xs`}>{q.id}</td>
                  <td className={td}>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
                        q.category === "exam"
                          ? "bg-rose-50 text-rose-700 ring-rose-200"
                          : "bg-sky-50 text-sky-700 ring-sky-200",
                      ].join(" ")}
                    >
                      {q.category}
                    </span>
                  </td>
                  <td className={td}>{q.level}</td>
                  <td className={td}>{q.lesson}</td>
                  <td className={td}>{q.no}</td>
                  <td className={`${td} text-slate-500`}>{q.skill ?? "—"}</td>
                  <td className={td}>{q.type}</td>
                  <td className={`${td} text-slate-500 max-w-xs`} title={q.content ?? undefined}>
                    {truncate(q.content)}
                  </td>
                  <td className={`${td} text-right`}>
                    {deleteId === q.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-slate-500">Delete?</span>
                        <button
                          id={`question-confirm-delete-${q.id}`}
                          onClick={() => { onDelete(q); setDeleteId(null); }}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`question-edit-${q.id}`}
                          onClick={() => onEdit(q)}
                          title="Edit"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                        <button
                          id={`question-delete-${q.id}`}
                          onClick={() => setDeleteId(q.id)}
                          title="Delete"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
