"use client";

// components/page/learner/milestone/MilestoneHeader.tsx
// The context strip above the milestone's step pills: back to the lesson's part
// picker, the "HSK2 · Lesson 2" badge, the part's title, where the learner is
// ("Step 2 of 6 · Vocab Learner") and how many of the part's words are mastered.
//
// The badge and step come from what the runner already knows. The title and word
// count come from the lesson outline (LessonStudyShell's parts load) when there
// is one, and are simply left out when there is not.
//
// Every class belongs to milestone.css, which is subject to the §2 invariant.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useLessonOutline } from "@/components/page/learner/lesson/LessonOutlineContext";
import { hskLevelFromPassageId, partPickerHref } from "@/lib/lessons/lessons";
import { STEP_TITLE_KEYS } from "./MilestoneBar";

interface MilestoneHeaderProps {
  passageId: string;
  step: number;
  totalSteps: number;
}

export function MilestoneHeader({ passageId, step, totalSteps }: MilestoneHeaderProps) {
  const { t } = useT();
  const part = useLessonOutline()?.parts.find((p) => p.passageId === passageId);

  const seg = passageId.split("_");
  const badge =
    seg.length >= 2
      ? `${hskLevelFromPassageId(passageId)} · ${t("picker.lesson_prefix")} ${seg[1]}`
      : "";
  const title = part
    ? part.title ||
      (part.isNumber ? t("picker.number_part") : `${t("picker.part_prefix")} ${part.partNum}`)
    : "";
  const words = part?.progress;

  return (
    <div className="milestone-header">
      <div className="milestone-header-lead">
        <Link href={partPickerHref(passageId)} className="milestone-header-back">
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden />
          <span>{t("milestone.back_to_lesson")}</span>
        </Link>
        {badge && <span className="milestone-header-badge">{badge}</span>}
        {title && <h2 className="milestone-header-title">{title}</h2>}
        <span className="milestone-header-step">
          {t("milestone.step_counter", { n: step, total: totalSteps })}
          {" · "}
          {t(STEP_TITLE_KEYS[step] ?? "")}
        </span>
      </div>
      {words && words.totalWords > 0 && (
        <span className="milestone-header-mastered">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden />
          <span>
            {t("milestone.mastered")}: <strong>{words.learnedWords}</strong>/{words.totalWords}
          </span>
        </span>
      )}
    </div>
  );
}
