"use client";

// components/page/support/TicketThread.tsx
// One support ticket for staff: header (student, item link, status, assignee),
// the conversation, and a reply box.

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/shared/manager_ui/Badge/Badge";
import { ITEM_MANAGE_PATH, type SupportTicketDetail, type TicketStatus } from "@/lib/types/support";

interface TicketThreadProps {
  ticket: SupportTicketDetail;
  currentUserId: number | null;
  onReply: (body: string) => Promise<void>;
  onStatus: (status: TicketStatus) => Promise<void>;
  onAssign: (userId: number) => Promise<void>;
}

const btn =
  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ";

export function TicketThread({ ticket, currentUserId, onReply, onStatus, onAssign }: TicketThreadProps) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await onReply(body.trim());
      setBody("");
    });
  };

  const resolved = ticket.status === "resolved";
  const mine = currentUserId !== null && ticket.assignee_id === currentUserId;

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm min-h-0">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-800 truncate">{ticket.subject}</h2>
          <p className="mt-1 text-xs text-slate-500">
            From <span className="font-medium text-slate-700">{ticket.username}</span>
            {ticket.assignee_name && <> · Assigned to {ticket.assignee_name}</>}
          </p>
          {ticket.item_type && ticket.item_id && (
            <p className="mt-1 text-xs">
              <Link
                href={ITEM_MANAGE_PATH[ticket.item_type]}
                className="text-indigo-600 hover:underline"
              >
                {ticket.item_type} #{ticket.item_id}
              </Link>
            </p>
          )}
          {ticket.page_url && <p className="mt-1 text-xs text-slate-400 truncate">{ticket.page_url}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge label={ticket.status} />
          <button
            type="button"
            disabled={busy || currentUserId === null}
            onClick={() => run(() => onAssign(mine ? 0 : (currentUserId as number)))}
            className={btn + "text-slate-600 hover:bg-slate-100"}
          >
            {mine ? "Unassign" : "Assign to me"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => onStatus(resolved ? "open" : "resolved"))}
            className={btn + "bg-indigo-500 text-white hover:bg-indigo-600"}
          >
            {resolved ? "Reopen" : "Mark resolved"}
          </button>
        </div>
      </header>

      <ul className="flex flex-col gap-3 overflow-y-auto p-4">
        {ticket.messages.map((m) => (
          <li
            key={m.id}
            className={[
              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
              m.is_staff ? "self-end bg-indigo-500 text-white" : "self-start bg-slate-100 text-slate-800",
            ].join(" ")}
          >
            <p className="mb-0.5 text-[11px] font-semibold opacity-75">{m.sender_name}</p>
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="space-y-2 border-t border-slate-100 p-4">
        <textarea
          aria-label="Reply"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          required
          placeholder="Write a reply…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className={btn + "bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-600"}
          >
            Send reply
          </button>
        </div>
      </form>
    </section>
  );
}
