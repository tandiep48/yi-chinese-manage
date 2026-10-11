"use client";

// components/page/learner/shared/CardShortcutLegend.tsx
// The control bar for the card learners (vocab FlashcardView and lesson
// LessonCardStudy). Each item is a real button — tappable on phones, where there is
// no keyboard — and also shows its keyboard-shortcut key as an accelerator hint for
// desktop. Space/Q appear only where the learner supports them (vocab).

import { useT } from "@/components/i18n/I18nProvider";
import "./card-shortcut-legend.css";

interface LegendAction {
  keyLabel: string;
  label: string;
  onClick: () => void;
}

export function CardShortcutLegend({
  onPrev,
  onNext,
  onAudioReveal,
  onReveal,
  onShuffle,
  onStroke,
}: {
  onPrev: () => void;
  onNext: () => void;
  // W — reveal pinyin + meaning and play the audio.
  onAudioReveal: () => void;
  // S — reveal pinyin + meaning silently.
  onReveal: () => void;
  onShuffle?: () => void;
  onStroke?: () => void;
}) {
  const { t } = useT();

  const items: LegendAction[] = [
    { keyLabel: "A", label: t("card_shortcuts.prev"), onClick: onPrev },
    { keyLabel: "D", label: t("card_shortcuts.next"), onClick: onNext },
    { keyLabel: "W", label: t("card_shortcuts.audio_reveal"), onClick: onAudioReveal },
    { keyLabel: "S", label: t("card_shortcuts.reveal"), onClick: onReveal },
  ];
  if (onShuffle) items.push({ keyLabel: t("card_shortcuts.space"), label: t("card_shortcuts.shuffle"), onClick: onShuffle });
  if (onStroke) items.push({ keyLabel: "Q", label: t("card_shortcuts.stroke"), onClick: onStroke });

  return (
    <div className="card-shortcut-legend" role="group" aria-label={t("card_shortcuts.title")}>
      {items.map((item) => (
        <button key={item.label} type="button" className="card-shortcut-item" onClick={item.onClick}>
          <kbd className="card-shortcut-key">{item.keyLabel}</kbd>
          <span className="card-shortcut-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
