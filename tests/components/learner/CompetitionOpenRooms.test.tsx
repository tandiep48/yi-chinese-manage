// tests/components/learner/CompetitionOpenRooms.test.tsx
// Item 6 (frontend): the setup screen lists open rooms below the create/join form.
// Each row shows the code, owner and learner count, joins on click, and a full
// room's Join is disabled.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { SetupScreen } from "@/components/page/learner/competition/SetupScreen";
import type { CompetitionSetup } from "@/hooks/competition/useCompetitionSetup";
import type { OpenRoomSummary } from "@/lib/types/competition";

function makeSetup(): CompetitionSetup {
  return {
    mode: "vocab",
    setMode: vi.fn(),
    isBook: false,
    typeOptions: [],
    types: [],
    setTypes: vi.fn(),
    levels: [],
    setLevels: vi.fn(),
    books: [],
    setBooks: vi.fn(),
    bookOptions: [],
    lessonOptions: [],
    lessonKeys: [],
    setLessonKeys: vi.fn(),
    partOptions: [],
    partIds: [],
    setPartIds: vi.fn(),
    maxUsers: 8,
    setMaxUsers: vi.fn(),
    timeoutMinutes: 15,
    setTimeoutMinutes: vi.fn(),
    error: "",
    setError: vi.fn(),
    prefillFromRoom: vi.fn(),
    buildSettings: vi.fn(),
  } as unknown as CompetitionSetup;
}

const ROOMS: OpenRoomSummary[] = [
  { room_code: "ABC123", owner_username: "alice", max_users: 8, category: "vocab", level: 1, member_count: 3, created_at: null },
  { room_code: "FULL99", owner_username: "bob", max_users: 2, category: "lesson", level: 2, member_count: 2, created_at: null },
];

function renderSetup(openRooms: OpenRoomSummary[], onJoin = vi.fn()) {
  render(
    <I18nProvider>
      <SetupScreen
        setup={makeSetup()}
        editing={false}
        error=""
        openRooms={openRooms}
        onSubmit={vi.fn()}
        onCancelEdit={vi.fn()}
        onJoin={onJoin}
      />
    </I18nProvider>
  );
  return onJoin;
}

describe("Competition open-rooms list", () => {
  it("shows the empty state when there are no open rooms", () => {
    renderSetup([]);
    expect(screen.getByText("No open rooms right now.")).toBeInTheDocument();
  });

  it("renders a row per open room with code, owner and learner count", () => {
    renderSetup(ROOMS);
    const card = screen.getByText("ABC123").closest(".open-room-card")!;
    expect(within(card as HTMLElement).getByText(/alice/)).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("3/8 learners")).toBeInTheDocument();
  });

  it("joins a room by clicking its Join button", () => {
    const onJoin = renderSetup(ROOMS);
    const card = screen.getByText("ABC123").closest(".open-room-card")!;
    fireEvent.click(within(card as HTMLElement).getByRole("button"));
    expect(onJoin).toHaveBeenCalledWith("ABC123");
  });

  it("disables Join for a full room", () => {
    renderSetup(ROOMS);
    const card = screen.getByText("FULL99").closest(".open-room-card")!;
    const button = within(card as HTMLElement).getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Full");
  });
});
