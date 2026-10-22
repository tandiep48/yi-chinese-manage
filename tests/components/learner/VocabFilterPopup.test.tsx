// tests/components/learner/VocabFilterPopup.test.tsx
// Item 5: the vocab filters live behind a Filter button next to the Mode select.
// The button carries an active-filter count badge, opens a popup holding the
// filter bar, and is disabled while searching.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { VocabSelectPage } from "@/components/page/learner/vocab/VocabSelectPage";
import { useVocabSelect } from "@/hooks/vocab/useVocabSelect";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/hooks/vocab/useVocabSelect", () => ({ useVocabSelect: vi.fn() }));
vi.mock("@/hooks/shared/useMediaQuery", () => ({ useMediaQuery: () => false }));

type VocabState = ReturnType<typeof useVocabSelect>;

function makeVocab(overrides: Partial<VocabState> = {}): VocabState {
  return {
    mode: "free",
    setMode: vi.fn(),
    hskLevel: "",
    setHskLevel: vi.fn(),
    isHistoryMode: false,
    isBookMode: false,
    bookOptions: [],
    selectedBook: "",
    setBook: vi.fn(),
    lessonOptions: [],
    partOptions: [],
    selectedLessons: [],
    changeLessons: vi.fn(),
    selectedParts: [],
    changeParts: vi.fn(),
    pageSize: 20,
    setPageSize: vi.fn(),
    rows: [],
    tableState: { status: "prompt", message: "Choose filters" },
    page: 1,
    totalPages: 1,
    total: 0,
    goToPage: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    searchMode: false,
    ...overrides,
  } as VocabState;
}

function renderPage() {
  return render(
    <I18nProvider>
      <VocabSelectPage />
    </I18nProvider>
  );
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useVocabSelect).mockReturnValue(makeVocab());
});

describe("Vocab filter popup", () => {
  it("shows a Filter button and keeps the filter bar out of the DOM until opened", () => {
    const { container } = renderPage();
    expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
    expect(container.querySelector(".vocab-filter-bar")).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the popup with the filter bar and closes it via Done", () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Filters")).toBeInTheDocument();
    expect(container.querySelector(".vocab-filter-bar")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows no badge when no filters are active", () => {
    const { container } = renderPage();
    expect(container.querySelector(".vocab-filter-badge")).toBeNull();
  });

  it("counts HSK, lesson and part selections on the badge (multi-selects count once each)", () => {
    vi.mocked(useVocabSelect).mockReturnValue(
      makeVocab({
        mode: "standard",
        hskLevel: "HSK3",
        selectedLessons: ["1"],
        selectedParts: ["1", "2"],
      })
    );
    const { container } = renderPage();
    expect(container.querySelector(".vocab-filter-badge")?.textContent).toBe("3");
  });

  it("disables the Filter button while searching", () => {
    vi.mocked(useVocabSelect).mockReturnValue(makeVocab({ searchMode: true }));
    renderPage();
    expect(screen.getByRole("button", { name: /Filters/ })).toBeDisabled();
  });
});
