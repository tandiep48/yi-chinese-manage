"use client";

// components/page/learner/milestone/MilestoneBar.tsx
// The six-segment progress indicator above a lesson part's milestone, plus the
// step title ("Step 3 of 6 · Vocab Trainer").
//
// Gating is soft (docs/plans/dashboard-tabs.md §10.1): every completed step is
// replayable, so the segments are buttons. Steps ahead of the learner are not
// disabled either — the sidebar can already jump anywhere, and disabling them
// here would hard-gate the flow by accident.
//
// Every class belongs to milestone.css, which is subject to the §2 invariant.

import { useT } from "@/components/i18n/I18nProvider";

export const STEP_TITLE_KEYS: Record<number, string> = {
  1: "milestone.step_vocab_summary",
  2: "milestone.step_vocab_learner",
  3: "milestone.step_vocab_trainer",
  4: "milestone.step_lesson_summary",
  5: "milestone.step_lesson_learner",
  6: "milestone.step_lesson_trainer",
};

interface MilestoneBarProps {
  step: number;
  totalSteps: number;
  isCompleted: (step: number) => boolean;
  onSelect: (step: number) => void;
}

export function MilestoneBar({ step, totalSteps, isCompleted, onSelect }: MilestoneBarProps) {
  const { t } = useT();
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="milestone-bar">
      <ol className="milestone-segments">
        {steps.map((n) => {
          const done = isCompleted(n);
          const current = n === step;
          return (
            <li key={n} className="milestone-segment-item">
              <button
                type="button"
                className={`milestone-segment${done ? " is-done" : ""}${current ? " is-current" : ""}`}
                aria-current={current ? "step" : undefined}
                aria-label={t("milestone.step_aria", {
                  n,
                  total: totalSteps,
                  title: t(STEP_TITLE_KEYS[n] ?? ""),
                })}
                onClick={() => onSelect(n)}
              >
                <span className="milestone-segment-num">{n}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="milestone-step-title">
        {t("milestone.step_counter", { n: step, total: totalSteps })}
        {" · "}
        {t(STEP_TITLE_KEYS[step] ?? "")}
      </p>
    </div>
  );
}
