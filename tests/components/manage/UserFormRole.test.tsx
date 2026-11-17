// The user edit form's role dropdown: options come from /api/admin/user/roles and the
// chosen role is sent with the rest of the payload.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UserForm } from "@/components/page/user/UserForm";
import { listRoles } from "@/lib/api/manage/user";
import type { User } from "@/lib/types/user";

vi.mock("@/lib/api/manage/user", () => ({ listRoles: vi.fn() }));
const mockListRoles = listRoles as unknown as ReturnType<typeof vi.fn>;

const alice: User = { id: 1, username: "alice", email: "alice@example.com", level: 2, role: "student" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserForm role", () => {
  it("lists the fetched roles and submits the selected one", async () => {
    mockListRoles.mockResolvedValue(["admin", "student"]);
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<UserForm open initial={alice} onClose={vi.fn()} onSubmit={onSubmit} />);

    expect(await screen.findByRole("option", { name: "admin" })).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toHaveValue("student");

    await user.selectOptions(screen.getByLabelText("Role"), "admin");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
  });

  it("defaults new users to student and survives a failed role fetch", async () => {
    mockListRoles.mockRejectedValue(new Error("boom"));
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<UserForm open initial={null} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Username/), "bob");
    await user.type(screen.getByLabelText(/Email/), "bob@example.com");
    await user.type(screen.getByLabelText(/Password/), "password1");
    await user.click(screen.getByRole("button", { name: "Add User" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
  });
});
