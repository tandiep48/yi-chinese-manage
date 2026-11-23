// tests/components/manage/SupportInbox.test.tsx
// /manage/support: the inbox list, opening a ticket, replying, resolving and assigning.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SupportPage from "@/app/manage/support/page";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTicket, listTickets, replyAsStaff, updateTicket } from "@/lib/api/manage/support";
import type { SupportTicketDetail } from "@/lib/types/support";

vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/api/manage/support", () => ({
  listTickets: vi.fn(),
  getTicket: vi.fn(),
  replyAsStaff: vi.fn(),
  updateTicket: vi.fn(),
}));

const mockAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockList = listTickets as unknown as ReturnType<typeof vi.fn>;
const mockGet = getTicket as unknown as ReturnType<typeof vi.fn>;
const mockReply = replyAsStaff as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = updateTicket as unknown as ReturnType<typeof vi.fn>;

const ticket: SupportTicketDetail = {
  id: 5,
  user_id: 7,
  username: "kid",
  subject: "Wrong pinyin",
  item_type: "vocab",
  item_id: "42",
  page_url: "/learner/vocab",
  status: "open",
  assignee_id: null,
  assignee_name: null,
  created_at: null,
  updated_at: null,
  messages: [
    { id: 1, ticket_id: 5, sender_id: 7, sender_name: "kid", is_staff: false, body: "It says ni", created_at: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockReturnValue({ user: { id: 1 } });
  mockList.mockResolvedValue({ items: [ticket], page: 1, page_size: 20, total: 1, total_pages: 1 });
  mockGet.mockResolvedValue(ticket);
  mockReply.mockResolvedValue({});
  mockUpdate.mockResolvedValue(ticket);
});

async function openTicket() {
  const user = userEvent.setup();
  render(<SupportPage />);
  await user.click(await screen.findByRole("button", { name: /Wrong pinyin/ }));
  await screen.findByText("It says ni");
  return user;
}

describe("Support inbox", () => {
  it("loads open tickets by default", async () => {
    render(<SupportPage />);
    expect(await screen.findByText("Wrong pinyin")).toBeInTheDocument();
    expect(mockList).toHaveBeenCalledWith(1, 20, "open", "");
  });

  it("shows an empty state", async () => {
    mockList.mockResolvedValue({ items: [], page: 1, page_size: 20, total: 0, total_pages: 1 });
    render(<SupportPage />);
    expect(await screen.findByText("No tickets found.")).toBeInTheDocument();
  });

  it("links the reported item to its manage page", async () => {
    await openTicket();
    expect(screen.getByRole("link", { name: "vocab #42" })).toHaveAttribute("href", "/manage/vocab");
  });

  it("replies as staff", async () => {
    const user = await openTicket();
    await user.type(screen.getByLabelText("Reply"), "Fixed");
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => expect(mockReply).toHaveBeenCalledWith(5, "Fixed"));
  });

  it("marks the ticket resolved and assigns it to me", async () => {
    const user = await openTicket();
    await user.click(screen.getByRole("button", { name: "Mark resolved" }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(5, { status: "resolved" }));

    await user.click(screen.getByRole("button", { name: "Assign to me" }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(5, { assignee_id: 1 }));
  });

  it("shows the server error when a reply fails", async () => {
    mockReply.mockRejectedValue(new Error("Ticket 5 not found."));
    const user = await openTicket();
    await user.type(screen.getByLabelText("Reply"), "Fixed");
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ticket 5 not found.");
  });
});
