import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BasicPinyinTable } from "@/components/page/learner/pinyin/BasicPinyinTable";
import { I18nProvider } from "@/components/i18n/I18nProvider";

beforeEach(() => {
  vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  // @ts-expect-error minimal speechSynthesis stub
  window.speechSynthesis = { speak: vi.fn() };
});

function renderTable() {
  return render(
    <I18nProvider>
      <BasicPinyinTable />
    </I18nProvider>
  );
}

describe("BasicPinyinTable", () => {
  it("renders the Initials / Finals / Tones sections", () => {
    renderTable();
    expect(screen.getByRole("columnheader", { name: "Initials" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Finals" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Tones" })).toBeInTheDocument();
  });

  it("plays the syllable when a cell is clicked", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "b" }));
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("shows a pronunciation hint on hover and hides it on leave", () => {
    renderTable();
    const cell = screen.getByRole("button", { name: "b" });
    fireEvent.mouseEnter(cell, { pageX: 10, pageY: 10 });
    expect(screen.getByText("Like 'p' in 'spit'")).toBeInTheDocument();
    // React synthesizes onMouseLeave from the underlying mouseout event.
    fireEvent.mouseOut(cell);
    expect(screen.queryByText("Like 'p' in 'spit'")).not.toBeInTheDocument();
  });
});
