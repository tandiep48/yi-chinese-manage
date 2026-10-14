// tests/components/learner/VocabTrainerRecap.test.tsx
// The exit button's label: "Back to vocabulary" by default (standalone trainer),
// overridden to "Next" when the dashboard milestone embeds the trainer.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VocabTrainerRecap } from "@/components/page/learner/vocab-training/VocabTrainerRecap";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (k: string) => k, lang: "en" }),
}));

describe("VocabTrainerRecap", () => {
  it("defaults the exit button to Back to vocabulary", () => {
    render(<VocabTrainerRecap missed={[]} canRetry={false} onRetry={() => {}} onHome={() => {}} />);
    expect(
      screen.getByRole("button", { name: "vocab_trainer.back_to_vocabulary" })
    ).toBeInTheDocument();
  });

  it("uses homeLabel when provided (dashboard shows Next)", () => {
    render(
      <VocabTrainerRecap
        missed={[]}
        canRetry={false}
        onRetry={() => {}}
        onHome={() => {}}
        homeLabel="Next"
      />
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "vocab_trainer.back_to_vocabulary" })
    ).not.toBeInTheDocument();
  });
});
