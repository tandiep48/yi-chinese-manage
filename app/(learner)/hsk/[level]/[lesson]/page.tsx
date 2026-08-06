"use client";

// app/(learner)/hsk/[level]/[lesson]/page.tsx
// Step 3 of the lesson flow — pick a part, or Grammar / Translation.
// The trainer buttons and part items are static mock-ups for now.

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { getLevel, getParts, getLessonProgress, type LessonPart } from "@/lib/lessons/lessons";
import { LessonProgress, ProgressLines } from "@/components/page/learner/PickerProgress";
import { useT } from "@/components/i18n/I18nProvider";

function partTitle(p: LessonPart, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (p.type === "grammar") return t("picker.grammar_btn");
  if (p.type === "translation") return t("picker.translation_btn");
  return `${t("picker.part_prefix")} ${p.partNumber}`;
}

export default function PartPickerPage({
  params,
}: {
  params: Promise<{ level: string; lesson: string }>;
}) {
  const { level, lesson } = use(params);
  const { t } = useT();
  const hsk = getLevel(level);
  const lessonNum = Number(lesson);
  if (!hsk || Number.isNaN(lessonNum)) notFound();

  const parts = getParts(hsk.key, lessonNum);
  const lessonProgress = getLessonProgress(hsk.key, lessonNum);

  return (
    <div className="lesson-picker">
      <div className="picker-wrap picker-wrap-narrow">
        <div className="picker-toolbar-section">
          <Link href={`/hsk/${hsk.key}`} className="picker-back-button">
            ← {t("picker.back_to_lessons")}
          </Link>
        </div>

        <div className="picker-header-section">
          <div className="picker-header-col1">
            <div className="picker-header-image" style={{ backgroundColor: hsk.color }}>
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
          </div>
          <div className="picker-header-col2">
            <h2>{t("picker.select_part")}</h2>
            <p className="subtitle">
              {hsk.label} — {t("picker.lesson_prefix")} {lessonNum}
            </p>

            {/* Trainer action card (mock) */}
            <div className="picker-lesson-action-card">
              <div className="picker-lesson-action-header">
                <LessonProgress progress={lessonProgress} />
                <div className="picker-lesson-action-buttons">
                  <button type="button" className="picker-action-btn">
                    {t("picker.vocab_trainer_btn")}
                  </button>
                  <button type="button" className="picker-action-btn">
                    {t("picker.lesson_trainer_btn")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="picker-cards-section">
          <div className="part-list">
            {parts.map((p) => (
              <div key={p.key} className={`part-list-item part-list-item-${p.type}`}>
                <div className="part-list-title">{partTitle(p, t)}</div>
                {p.progress ? <ProgressLines progress={p.progress} centered /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
