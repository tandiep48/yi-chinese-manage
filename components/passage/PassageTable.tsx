"use client";

// components/passage/PassageTable.tsx
// Passage list table with expandable lines panel and edit/delete actions.

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/SkeletonRow";
import { Pagination } from "@/components/ui/Pagination";
import type { LessonPassage } from "@/lib/types";

interface PassageTableProps {
  items: LessonPassage[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  loading: boolean;
  expandedPassage: LessonPassage | null;
  expandLoading: boolean;
  onPageChange: (p: number) => void;
  onExpand: (passageId: string) => void;
  onEdit: (passage: LessonPassage) => void;
  onDelete: (passage: LessonPassage) => void;
}

const COL_COUNT = 4;
const th = "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider";
const td = "px-4 py-3 text-sm text-slate-700";

export function PassageTable({
  items,
  total,
  totalPages,
  page,
  pageSize,
  loading,
  expandedPassage,
  expandLoading,
  onPageChange,
  onExpand,
  onEdit,
  onDelete,
}: PassageTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Passage ID</th>
              <th className={th}>HSK Level</th>
              <th className={th}>Lines</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <SkeletonTable cols={COL_COUNT} rows={6} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No passages found.
                </td>
              </tr>
            ) : null}
          </tbody>
          {!loading && items.length > 0 && items.map((p) => {
            const isExpanded = expandedPassage?.passage_id === p.passage_id;
            return (
              <tbody key={p.passage_id}>
                    {/* Main row */}
                    <tr
                      key={p.passage_id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onExpand(p.passage_id)}
                    >
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          {/* Chevron */}
                          <svg
                            className={[
                              "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200",
                              isExpanded ? "rotate-90" : "",
                            ].join(" ")}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                          </svg>
                          <span className="font-mono font-medium text-slate-800">
                            {p.passage_id}
                          </span>
                        </div>
                      </td>
                      <td className={td}>
                        {p.hsk_level ? (
                          <Badge label={p.hsk_level} hskLevel={p.hsk_level} />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className={`${td} text-slate-400`}>
                        {isExpanded && !expandLoading
                          ? `${expandedPassage?.lines?.length ?? 0} lines`
                          : "—"}
                      </td>
                      <td
                        className={`${td} text-right`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deleteId === p.passage_id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-slate-500">Delete?</span>
                            <button
                              id={`passage-confirm-delete-${p.passage_id}`}
                              onClick={() => { onDelete(p); setDeleteId(null); }}
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
                              id={`passage-edit-${p.passage_id}`}
                              onClick={() => onEdit(p)}
                              title="Edit"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>
                            <button
                              id={`passage-delete-${p.passage_id}`}
                              onClick={() => setDeleteId(p.passage_id)}
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

                    {/* Expanded lines panel */}
                    {isExpanded && (
                      <tr key={`${p.passage_id}-lines`}>
                        <td colSpan={COL_COUNT} className="bg-indigo-50/50 px-6 py-4">
                          {expandLoading ? (
                            <p className="text-xs text-slate-400 animate-pulse">Loading lines…</p>
                          ) : !expandedPassage?.lines?.length ? (
                            <p className="text-xs text-slate-400 italic">No lines in this passage.</p>
                          ) : (
                            <div className="space-y-2">
                              {expandedPassage.lines.map((line) => (
                                <div
                                  key={line.id}
                                  className="flex items-start gap-4 rounded-lg bg-white border border-slate-200 px-4 py-2.5 shadow-sm"
                                >
                                  <span className="text-[10px] font-mono text-slate-400 w-6 shrink-0 mt-0.5">
                                    {line.line_id}
                                  </span>
                                  {line.speaker && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                      {line.speaker}
                                    </span>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800">{line.content}</p>
                                    {line.pinyin && (
                                      <p className="text-xs text-slate-500 mt-0.5">{line.pinyin}</p>
                                    )}
                                    {(line.translation_en || line.translation_vi) && (
                                      <p className="text-xs text-slate-400 mt-0.5">
                                        {[line.translation_en, line.translation_vi].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
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
