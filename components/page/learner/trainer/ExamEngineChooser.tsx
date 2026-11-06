"use client";

// components/page/learner/trainer/ExamEngineChooser.tsx
// "Exam" chooser modal: the single Exam entry (in the part picker and the lesson
// sidebar) opens this to pick which whole-lesson trainer to run — the vocab trainer
// or the lesson trainer. Reuses the train-type picker's overlay chrome (overlays.css)
// so it matches the skill picker that opens next on the part page.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import type { TrainerEngine } from "./TrainTypePicker";
import "./overlays.css";

export function ExamEngineChooser({
  onSelect,
  onCancel,
}: {
  onSelect: (engine: TrainerEngine) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  return (
    <div
      className="ttp-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="ttp-card" role="dialog" aria-modal="true">
        <h2 className="ttp-title">{t("exam_chooser.title")}</h2>
        <p className="ttp-subtitle">{t("exam_chooser.subtitle")}</p>
        <div className="ttp-options">
          <button type="button" className="ttp-option" onClick={() => onSelect("vocab")}>
            <FontAwesomeIcon icon={faDumbbell} aria-hidden />
            <span className="ttp-option-label">{t("picker.vocab_trainer_btn")}</span>
          </button>
          <button type="button" className="ttp-option" onClick={() => onSelect("lesson")}>
            <FontAwesomeIcon icon={faGraduationCap} aria-hidden />
            <span className="ttp-option-label">{t("picker.lesson_trainer_btn")}</span>
          </button>
        </div>
        <div className="ttp-actions">
          <button type="button" className="btn secondary ttp-cancel" onClick={onCancel}>
            {t("train_picker.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
