"use client";

// app/(learner)/hsk/[level]/page.tsx
// Step 2 of the lesson flow — pick a lesson within an HSK level.

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { getLevel } from "@/lib/lessons/lessons";
import { useLessonPicker } from "@/hooks/useLessonPicker";
import { ProgressLines } from "@/components/page/learner/PickerProgress";
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

  const { loading, error, lessons } = useLessonPicker(hsk.key);

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
              {loading
                ? t("picker.loading_lessons")
                : t("picker.lessons_available", { count: lessons.length })}
            </p>
          </div>
        </div>

        <div className="lesson-list">
          {error ? (
            <p style={{ color: "var(--danger, #dc2626)", textAlign: "center" }}>
              {t("picker.failed_load_lessons")}
            </p>
          ) : !loading && lessons.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
              {t("picker.no_lessons_found")}
            </p>
          ) : (
            lessons.map((ls) => (
              <Link key={ls.lesson} href={`/hsk/${hsk.key}/${ls.lesson}`} className="lesson-card">
                <div className="lesson-card-img-wrap">
                  <FontAwesomeIcon icon={faBookOpen} />
                </div>
                <div className="lesson-card-body">
                  {ls.title ? (
                    <>
                      <div className="lesson-card-title">{ls.title}</div>
                      <div className="lesson-card-preview">
                        {ls.lesson === "Other" ? t("picker.other_passages") : `${t("picker.lesson_prefix")} ${ls.lesson}`}
                      </div>
                    </>
                  ) : (
                    <div className="lesson-card-title">
                      {ls.lesson === "Other" ? t("picker.other_passages") : `${t("picker.lesson_prefix")} ${ls.lesson}`}
                    </div>
                  )}
                  <ProgressLines progress={ls.progress} />
                  <div className="lesson-card-count">
                    {ls.isPinyinLesson ? t("picker.pinyin_guide") : t("picker.parts_count", { count: ls.partCount })}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
