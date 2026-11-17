// tests/components/manage/ManageAuth.test.tsx
// The /manage guard (ManageShell) and the /manage/login page.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ManageShell } from "@/components/layout/ManageShell";
import ManageLoginPage from "@/app/manage/login/page";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AuthUser } from "@/lib/types/user";

const replace = vi.fn();
let pathname = "/manage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));
vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("@/components/layout/Sidebar", () => ({ Sidebar: () => <nav>sidebar</nav> }));

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

const admin = { username: "root", role: "admin", permissions: ["manage:access"] } as AuthUser;
const student = { username: "kid", role: "student", permissions: [] } as unknown as AuthUser;

function auth(overrides: Record<string, unknown>) {
  mockUseAuth.mockReturnValue({
    user: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  pathname = "/manage";
});

describe("ManageShell", () => {
  it("redirects a signed-out visitor to the login page", async () => {
    auth({ user: null });
    render(<ManageShell>secret</ManageShell>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/manage/login"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("redirects a signed-in account without manage access", async () => {
    auth({ user: student });
    render(<ManageShell>secret</ManageShell>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/manage/login"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("waits for the session check before deciding", () => {
    auth({ user: null, loading: true });
    render(<ManageShell>secret</ManageShell>);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders the sidebar and page for an admin", () => {
    auth({ user: admin });
    render(<ManageShell>secret</ManageShell>);

    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(screen.getByText("sidebar")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders the login page bare, without redirecting", () => {
    pathname = "/manage/login";
    auth({ user: null });
    render(<ManageShell>login form</ManageShell>);

    expect(screen.getByText("login form")).toBeInTheDocument();
    expect(screen.queryByText("sidebar")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("ManageLoginPage", () => {
  async function submit() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Username"), "someone");
    await user.type(screen.getByLabelText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
  }

  it("signs an admin in and goes to the dashboard", async () => {
    const login = vi.fn().mockResolvedValue(admin);
    auth({ login });
    render(<ManageLoginPage />);

    await submit();

    expect(login).toHaveBeenCalledWith("someone", "pw");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/manage"));
  });

  it("signs a student back out and explains why", async () => {
    const login = vi.fn().mockResolvedValue(student);
    const logout = vi.fn().mockResolvedValue(undefined);
    auth({ login, logout });
    render(<ManageLoginPage />);

    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/does not have access/i);
    expect(logout).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows the server error for bad credentials", async () => {
    auth({ login: vi.fn().mockRejectedValue(new Error("Invalid username or password.")) });
    render(<ManageLoginPage />);

    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
  });

  it("skips the form when an admin session already exists", async () => {
    auth({ user: admin });
    render(<ManageLoginPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/manage"));
  });
});
