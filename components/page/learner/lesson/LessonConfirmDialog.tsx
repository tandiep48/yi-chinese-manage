"use client";

// components/page/learner/lesson/LessonConfirmDialog.tsx
// A small confirm dialog for the lesson flow's forward moves: "go to the next
// lesson?" (Translation → Next) and the end-of-lesson "run the master Vocab /
// Lesson trainer?" prompts. It is a plain positive confirm — primary Confirm +
// outline Cancel — distinct from the milestone/trainer quit modals, which warn in
// red about losing progress. Colours come from the .learner-theme tokens.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "./lesson-confirm.css";

interface LessonConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  icon?: IconDefinition;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LessonConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  icon,
  onConfirm,
  onCancel,
}: LessonConfirmDialogProps) {
  return (
    <div
      className="lesson-confirm-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="lesson-confirm-modal" role="dialog" aria-modal="true" aria-label={title}>
        {icon && (
          <div className="lesson-confirm-icon" aria-hidden>
            <FontAwesomeIcon icon={icon} />
          </div>
        )}
        <h3 className="lesson-confirm-title">{title}</h3>
        <p className="lesson-confirm-body">{body}</p>
        <div className="lesson-confirm-btns">
          <button type="button" className="lesson-confirm-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="lesson-confirm-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
