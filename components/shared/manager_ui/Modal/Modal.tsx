"use client";

// components/shared/manager_ui/Modal/Modal.tsx
import { useEffect, useRef, ReactNode } from "react";
import { MODAL_DESIGN } from "./constants";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Max width class — default "max-w-lg" */
  maxWidth?: string;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus first focusable element
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button"
    );
    el?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={MODAL_DESIGN.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className={MODAL_DESIGN.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={dialogRef}
        className={[MODAL_DESIGN.cardBase, maxWidth].join(" ")}
      >
        {/* Header */}
        <div className={MODAL_DESIGN.header}>
          <h2 id="modal-title" className={MODAL_DESIGN.title}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={MODAL_DESIGN.closeButton}
          >
            <svg className={MODAL_DESIGN.icon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Content — scrollable */}
        <div className={MODAL_DESIGN.content}>{children}</div>
      </div>
    </div>
  );
}
