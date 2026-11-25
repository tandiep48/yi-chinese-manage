"use client";

// components/page/passage/PassageTable.tsx
// Passage list; each row opens that passage's editor page.

import Link from "next/link";
import { Badge } from "@/components/shared/manager_ui/Badge/Badge";
import { SkeletonTable } from "@/components/shared/manager_ui/SkeletonRow/SkeletonRow";
import { Pagination } from "@/components/shared/manager_ui/Pagination/Pagination";
import type { LessonPassage } from "@/lib/types/lesson";

interface PassageTableProps {
  items: LessonPassage[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (p: number) => void;
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
  onPageChange,
}: PassageTableProps) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Passage ID</th>
              <th className={th}>Title</th>
              <th className={th}>HSK / Book</th>
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
            ) : (
              items.map((p) => (
                <tr key={p.passage_id} className="hover:bg-slate-50 transition-colors">
                  <td className={`${td} font-mono font-medium`}>
                    <Link
                      href={`/manage/passage/${p.passage_id}`}
                      className="text-slate-800 hover:text-indigo-600"
                    >
                      {p.passage_id}
                    </Link>
                  </td>
                  <td className={td}>
                    {p.title_en || p.title_vn || <span className="text-slate-300">—</span>}
                  </td>
                  <td className={td}>
                    {p.hsk_level ? (
                      <Badge label={p.hsk_level} hskLevel={p.hsk_level} />
                    ) : (
                      p.book_code || <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={`${td} text-right`}>
                    <Link
                      href={`/manage/passage/${p.passage_id}`}
                      aria-label={`Edit ${p.passage_id}`}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </Link>
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
