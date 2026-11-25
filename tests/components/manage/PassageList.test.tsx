// tests/components/manage/PassageList.test.tsx
// The passage list: search and book filter, links to the editor, and adding a
// passage opens it. There is no delete.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PassagePage from "@/app/manage/passage/page";
import { createPassage, listPassages } from "@/lib/api/manage/passage";
import { listBooks } from "@/lib/api/manage/book";

vi.mock("@/lib/api/manage/passage");
vi.mock("@/lib/api/manage/book");
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/layout/TopBar", () => ({
  TopBar: ({ actions }: { actions: React.ReactNode }) => <>{actions}</>,
}));

describe("Passage list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listBooks).mockResolvedValue([
      { book_code: "AML" } as Awaited<ReturnType<typeof listBooks>>[number],
    ]);
    vi.mocked(listPassages).mockResolvedValue({
      items: [{
        passage_id: "AML_1_1", hsk_level: null, book_code: "AML", title_en: "AI", title_vn: null,
      }],
      total: 1, page: 1, page_size: 20, total_pages: 1,
    });
  });

  it("links each passage to its editor and offers no delete", async () => {
    render(<PassagePage />);

    expect(await screen.findByRole("link", { name: "Edit AML_1_1" })).toHaveAttribute(
      "href", "/manage/passage/AML_1_1"
    );
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("combines the ID search with the book filter", async () => {
    const user = userEvent.setup();
    render(<PassagePage />);
    await screen.findByRole("option", { name: "AML" });

    await user.selectOptions(screen.getByLabelText("Book:"), "AML");
    await user.type(screen.getByRole("searchbox", { name: "Search passages" }), "1_1{Enter}");

    expect(listPassages).toHaveBeenLastCalledWith(1, 20, { bookCode: "AML", search: "1_1" });
  });

  it("opens a passage after adding it", async () => {
    const user = userEvent.setup();
    render(<PassagePage />);

    await user.click(screen.getByRole("button", { name: "Add Passage" }));
    await user.type(screen.getByLabelText(/^Passage ID/), "H1_9_1");
    await user.click(screen.getAllByRole("button", { name: "Add Passage" })[1]);

    expect(createPassage).toHaveBeenCalledWith({ passage_id: "H1_9_1", hsk_level: undefined });
    expect(push).toHaveBeenCalledWith("/manage/passage/H1_9_1");
  });
});
