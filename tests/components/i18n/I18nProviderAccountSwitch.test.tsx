// tests/components/i18n/I18nProviderAccountSwitch.test.tsx
// The provider lives in the layout, so signing out of one account and into another does
// not remount it. Each account must get ITS OWN saved language, not the previous one's.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider, useT } from "@/components/i18n/I18nProvider";
import { useAuth } from "@/components/auth/AuthProvider";

vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/api/learner/userSettings", () => ({
  loadUiLanguage: vi.fn(() => Promise.resolve(null)),
  saveUiLanguage: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@/lib/api/readCache", () => ({ clearReadCache: vi.fn() }));
vi.mock("@/lib/api/learner/lessons", () => ({ clearPassagesCache: vi.fn() }));

const mockAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

const signedIn = (id: number, ui_language: string) => ({ user: { id, ui_language } });
const signedOut = { user: null };

function Probe() {
  const { lang } = useT();
  return <span data-testid="lang">{lang}</span>;
}

function setup(auth: unknown) {
  mockAuth.mockReturnValue(auth);
  const view = render(
    <I18nProvider>
      <Probe />
    </I18nProvider>
  );
  const switchTo = (next: unknown) => {
    mockAuth.mockReturnValue(next);
    view.rerender(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
  };
  return { switchTo, lang: () => screen.getByTestId("lang").textContent };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("I18nProvider across account switches", () => {
  it("adopts each account's own language when a different account signs in", () => {
    const { switchTo, lang } = setup(signedIn(1, "en"));
    expect(lang()).toBe("en");

    switchTo(signedOut);
    switchTo(signedIn(2, "vi"));
    expect(lang()).toBe("vi");

    switchTo(signedOut);
    switchTo(signedIn(1, "en"));
    expect(lang()).toBe("en");
  });

  it("adopts the new account's language even without a signed-out step in between", () => {
    const { switchTo, lang } = setup(signedIn(1, "en"));
    switchTo(signedIn(2, "vi"));
    expect(lang()).toBe("vi");
  });

  it("does not override a language the user just picked while still signed in", () => {
    const { switchTo, lang } = setup(signedIn(1, "en"));
    // Re-render with the same account (e.g. an unrelated auth update): nothing is re-applied.
    switchTo(signedIn(1, "en"));
    expect(lang()).toBe("en");
  });

  it("keeps the local choice for a guest", () => {
    localStorage.setItem("ui_language", "en");
    const { lang } = setup(signedOut);
    expect(lang()).toBe("en");
  });
});
