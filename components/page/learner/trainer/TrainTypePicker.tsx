"use client";

// components/page/learner/trainer/TrainTypePicker.tsx
// "Choose which skills to train" modal shown before a training session, ported from
// Learning/web_app/static/shared/train_type_picker.js (+ train_type_picker.css).
// Multi-select; every skill checked by default (= train all). Each engine has its
// own skill set and the caller gets back that engine's native skill ids.

import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import "./overlays.css";

export type TrainerEngine = "vocab" | "lesson";

interface Skill {
  id: string;
  labelKey: string;
}

// Engine -> ordered skills. `id` is exactly what the trainer expects (VocabTrainer's
// activityTypes / a lesson task's `type`); `labelKey` is the i18n label.
const ENGINES: Record<TrainerEngine, Skill[]> = {
  vocab: [
    { id: "typing", labelKey: "train_picker.skill_typing" },
    { id: "listen", labelKey: "train_picker.skill_listening" },
    { id: "reading", labelKey: "train_picker.skill_reading" },
  ],
  lesson: [
    { id: "listening", labelKey: "train_picker.skill_listening" },
    { id: "meaning", labelKey: "train_picker.skill_meaning" },
    { id: "typing", labelKey: "train_picker.skill_typing" },
    { id: "reorder", labelKey: "train_picker.skill_reorder" },
  ],
};

// Rendered only while open (the caller mounts it conditionally), so its checkbox
// state resets to "all skills" on each open via the useState initialiser — no effect.
export function TrainTypePicker({
  engine,
  onStart,
  onCancel,
}: {
  engine: TrainerEngine;
  onStart: (selectedTypeIds: string[]) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const skills = ENGINES[engine] ?? ENGINES.vocab;
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(skills.map((s) => [s.id, true]))
  );
  const [error, setError] = useState("");

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    setError("");
  }

  function submit() {
    const chosen = skills.filter((s) => checked[s.id]).map((s) => s.id);
    if (!chosen.length) {
      setError(t("train_picker.select_one"));
      return;
    }
    onStart(chosen);
  }

  return (
    <div
      className="ttp-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="ttp-card" role="dialog" aria-modal="true">
        <h2 className="ttp-title">{t("train_picker.title")}</h2>
        <p className="ttp-subtitle">{t("train_picker.subtitle")}</p>
        <div className="ttp-options">
          {skills.map((skill) => (
            <label key={skill.id} className="ttp-option">
              <input
                type="checkbox"
                className="ttp-check"
                checked={!!checked[skill.id]}
                onChange={() => toggle(skill.id)}
              />
              <span className="ttp-option-label">{t(skill.labelKey)}</span>
            </label>
          ))}
        </div>
        <div className="ttp-error" aria-live="polite">
          {error}
        </div>
        <div className="ttp-actions">
          <button type="button" className="btn secondary ttp-cancel" onClick={onCancel}>
            {t("train_picker.cancel")}
          </button>
          <button type="button" className="btn primary ttp-start" onClick={submit}>
            {t("train_picker.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
