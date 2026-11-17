"use client";

// app/manage/support/page.tsx
// Support inbox — students' item reports and questions; staff reply, assign and resolve.

import { useAuth } from "@/components/auth/AuthProvider";
import { TopBar } from "@/components/layout/TopBar";
import { Pagination } from "@/components/shared/manager_ui/Pagination/Pagination";
import { SkeletonTable } from "@/components/shared/manager_ui/SkeletonRow/SkeletonRow";
import { TicketThread } from "@/components/page/support/TicketThread";
import { useSupportInbox } from "@/hooks/manage/useSupportInbox";
import type { TicketStatus } from "@/lib/types/support";

const FILTERS: { value: TicketStatus | ""; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "", label: "All" },
];

export default function SupportPage() {
  const { user } = useAuth();
  const inbox = useSupportInbox();

  return (
    <>
      <TopBar title="Support" subtitle="Questions and item reports from students" />
      <div className="grid flex-1 min-h-0 gap-4 overflow-y-auto p-4 lg:grid-cols-[22rem_1fr] lg:p-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  inbox.setStatus(f.value);
                  inbox.setPage(1);
                }}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  inbox.status === f.value
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-100",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            aria-label="Search tickets"
            placeholder="Search subject or username"
            value={inbox.search}
            onChange={(e) => inbox.setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />

          {inbox.error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {inbox.error}
            </p>
          )}

          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {inbox.loading ? (
              <li>
                <table className="w-full">
                  <tbody>
                    <SkeletonTable cols={1} rows={5} />
                  </tbody>
                </table>
              </li>
            ) : inbox.items.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-slate-400">No tickets found.</li>
            ) : (
              inbox.items.map((tk) => (
                <li key={tk.id}>
                  <button
                    type="button"
                    onClick={() => void inbox.select(tk.id)}
                    className={[
                      "w-full px-4 py-3 text-left transition-colors hover:bg-slate-50",
                      inbox.detail?.id === tk.id ? "bg-indigo-50" : "",
                    ].join(" ")}
                  >
                    <p className="truncate text-sm font-medium text-slate-800">{tk.subject}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {tk.username} · {tk.status}
                      {tk.item_type && ` · ${tk.item_type} #${tk.item_id}`}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>

          <Pagination
            page={inbox.page}
            totalPages={inbox.totalPages}
            total={inbox.total}
            pageSize={inbox.pageSize}
            onPageChange={inbox.setPage}
          />
        </div>

        {inbox.detail ? (
          <TicketThread
            key={inbox.detail.id}
            ticket={inbox.detail}
            currentUserId={user?.id ?? null}
            onReply={inbox.reply}
            onStatus={inbox.setTicketStatus}
            onAssign={inbox.assign}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">
            {inbox.detailLoading ? "Loading…" : "Select a ticket to read and reply."}
          </p>
        )}
      </div>
    </>
  );
}
