"use client";

// components/page/learner/milestone/MilestoneHeader.tsx
// The context strip above the milestone's step tiles: a breadcrumb back up the
// library ("Library › HSK 1 › Lesson 2 › Part 3") and how many of the part's words
// are mastered.
//
// The crumbs come from the passage id; the part's name and the word count come from
// the lesson outline (LessonStudyShell's parts load) when there is one, and are
// simply left out when there is not.
//
// Every class belongs to milestone.css, which is subject to the §2 invariant.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faCircleCheck, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useLessonOutline } from "@/components/page/learner/lesson/LessonOutlineContext";
import { hskLevelFromPassageId, isBookPassageId, partPickerHref } from "@/lib/lessons/lessons";

interface MilestoneHeaderProps {
  passageId: string;
}

export function MilestoneHeader({ passageId }: MilestoneHeaderProps) {
  const { t } = useT();
  const part = useLessonOutline()?.parts.find((p) => p.passageId === passageId);

  const seg = passageId.split("_");
  const isBook = isBookPassageId(passageId);
  // Levels read "HSK 1" and books keep their code; the part picker is the lesson page.
  const levelHref = isBook ? `/learner/books/${seg[0]}` : `/learner/hsk/${hskLevelFromPassageId(passageId)}`;
  const levelLabel = isBook ? seg[0] : hskLevelFromPassageId(passageId).replace(/^(HSK)(\d)/, "$1 $2");
  const lessonLabel = seg.length >= 2 ? `${t("picker.lesson_prefix")} ${seg[1]}` : "";
  const partLabel = part
    ? part.isNumber
      ? t("picker.number_part")
      : `${t("picker.part_prefix")} ${part.partNum}`
    : "";
  const words = part?.progress;

  return (
    <div className="milestone-header">
      <nav className="milestone-crumbs" aria-label={t("milestone.breadcrumb")}>
        <FontAwesomeIcon icon={faBookOpen} className="milestone-crumb-icon" aria-hidden />
        <Link href="/learner/hsk" className="milestone-crumb">
          {t("nav.hsk")}
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="milestone-crumb-sep" aria-hidden />
        <Link href={levelHref} className="milestone-crumb">
          {levelLabel}
        </Link>
        {lessonLabel && (
          <>
            <FontAwesomeIcon icon={faChevronRight} className="milestone-crumb-sep" aria-hidden />
            <Link href={partPickerHref(passageId)} className="milestone-crumb">
              {lessonLabel}
            </Link>
          </>
        )}
        {partLabel && (
          <>
            <FontAwesomeIcon icon={faChevronRight} className="milestone-crumb-sep" aria-hidden />
            <span className="milestone-crumb-current" aria-current="page">
              {partLabel}
            </span>
          </>
        )}
      </nav>
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
