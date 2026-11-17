"use client";

// hooks/support/useSupportPanel.ts
// State machine for the learner support panel: my tickets -> new ticket / one thread.
// While a thread is open it re-fetches every POLL_MS so staff replies appear without a reload.

import { useCallback, useEffect, useState } from "react";
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

export function useSupportPanel(open: boolean, prefill: SupportPrefill | null) {
  const [view, setView] = useState<SupportView>("list");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTickets((await listMyTickets()).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setLoading(false);
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
        setTicket(await getMyTicket(ticket.id));
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
