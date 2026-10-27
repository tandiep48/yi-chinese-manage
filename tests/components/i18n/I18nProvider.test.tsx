// tests/components/i18n/I18nProvider.test.tsx
// The provider treats a signed-in account's saved language as the source of truth:
// it loads it on mount and persists a change back, so the Flask backend (which
// reads the account language for server-built content like lesson-trainer options)
// never drifts out of sync with the UI switcher.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, I18nRemount, useT } from "@/components/i18n/I18nProvider";
import { loadUiLanguage, saveUiLanguage } from "@/lib/api/learner/userSettings";
import { clearReadCache } from "@/lib/api/readCache";
import { clearPassagesCache } from "@/lib/api/learner/lessons";

vi.mock("@/lib/api/learner/userSettings", () => ({
  loadUiLanguage: vi.fn(),
  saveUiLanguage: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@/lib/api/readCache", () => ({ clearReadCache: vi.fn() }));
vi.mock("@/lib/api/learner/lessons", () => ({ clearPassagesCache: vi.fn() }));

const mockLoad = vi.mocked(loadUiLanguage);
const mockSave = vi.mocked(saveUiLanguage);
const mockClearRead = vi.mocked(clearReadCache);
const mockClearPassages = vi.mocked(clearPassagesCache);

function Probe() {
  const { lang, setLang } = useT();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={() => setLang("vi")}>to-vi</button>
    </div>
  );
}

// Counts how many times it has been mounted, so a remount (I18nRemount bumping its
// key after a saved language change) is observable.
let mounts = 0;
function MountCounter() {
  useEffect(() => {
    mounts += 1;
  }, []);
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoad.mockResolvedValue(null);
  mockSave.mockResolvedValue({});
  mounts = 0;
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

  it("drops the server-content caches and remounts the content once the change is saved", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
        <I18nRemount>
          <MountCounter />
        </I18nRemount>
      </I18nProvider>
    );
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());
    expect(mounts).toBe(1); // first mount

    await user.click(screen.getByText("to-vi"));

    // The switch is instant; the save then triggers the cache drop + remount.
    expect(screen.getByTestId("lang").textContent).toBe("vi");
    await waitFor(() => {
      expect(mockClearRead).toHaveBeenCalled();
      expect(mockClearPassages).toHaveBeenCalled();
      expect(mounts).toBe(2); // remounted so server-built views refetch
    });
  });

  it("keeps the front-end switch but does not refetch when the save fails (guest)", async () => {
    mockSave.mockRejectedValue(new Error("401"));
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
        <I18nRemount>
          <MountCounter />
        </I18nRemount>
      </I18nProvider>
    );
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());

    await user.click(screen.getByText("to-vi"));

    // Front-end flips immediately, but no server caches are cleared and no remount.
    expect(screen.getByTestId("lang").textContent).toBe("vi");
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith("vi"));
    expect(mockClearRead).not.toHaveBeenCalled();
    expect(mockClearPassages).not.toHaveBeenCalled();
    expect(mounts).toBe(1);
  });
});
