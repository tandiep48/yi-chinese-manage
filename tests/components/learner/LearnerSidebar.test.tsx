// tests/components/learner/LearnerSidebar.test.tsx
// The learner sidebar: nav items + active state, auth-dependent account block,
// the desktop collapse toggle, the mobile drawer, and the settings modal it
// opens. next/navigation, auth, and the hanzi provider are mocked; i18n is real
// so assertions use the shipped EN strings.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { usePathname } from "next/navigation";
import { LearnerSidebar } from "@/components/layout/LearnerSidebar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

let mockAuth: {
  user: { username: string; avatar_url?: string | null } | null;
  loading: boolean;
  logout: () => void;
};
vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: () => mockAuth }));

// The settings modal always renders its controls (toggled via `hidden`), so the
// hanzi control mounts even while closed — stub the provider it reads.
vi.mock("@/components/han/HanziSettingsProvider", () => ({
  useHanziSettings: () => ({
    script: "simplified",
    font: "Noto Sans",
    setScript: vi.fn(),
    setFont: vi.fn(),
  }),
}));

function renderSidebar() {
  return render(
    <I18nProvider>
      <LearnerSidebar />
    </I18nProvider>
  );
}

describe("LearnerSidebar", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/learner/vocab");
    mockAuth = { user: null, loading: false, logout: vi.fn() };
    localStorage.clear();
  });

  it("renders every primary nav item linked to its route", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/learner");
    expect(screen.getByRole("link", { name: "Vocabulary" })).toHaveAttribute("href", "/learner/vocab");
    expect(screen.getByRole("link", { name: "HSK" })).toHaveAttribute("href", "/learner/hsk");
    expect(screen.getByRole("link", { name: "Learn Together" })).toHaveAttribute(
      "href",
      "/learner/learn-together"
    );
  });

  it("marks the active route and not the home prefix", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Vocabulary" }).className).toContain("bg-white/20");
    // "/learner" is a prefix of every route, so Dashboard is only active on an exact match.
    expect(screen.getByRole("link", { name: "Dashboard" }).className).not.toContain("bg-white/20");
  });

  it("shows Login and Register when signed out, not Logout", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
  });

  it("shows the username and Logout when signed in", async () => {
    mockAuth = { user: { username: "tester" }, loading: false, logout: vi.fn() };
    renderSidebar();
    expect(screen.getByRole("link", { name: /tester/ })).toHaveAttribute("href", "/learner/profile");
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
  });

  it("opens the settings modal from the Settings button", async () => {
    const user = userEvent.setup();
    renderSidebar();
    // Closed modals are hidden, so the dialog is not in the accessibility tree yet.
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("toggles the desktop rail between full and icon-only and remembers the choice", async () => {
    const user = userEvent.setup();
    const { container } = renderSidebar();
    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside.className).toContain("md:w-64");

    await user.click(screen.getByRole("button", { name: "Collapse menu" }));

    expect(aside.className).toContain("md:w-16");
    expect(screen.getByRole("button", { name: "Expand menu" })).toBeInTheDocument();
    expect(localStorage.getItem("learnerNavCollapsed")).toBe("1");
  });

  it("restores the collapsed rail from storage on mount", () => {
    localStorage.setItem("learnerNavCollapsed", "1");
    const { container } = renderSidebar();
    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside.className).toContain("md:w-16");
    expect(screen.getByRole("button", { name: "Expand menu" })).toBeInTheDocument();
  });

  it("opens the drawer backdrop from the hamburger and closes it from the backdrop", async () => {
    const user = userEvent.setup();
    const { container } = renderSidebar();
    expect(container.querySelector(".learner-drawer-backdrop")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const backdrop = container.querySelector(".learner-drawer-backdrop");
    expect(backdrop).not.toBeNull();

    await user.click(backdrop as Element);
    expect(container.querySelector(".learner-drawer-backdrop")).toBeNull();
  });
});
