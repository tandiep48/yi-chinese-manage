// tests/components/i18n/I18nProvider.test.tsx
// The provider treats a signed-in account's saved language as the source of truth:
// it loads it on mount and persists a change back, so the Flask backend (which
// reads the account language for server-built content like lesson-trainer options)
// never drifts out of sync with the UI switcher.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, useT } from "@/components/i18n/I18nProvider";
import { loadUiLanguage, saveUiLanguage } from "@/lib/api/learner/userSettings";

vi.mock("@/lib/api/learner/userSettings", () => ({
  loadUiLanguage: vi.fn(),
  saveUiLanguage: vi.fn(() => Promise.resolve({})),
}));

const mockLoad = vi.mocked(loadUiLanguage);
const mockSave = vi.mocked(saveUiLanguage);

function Probe() {
  const { lang, setLang } = useT();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={() => setLang("vi")}>to-vi</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoad.mockResolvedValue(null);
  mockSave.mockResolvedValue({});
  localStorage.clear();
});

describe("I18nProvider ↔ account language", () => {
  it("adopts the account's saved language on mount, over the local choice", async () => {
    localStorage.setItem("ui_language", "en");
    mockLoad.mockResolvedValue("vi"); // the account prefers Vietnamese

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    // Starts from the local choice, then reconciles to the account preference.
    expect(screen.getByTestId("lang").textContent).toBe("en");
    await waitFor(() => expect(screen.getByTestId("lang").textContent).toBe("vi"));
  });

  it("persists a language change to the account", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());

    await user.click(screen.getByText("to-vi"));

    expect(mockSave).toHaveBeenCalledWith("vi");
    expect(screen.getByTestId("lang").textContent).toBe("vi");
  });

  it("keeps the local choice when signed out (no account language)", async () => {
    localStorage.setItem("ui_language", "en");
    mockLoad.mockResolvedValue(null);

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => expect(mockLoad).toHaveBeenCalled());
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });
});
