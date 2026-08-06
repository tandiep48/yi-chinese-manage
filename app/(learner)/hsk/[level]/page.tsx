"use client";

// app/(learner)/hsk/[level]/page.tsx
// Step 2 of the lesson flow — pick a lesson within an HSK level.

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { getLevel, getLessons } from "@/lib/lessons/lessons";
import { ProgressLines } from "@/components/learner/PickerProgress";
import { useT } from "@/components/i18n/I18nProvider";

export default function LessonPickerPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = use(params);
  const { t } = useT();
  const hsk = getLevel(level);
  if (!hsk) notFound();

  const lessons = getLessons(hsk.key);

  return (
    <div className="lesson-picker">
      <div className="picker-wrap">
        <div className="picker-toolbar-section">
          <Link href="/hsk" className="picker-back-button">
            ← {t("picker.back_to_levels")}
          </Link>
        </div>

        <div className="picker-header-section">
          <div className="picker-header-col1">
            <div className="picker-header-image" style={{ backgroundColor: hsk.color }}>
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
          </div>
          <div className="picker-header-col2">
            <h2>{t("picker.select_lesson")}</h2>
            <p className="subtitle">
              {t("picker.lessons_available", { count: lessons.length })}
            </p>
          </div>
        </div>

        <div className="lesson-list">
          {lessons.map((ls) => (
            <Link
              key={ls.lesson}
              href={`/hsk/${hsk.key}/${ls.lesson}`}
              className="lesson-card"
            >
              <div className="lesson-card-img-wrap">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <div className="lesson-card-body">
                <div className="lesson-card-title">
                  {t("picker.lesson_prefix")} {ls.lesson}
                </div>
                <ProgressLines progress={ls.progress} />
                <div className="lesson-card-count">
                  {t("picker.parts_count", { count: ls.partCount })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
