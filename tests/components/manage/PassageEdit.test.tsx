// tests/components/manage/PassageEdit.test.tsx
// Editing a passage must always load its lines first: an expanded row used to
// collapse instead, and saving the empty form deleted every line.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PassagePage from "@/app/manage/passage/page";
import { getPassage, listPassages, updatePassage } from "@/lib/api/manage/passage";

vi.mock("@/lib/api/manage/passage");
vi.mock("@/components/layout/TopBar", () => ({ TopBar: () => null }));
const toast = vi.fn();
vi.mock("@/components/shared/manager_ui/Toast/Toast", () => ({
  useToast: () => ({ toast }),
}));
vi.mock("@/components/page/passage/PassageVocabManager", () => ({
  PassageVocabManager: () => null,
}));

const passage = { passage_id: "H1_1_1", hsk_level: "HSK1" };
const line = {
  id: 1, passage_id: "H1_1_1", line_id: 1, speaker: "A", content: "你好", pinyin: null,
  audio_key: null, translation_en: null, translation_vi: null, tokens: [],
};

describe("Passage edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPassages).mockResolvedValue({
      items: [passage], total: 1, page: 1, page_size: 20, total_pages: 1,
    });
    vi.mocked(getPassage).mockResolvedValue({ ...passage, lines: [line] });
  });

  it("keeps the lines when the row is already expanded", async () => {
    const user = userEvent.setup();
    render(<PassagePage />);

    await user.click(await screen.findByText("H1_1_1"));
    await screen.findByText("你好");
    await user.click(screen.getByTitle("Edit"));
    await user.click(await screen.findByRole("button", { name: "Save Changes" }));

    expect(updatePassage).toHaveBeenCalledWith(
      "H1_1_1",
      expect.objectContaining({ lines: [expect.objectContaining({ content: "你好" })] })
    );
  });

  it("does not open the form when the lines fail to load", async () => {
    vi.mocked(getPassage).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<PassagePage />);

    await user.click(await screen.findByTitle("Edit"));

    expect(toast).toHaveBeenCalledWith("boom", "error");
    expect(screen.queryByRole("button", { name: "Save Changes" })).toBeNull();
  });
});
