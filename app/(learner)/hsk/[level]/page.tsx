"use client";

// app/(learner)/hsk/[level]/page.tsx
// Step 2 of the lesson flow — pick a lesson within an HSK level.

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { getLevel } from "@/lib/lessons/lessons";
import { hskImageUrl, lessonImageUrl } from "@/lib/gcs";
import { useLessonPicker } from "@/hooks/useLessonPicker";
import { ProgressLines } from "@/components/page/learner/PickerProgress";
import { useT } from "@/components/i18n/I18nProvider";
import "@/components/page/learner/lesson-picker.css";

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

        <div className="picker-header-section" style={{ backgroundColor: hsk.color }}>
          <div className="picker-header-col1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="picker-header-hsk-img"
              src={hskImageUrl(hsk.level)}
              alt={hsk.label}
              // Fall back to a graduation-cap tile if the HSK cover is unavailable.
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement
                  ?.querySelector<HTMLElement>(".picker-header-image")
                  ?.style.setProperty("display", "flex");
              }}
            />
            <div className="picker-header-image" style={{ display: "none" }}>
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
              <Link
                key={ls.lesson}
                // The pinyin lesson (HSK1 L1) has no real passages — it opens the
                // dedicated pinyin guide instead of the (empty) part picker.
                href={ls.isPinyinLesson ? "/lesson/basic-pinyin" : `/hsk/${hsk.key}/${ls.lesson}`}
                className="lesson-card"
              >
                <div className="lesson-card-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="lesson-card-img"
                    src={lessonImageUrl(hsk.key, ls.lesson)}
                    alt=""
                    loading="lazy"
                    // Hide the image column when a lesson has no cover (e.g. pinyin / Other).
                    onError={(e) => {
                      const wrap = e.currentTarget.parentElement;
                      if (wrap) wrap.style.display = "none";
                    }}
                  />
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
