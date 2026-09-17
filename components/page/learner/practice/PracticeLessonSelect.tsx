"use client";

// components/page/learner/practice/PracticeLessonSelect.tsx
// Lesson grid for one HSK level — ports templates/practice/practice_lesson_select.html
// + static/practice/practice_lesson_select.js. Clicking a lesson stashes the
// referrer so the runner's Back button points at this level.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { getPracticeLessons } from "@/lib/api/practice";
import type { PracticeCategory } from "@/lib/types/types";
import "./practice-select.css";

export function PracticeLessonSelect({
  category,
  number,
}: {
  category: PracticeCategory;
  number: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const base = category === "exam" ? "/learner/exam" : "/learner/practice";
  const categoryLabel = category === "exam" ? t("dashboard.exam") : t("dashboard.exercise");

  const [lessons, setLessons] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPracticeLessons(number, category)
      .then((data) => {
        if (!cancelled) setLessons(data.lessons ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ? String(e.message) : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [number, category]);

  function openLesson(lesson: string) {
    try {
      window.sessionStorage.setItem("practice_referrer", `${category}-${number}`);
    } catch {
      // ignore
    }
    router.push(`${base}/${number}/${encodeURIComponent(lesson)}`);
  }

  return (
    <div className="practice-select">
      <div className="practice-select-container">
        <Link href={base} className="page-back">
          ← {t("practice_select.back_to_category", { category: categoryLabel })}
        </Link>
        <h1 className="page-title">
          {t("practice_select.lessons_heading", { number, category: categoryLabel })}
        </h1>
        <p className="page-subtitle">
          {t("practice_select.choose_lesson_subtitle", { category: categoryLabel.toLowerCase() })}
        </p>

        <div className="lesson-grid">
          {error ? (
            <p style={{ color: "var(--danger)" }}>{t("practice_select.error_prefix", { error })}</p>
          ) : lessons === null ? (
            <div className="loader-container">{t("picker.loading_lessons")}</div>
          ) : lessons.length === 0 ? (
            <p>{t("practice_select.no_lessons_found")}</p>
          ) : (
            lessons.map((lesson) => (
              <button key={lesson} type="button" className="lesson-card" onClick={() => openLesson(lesson)}>
                <div className="lesson-label">
                  {t("picker.lesson_prefix")} {lesson}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
