"use client";

// hooks/support/useSupportPanel.ts
// State machine for the learner support panel: my tickets -> new ticket / one thread.
// While a thread is open it re-fetches every POLL_MS so staff replies appear without a reload.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTicket,
  getMyTicket,
  listMyTickets,
  replyToTicket,
} from "@/lib/api/learner/support";
import type { SupportTicket, SupportTicketDetail } from "@/lib/types/support";
import type { SupportPrefill } from "@/components/page/learner/support/SupportContext";

export type SupportView = "list" | "new" | "thread";
const POLL_MS = 15000;

// Put a just-created/updated ticket at the top of the cached list, so going back shows it
// straight away instead of waiting for (or losing it to) the next list fetch.
function withTicketFirst(list: SupportTicket[], detail: SupportTicketDetail): SupportTicket[] {
  const { messages: _messages, ...summary } = detail;
  void _messages;
  return [summary, ...list.filter((t) => t.id !== summary.id)];
}

export function useSupportPanel(open: boolean, prefill: SupportPrefill | null) {
  const [view, setView] = useState<SupportView>("list");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only the newest list request may apply its result, so a slow, older response can't
  // overwrite a ticket added locally in the meantime.
  const listRequest = useRef(0);
  const loadList = useCallback(async () => {
    const mine = ++listRequest.current;
    setLoading(true);
    setError(null);
    try {
      const res = await listMyTickets();
      if (mine === listRequest.current) setTickets(res.items);
    } catch (e) {
      if (mine === listRequest.current) setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      if (mine === listRequest.current) setLoading(false);
    }
  }, []);

  const showList = useCallback(() => {
    setView("list");
    setTicket(null);
    void loadList();
  }, [loadList]);

  // Each time the panel opens: straight to the form when opened from an item, else the list.
  useEffect(() => {
    if (!open) return;
    if (prefill) {
      setView("new");
      setError(null);
    } else {
      showList();
    }
  }, [open, prefill, showList]);

  const showNew = useCallback(() => {
    setView("new");
    setError(null);
  }, []);

  const openTicket = useCallback(async (id: number) => {
    setView("thread");
    setLoading(true);
    setError(null);
    try {
      setTicket(await getMyTicket(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const ticketId = ticket?.id;
  useEffect(() => {
    if (!open || view !== "thread" || ticketId === undefined) return;
    const timer = setInterval(() => {
      getMyTicket(ticketId).then(setTicket, () => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [open, view, ticketId]);

  // Both senders resolve true on success so the form knows to clear itself.
  const submitNew = useCallback(
    async (subject: string, body: string): Promise<boolean> => {
      setSending(true);
      setError(null);
      try {
        const created = await createTicket({
          subject,
          body,
          ...(prefill ? { item_type: prefill.item_type, item_id: prefill.item_id } : {}),
          page_url: window.location.pathname + window.location.search,
        });
        setTicket(created);
        listRequest.current++; // drop any list fetch that started before this ticket existed
        setTickets((prev) => withTicketFirst(prev, created));
        setView("thread");
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed");
        return false;
      } finally {
        setSending(false);
      }
    },
    [prefill]
  );

  const sendReply = useCallback(
    async (body: string): Promise<boolean> => {
      if (!ticket) return false;
      setSending(true);
      setError(null);
      try {
        await replyToTicket(ticket.id, body);
        const fresh = await getMyTicket(ticket.id);
        setTicket(fresh);
        listRequest.current++;
        setTickets((prev) => withTicketFirst(prev, fresh));
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed");
        return false;
      } finally {
        setSending(false);
      }
    },
    [ticket]
  );

  return { view, tickets, ticket, loading, sending, error, showList, showNew, openTicket, submitNew, sendReply };
}
