"use client";

// components/page/grammar_rule/GrammarRuleTable.tsx
// Grammar rule data table with edit/delete actions.

import { useState } from "react";
import { Badge } from "@/components/shared/manager_ui/Badge/Badge";
import { SkeletonTable } from "@/components/shared/manager_ui/SkeletonRow/SkeletonRow";
import { Pagination } from "@/components/shared/manager_ui/Pagination/Pagination";
import type { GrammarRule } from "@/lib/types/types";

interface GrammarRuleTableProps {
  items: GrammarRule[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (p: number) => void;
  onEdit: (rule: GrammarRule) => void;
  onDelete: (rule: GrammarRule) => void;
}

const COL_COUNT = 6;

const th = "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider";
const td = "px-4 py-3 text-sm text-slate-700";

function truncate(text: string | null, max = 60): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function GrammarRuleTable({
  items,
  total,
  totalPages,
  page,
  pageSize,
  loading,
  onPageChange,
  onEdit,
  onDelete,
}: GrammarRuleTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>ID</th>
              <th className={th}>Grammar ID</th>
              <th className={th}>Type</th>
              <th className={th}>Vietnamese</th>
              <th className={th}>English</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <SkeletonTable cols={COL_COUNT} rows={6} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No grammar rules found.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className={`${td} text-slate-400 font-mono text-xs`}>{r.id}</td>
                  <td className={td}>
                    <span className="font-medium text-slate-800">{r.grammar_id}</span>
                  </td>
                  <td className={td}>
                    {r.type != null ? (
                      <Badge label={`Type ${r.type}`} />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={td}>{truncate(r.vietnamese_content)}</td>
                  <td className={td}>{truncate(r.english_content)}</td>
                  <td className={`${td} text-right`}>
                    {deleteId === r.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-slate-500">Delete?</span>
                        <button
                          id={`grammar-rule-confirm-delete-${r.id}`}
                          onClick={() => { onDelete(r); setDeleteId(null); }}
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
                          id={`grammar-rule-edit-${r.id}`}
                          onClick={() => onEdit(r)}
                          title="Edit"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                        <button
                          id={`grammar-rule-delete-${r.id}`}
                          onClick={() => setDeleteId(r.id)}
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
