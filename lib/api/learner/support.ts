import type { PaginatedResponse } from "@/lib/types/common";
import type {
  NewTicketData,
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
} from "@/lib/types/support";
import { apiFetch } from "../client";

export function listMyTickets(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<SupportTicket>> {
  return apiFetch("/api/support/tickets/query", {
    method: "POST",
    body: JSON.stringify({ page, page_size: pageSize }),
  });
}

export function createTicket(data: NewTicketData): Promise<SupportTicketDetail> {
  return apiFetch("/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyTicket(id: number): Promise<SupportTicketDetail> {
  return apiFetch(`/api/support/tickets/${id}`);
}

export function replyToTicket(id: number, body: string): Promise<SupportMessage> {
  return apiFetch(`/api/support/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
