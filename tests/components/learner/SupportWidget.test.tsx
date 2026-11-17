// tests/components/learner/SupportWidget.test.tsx
// The learner support panel: hidden when signed out, lists tickets, opens a thread,
// and files a new ticket (pre-filled with the item it was opened from).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SupportWidget } from "@/components/page/learner/support/SupportWidget";
import { SupportProvider, useSupport } from "@/components/page/learner/support/SupportContext";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { createTicket, getMyTicket, listMyTickets, replyToTicket } from "@/lib/api/learner/support";
import type { SupportTicketDetail } from "@/lib/types/support";

vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/api/learner/support", () => ({
  listMyTickets: vi.fn(),
  createTicket: vi.fn(),
  getMyTicket: vi.fn(),
  replyToTicket: vi.fn(),
}));

const mockAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockList = listMyTickets as unknown as ReturnType<typeof vi.fn>;
const mockCreate = createTicket as unknown as ReturnType<typeof vi.fn>;
const mockGet = getMyTicket as unknown as ReturnType<typeof vi.fn>;
const mockReply = replyToTicket as unknown as ReturnType<typeof vi.fn>;

const ticket: SupportTicketDetail = {
  id: 5,
  user_id: 7,
  username: "kid",
  subject: "Wrong pinyin",
  item_type: "vocab",
  item_id: "42",
  page_url: null,
  status: "open",
  assignee_id: null,
  assignee_name: null,
  created_at: null,
  updated_at: null,
  messages: [
    { id: 1, ticket_id: 5, sender_id: 7, sender_name: "kid", is_staff: false, body: "It says ni", created_at: null },
    { id: 2, ticket_id: 5, sender_id: 1, sender_name: "ed", is_staff: true, body: "Fixed, thanks", created_at: null },
  ],
};

function OpenFromItem() {
  const { openSupport } = useSupport();
  return (
    <button onClick={() => openSupport({ item_type: "vocab", item_id: "42", label: "你好" })}>
      report-item
    </button>
  );
}

function renderWidget() {
  return render(
    <I18nProvider>
      <SupportProvider>
        <OpenFromItem />
        <SupportWidget />
      </SupportProvider>
    </I18nProvider>
  );
}

const helpButton = () => screen.getByRole("button", { expanded: false });

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockReturnValue({ user: { id: 7 } });
  mockList.mockResolvedValue({ items: [], page: 1, page_size: 20, total: 0, total_pages: 1 });
});

describe("SupportWidget", () => {
  it("renders nothing for a signed-out visitor", () => {
    mockAuth.mockReturnValue({ user: null });
    renderWidget();
    expect(screen.queryByRole("button", { expanded: false })).not.toBeInTheDocument();
  });

  it("lists my tickets and opens a thread with staff replies", async () => {
    mockList.mockResolvedValue({ items: [ticket], page: 1, page_size: 20, total: 1, total_pages: 1 });
    mockGet.mockResolvedValue(ticket);
    const user = userEvent.setup();
    renderWidget();

    await user.click(helpButton());
    await user.click(await screen.findByRole("button", { name: /Wrong pinyin/ }));

    expect(await screen.findByText("Fixed, thanks")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith(5);
  });

  it("sends a reply and refreshes the thread", async () => {
    mockList.mockResolvedValue({ items: [ticket], page: 1, page_size: 20, total: 1, total_pages: 1 });
    mockGet.mockResolvedValue(ticket);
    mockReply.mockResolvedValue({});
    const user = userEvent.setup();
    renderWidget();

    await user.click(helpButton());
    await user.click(await screen.findByRole("button", { name: /Wrong pinyin/ }));
    await user.type(await screen.findByRole("textbox"), "thank you");
    await user.click(screen.getByRole("button", { name: /^(Reply|Phản hồi)$/ }));

    await waitFor(() => expect(mockReply).toHaveBeenCalledWith(5, "thank you"));
  });

  it("files a ticket about the item the panel was opened from", async () => {
    mockCreate.mockResolvedValue(ticket);
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole("button", { name: "report-item" }));
    expect(await screen.findByText(/你好/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Subject|Tiêu đề/), "Wrong pinyin");
    await user.type(screen.getByLabelText(/Message|Nội dung/), "It says ni");
    await user.click(screen.getByRole("button", { name: /^(Send|Gửi)$/ }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Wrong pinyin",
          body: "It says ni",
          item_type: "vocab",
          item_id: "42",
        })
      )
    );
    expect(await screen.findByText("Fixed, thanks")).toBeInTheDocument();
  });
});
