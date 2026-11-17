import type { PaginatedResponse } from "@/lib/types/common";
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
  TicketStatus,
} from "@/lib/types/support";
import { API_CONSTANTS } from "../constants";
import { apiFetch } from "../client";

export function listTickets(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  status?: TicketStatus,
  search?: string
): Promise<PaginatedResponse<SupportTicket>> {
  return apiFetch("/api/admin/support/query", {
    method: "POST",
    body: JSON.stringify({
      page,
      page_size: pageSize,
      ...(status ? { status } : {}),
      ...(search?.trim() ? { search: search.trim() } : {}),
    }),
  });
}

export function getTicket(id: number): Promise<SupportTicketDetail> {
  return apiFetch(`/api/admin/support/${id}`);
}

export function replyAsStaff(id: number, body: string): Promise<SupportMessage> {
  return apiFetch(`/api/admin/support/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

// assignee_id: a user id to assign, 0 to clear; leave the key out to keep it.
export function updateTicket(
  id: number,
  changes: { status?: TicketStatus; assignee_id?: number }
): Promise<SupportTicket> {
  return apiFetch(`/api/admin/support/${id}`, {
    method: "PUT",
    body: JSON.stringify(changes),
  });
}
