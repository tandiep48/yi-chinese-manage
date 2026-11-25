// tests/components/manage/PassageEditor.test.tsx
// The per-passage editor: each line saves on its own, tokens must match the
// content, lines reorder and append, and nothing can be deleted.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PassageEditorPage from "@/app/manage/passage/[passageId]/page";
import {
  addPassageLine,
  getPassage,
  reorderPassageLines,
  updatePassage,
  updatePassageLine,
} from "@/lib/api/manage/passage";
import type { LessonLine } from "@/lib/types/lesson";

vi.mock("@/lib/api/manage/passage");
vi.mock("next/navigation", () => ({ useParams: () => ({ passageId: "H1_1_1" }) }));
vi.mock("@/components/layout/TopBar", () => ({ TopBar: () => null }));
const toast = vi.fn();
vi.mock("@/components/shared/manager_ui/Toast/Toast", () => ({
  useToast: () => ({ toast }),
}));
vi.mock("@/components/page/passage/PassageVocabManager", () => ({
  PassageVocabManager: () => null,
}));

function line(n: number, content: string, patch: Partial<LessonLine> = {}): LessonLine {
  return {
    id: n * 10, passage_id: "H1_1_1", line_id: n, speaker: "A", content, pinyin: null,
    audio_key: `H1_1_1_${n}`, translation_en: null, translation_vi: null,
    tokens: [content], flag: 1, ...patch,
  };
}

const passage = {
  passage_id: "H1_1_1", hsk_level: "HSK1", book_code: null, title_en: "Hello", title_vn: null,
};

async function openEditor() {
  const user = userEvent.setup();
  render(<PassageEditorPage />);
  await screen.findByRole("form", { name: "Line 1" });
  return user;
}

const card = (name: string) => within(screen.getByRole("form", { name }));

