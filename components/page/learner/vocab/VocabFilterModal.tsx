"use client";

// components/page/learner/vocab/VocabFilterModal.tsx
// Popup that holds the vocab selection filters behind the header's Filter button
// (item 5). Follows the learner overlay pattern (VocabStrokeModal / WordSummary
// sheet): backdrop + Escape to close, styled under .vocab-select in
// vocab-select.css. The filter controls themselves stay in VocabFilterBar; this
// is only the shell.

import { useEffect, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";

export function VocabFilterModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="vocab-filter-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="vocab-filter-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("vocab.filters_title")}
      >
        <div className="vocab-filter-modal-header">
          <h2 className="vocab-filter-modal-title">{t("vocab.filters_title")}</h2>
          <button
            type="button"
            className="vocab-filter-modal-close"
            onClick={onClose}
            aria-label={t("widgets.close")}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="vocab-filter-modal-body">{children}</div>
        <div className="vocab-filter-modal-footer">
          <button type="button" className="btn action-primary" onClick={onClose}>
            {t("vocab.filters_done")}
          </button>
        </div>
      </div>
    </div>
  );
}
