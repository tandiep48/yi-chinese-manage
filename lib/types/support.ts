// lib/types/support.ts
// Support tickets — mirrors Learning/web_app/entity/support (student + staff APIs).

export type TicketStatus = "open" | "resolved";

// Content a ticket can point at; mirrors ITEM_TYPES in entity/support/schemas.py.
export type SupportItemType =
  | "vocab"
  | "passage"
  | "passage_line"
  | "question"
  | "grammar_rule"
  | "grammar_context"
  | "book";

export interface SupportMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_name: string | null;
  is_staff: boolean;
  body: string;
  created_at: string | null;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  username: string | null;
  subject: string;
  item_type: SupportItemType | null;
  item_id: string | null;
  page_url: string | null;
  status: TicketStatus;
  assignee_id: number | null;
  assignee_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export interface NewTicketData {
  subject: string;
  body: string;
  item_type?: SupportItemType;
  item_id?: string;
  page_url?: string;
}

// Where /manage opens each item type, so staff can jump straight to what was reported.
export const ITEM_MANAGE_PATH: Record<SupportItemType, string> = {
  vocab: "/manage/vocab",
  passage: "/manage/passage",
  passage_line: "/manage/passage",
  question: "/manage/question",
  grammar_rule: "/manage/grammar_rule",
  grammar_context: "/manage/grammar_context",
  book: "/manage/book",
};
