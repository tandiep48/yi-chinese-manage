import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GrammarPanel } from "@/components/page/learner/grammar/GrammarPanel";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { GrammarSection } from "@/hooks/shared/useGrammar";

const SECTIONS: GrammarSection[] = [
  [
    { grammar_id: "g1", type: 1, english_content: "Title EN", vietnamese_content: "Tiêu đề" },
    { grammar_id: "g2", type: 2, english_content: "A description.", vietnamese_content: "Mô tả." },
    { grammar_id: "g3", type: 3, english_content: "你好 ~ Hello", vietnamese_content: "你好 ~ Xin chào" },
    {
      grammar_id: "g4",
      type: 4,
      en_context: [{ Subject: "you", Adjective: "tall" }],
    },
  ],
];

function renderPanel(sections: GrammarSection[], loading = false, error: string | null = null) {
  return render(
    <I18nProvider>
      <GrammarPanel sections={sections} loading={loading} error={error} />
    </I18nProvider>
  );
}

describe("GrammarPanel", () => {
  it("renders title, description, example (cn/translation) and a context table", () => {
    renderPanel(SECTIONS);
    // English content on the default EN locale.
    expect(screen.getByRole("heading", { name: "Title EN" })).toBeInTheDocument();
    expect(screen.getByText("A description.")).toBeInTheDocument();
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // type=4 table renders its context rows with headers.
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Subject" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "tall" })).toBeInTheDocument();
  });

  it("shows the loading state", () => {
    renderPanel([], true);
    expect(screen.getByText("Loading grammar...")).toBeInTheDocument();
  });

  it("shows the error state", () => {
    renderPanel([], false, "boom");
    expect(screen.getByText("Error loading grammar.")).toBeInTheDocument();
  });

  it("shows the empty state when there are no rules", () => {
    renderPanel([]);
    expect(screen.getByText("No grammar rules for this passage.")).toBeInTheDocument();
  });
});
