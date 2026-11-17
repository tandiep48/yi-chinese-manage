"use client";

// components/page/learner/milestone/MilestoneBar.tsx
// The six labelled step pills above a lesson part's milestone ("1. Vocab Summary",
// "2. Vocab Learner", …): a check for a finished step, a pulsing dot on the one
// showing.
//
// Gating is soft (docs/plans/dashboard-tabs.md §10.1): every completed step is
// replayable, so the pills are buttons. Steps ahead of the learner are not
// disabled either — the outline can already jump anywhere, and disabling them
// here would hard-gate the flow by accident.
//
// Every class belongs to milestone.css, which is subject to the §2 invariant.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
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
          const title = t(STEP_TITLE_KEYS[n] ?? "");
          return (
            <li key={n} className="milestone-segment-item">
              <button
                type="button"
                className={`milestone-segment${done ? " is-done" : ""}${current ? " is-current" : ""}`}
                aria-current={current ? "step" : undefined}
                aria-label={t("milestone.step_aria", { n, total: totalSteps, title })}
                onClick={() => onSelect(n)}
              >
                <span className="milestone-segment-num">
                  {done && !current ? <FontAwesomeIcon icon={faCheck} aria-hidden /> : n}
                </span>
                <span className="milestone-segment-label">
                  {n}. {title}
                </span>
                {current && <span className="milestone-segment-pulse" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
