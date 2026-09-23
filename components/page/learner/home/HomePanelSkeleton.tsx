"use client";

// components/page/learner/home/HomePanelSkeleton.tsx
// Loading state for a lazily-imported home panel (CLAUDE.md 4.5). The panels are
// next/dynamic chunks, so the first visit to a tab has a real gap to fill — the
// bars stand in for the panel's own heading and list rather than a spinner, so the
// tab bar doesn't appear to jump when the content lands.

import { useT } from "@/components/i18n/I18nProvider";

export function HomePanelSkeleton() {
  const { t } = useT();
  return (
    <div className="learner-home-skeleton" role="status" aria-live="polite">
      <span className="learner-home-skeleton-label">{t("home.loading_panel")}</span>
      <div className="learner-home-skeleton-bar is-title" aria-hidden />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="learner-home-skeleton-bar" aria-hidden />
      ))}
    </div>
  );
}
