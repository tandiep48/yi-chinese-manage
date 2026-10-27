// tests/components/lesson/LessonConfirmDialog.test.tsx
// The lesson flow's positive confirm dialog: Confirm / Cancel callbacks and the
// backdrop-click cancel.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonConfirmDialog } from "@/components/page/learner/lesson/LessonConfirmDialog";

function setup(over: Partial<Parameters<typeof LessonConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <LessonConfirmDialog
      title="Go on?"
      body="Move to the next lesson."
      confirmLabel="Yes"
      cancelLabel="No"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...over}
    />
  );
  return { onConfirm, onCancel };
}

describe("LessonConfirmDialog", () => {
  it("shows the title and body", () => {
    setup();
    expect(screen.getByText("Go on?")).toBeInTheDocument();
    expect(screen.getByText("Move to the next lesson.")).toBeInTheDocument();
  });

  it("fires onConfirm / onCancel from the buttons", () => {
    const { onConfirm, onCancel } = setup();
    fireEvent.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("No"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels when the backdrop is clicked", () => {
    const { onCancel } = setup();
    // The overlay is the dialog's parent (role=presentation).
    fireEvent.click(screen.getByRole("presentation"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not cancel when the modal body is clicked", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
