// tests/components/learner/LearnerSettingsModal.test.tsx
// The settings modal: language is offered to everyone, the per-user hanzi
// script + font only when signed in, and the dialog stays out of the a11y tree
// while closed. Auth + hanzi provider are mocked; i18n is real.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { LearnerSettingsModal } from "@/components/layout/LearnerSettingsModal";

let mockAuth: { user: { username: string } | null };
vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: () => mockAuth }));

vi.mock("@/components/han/HanziSettingsProvider", () => ({
  useHanziSettings: () => ({
    script: "simplified",
    font: "Noto Sans",
    setScript: vi.fn(),
    setFont: vi.fn(),
  }),
}));

function renderModal(open: boolean) {
  return render(
    <I18nProvider>
      <LearnerSettingsModal open={open} onClose={vi.fn()} />
    </I18nProvider>
  );
}

describe("LearnerSettingsModal", () => {
  beforeEach(() => {
    mockAuth = { user: null };
  });

  it("stays out of the accessibility tree while closed", () => {
    renderModal(false);
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("offers the language switcher to anonymous users, without hanzi controls", () => {
    renderModal(true);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
    expect(screen.queryByLabelText("Script")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Font")).not.toBeInTheDocument();
  });

  it("adds the hanzi script + font controls when signed in", () => {
    mockAuth = { user: { username: "tester" } };
    renderModal(true);
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
    expect(screen.getByLabelText("Script")).toBeInTheDocument();
    expect(screen.getByLabelText("Font")).toBeInTheDocument();
  });
});