describe("Passage editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPassage).mockResolvedValue({ ...passage, lines: [line(1, "你好"), line(2, "再见")] });
  });

  it("saves one line with its tokens and flag", async () => {
    vi.mocked(updatePassageLine).mockResolvedValue(line(1, "您好", { tokens: ["您", "好"], flag: 0 }));
    const user = await openEditor();
    const first = card("Line 1");
    expect(first.getByRole("button", { name: "Save line" })).toBeDisabled();

    await user.clear(first.getByLabelText("Content (Chinese)"));
    await user.type(first.getByLabelText("Content (Chinese)"), "您好");
    await user.clear(first.getByLabelText(/^Tokens/));
    await user.type(first.getByLabelText(/^Tokens/), "您 | 好");
    await user.click(first.getByLabelText("Quizzed in lesson trainer"));
    await user.click(first.getByRole("button", { name: "Save line" }));

    expect(updatePassageLine).toHaveBeenCalledTimes(1);
    expect(updatePassageLine).toHaveBeenCalledWith(
      "H1_1_1", 1, expect.objectContaining({ content: "您好", tokens: ["您", "好"], flag: 0 })
    );
    expect(first.getByRole("button", { name: "Save line" })).toBeDisabled();
  });

  it("blocks saving while the tokens do not match the content", async () => {
    const user = await openEditor();
    const first = card("Line 1");

    await user.type(first.getByLabelText("Content (Chinese)"), "吗");

    expect(first.getByRole("alert")).toHaveTextContent("Tokens must spell out the content");
    expect(first.getByRole("button", { name: "Save line" })).toBeDisabled();

    await user.clear(first.getByLabelText(/^Tokens/));
    expect(first.getByRole("button", { name: "Save line" })).toBeEnabled();
  });

  it("lets an older mismatched line save its other fields", async () => {
    vi.mocked(getPassage).mockResolvedValue({
      ...passage, lines: [line(1, "你好", { tokens: ["旧"] })],
    });
    const user = await openEditor();

    await user.type(card("Line 1").getByLabelText("Translation (EN)"), "Hi");

    expect(card("Line 1").getByRole("button", { name: "Save line" })).toBeEnabled();
  });

  it("shows the server's reason when a save fails and keeps the draft", async () => {
    vi.mocked(updatePassageLine).mockRejectedValue(new Error("Nope."));
    const user = await openEditor();
    const first = card("Line 1");

    await user.type(first.getByLabelText("Pinyin"), "ni hao");
    await user.click(first.getByRole("button", { name: "Save line" }));

    expect(first.getByRole("alert")).toHaveTextContent("Nope.");
    expect(first.getByLabelText("Pinyin")).toHaveValue("ni hao");
  });

  it("reorders lines, keeping each unsaved draft with its line", async () => {
    vi.mocked(reorderPassageLines).mockResolvedValue([
      line(1, "再见", { id: 20, audio_key: "H1_1_1_2" }),
      line(2, "你好", { id: 10, audio_key: "H1_1_1_1" }),
    ]);
    const user = await openEditor();
    await user.type(card("Line 2").getByLabelText("Pinyin"), "zaijian");
    expect(card("Line 1").getByRole("button", { name: "Move line 1 up" })).toBeDisabled();

    await user.click(card("Line 2").getByRole("button", { name: "Move line 2 up" }));

    expect(reorderPassageLines).toHaveBeenCalledWith("H1_1_1", [2, 1]);
    expect(card("Line 1").getByLabelText("Pinyin")).toHaveValue("zaijian");
    expect(card("Line 1").getByLabelText("Audio key")).toHaveValue("H1_1_1_2");
  });

  it("appends a line with the next number and a matching audio key", async () => {
    vi.mocked(addPassageLine).mockResolvedValue(line(3, "好"));
    const user = await openEditor();

    await user.click(screen.getByRole("button", { name: "+ Add line" }));
    const added = card("New line");
    expect(added.getByLabelText("Audio key")).toHaveValue("H1_1_1_3");
    await user.type(added.getByLabelText("Content (Chinese)"), "好");
    await user.type(added.getByLabelText(/^Tokens/), "好");
    await user.click(added.getByRole("button", { name: "Add line" }));

    expect(addPassageLine).toHaveBeenCalledWith(
      "H1_1_1", expect.objectContaining({ line_id: 3, content: "好", tokens: ["好"], flag: 1 })
    );
    expect(await screen.findByRole("form", { name: "Line 3" })).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "New line" })).toBeNull();
  });

  it("plays the audio of the key being edited", async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const sources: string[] = [];
    vi.stubGlobal("Audio", class {
      constructor(src: string) { sources.push(src); }
      play = play;
    });
    const user = await openEditor();

    await user.click(screen.getByRole("button", { name: "Play audio of line 1" }));

    expect(play).toHaveBeenCalled();
    expect(sources[0]).toMatch(/\/lesson_audio\/HSK1\/H1_1_1_1\.mp3$/);
    vi.unstubAllGlobals();
  });

  it("saves the titles and shows the book code read-only", async () => {
    vi.mocked(updatePassage).mockResolvedValue({ ...passage, title_vn: "Chào" });
    const user = await openEditor();
    const details = card("Passage details");
    expect(details.getByLabelText("Book code (read-only)")).toHaveAttribute("readonly");

    await user.type(details.getByLabelText("Title (VI)"), "Chào");
    await user.click(details.getByRole("button", { name: "Save details" }));

    expect(updatePassage).toHaveBeenCalledWith("H1_1_1", {
      hsk_level: "HSK1", title_en: "Hello", title_vn: "Chào",
    });
  });

  it("offers no way to delete the passage or a line", async () => {
    await openEditor();

    expect(screen.queryByRole("button", { name: /delete|remove line/i })).toBeNull();
  });

  it("reports a passage that cannot be loaded", async () => {
    vi.mocked(getPassage).mockRejectedValue(new Error("Passage 'H1_1_1' not found."));
    render(<PassageEditorPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("not found");
  });
});
