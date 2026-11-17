"use client";

// hooks/manage/useSupportInbox.ts
// State for the /manage/support inbox: the filtered ticket list plus the open thread.

import { useCallback, useEffect, useState } from "react";
import { getTicket, listTickets, replyAsStaff, updateTicket } from "@/lib/api/manage/support";
import type { SupportTicket, SupportTicketDetail, TicketStatus } from "@/lib/types/support";

const PAGE_SIZE = 20;

export function useSupportInbox() {
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatusFilter] = useState<TicketStatus | "">("open");
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTickets(page, PAGE_SIZE, status || undefined, search);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const select = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      setDetail(await getTicket(id));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const reload = useCallback(
    async (id: number) => {
      setDetail(await getTicket(id));
      await refresh();
    },
    [refresh]
  );

  const reply = useCallback(
    async (body: string) => {
      if (!detail) return;
      await replyAsStaff(detail.id, body);
      await reload(detail.id);
    },
    [detail, reload]
  );

  const setStatus = useCallback(
    async (next: TicketStatus) => {
      if (!detail) return;
      await updateTicket(detail.id, { status: next });
      await reload(detail.id);
    },
    [detail, reload]
  );

  // assigneeId 0 unassigns.
  const assign = useCallback(
    async (assigneeId: number) => {
      if (!detail) return;
      await updateTicket(detail.id, { assignee_id: assigneeId });
      await reload(detail.id);
    },
    [detail, reload]
  );

  return {
    items,
    total,
    totalPages,
    page,
    pageSize: PAGE_SIZE,
    status,
    search,
    loading,
    error,
    detail,
    detailLoading,
    setPage,
    setStatus: setStatusFilter,
    setSearch: (q: string) => {
      setSearchState(q);
      setPage(1);
    },
    select,
    reply,
    setTicketStatus: setStatus,
    assign,
  };
}
