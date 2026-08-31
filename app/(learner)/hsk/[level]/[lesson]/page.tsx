"use client";

// app/(learner)/hsk/[level]/[lesson]/page.tsx
// Step 3 of the lesson flow — pick a part, or Grammar / Translation.
// Vocab/Lesson trainer buttons and the Grammar/Translation items are not
// wired yet — those trainer screens don't exist in this app yet.

import { use } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { getLevel, isNumberPart, getPartNumber, lessonColor } from "@/lib/lessons/lessons";
import { lessonImageUrl } from "@/lib/gcs";
import { useLessonPicker } from "@/hooks/useLessonPicker";
import { LessonProgress, ProgressLines } from "@/components/page/learner/PickerProgress";
import { useT } from "@/components/i18n/I18nProvider";
import { saveRecentLearning } from "@/lib/api/recent";
import type { PickerPassage } from "@/lib/types/types";

function partLabel(p: PickerPassage, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (p.title) return p.title;
  if (isNumberPart(p.passage_id)) return t("picker.number_part");
  return `${t("picker.part_prefix")} ${getPartNumber(p.passage_id)}`;
}

export default function PartPickerPage({
  params,
}: {
  params: Promise<{ level: string; lesson: string }>;
}) {
  const { level, lesson } = use(params);
  const { t } = useT();
  const hsk = getLevel(level);
  const { loading, error, lessons, partsProgress } = useLessonPicker(hsk?.key ?? level);
  if (!hsk || !lesson) notFound();
  // HSK1 Lesson 1 is the pinyin guide, not a passage-backed lesson — its only
  // "part" is a placeholder, so send direct visits to the guide instead.
  if (hsk.key === "HSK1" && lesson === "1") redirect("/lesson/basic-pinyin");

  const current = lessons.find((l) => l.lesson === lesson);
  const lessonLabel = lesson === "Other" ? t("picker.other_passages") : `${t("picker.lesson_prefix")} ${lesson}`;
  const emptyProgress = { learnedWords: 0, totalWords: 0, progressPct: 0 };
  const headerColor = lessonColor(hsk.key, lesson);

  return (
    <div className="lesson-picker">
      <div className="picker-wrap picker-wrap-narrow">
        <div className="picker-toolbar-section">
          <Link href={`/hsk/${hsk.key}`} className="picker-back-button">
            ← {t("picker.back_to_lessons")}
          </Link>
        </div>

        <div className="picker-header-section" style={{ backgroundColor: headerColor }}>
          <div className="picker-header-col1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="picker-header-lesson-img"
              src={lessonImageUrl(hsk.key, lesson)}
              alt=""
              // Fall back to a colored icon tile when the lesson has no image.
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement
                  ?.querySelector<HTMLElement>(".picker-header-image")
                  ?.style.setProperty("display", "flex");
              }}
            />
            <div
              className="picker-header-image"
              style={{ backgroundColor: hsk.color, display: "none" }}
            >
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
          </div>
          <div className="picker-header-col2">
            <h2>{t("picker.select_part")}</h2>
            <p className="subtitle">
              {hsk.label} — {lessonLabel}
            </p>

            {/* Trainer action card — buttons aren't wired yet (no trainer screens exist). */}
            <div className="picker-lesson-action-card">
              <div className="picker-lesson-action-header">
                <LessonProgress progress={current?.progress ?? emptyProgress} />
                <div className="picker-lesson-action-buttons">
                  <button type="button" className="picker-action-btn" disabled>
                    {t("picker.vocab_trainer_btn")}
                  </button>
                  <button type="button" className="picker-action-btn" disabled>
                    {t("picker.lesson_trainer_btn")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="picker-cards-section">
          {loading ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>{t("picker.loading_parts")}</p>
          ) : error ? (
            <p style={{ color: "var(--danger, #dc2626)", textAlign: "center" }}>{t("picker.failed_load_lessons")}</p>
          ) : !current ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>{t("picker.no_lessons_found")}</p>
          ) : (
            <div className="part-list">
              {current.parts.map((p) => {
                const progress = partsProgress[p.passage_id];
                return (
                  <Link
                    key={p.passage_id}
                    href={`/lesson?passage_id=${encodeURIComponent(p.passage_id)}`}
                    className="part-list-item"
                    // Record this as the most-recent lesson so the learning
                    // page's "Continue" panel can offer it (best-effort POST).
                    onClick={() => saveRecentLearning(p.passage_id)}
                  >
                    <div className="part-list-title">{partLabel(p, t)}</div>
                    {progress ? <ProgressLines progress={progress} centered /> : null}
                  </Link>
                );
              })}
              <div className="part-list-item part-list-item-grammar">
                <div className="part-list-title">{t("picker.grammar_btn")}</div>
              </div>
              <div className="part-list-item part-list-item-translation">
                <div className="part-list-title">{t("picker.translation_btn")}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
