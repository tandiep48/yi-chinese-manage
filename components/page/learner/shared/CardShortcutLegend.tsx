"use client";

// components/page/learner/shared/CardShortcutLegend.tsx
// The on-screen key legend for the card learners (vocab FlashcardView and lesson
// LessonCardStudy), replacing the old button row. Space/Q are shown only where the
// learner supports them.

import { useT } from "@/components/i18n/I18nProvider";
import "./card-shortcut-legend.css";

export function CardShortcutLegend({
  shuffle = false,
  stroke = false,
}: {
  shuffle?: boolean;
  stroke?: boolean;
}) {
  const { t } = useT();

  const items: Array<{ keyLabel: string; label: string }> = [
    { keyLabel: "A", label: t("card_shortcuts.prev") },
    { keyLabel: "D", label: t("card_shortcuts.next") },
    { keyLabel: "W", label: t("card_shortcuts.audio_reveal") },
    { keyLabel: "S", label: t("card_shortcuts.reveal") },
  ];
  if (shuffle) items.push({ keyLabel: t("card_shortcuts.space"), label: t("card_shortcuts.shuffle") });
  if (stroke) items.push({ keyLabel: "Q", label: t("card_shortcuts.stroke") });

  return (
    <div className="card-shortcut-legend" role="group" aria-label={t("card_shortcuts.title")}>
      {items.map((item) => (
        <span key={item.label} className="card-shortcut-item">
          <kbd className="card-shortcut-key">{item.keyLabel}</kbd>
          <span className="card-shortcut-label">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
