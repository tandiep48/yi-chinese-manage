// tests/components/manage/VocabSearch.test.tsx
// The manage vocabulary page's search: it queries on Enter only, goes back to
// page 1, combines with the HSK filter, clears, and names the term when nothing
// matches.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VocabPage from "@/app/manage/vocab/page";
import { listVocab } from "@/lib/api/manage/vocab";

vi.mock("@/lib/api/manage/vocab");
vi.mock("@/components/layout/TopBar", () => ({ TopBar: () => null }));
vi.mock("@/components/shared/manager_ui/Toast/Toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@/components/page/vocab/VocabForm", () => ({ VocabForm: () => null }));

const mockList = vi.mocked(listVocab);

describe("Vocabulary search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 1 });
  });

  it("searches on Enter, not while typing", async () => {
    const user = userEvent.setup();
    render(<VocabPage />);
    const box = screen.getByRole("searchbox", { name: "Search vocabulary" });

    await user.type(box, "  nihao ");
    expect(mockList).toHaveBeenCalledTimes(1);

    await user.keyboard("{Enter}");
    expect(mockList).toHaveBeenLastCalledWith(1, 20, undefined, "nihao");
    expect(await screen.findByText("No vocabulary matches “nihao”.")).toBeInTheDocument();
  });

  it("keeps the HSK filter and clears back to the full list", async () => {
    const user = userEvent.setup();
    render(<VocabPage />);
    await user.selectOptions(screen.getByLabelText("HSK Level:"), "HSK2");
    await user.type(screen.getByRole("searchbox"), "hao{Enter}");
    expect(mockList).toHaveBeenLastCalledWith(1, 20, "HSK2", "hao");

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(mockList).toHaveBeenLastCalledWith(1, 20, "HSK2", undefined);
    expect(await screen.findByText("No vocabulary entries found.")).toBeInTheDocument();
  });

  it("returns to page 1 for a new search", async () => {
    mockList.mockResolvedValue({ items: [], total: 60, page: 1, page_size: 20, total_pages: 3 });
    const user = userEvent.setup();
    render(<VocabPage />);
    await user.click(await screen.findByRole("button", { name: "2" }));
    expect(mockList).toHaveBeenLastCalledWith(2, 20, undefined, undefined);

    await user.type(screen.getByRole("searchbox"), "hao{Enter}");
    expect(mockList).toHaveBeenLastCalledWith(1, 20, undefined, "hao");
  });

  it("ignores a slow response that arrives after a newer search", async () => {
    const row = (id: number, cn: string) => ({
      items: [{ id, cn, pinyin: "", meaning_en: "", meaning_vn: "", audio_key: "", hsk_level: "HSK1", source: "" }],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });
    let finishFirst: (value: ReturnType<typeof row>) => void = () => {};
    mockList
      .mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve)))
      .mockResolvedValue(row(2, "新"));
    const user = userEvent.setup();
    render(<VocabPage />);

    await user.type(screen.getByRole("searchbox"), "xin{Enter}");
    expect(await screen.findByText("新")).toBeInTheDocument();
    finishFirst(row(1, "旧"));
    await Promise.resolve();
    expect(screen.queryByText("旧")).toBeNull();
  });
});
